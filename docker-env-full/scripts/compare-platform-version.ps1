<#
.SYNOPSIS
    Checks whether the platform present in ./publish is the exact one the manifest asks for,
    and optionally drops a cache-restored platform that is a different build.
.DESCRIPTION
    vc-build skips reinstalling the platform unless the manifest's numeric PlatformVersion is
    newer than the present DLL's numeric FileVersion. Both sides drop any alpha/PR suffix
    (3.1050.0, 3.1050.0-alpha and 3.1050.0-alpha2 all report 3.1050.0.0), so vc-build can't
    tell those apart and silently keeps whatever a stale cache restored; its extraction also
    overwrites in place without wiping, leaving files from the previous build behind.

    ProductVersion is compared instead — its version part matches the manifest form exactly
    for release ("3.1039.0") and alpha/PR ("3.1059.0-pr-3099-da0b") alike.
.PARAMETER ManifestPath
    Package manifest (packages.json / new-packages.json) passed to `vc-build install`.
.PARAMETER PublishPath
    The vc-build --root directory holding the platform.
.PARAMETER DiscardMismatchedPlatformCache
    On mismatch, delete the cached platform (keeping modules/) instead of only warning. Use
    after a cache restore, before `vc-build install`.
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$ManifestPath,
    [string]$PublishPath = './publish',
    [switch]$DiscardMismatchedPlatformCache
)

# try/catch, not -ErrorAction: ConvertFrom-Json's error is *terminating*, and GH Actions runs
# pwsh with $ErrorActionPreference='Stop' — unhandled, it would fail this diagnostic-only step.
try {
    $manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
}
catch {
    Write-Host "::warning::Could not read or parse ${ManifestPath}: $_"
    return
}

# Alpha/PR builds keep their version in the asset filename (common-packages-list.ps1 builds
# "<blob>/VirtoCommerce.Platform.<version>.zip") and leave PlatformVersion stale from the
# upstream bundle; release builds use PlatformVersion.
if ($manifest.PlatformAssetUrl) {
    $assetName = Split-Path $manifest.PlatformAssetUrl -Leaf
    $requested = if ($assetName -match '^VirtoCommerce\.Platform\.(.+)\.zip$') { $Matches[1] } else { $null }
}
else {
    $requested = $manifest.PlatformVersion
}
if (-not $requested) {
    Write-Host "Could not determine the requested platform version from $ManifestPath — skipping check."
    return
}

$dll = Join-Path $PublishPath 'VirtoCommerce.Platform.Web.dll'
if (-not (Test-Path $dll)) {
    # Before the install this just means an empty/cold cache — nothing to check or discard.
    if (-not $DiscardMismatchedPlatformCache) {
        Write-Host "::warning::$dll not found — cannot determine which platform version $PublishPath holds."
    }
    return
}

try {
    # Convert-Path first: GetVersionInfo is a .NET static call, so a relative path would
    # resolve against the process working directory, which Set-Location doesn't move.
    $presentRaw = [System.Diagnostics.FileVersionInfo]::GetVersionInfo((Convert-Path $dll)).ProductVersion
}
catch {
    Write-Host "::warning::Failed to read the platform version from ${dll}: $_"
    return
}
$present = ($presentRaw -split '\+')[0]

Write-Host "Platform version — manifest requests: $requested, $PublishPath holds: $present"
if ($present -eq $requested) {
    return
}

if ($DiscardMismatchedPlatformCache) {
    # Keep modules/: the platform zip ships no such directory, so it's entirely module-owned
    # and still lets vc-build skip modules already at the manifest's version. app_data/modules
    # (the probing path) goes with the rest — vc-build regenerates it from modules/ via
    # RefreshProbingDirectory on its next run.
    Write-Host "Dropping the cached platform from $PublishPath — it holds $present, not the requested $requested. Keeping modules/; vc-build will reinstall the platform."
    # Guarded like the reads above: neither an enumeration error nor a blocked delete may escape.
    try {
        Get-ChildItem -Path $PublishPath -Force |
            Where-Object { $_.Name -ne 'modules' } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue -ErrorVariable removeErrors
        if ($removeErrors) {
            Write-Host "::warning::Could not fully drop the cached platform — $($removeErrors.Count) item(s) left in $PublishPath. vc-build installs over what remains, so stale files may survive."
        }
    }
    catch {
        Write-Host "::warning::Failed to drop the cached platform from ${PublishPath}: $_"
    }
}
else {
    Write-Host "::warning::Platform version mismatch — manifest requests $requested but $PublishPath holds $present."
}
