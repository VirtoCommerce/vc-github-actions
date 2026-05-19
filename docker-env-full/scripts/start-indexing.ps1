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

# Triggers a full rebuild (DeleteExistingIndex=$true) so every seeded record is re-emitted
# into a clean index. Returns the IndexProgressPushNotification — its 'id' is what we poll
# below to know when the indexer truly finished.
function Start-FullReindex {
    param([string]$token)
    $body = $script:reindexDocumentTypes | ForEach-Object {
        @{ DocumentType = $_; DeleteExistingIndex = $true }
    }
    $headers = @{
        'Content-Type'  = 'application/json-patch+json'
        'Authorization' = "Bearer $token"
    }
    Write-Output "Triggering full reindex (DeleteExistingIndex=true) of $($body.Count) document types: $($script:reindexDocumentTypes -join ', ')..."
    $resp = Invoke-WebRequest -Uri "$platformUrl/api/search/indexes/index" `
        -Body ($body | ConvertTo-Json) -Headers $headers -Method POST
    return ($resp.Content | ConvertFrom-Json)
}

# Polls the IndexProgressPushNotification by id until $notification.finished is set.
# This is the indexer's own end-of-work signal: IndexProgressHandler.Finish() is called
# inside the Hangfire job's finally block and sets 'finished' regardless of success/failure.
# 'errorCount' + 'errors' carry every per-document failure AND any wrapper-level exception
# that IndexProgressHandler.Exception(...) recorded. So this is strictly more authoritative
# than the Hangfire job state OR the IndexState.LastIndexationDate timestamps.
function Wait-IndexerFinished {
    param([string]$token, [string]$notificationId)
    $headers = @{
        'Content-Type'  = 'application/json'
        'Authorization' = "Bearer $token"
    }
    $criteria = @{ Ids = @($notificationId) } | ConvertTo-Json
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    $lastDescription = ''
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = (Invoke-WebRequest -Uri "$platformUrl/api/platform/pushnotifications" `
                -Body $criteria -Headers $headers -Method POST -ErrorAction Stop).Content | ConvertFrom-Json
            $notif = @($resp.notifyEvents)[0]
            if (-not $notif) {
                Write-Output "Notification $notificationId not yet visible; retrying in ${pollIntervalSec}s..."
            } else {
                $processed = [long]($notif.processedCount ?? 0)
                $total     = [long]($notif.totalCount ?? 0)
                $errors    = [long]($notif.errorCount ?? 0)
                $docType   = $notif.documentType
                $desc      = $notif.description
                if ($notif.finished) {
                    if ($errors -gt 0) {
                        $errList = (@($notif.errors) | Select-Object -First 5) -join ' | '
                        throw "Indexer finished with $errors error(s). First few: $errList"
                    }
                    Write-Output "Indexer finished: $processed/$total processed across all document types."
                    return
                }
                # Suppress repetitive identical progress lines.
                $line = "Indexer running [$docType]: $processed/$total | $desc"
                if ($line -ne $lastDescription) {
                    Write-Output $line
                    $lastDescription = $line
                }
            }
        } catch {
            if ($_.Exception.Message -like 'Indexer finished with*') { throw }
            Write-Output "Transient error polling notification; retrying: $($_.Exception.Message)"
        }
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "Indexer did not finish within ${timeoutSeconds}s (notificationId=$notificationId)"
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

$token = Get-AdminToken
$notification = Start-FullReindex -token $token
if (-not $notification.id) {
    throw "Reindex POST returned no notification id. Response: $($notification | ConvertTo-Json -Depth 5)"
}
Write-Output "Reindex enqueued: notificationId=$($notification.id), jobId=$($notification.jobId)"

Wait-IndexerFinished -token $token -notificationId $notification.id

Test-IndexSmoke -token $token -productIds $smokeProductIds -storeId $storeId -cultureName $cultureName -currencyCode $currencyCode
Write-Output "Indexing complete and verified — safe to start tests."
