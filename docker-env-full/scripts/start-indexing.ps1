param(
    [string]$platformUrl       = 'http://localhost:8090',
    [string]$adminUsername     = 'admin',
    [string]$adminPassword     = 'store',
    [int]   $timeoutSeconds    = 900,
    [int]   $pollIntervalSec   = 5,
    [string[]]$smokeProductIds = @('smartphone-apple-iphone-17-256gb-black'),
    [string]$storeId           = 'store-acme',
    [string]$cultureName       = 'en-US',
    [string]$currencyCode      = 'USD'
)

$ErrorActionPreference = 'Stop'

function Get-AdminToken {
    $body = "grant_type=password&username=$adminUsername&password=$adminPassword"
    $headers = @{ 'Content-Type' = 'application/x-www-form-urlencoded' }
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri "$platformUrl/connect/token" -Body $body -Headers $headers -Method POST -ErrorAction Stop
            return ($resp.Content | ConvertFrom-Json).access_token
        } catch {
            Write-Output "Platform not ready yet: $($_.Exception.Message). Retrying in ${pollIntervalSec}s..."
            Start-Sleep -Seconds $pollIntervalSec
        }
    }
    throw "Platform did not accept auth within ${timeoutSeconds}s"
}

$script:reindexDocumentTypes = @('Member', 'Product', 'Category', 'CustomerOrder', 'PickupLocation')

function Start-FullReindex {
    param([string]$token)
    $body = $script:reindexDocumentTypes | ForEach-Object {
        @{ DocumentType = $_; DeleteExistingIndex = $true }
    }
    $headers = @{
        'Content-Type'  = 'application/json-patch+json'
        'Authorization' = "Bearer $token"
    }
    Write-Output "Triggering full reindex of $($body.Count) document types: $($script:reindexDocumentTypes -join ', ')..."
    Invoke-WebRequest -Uri "$platformUrl/api/search/indexes/index" `
        -Body ($body | ConvertTo-Json) -Headers $headers -Method POST | Out-Null
}

# Polls /api/search/indexes and waits until LastIndexationDate for every requested
# document type has advanced past $triggerTimeUtc. This is the authoritative signal
# that indexing actually completed: SetLastIndexationDateAsync runs INSIDE the indexer
# AFTER documents are committed, so the timestamp only advances on real success — unlike
# the Hangfire job state, which reports Succeeded even when the indexer's inner exception
# was swallowed by IndexProgressHandler.
function Wait-IndexState {
    param([string]$token, [string[]]$documentTypes, [datetime]$triggerTimeUtc)
    $headers = @{ 'Authorization' = "Bearer $token" }
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $states = (Invoke-WebRequest -Uri "$platformUrl/api/search/indexes" -Headers $headers -Method GET -ErrorAction Stop).Content | ConvertFrom-Json
            $stateByType = @{}
            foreach ($s in @($states)) { $stateByType[$s.documentType] = $s }
            $pending = @()
            foreach ($docType in $documentTypes) {
                $st = $stateByType[$docType]
                if (-not $st) {
                    $pending += "$docType (no IndexState yet)"
                    continue
                }
                if (-not $st.lastIndexationDate) {
                    $pending += "$docType (lastIndexationDate is null)"
                    continue
                }
                $lid = ([datetime]$st.lastIndexationDate).ToUniversalTime()
                if ($lid -lt $triggerTimeUtc) {
                    $pending += "$docType (lastIndexationDate=$($lid.ToString('o')) < trigger=$($triggerTimeUtc.ToString('o')))"
                }
            }
            if ($pending.Count -eq 0) {
                Write-Output "All requested indexes caught up past trigger time: $($documentTypes -join ', ')."
                return
            }
            Write-Output "Indexing in progress; waiting on: $($pending -join '; ')"
        } catch {
            Write-Output "Transient error reading index state; retrying: $($_.Exception.Message)"
        }
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "Indexing did not complete for all requested document types within ${timeoutSeconds}s (triggerTimeUtc=$($triggerTimeUtc.ToString('o')))"
}

function Test-IndexSmoke {
    param([string]$token, [string[]]$productIds, [string]$storeId, [string]$cultureName, [string]$currencyCode)
    $headers = @{
        'Content-Type'  = 'application/json'
        'Authorization' = "Bearer $token"
    }
    foreach ($id in $productIds) {
        $query = @{
            query     = 'query($id:String!,$storeId:String!,$cultureName:String,$currencyCode:String){ product(id:$id,storeId:$storeId,cultureName:$cultureName,currencyCode:$currencyCode){ id name availabilityData { isAvailable isBuyable isInStock availableQuantity } } }'
            variables = @{ id = $id; storeId = $storeId; cultureName = $cultureName; currencyCode = $currencyCode }
        } | ConvertTo-Json -Compress
        $deadline = (Get-Date).AddSeconds($timeoutSeconds)
        $passed = $false
        $lastReason = $null
        while ((Get-Date) -lt $deadline) {
            try {
                $resp = (Invoke-WebRequest -Uri "$platformUrl/graphql" -Body $query -Headers $headers -Method POST -ErrorAction Stop).Content | ConvertFrom-Json
                if ($resp.errors) {
                    # GraphQL server-side errors (schema/auth/store-config) are not transient — surface and fail fast.
                    $errMsg = ($resp.errors | ForEach-Object { $_.message }) -join '; '
                    throw "GraphQL error for product '$id': $errMsg"
                }
                $product = $resp.data.product
                if (-not $product) {
                    $lastReason = "product '$id' not yet in catalog index"
                } elseif (-not $product.availabilityData) {
                    $lastReason = "product '$id' present but availabilityData is null (pricing/inventory index not ready)"
                } elseif (-not $product.availabilityData.isBuyable) {
                    $a = $product.availabilityData
                    $lastReason = "product '$id' not yet buyable (isAvailable=$($a.isAvailable), isInStock=$($a.isInStock), availableQuantity=$($a.availableQuantity)) — waiting for price/inventory indexes to settle"
                } else {
                    $passed = $true
                    break
                }
            } catch {
                # Re-throw GraphQL-error wrapping immediately; only retry transport-level failures.
                if ($_.Exception.Message -like 'GraphQL error*') { throw }
                $lastReason = $_.Exception.Message
            }
            Write-Output "Smoke check for '$id' not ready: $lastReason. Retrying in ${pollIntervalSec}s..."
            Start-Sleep -Seconds $pollIntervalSec
        }
        if (-not $passed) {
            throw "Smoke check failed for product '$id' within ${timeoutSeconds}s: $lastReason"
        }
        Write-Output "Smoke check passed for product '$id' (buyable)."
    }
}

$token       = Get-AdminToken
$triggerTime = [datetime]::UtcNow
Start-FullReindex -token $token

Write-Output "Waiting for indexes to catch up past $($triggerTime.ToString('o'))..."
Wait-IndexState -token $token -documentTypes $script:reindexDocumentTypes -triggerTimeUtc $triggerTime

Test-IndexSmoke -token $token -productIds $smokeProductIds -storeId $storeId -cultureName $cultureName -currencyCode $currencyCode
Write-Output "Indexing complete and verified — safe to start tests."
