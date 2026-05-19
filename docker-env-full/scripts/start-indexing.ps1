param(
    [string]$platformUrl       = 'http://localhost:8090',
    [string]$adminUsername     = 'admin',
    [string]$adminPassword     = 'store',
    [int]   $timeoutSeconds    = 900,
    [int]   $pollIntervalSec   = 5,
    [string[]]$smokeProductIds = @('smartphone-apple-iphone-17-256gb-black'),
    [string]$storeId           = 'store-acme',
    [string]$cultureName       = 'en-US'
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

function Start-FullReindex {
    param([string]$token)
    $body = @(
        @{ DocumentType = 'Member';         DeleteExistingIndex = $true },
        @{ DocumentType = 'Product';        DeleteExistingIndex = $true },
        @{ DocumentType = 'Category';       DeleteExistingIndex = $true },
        @{ DocumentType = 'CustomerOrder';  DeleteExistingIndex = $true },
        @{ DocumentType = 'PickupLocation'; DeleteExistingIndex = $true }
    )
    $headers = @{
        'Content-Type'  = 'application/json-patch+json'
        'Authorization' = "Bearer $token"
    }
    Write-Output "Triggering full reindex of $($body.Count) document types..."
    $resp = Invoke-WebRequest -Uri "$platformUrl/api/search/indexes/index" `
        -Body ($body | ConvertTo-Json) -Headers $headers -Method POST
    return ($resp.Content | ConvertFrom-Json)
}

function Wait-JobComplete {
    param([string]$token, [string]$jobId, [string]$label)
    $headers = @{ 'Authorization' = "Bearer $token" }
    $deadline = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $job = (Invoke-WebRequest -Uri "$platformUrl/api/platform/jobs/$jobId" -Headers $headers -Method GET -ErrorAction Stop).Content | ConvertFrom-Json
            if ($job.completed) {
                if ($job.exception) { throw "[$label] job $jobId failed: $($job.exception)" }
                Write-Output "[$label] job $jobId completed."
                return
            }
            $desc = $job.description ?? $job.title ?? '<no description>'
            Write-Output "[$label] job $jobId still running: $desc"
        } catch {
            # Tolerate transient 5xx / connection drops (e.g. platform restart mid-poll).
            Write-Output "[$label] transient error polling $jobId; retrying: $($_.Exception.Message)"
        }
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "[$label] job $jobId did not complete within ${timeoutSeconds}s"
}

function Test-IndexSmoke {
    param([string]$token, [string[]]$productIds, [string]$storeId, [string]$cultureName)
    $headers = @{
        'Content-Type'  = 'application/json'
        'Authorization' = "Bearer $token"
    }
    foreach ($id in $productIds) {
        $query = @{
            query     = 'query($id:String!,$storeId:String!,$cultureName:String){ product(id:$id,storeId:$storeId,cultureName:$cultureName){ id name } }'
            variables = @{ id = $id; storeId = $storeId; cultureName = $cultureName }
        } | ConvertTo-Json -Compress
        $deadline = (Get-Date).AddSeconds($timeoutSeconds)
        $passed = $false
        $lastReason = $null
        while ((Get-Date) -lt $deadline) {
            try {
                $resp = (Invoke-WebRequest -Uri "$platformUrl/graphql" -Body $query -Headers $headers -Method POST -ErrorAction Stop).Content | ConvertFrom-Json
                if ($resp.errors) {
                    # GraphQL server-side errors are not transient — surface and fail fast.
                    $errMsg = ($resp.errors | ForEach-Object { $_.message }) -join '; '
                    throw "GraphQL error for product '$id': $errMsg"
                }
                if ($resp.data.product) {
                    $passed = $true
                    break
                }
                $lastReason = "product '$id' not present in catalog index yet (data.product is null, no GraphQL errors)"
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
        Write-Output "Smoke check passed for product '$id'."
    }
}

$token       = Get-AdminToken
$startResult = Start-FullReindex -token $token

# Response may be a single object or an array — normalize.
$jobs = @()
if ($startResult -is [System.Array]) {
    $jobs = $startResult
} elseif ($startResult.PSObject.Properties.Name -contains 'JobId') {
    $jobs = @($startResult)
} else {
    throw "Unexpected indexing response shape: $($startResult | ConvertTo-Json -Depth 5)"
}

$jobIds = $jobs | ForEach-Object {
    [pscustomobject]@{
        JobId = $_.JobId
        Label = if ($_.DocumentType) { $_.DocumentType } else { 'index' }
    }
} | Where-Object { $_.JobId }

if (-not $jobIds) {
    throw "No JobId returned. Response: $($startResult | ConvertTo-Json -Depth 5)"
}

Write-Output "Waiting for $($jobIds.Count) indexing job(s) to complete..."
foreach ($j in $jobIds) {
    Wait-JobComplete -token $token -jobId $j.JobId -label $j.Label
}

Test-IndexSmoke -token $token -productIds $smokeProductIds -storeId $storeId -cultureName $cultureName
Write-Output "Indexing complete and verified — safe to start tests."
