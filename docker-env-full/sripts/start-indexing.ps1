param(
    [string]$platformUrl = 'http://localhost:8090',
    [string]$adminUsername = 'admin',
    [string]$adminPassword = 'store'
)

# get token
$body = "grant_type=password&username=$adminUsername&password=$adminPassword"
$headers = @{
    "accept"       = "application/json"
    "Content-Type" = "application/x-www-form-urlencoded"
}
$adminToken = (Invoke-WebRequest -Uri "$platformUrl/connect/token" -Body $body -Headers $headers -Method POST).Content | ConvertFrom-Json
$adminToken = $adminToken.access_token

function StartIndexing {
    param (
        [string]$token
    )

    $body = @(
        @{ "DocumentType" = "Member"; "DeleteExistingIndex" = $true },
        @{ "DocumentType" = "Product"; "DeleteExistingIndex" = $true },
        @{ "DocumentType" = "Category"; "DeleteExistingIndex" = $true },
        @{ "DocumentType" = "CustomerOrder"; "DeleteExistingIndex" = $true }
    )
    $headers = @{
        "Content-Type"  = "application/json-patch+json"
        "Authorization" = "Bearer $token"
    }
    Write-Output "Starting indexing..."
    $startIndexResult = Invoke-WebRequest -Uri "$platformUrl/api/search/indexes/index" -Body ($body | ConvertTo-Json) -Headers $headers -Method POST | ConvertFrom-Json
    Write-Output "Indexing started."
    $startIndexResult
    return $startIndexResult
}

function CheckIndexFinished {
    param (
        [string]$token,
        [string]$jobId
    )

    $headers = @{
        "Content-Type"  = "application/json-patch+json"
        "Authorization" = "Bearer $token"
    }
    Write-Output "Checking indexing status..."
    do {
        $indexResult = Invoke-WebRequest -Uri "$platformUrl/api/platform/jobs/$jobId" -Headers $headers -Method GET | ConvertFrom-Json
        Write-Output "Indexing completed: $($indexResult.completed)"
        if (-not $indexResult.completed) {
            Start-Sleep -Seconds 5
        }
    } while (-not $indexResult.completed)
    Write-Output "Indexing finished."
    $indexResult
    return $indexResult
}

$indexResult = StartIndexing -token $adminToken
$jobId = $indexResult.JobId
CheckIndexFinished -token $adminToken -jobId $jobId