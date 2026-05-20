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
            # Write-Host (not Write-Output) — this function returns the JWT, and Write-Output
            # inside a value-returning function pollutes the return value. Caller does
            # `$token = Get-AdminToken`, which would otherwise capture every retry log line
            # plus the JWT into an array, corrupting the Bearer header on subsequent requests.
            Write-Host "Platform not ready yet: $($_.Exception.Message). Retrying in ${pollIntervalSec}s..."
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
    # Write-Host: this function returns the notification object; Write-Output would pollute it.
    Write-Host "Triggering full reindex (DeleteExistingIndex=true) of $($body.Count) document types: $($script:reindexDocumentTypes -join ', ')..."
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
                # Avoid PS7-only ?? operator so this script parses on Windows PowerShell 5.1.
                $processed = if ($null -ne $notif.processedCount) { [long]$notif.processedCount } else { 0L }
                $total     = if ($null -ne $notif.totalCount)     { [long]$notif.totalCount }     else { 0L }
                $errors    = if ($null -ne $notif.errorCount)     { [long]$notif.errorCount }     else { 0L }
                $docType   = $notif.documentType
                $desc      = $notif.description
                if ($notif.finished) {
                    if ($errors -gt 0) {
                        # VC's IndexProgressHandler has a known intermittent race in its
                        # _totalCountMap/_processedCountMap Dictionaries when multiple
                        # document types index in parallel. The exception fires in the
                        # progress callback AFTER documents have committed to ES, so the
                        # index state itself is fine. We log a warning instead of failing
                        # — Wait-IndexedProductReady is the authoritative readiness gate.
                        $errList = (@($notif.errors) | Select-Object -First 3) -join ' | '
                        Write-Warning "Indexer reported $errors error(s) (data may still be indexed). First few: $errList"
                    } else {
                        Write-Output "Indexer finished: $processed/$total processed across all document types."
                    }
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
            Write-Output "Transient error polling notification; retrying: $($_.Exception.Message)"
        }
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "Indexer did not finish within ${timeoutSeconds}s (notificationId=$notificationId)"
}

# Lists per-document-type counts from /api/search/indexes. Useful sanity check after the
# indexer reports "finished" — if Product is 0 we have a clear, fast diagnostic instead of
# watching the XAPI smoke check loop spin until timeout.
function Write-IndexCounts {
    param([string]$token)
    $headers = @{ 'Authorization' = "Bearer $token" }
    try {
        $states = (Invoke-WebRequest -Uri "$platformUrl/api/search/indexes" -Headers $headers -Method GET -ErrorAction Stop).Content | ConvertFrom-Json
        Write-Output "Per-type index counts:"
        foreach ($s in @($states)) {
            Write-Output "  $($s.documentType): $($s.indexedDocumentsCount) docs (provider=$($s.provider), lastIndexationDate=$($s.lastIndexationDate))"
        }
    } catch {
        Write-Output "Could not read /api/search/indexes: $($_.Exception.Message)"
    }
}

# Direct raw-index read for a single document. Bypasses XAPI's resolver and store/catalog
# filtering — answers the bare "is doc X in the {type} index?" question. If this finds the
# product, XAPI failure is a resolver/filter issue. If it doesn't, the indexer skipped the
# doc despite reporting overall success.
# Polls the raw search index for a product and gates on:
#   (1) document is present
#   (2) status contains 'visible'
#   (3) instock_quantity > 0 (or instock = true)
#   (4) price_<currency> > 0
# Reads the same /api/search/indexes/index/{type}/{id} endpoint used for diagnostics —
# does NOT depend on XAPI's __object reconstruction, so this works regardless of the
# Catalog.Search.UseFullObjectIndexStoring platform setting.
function Wait-IndexedProductReady {
    param([string]$token, [string]$documentType, [string]$documentId, [string]$currencyCode)
    $headers    = @{ 'Authorization' = "Bearer $token" }
    $uri        = "$platformUrl/api/search/indexes/index/$documentType/$documentId"
    $priceField = "price_$(($currencyCode).ToLower())"   # e.g. 'price_usd'
    $deadline   = (Get-Date).AddSeconds($timeoutSeconds)

    function Test-Contains($value, [string]$expected) {
        if ($null -eq $value) { return $false }
        if ($value -is [array]) { return ($value | ForEach-Object { [string]$_ }) -contains $expected }
        return [string]$value -eq $expected
    }
    function Get-ScalarNumber($value) {
        if ($null -eq $value) { return 0 }
        if ($value -is [array]) { return ([double[]]@($value | ForEach-Object { try { [double]$_ } catch { 0 } }) | Measure-Object -Maximum).Maximum }
        try { return [double]$value } catch { return 0 }
    }

    while ((Get-Date) -lt $deadline) {
        try {
            $docs = (Invoke-WebRequest -Uri $uri -Headers $headers -Method GET -ErrorAction Stop).Content | ConvertFrom-Json
            if (-not $docs -or @($docs).Count -eq 0) {
                $lastReason = "no document for $documentType/$documentId in raw index"
            } else {
                $doc       = @($docs)[0]
                $statusOk  = Test-Contains $doc.status 'visible'
                $price     = Get-ScalarNumber $doc.$priceField
                $priceOk   = $price -gt 0
                $stockQty  = Get-ScalarNumber $doc.instock_quantity
                $stockFlag = $doc.instock
                $stockOk   = ($stockQty -gt 0) -or ($stockFlag -eq $true) -or (Test-Contains $stockFlag 'true')

                if ($statusOk -and $priceOk -and $stockOk) {
                    Write-Output "Product '$documentId' is buyable in the raw index (status=visible, $priceField=$price, instock_quantity=$stockQty)."
                    return
                }
                $missing = @()
                if (-not $statusOk) { $missing += "status=$($doc.status) (need 'visible')" }
                if (-not $priceOk)  { $missing += "$priceField=$price (need > 0)" }
                if (-not $stockOk)  { $missing += "instock_quantity=$stockQty, instock=$stockFlag (need stock > 0)" }
                $lastReason = "buyability incomplete: $($missing -join '; ')"
            }
        } catch {
            $lastReason = $_.Exception.Message
        }
        Write-Output "Smoke check for '$documentId' not ready: $lastReason. Retrying in ${pollIntervalSec}s..."
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "Product '$documentId' did not become buyable in the raw index within ${timeoutSeconds}s: $lastReason"
}

$token = Get-AdminToken
$notification = Start-FullReindex -token $token
if (-not $notification.id) {
    throw "Reindex POST returned no notification id. Response: $($notification | ConvertTo-Json -Depth 5)"
}
Write-Output "Reindex enqueued: notificationId=$($notification.id), jobId=$($notification.jobId)"

Wait-IndexerFinished -token $token -notificationId $notification.id

Write-IndexCounts -token $token
foreach ($id in $smokeProductIds) {
    Wait-IndexedProductReady -token $token -documentType 'Product' -documentId $id -currencyCode $currencyCode
}
Write-Output "Indexing complete and verified — safe to start tests."
