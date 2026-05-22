param(
    [string]$platformUrl     = 'http://localhost:8090',
    [string]$adminUsername   = 'admin',
    [string]$adminPassword   = 'store',
    # Per-phase timeout (auth, single-type reindex, count gate, smoke check). 5 min is
    # generous for the seeded dataset (each phase normally completes in seconds); the
    # main purpose is to bound how long we wait on an upstream platform hang — e.g. the
    # known IndexProgressHandler.Finish() NullReferenceException that leaves the
    # notification stuck and the Hangfire job in an automatic-retry loop.
    [int]   $timeoutSeconds  = 300,
    [int]   $pollIntervalSec = 5,
    [string]$storeId         = 'store-acme',
    [string]$cultureName     = 'en-US',
    [string]$currencyCode    = 'USD',
    # Per-type smoke IDs — one or more known seeded documents per index type.
    # Defaults track the current vc-testing-module dataset. Product gets the
    # full buyability check (status + price + stock); other types only need
    # presence in the raw index. PickupLocation IDs are platform-generated
    # (not derived from seed JSON), so it's empty by default and the count
    # gate below covers that type; callers can opt in by passing IDs.
    [hashtable]$smokeDocIds  = @{
        Product        = @('smartphone-apple-iphone-17-256gb-black')
        Category       = @('category-acme-electronics-smartphones')
        Member         = @('contact-acme-store-administrator')
        CustomerOrder  = @('10605003-8a51-44b0-a91c-90b14cdb4a9c')
        PickupLocation = @()
    },
    # Per-type minimum indexed-document count. Callers can pass
    # stricter expectations, e.g.:
    #   -minDocCounts @{ Product=166; Category=4; Member=38; CustomerOrder=20; PickupLocation=34 }
    [hashtable]$minDocCounts = @{
        Member         = 38
        Product        = 166
        Category       = 4
        CustomerOrder  = 20
        PickupLocation = 34
    }
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

# Triggers a reindex (DeleteExistingIndex=$true) for ONE document type and returns
# the IndexProgressPushNotification — its 'id' is what we poll to know when the
# indexer truly finished.
#
# Why per-type and not batched: VC's IndexingJobs.RunIndexJobAsync runs all submitted
# options in Task.WhenAll, and the shared IndexProgressHandler holds non-concurrent
# Dictionary<string,long>'s. Submitting >1 type per POST races the dictionary writes
# and intermittently corrupts state mid-indexation — one type's task throws while
# others may have not even started. Serializing here (1 type per POST, wait for
# Finished between submissions) eliminates the race entirely; the platform's
# distributed "IndexationJob" lock already enforces one-at-a-time anyway.
function Start-ReindexDocumentType {
    param([string]$token, [string]$documentType)
    $body = @( @{ DocumentType = $documentType; DeleteExistingIndex = $true } )
    $headers = @{
        'Content-Type'  = 'application/json-patch+json'
        'Authorization' = "Bearer $token"
    }
    # Write-Host: this function returns the notification object; Write-Output would pollute it.
    Write-Host "Triggering reindex for $documentType (DeleteExistingIndex=true)..."
    # Use -InputObject (not pipeline): in PowerShell, `@($x) | ConvertTo-Json` unwraps a
    # single-element array to its element and emits a JSON object instead of a one-element
    # JSON array. The controller binds to IndexingOptions[]; an object yields options=null
    # at the platform side and RunIndexJobAsync throws ArgumentNullException in .Select.
    $bodyJson = ConvertTo-Json -InputObject $body -Depth 5
    $resp = Invoke-WebRequest -Uri "$platformUrl/api/search/indexes/index" `
        -Body $bodyJson -Headers $headers -Method POST
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
                        # — Wait-IndexedDocumentReady is the authoritative readiness gate.
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
# watching the smoke check loop spin until timeout.
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

# Polls /api/search/indexes and asserts that each requested document type has at least
# its declared minimum indexed-document count. Retries within $timeoutSeconds because
# index counts can lag slightly behind the indexer's "finished" signal (ES refresh
# interval). Throws on timeout with a per-type diagnostic.
function Wait-AllIndexedCountsReady {
    param([string]$token, [hashtable]$minDocCounts)
    if (-not $minDocCounts -or $minDocCounts.Count -eq 0) {
        Write-Output "Skipping per-type count gate (no minDocCounts configured)."
        return
    }
    $headers   = @{ 'Authorization' = "Bearer $token" }
    $deadline  = (Get-Date).AddSeconds($timeoutSeconds)
    $lastReason = ''
    while ((Get-Date) -lt $deadline) {
        try {
            $states = (Invoke-WebRequest -Uri "$platformUrl/api/search/indexes" -Headers $headers -Method GET -ErrorAction Stop).Content | ConvertFrom-Json
            $byType = @{}
            foreach ($s in @($states)) { $byType[$s.documentType] = $s }
            $missing = @()
            $observed = @()
            foreach ($key in $minDocCounts.Keys) {
                $minimum = [long]$minDocCounts[$key]
                $state   = $byType[$key]
                $actual  = if ($state -and $null -ne $state.indexedDocumentsCount) { [long]$state.indexedDocumentsCount } else { 0L }
                $observed += "$key($actual)"
                if ($actual -lt $minimum) {
                    $missing += "$key (have $actual, need >= $minimum)"
                }
            }
            if ($missing.Count -eq 0) {
                Write-Output "All requested document types meet minimum count expectations: $($observed -join ', ')."
                return
            }
            $lastReason = $missing -join '; '
            Write-Output "Index counts below expected: $lastReason. Retrying in ${pollIntervalSec}s..."
        } catch {
            $lastReason = $_.Exception.Message
            Write-Output "Transient error reading index state; retrying: $lastReason"
        }
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "Index counts did not satisfy minimum expectations within ${timeoutSeconds}s: $lastReason"
}

# Polls the raw search index for a document and asserts readiness:
#   - For every documentType: the doc must be present.
#   - For Product specifically: additionally gates on buyability —
#       status contains 'visible'
#       price_<currency> > 0
#       instock_quantity > 0 (or instock = true)
# Reads the /api/search/indexes/index/{type}/{id} endpoint directly, so this works
# regardless of the Catalog.Search.UseFullObjectIndexStoring platform setting (which
# only affects XAPI's __object reconstruction path).
function Wait-IndexedDocumentReady {
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
            } elseif ($documentType -eq 'Product') {
                # Product requires the full buyability check (status + price + stock).
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
            } else {
                # Non-Product types: presence in the raw index is sufficient.
                Write-Output "$documentType '$documentId' is present in the raw index."
                return
            }
        } catch {
            $lastReason = $_.Exception.Message
        }
        Write-Output "Smoke check for '$documentId' not ready: $lastReason. Retrying in ${pollIntervalSec}s..."
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "$documentType '$documentId' did not become ready in the raw index within ${timeoutSeconds}s: $lastReason"
}

$token = Get-AdminToken

# Reindex one document type at a time. See Start-ReindexDocumentType for the rationale —
# batching all 5 types into one POST trips an upstream race condition in the indexer's
# progress handler that intermittently corrupts the indexation of a random type.
foreach ($docType in $script:reindexDocumentTypes) {
    $notification = Start-ReindexDocumentType -token $token -documentType $docType
    if (-not $notification.id) {
        throw "Reindex POST for $docType returned no notification id. Response: $($notification | ConvertTo-Json -Depth 5)"
    }
    Write-Output "Reindex enqueued for ${docType}: notificationId=$($notification.id), jobId=$($notification.jobId)"
    Wait-IndexerFinished -token $token -notificationId $notification.id
}

Write-IndexCounts -token $token
Wait-AllIndexedCountsReady -token $token -minDocCounts $minDocCounts

foreach ($docType in $smokeDocIds.Keys) {
    foreach ($id in @($smokeDocIds[$docType])) {
        Wait-IndexedDocumentReady -token $token -documentType $docType -documentId $id -currencyCode $currencyCode
    }
}
Write-Output "Indexing complete and verified — safe to start tests."
