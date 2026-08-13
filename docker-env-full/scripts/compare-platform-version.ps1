<#
.SYNOPSIS
    Checks whether the platform present in ./publish is the exact one the manifest asks for,
    and optionally drops a cache-restored platform that is a different build.
.DESCRIPTION
    vc-build decides whether to (re)install the platform by comparing the manifest's numeric
    PlatformVersion against the present DLL's numeric FileVersion, and skips whenever the
    requested version is not strictly newer. Both sides of that comparison drop any alpha/PR
    suffix — 3.1050.0, 3.1050.0-alpha and 3.1050.0-alpha2 all report FileVersion 3.1050.0.0 —
    so vc-build cannot tell those apart and will silently keep whatever a stale cache
    restored. Its extraction also overwrites in place without wiping, so even a legitimate
    upgrade can leave files behind from the previously cached build.

    This compares the assembly's ProductVersion instead, whose version part matches the
    manifest form exactly for both release ("3.1039.0") and alpha/PR
    ("3.1059.0-pr-3099-da0b") builds. Run it with -DiscardMismatchedPlatformCache right after the
    cache restore to drop a cached platform that isn't the requested build (keeping modules/,
    so the module warm-start survives), and without the switch after the install as a
    warn-only check.
.PARAMETER ManifestPath
    Path to the package manifest (packages.json / new-packages.json) passed to
    `vc-build install --package-manifest-path`.
.PARAMETER PublishPath
    The vc-build --root directory holding the platform.
.PARAMETER DiscardMismatchedPlatformCache
    Delete the cached platform from $PublishPath (keeping modules/) when it isn't the
    requested build, instead of only warning. Use after a cache restore, before
    `vc-build install`.
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$ManifestPath,
    [string]$PublishPath = './publish',
    [switch]$DiscardMismatchedPlatformCache
)

# try/catch, not -ErrorAction: ConvertFrom-Json raises a *terminating* error on malformed
# input, which -ErrorAction can't suppress — and GH Actions runs pwsh with
# $ErrorActionPreference='Stop', so an unhandled one would fail this diagnostic-only step.
try {
    $manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
}
catch {
    Write-Host "::warning::Could not read or parse ${ManifestPath}: $_"
    return
}

# Alpha/PR builds carry their version in the asset filename (see common-packages-list.ps1,
# which builds "<blob>/VirtoCommerce.Platform.<version>.zip") and leave PlatformVersion at a
# stale value inherited from the upstream bundle; release builds use PlatformVersion.
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
    # Resolve to an absolute path first: GetVersionInfo is a .NET static call, so a relative
    # path would resolve against the process working directory, which Set-Location doesn't move.
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
    # Drop the platform but keep modules/: the platform zip ships no modules/ directory, so
    # that subtree is entirely module-owned and still lets vc-build skip re-downloading
    # modules already at the manifest's version. app_data/modules (the probing path) goes
    # with the rest — vc-build regenerates it from modules/ on its next run
    # (LocalModuleCatalogFactory sets RefreshProbingFolderOnStart, and InstallModules calls
    # RefreshProbingDirectory), so it doesn't need preserving here.
    Write-Host "Dropping the cached platform from $PublishPath — it holds $present, not the requested $requested. Keeping modules/; vc-build will reinstall the platform."
    # Guarded like the reads above: this step only ever corrects or reports, never fails the
    # build, so neither an enumeration error nor a partially-blocked delete may escape.
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
