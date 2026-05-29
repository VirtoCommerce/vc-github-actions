param(
    [string]$platformUrl     = 'http://localhost:8090',
    [string]$adminUsername   = 'admin',
    [string]$adminPassword   = 'store',
    # Per-phase timeout (auth, single-type reindex, per-type count gate). The flow
    # now has up to ~6 phases that could each hit the timeout (5 serialized reindex
    # phases + count gate); 150s × 6 ≈ 15 min total worst case, matching the legacy
    # per-phase budget of 900s back when the flow was a single batched reindex.
    # The main purpose is to bound how long we wait on an upstream platform hang —
    # e.g. the known IndexProgressHandler.Finish() NullReferenceException that leaves
    # the notification stuck and the Hangfire job in an automatic-retry loop.
    [int]   $timeoutSeconds  = 150,
    [int]   $pollIntervalSec = 5,
    # Per-type minimum indexed-document count. Defaults track the current
    # vc-testing-module dataset. Callers can override per environment:
    #   -minDocCounts @{ Product=166; Category=4; Member=38; CustomerOrder=20; PickupLocation=34 }
    [hashtable]$minDocCounts = @{
        Member         = 38
        Product        = 166
        Category       = 4
        CustomerOrder  = 20
        PickupLocation = 34
    },
    # Document types whose count gate should be skipped (reindex still runs).
    # Use when the dataset legitimately has 0 source records for a type — e.g.
    #   -skipDocCountVerification PickupLocation,ContentFile
    [string[]]$skipDocCountVerification = @()
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
                        # — Wait-AllIndexedCountsReady is the authoritative readiness gate.
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
# watching the count gate spin until timeout.
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
        Write-Host "Skipping per-type count gate (no minDocCounts configured)."
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
                Write-Host "All requested document types meet minimum count expectations: $($observed -join ', ')."
                return
            }
            $lastReason = $missing -join '; '
            Write-Host "Index counts below expected: $lastReason. Retrying in ${pollIntervalSec}s..."
        } catch {
            $lastReason = $_.Exception.Message
            Write-Host "Transient error reading index state; retrying: $lastReason"
        }
        Start-Sleep -Seconds $pollIntervalSec
    }
    throw "Index counts did not satisfy minimum expectations within ${timeoutSeconds}s: $lastReason"
}

# Fail loud on typos before the (~15min) reindex loop: a value in
# -skipDocCountVerification that doesn't match a key in -minDocCounts would
# silently no-op, and the user would only notice 15min later when the count
# gate they thought they'd bypassed times out.
$unknownSkips = @($skipDocCountVerification | Where-Object { $_ -and ($minDocCounts.Keys -notcontains $_) })
if ($unknownSkips.Count -gt 0) {
    throw "skipDocCountVerification contains unknown document type(s): $($unknownSkips -join ', '). Valid types: $(($minDocCounts.Keys | Sort-Object) -join ', ')."
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

$effectiveMinDocCounts = @{}
foreach ($key in $minDocCounts.Keys) {
    if ($skipDocCountVerification -notcontains $key) {
        $effectiveMinDocCounts[$key] = $minDocCounts[$key]
    }
}
if ($skipDocCountVerification.Count -gt 0) {
    Write-Host "Skipping count verification for: $($skipDocCountVerification -join ', ')"
}
Wait-AllIndexedCountsReady -token $token -minDocCounts $effectiveMinDocCounts

Write-Output "Indexing complete and verified — safe to start tests."
