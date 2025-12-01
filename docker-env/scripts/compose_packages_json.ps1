<#
.SYNOPSIS
    Checks dependencies for alpha modules starting from a custom module URL.
.DESCRIPTION
    Downloads an alpha module from the provided URL, extracts its manifest, and recursively checks
    all dependencies (both alpha and release versions) for compatibility and availability.
.PARAMETER customModuleUrl
    The URL where the alpha module can be downloaded from.
.PARAMETER customModuleId
    Optional. The ID of the custom module. If not provided, will be extracted from the URL or manifest.
.PARAMETER OutputFormat
    Output format: 'Console' (default) or 'Json'. Json format outputs results to a file.
.PARAMETER OutputFile
    Path to output file when using Json format. Default: 'new-packages.json'
#>
[CmdletBinding()]
param (
    # [Parameter(Mandatory = $true)]
    [string]$customModuleUrl = 'https://vc3prerelease.blob.core.windows.net/packages/VirtoCommerce.FileExperienceApi_3.906.0-pr-16-5ad0.zip',
    [string]$customModuleId = '',
    [ValidateSet('Console', 'Json')]
    [string]$OutputFormat = 'Json',
    [string]$OutputFile = 'new-packages.json'
)

function IsAlfa {
    param (
        $version
    )
    if ($version -match '[A-za-z-]') {
        return $true
    }
    else {
        return $false
    }
}

function CompareVersions {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$currentVersion,
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$requiredVersion,
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$moduleId
    )
    
    $currentVerSplitted = $currentVersion.split('.')
    $requiredVerSplitted = $requiredVersion.split('.')
    
    if ($currentVerSplitted.Length -eq $requiredVerSplitted.Length) {
        if (IsAlfa $requiredVerSplitted[2] -or IsAlfa $currentVerSplitted[2]) {
            # Handle alpha version comparison
            $patchVersionRegex = '(?<patchVersion>\b\d+)[-a-zA-Z]+'
            $currentPatchVersion = $requiredPatchVersion = $currentBaseVersion = $requiredBaseVersion = ''
            
            if ($currentVersion -match $patchVersionRegex) {
                $currentPatchVersion = $matches['patchVersion']
                $currentBaseVersion = "$($currentVerSplitted[0]).$($currentVerSplitted[1]).$currentPatchVersion"
            }
            else {
                $currentBaseVersion = $currentVersion
            }
            
            if ($requiredVersion -match $patchVersionRegex) {
                $requiredPatchVersion = $matches['patchVersion']
                $requiredBaseVersion = "$($requiredVerSplitted[0]).$($requiredVerSplitted[1]).$requiredPatchVersion"
            }
            else {
                $requiredBaseVersion = $requiredVersion
            }
            
            try {
                if ([System.Version]$currentBaseVersion -ge [System.Version]$requiredBaseVersion) {
                    return @{
                        Status  = 'Satisfied'
                        Message = "Current version $currentVersion satisfies requirement $requiredVersion"
                    }
                }
                else {
                    return @{
                        Status  = 'Insufficient'
                        Message = "Current version $currentVersion is lower than required $requiredVersion"
                    }
                }
            }
            catch {
                return @{
                    Status  = 'Error'
                    Message = "Failed to compare versions: $_"
                }
            }
        }
        else {
            # Standard version comparison
            try {
                if ([System.Version]$currentVersion -ge [System.Version]$requiredVersion) {
                    return @{
                        Status  = 'Satisfied'
                        Message = "Current version $currentVersion satisfies requirement $requiredVersion"
                    }
                }
                else {
                    return @{
                        Status  = 'Insufficient'
                        Message = "Current version $currentVersion is lower than required $requiredVersion"
                    }
                }
            }
            catch {
                return @{
                    Status  = 'Error'
                    Message = "Failed to compare versions: $_"
                }
            }
        }
    }
    elseif ($currentVerSplitted.Length -lt $requiredVerSplitted.Length) {
        return @{
            Status  = 'Insufficient'
            Message = "Prerelease version required. Current: $currentVersion, Required: $requiredVersion"
        }
    }
    else {
        return @{
            Status  = 'Satisfied'
            Message = "Current prerelease version $currentVersion may satisfy requirement $requiredVersion"
        }
    }
}

function Invoke-WebRequestWithRetry {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [string]$OutFile,
        [int]$MaxRetries = 3,
        [int]$RetryDelaySeconds = 1
    )

    $retryCount = 0
    while ($retryCount -lt $MaxRetries) {
        try {
            if ($OutFile) {
                Invoke-WebRequest -Uri $Uri -OutFile $OutFile -TimeoutSec 15
            }
            else {
                return Invoke-WebRequest -Uri $Uri -TimeoutSec 15
            }
            return
        }
        catch {
            $retryCount++
            if ($retryCount -eq $MaxRetries) {
                Write-Error "Failed to download '$Uri' after $MaxRetries attempts: $_"
                throw
            }
            Write-Warning "Attempt $retryCount failed, retrying in $RetryDelaySeconds seconds..."
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }
}

function ProcessReleaseVersionDependency {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ModuleId,
        [Parameter(Mandatory = $true)]
        [string]$RequiredVersion,
        [Parameter(Mandatory = $true)]
        [hashtable]$processedModules,
        [Parameter(Mandatory = $true)]
        $edgePackages,
        [Parameter(Mandatory = $true)]
        [string]$blobPackagesUrl
    )
    
    $moduleKey = "$ModuleId|$RequiredVersion"
    if ($processedModules.ContainsKey($moduleKey)) {
        return $processedModules[$moduleKey]
    }
    
    # Look up the module in modules_v3.json
    $moduleInPackages = $edgePackages | Where-Object { $_.Id -eq $ModuleId }
    if (-not $moduleInPackages -or $null -eq $moduleInPackages.Versions -or $moduleInPackages.Versions.Count -eq 0) {
        $errorResult = @{
            ModuleId        = $ModuleId
            Version         = $RequiredVersion
            IsAlfa          = $false
            PlatformVersion = $null
            Dependencies    = @()
            Status          = 'Error'
            Error           = "Module '$ModuleId' not found in modules_v3.json"
        }
        $processedModules[$moduleKey] = $errorResult
        return $errorResult
    }
    
    # Find the specific version or use the first available (latest)
    $foundVersion = $moduleInPackages.Versions | Where-Object { $_.Version -eq $RequiredVersion } | Select-Object -First 1
    if (-not $foundVersion -and $moduleInPackages.Versions.Count -gt 0) {
        $foundVersion = $moduleInPackages.Versions[0]
    }
    if (-not $foundVersion) {
        $errorResult = @{
            ModuleId        = $ModuleId
            Version         = $RequiredVersion
            IsAlfa          = $false
            PlatformVersion = $null
            Dependencies    = @()
            Status          = 'Error'
            Error           = "No version found for module '$ModuleId' in modules_v3.json"
        }
        $processedModules[$moduleKey] = $errorResult
        return $errorResult
    }
    
    # Build version string
    if ($null -eq $foundVersion.Version) {
        $errorResult = @{
            ModuleId        = $ModuleId
            Version         = $RequiredVersion
            IsAlfa          = $false
            PlatformVersion = $null
            Dependencies    = @()
            Status          = 'Error'
            Error           = "Version information missing for module '$ModuleId' in modules_v3.json"
        }
        $processedModules[$moduleKey] = $errorResult
        return $errorResult
    }
    
    $versionTag = $foundVersion.VersionTag
    if ($null -eq $versionTag -or $versionTag -eq '') {
        $fullVersion = $foundVersion.Version
    }
    else {
        $fullVersion = "$($foundVersion.Version)-$versionTag"
    }
    
    $result = @{
        ModuleId        = $ModuleId
        Version         = $fullVersion
        IsAlfa          = IsAlfa $fullVersion
        PlatformVersion = $foundVersion.PlatformVersion
        Dependencies    = @()
        Status          = 'OK'
    }
    
    # Check version compatibility
    $availableVersion = $foundVersion.Version
    $versionCheck = CompareVersions -currentVersion $availableVersion -requiredVersion $RequiredVersion -moduleId $ModuleId
    if ($versionCheck.Status -ne 'Satisfied') {
        $result.Status = 'Warning'
        $result.Message = $versionCheck.Message
    }
    
    # Process dependencies from modules_v3.json
    if ($null -ne $foundVersion.Dependencies -and $foundVersion.Dependencies.Count -gt 0) {
        foreach ($dep in $foundVersion.Dependencies) {
            if ($null -eq $dep -or $null -eq $dep.Id -or $null -eq $dep.Version) {
                continue
            }
            $depId = $dep.Id
            $depVersion = $dep.Version
            
            $depResult = @{
                ModuleId         = $depId
                RequiredVersion  = $depVersion
                IsAlfa           = IsAlfa $depVersion
                Status           = 'Unknown'
                Message          = ''
                AvailableVersion = $null
                CheckResult      = $null
            }
            
            # Check if we've already processed this dependency
            $depModuleKey = "$depId|$depVersion"
            if ($processedModules.ContainsKey($depModuleKey)) {
                $depResult.Status = 'AlreadyProcessed'
                $depResult.Message = "Already checked in dependency tree"
                $depResult.CheckResult = $processedModules[$depModuleKey]
            }
            else {
                if (IsAlfa $depVersion) {
                    # Alpha dependency - will be processed by DownloadAndCheckModule
                    $depResult.Status = 'AlphaVersion'
                    $depResult.Message = "Alpha dependency from modules_v3.json"
                }
                else {
                    # Release dependency - recursively process from modules_v3.json
                    $depResult.CheckResult = ProcessReleaseVersionDependency -ModuleId $depId -RequiredVersion $depVersion -processedModules $processedModules -edgePackages $edgePackages -blobPackagesUrl $blobPackagesUrl
                    if ($null -ne $depResult.CheckResult) {
                        $depResult.Status = $depResult.CheckResult.Status
                        $depResult.Message = "Checked from modules_v3.json - Status: $($depResult.CheckResult.Status)"
                        $depResult.AvailableVersion = $depResult.CheckResult.Version
                    }
                    else {
                        $depResult.Status = 'Error'
                        $depResult.Message = "Failed to process release version dependency"
                    }
                }
            }
            
            $result.Dependencies += $depResult
        }
    }
    
    # Mark as processed
    $processedModules[$moduleKey] = $result
    return $result
}

function ProcessModuleManifest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ModuleId,
        [Parameter(Mandatory = $true)]
        [string]$ModulePath,
        [Parameter(Mandatory = $true)]
        [hashtable]$processedModules,
        [Parameter(Mandatory = $true)]
        $edgePackages,
        [Parameter(Mandatory = $true)]
        [string]$blobPackagesUrl
    )
    
    $manifestPath = Join-Path $ModulePath "module.manifest"
    if (-not (Test-Path $manifestPath)) {
        Write-Warning "Manifest not found at $manifestPath"
        return $null
    }
    
    $content = Get-Content -Path $manifestPath -Raw
    $node = $(Select-Xml -Content $content -XPath "//module").Node
    
    if (-not $node) {
        Write-Warning "Could not parse module node from manifest"
        return $null
    }
    
    $version = $node.version
    $versionTag = $node.'version-tag'
    if ($version -is [array]) {
        $version = $version[0]
    }
    if ($versionTag -is [array]) {
        $versionTag = $versionTag[0]
    }
    if ($versionTag -eq '' -or $null -eq $versionTag) {
        $fullVersion = "$version"
    }
    else {
        $fullVersion = "$version-$versionTag"
    }
    
    $result = @{
        ModuleId        = $ModuleId
        Version         = $fullVersion
        IsAlfa          = IsAlfa $fullVersion
        PlatformVersion = $null
        Dependencies    = @()
        Status          = 'OK'
    }
    
    # Get platform version
    $platformVersionNode = $(Select-Xml -Content $content -XPath "/module/platformVersion").Node
    if ($platformVersionNode) {
        $result.PlatformVersion = $platformVersionNode.InnerText
    }
    
    # Get dependencies
    $xmlDependency = $(Select-Xml -Content $content -XPath "//dependencies").Node
    if ($xmlDependency -and $xmlDependency.dependency) {
        $dependencies = $xmlDependency.dependency
        if ($dependencies -isnot [array]) {
            $dependencies = @($dependencies)
        }
        
        foreach ($dep in $dependencies) {
            $depId = $dep.id
            $depVersion = $dep.version
            
            $depResult = @{
                ModuleId         = $depId
                RequiredVersion  = $depVersion
                IsAlfa           = IsAlfa $depVersion
                Status           = 'Unknown'
                Message          = ''
                AvailableVersion = $null
                CheckResult      = $null
            }
            
            # Check if we've already processed this module
            $moduleKey = "$depId|$depVersion"
            if ($processedModules.ContainsKey($moduleKey)) {
                $depResult.Status = 'AlreadyProcessed'
                $depResult.Message = "Already checked in dependency tree"
                $depResult.CheckResult = $processedModules[$moduleKey]
            }
            else {
                # Check if it's an alpha version - need to download and check
                if (IsAlfa $depVersion) {
                    $depResult.Status = 'AlphaVersion'
                    $depResult.Message = "Alpha version - will be downloaded and checked"
                }
                else {
                    # Release version - get dependencies from modules_v3.json
                    $depResult.CheckResult = ProcessReleaseVersionDependency -ModuleId $depId -RequiredVersion $depVersion -processedModules $processedModules -edgePackages $edgePackages -blobPackagesUrl $blobPackagesUrl
                    $depResult.Status = $depResult.CheckResult.Status
                    $depResult.Message = "Checked from modules_v3.json - Status: $($depResult.CheckResult.Status)"
                    $depResult.AvailableVersion = $depResult.CheckResult.Version
                }
            }
            
            $result.Dependencies += $depResult
        }
    }
    
    return $result
}

function DownloadAndCheckModule {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ModuleId,
        [Parameter(Mandatory = $true)]
        [string]$ModuleUrl,
        [Parameter(Mandatory = $true)]
        [hashtable]$processedModules,
        [Parameter(Mandatory = $true)]
        $edgePackages,
        [Parameter(Mandatory = $true)]
        [string]$blobPackagesUrl,
        [int]$depth = 0
    )
    
    $indent = "  " * $depth
    Write-Host "$indent[$depth] Processing module: $ModuleId" -ForegroundColor Cyan
    
    $moduleKey = "$ModuleId|$ModuleUrl"
    if ($processedModules.ContainsKey($moduleKey)) {
        Write-Host "$indent  Already processed, skipping..." -ForegroundColor Yellow
        return $processedModules[$moduleKey]
    }
    
    $moduleZip = "./$($ModuleId)_$([System.Guid]::NewGuid().ToString('N').Substring(0,8)).zip"
    $modulePath = "./$($ModuleId)_$([System.Guid]::NewGuid().ToString('N').Substring(0,8))"
    
    try {
        Write-Host "$indent  Downloading from: $ModuleUrl" -ForegroundColor Gray
        Invoke-WebRequestWithRetry -Uri $ModuleUrl -OutFile $moduleZip
        
        Write-Host "$indent  Extracting..." -ForegroundColor Gray
        Expand-Archive $moduleZip -DestinationPath $modulePath -Force
        
        Write-Host "$indent  Reading manifest..." -ForegroundColor Gray
        $moduleResult = ProcessModuleManifest -ModuleId $ModuleId -ModulePath $modulePath -processedModules $processedModules -edgePackages $edgePackages -blobPackagesUrl $blobPackagesUrl
        
        if ($null -eq $moduleResult) {
            $moduleResult = @{
                ModuleId        = $ModuleId
                Version         = 'Unknown'
                IsAlfa          = $true
                PlatformVersion = $null
                Dependencies    = @()
                Status          = 'Error'
                Error           = "Failed to process manifest"
            }
        }
        
        # Mark as processed
        $processedModules[$moduleKey] = $moduleResult
        
        # Recursively check alpha dependencies
        function ProcessDependenciesRecursively {
            param(
                [Parameter(Mandatory = $true)]
                $dependencies,
                [Parameter(Mandatory = $false)]
                [AllowEmptyString()]
                [string]$parentIndent = '',
                [Parameter(Mandatory = $true)]
                [hashtable]$processedModulesRef,
                [Parameter(Mandatory = $true)]
                $edgePackagesRef,
                [Parameter(Mandatory = $true)]
                [string]$blobPackagesUrlRef,
                [Parameter(Mandatory = $true)]
                [int]$currentDepth
            )
            
            foreach ($dep in $dependencies) {
                if ($dep.IsAlfa -and $dep.Status -ne 'AlreadyProcessed') {
                    $depModuleUrl = "$blobPackagesUrlRef/$($dep.ModuleId)_$($dep.RequiredVersion).zip"
                    Write-Host "$parentIndent  Checking alpha dependency: $($dep.ModuleId) v$($dep.RequiredVersion)" -ForegroundColor Yellow
                    
                    $depResult = DownloadAndCheckModule -ModuleId $dep.ModuleId -ModuleUrl $depModuleUrl -processedModules $processedModulesRef -edgePackages $edgePackagesRef -blobPackagesUrl $blobPackagesUrlRef -depth ($currentDepth + 1)
                    
                    if ($depResult) {
                        $dep.CheckResult = $depResult
                        $dep.Status = $depResult.Status
                        $dep.Message = "Checked recursively - Status: $($depResult.Status)"
                        
                        # Recursively process dependencies of this alpha module
                        if ($null -ne $depResult.Dependencies -and $depResult.Dependencies.Count -gt 0) {
                            ProcessDependenciesRecursively -dependencies $depResult.Dependencies -parentIndent $parentIndent -processedModulesRef $processedModulesRef -edgePackagesRef $edgePackagesRef -blobPackagesUrlRef $blobPackagesUrlRef -currentDepth ($currentDepth + 1)
                        }
                    }
                }
                elseif (-not $dep.IsAlfa -and $null -ne $dep.CheckResult -and $null -ne $dep.CheckResult.Dependencies -and $dep.CheckResult.Dependencies.Count -gt 0) {
                    # For release versions, recursively check their dependencies (which may include alpha)
                    ProcessDependenciesRecursively -dependencies $dep.CheckResult.Dependencies -parentIndent $parentIndent -processedModulesRef $processedModulesRef -edgePackagesRef $edgePackagesRef -blobPackagesUrlRef $blobPackagesUrlRef -currentDepth $currentDepth
                }
            }
        }
        
        ProcessDependenciesRecursively -dependencies $moduleResult.Dependencies -parentIndent $indent -processedModulesRef $processedModules -edgePackagesRef $edgePackages -blobPackagesUrlRef $blobPackagesUrl -currentDepth $depth
        
        # Cleanup
        Remove-Item -Path $moduleZip -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $modulePath -Force -Recurse -ErrorAction SilentlyContinue
        
        return $moduleResult
    }
    catch {
        Write-Error "$indent  Error processing module $ModuleId : $_"
        $errorResult = @{
            ModuleId        = $ModuleId
            Version         = 'Unknown'
            IsAlfa          = $true
            PlatformVersion = $null
            Dependencies    = @()
            Status          = 'Error'
            Error           = $_.Exception.Message
        }
        $processedModules[$moduleKey] = $errorResult
        return $errorResult
    }
}

# Main script execution
$blobPackagesUrl = "https://vc3prerelease.blob.core.windows.net/packages"

# Extract module ID from URL if not provided
if ([string]::IsNullOrEmpty($customModuleId)) {
    if ($customModuleUrl -match '([^/]+)_([^/]+)\.zip$') {
        $customModuleId = $matches[1]
        Write-Host "Extracted module ID from URL: $customModuleId" -ForegroundColor Green
    }
    else {
        Write-Error "Could not extract module ID from URL. Please provide -customModuleId parameter."
        exit 1
    }
}

Write-Host "Fetching modules list from modules_v3.json..." -ForegroundColor Cyan
try {
    $edgePackagesResponse = Invoke-WebRequestWithRetry -Uri "https://raw.githubusercontent.com/VirtoCommerce/vc-modules/refs/heads/master/modules_v3.json"
    $edgePackages = $edgePackagesResponse.Content | ConvertFrom-Json -Depth 10
    Write-Host "Successfully loaded $($edgePackages.Count) modules" -ForegroundColor Green
}
catch {
    Write-Error "Failed to fetch modules_v3.json: $_"
    exit 1
}

# Process the root module and all its dependencies
$processedModules = @{}
Write-Host "`nStarting dependency check for: $customModuleId" -ForegroundColor Cyan
Write-Host "URL: $customModuleUrl`n" -ForegroundColor Gray

$rootResult = DownloadAndCheckModule -ModuleId $customModuleId -ModuleUrl $customModuleUrl -processedModules $processedModules -edgePackages $edgePackages -blobPackagesUrl $blobPackagesUrl -depth 0

# Build report
$report = @{
    GeneratedAt           = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    RootModule            = @{
        ModuleId = $customModuleId
        Url      = $customModuleUrl
    }
    TotalModulesProcessed = $processedModules.Count
    Modules               = @()
    Summary               = @{
        OK      = 0
        Warning = 0
        Error   = 0
    }
}

# Calculate status for each module
foreach ($key in $processedModules.Keys) {
    $module = $processedModules[$key]
    $hasErrors = $false
    $hasWarnings = $false
    
    if ($null -ne $module.Dependencies) {
        foreach ($dep in $module.Dependencies) {
            if ($dep.Status -eq 'Missing' -or $dep.Status -eq 'Error') {
                $hasErrors = $true
            }
            elseif ($dep.Status -eq 'Insufficient') {
                $hasWarnings = $true
            }
        }
    }
    
    if ($module.Status -eq 'Error' -or $hasErrors) {
        $module.Status = 'Error'
        $report.Summary.Error++
    }
    elseif ($hasWarnings) {
        $module.Status = 'Warning'
        $report.Summary.Warning++
    }
    else {
        $module.Status = 'OK'
        $report.Summary.OK++
    }
    
    $report.Modules += $module
}

# Output results
if ($OutputFormat -eq 'Json') {
    # Build packages.json format
    $packagesJson = @{
        ManifestVersion  = "2.0"
        PlatformVersion  = ""
        PlatformImage    = "ghcr.io/virtocommerce/platform"
        PlatformImageTag = ""
        PlatformAssetUrl = ""
        Sources          = @()
    }
    
    # Collect all unique alpha modules and release modules
    $alphaModules = @{}
    $releaseModules = @{}
    $platformVersions = @()
    
    foreach ($key in $processedModules.Keys) {
        $module = $processedModules[$key]
        
        # Collect platform versions
        if ($module.PlatformVersion) {
            $platformVersions += $module.PlatformVersion
        }
        
        # Collect alpha modules for AzureBlob source
        if ($module.IsAlfa -and $module.ModuleId -and $module.Version) {
            $moduleKey = $module.ModuleId
            # Keep the version from the module itself (not from dependencies)
            if (-not $alphaModules.ContainsKey($moduleKey)) {
                $alphaModules[$moduleKey] = $module.Version
            }
        }
        
        # Collect release modules for GithubReleases source
        if (-not $module.IsAlfa -and $module.ModuleId -and $module.Version -and $module.Status -ne 'Error') {
            $moduleKey = $module.ModuleId
            # Keep the version from the module itself (not from dependencies)
            if (-not $releaseModules.ContainsKey($moduleKey)) {
                $releaseModules[$moduleKey] = $module.Version
            }
        }
    }
    
    # Add all modules marked with group 'commerce' and their dependencies
    Write-Host "`nAdding modules from 'commerce' group..." -ForegroundColor Cyan
    $commerceModules = $edgePackages | Where-Object { 
        $groups = $_.Groups
        if ($null -eq $groups) { return $false }
        # Handle both array and string cases
        if ($groups -is [array]) {
            return $groups -contains 'commerce'
        }
        else {
            return $groups -eq 'commerce'
        }
    }
    
    foreach ($commerceModule in $commerceModules) {
        if ($null -eq $commerceModule.Id -or $null -eq $commerceModule.Versions -or $commerceModule.Versions.Count -eq 0) {
            continue
        }
        
        $moduleId = $commerceModule.Id
        # Get the latest version (first in Versions array is typically the latest)
        $latestVersion = $commerceModule.Versions[0]
        if ($null -eq $latestVersion -or $null -eq $latestVersion.Version) {
            Write-Warning "Module '$moduleId' has no valid version, skipping..."
            continue
        }
        
        # Build full version string
        $versionTag = $latestVersion.VersionTag
        if ($null -eq $versionTag -or $versionTag -eq '') {
            $fullVersion = $latestVersion.Version
        }
        else {
            $fullVersion = "$($latestVersion.Version)-$versionTag"
        }
        
        $isAlpha = IsAlfa $fullVersion
        
        # Update or add to the appropriate list
        if ($isAlpha) {
            # Update version if already exists, or add new
            if ($alphaModules.ContainsKey($moduleId)) {
                Write-Host "  Updating alpha module '$moduleId': $($alphaModules[$moduleId]) -> $fullVersion" -ForegroundColor Yellow
            }
            else {
                Write-Host "  Adding alpha module '$moduleId': $fullVersion" -ForegroundColor Green
            }
            $alphaModules[$moduleId] = $fullVersion
        }
        else {
            # Update version if already exists, or add new
            if ($releaseModules.ContainsKey($moduleId)) {
                Write-Host "  Updating release module '$moduleId': $($releaseModules[$moduleId]) -> $fullVersion" -ForegroundColor Yellow
            }
            else {
                Write-Host "  Adding release module '$moduleId': $fullVersion" -ForegroundColor Green
            }
            $releaseModules[$moduleId] = $fullVersion
        }
        
        # Collect platform version if available
        if ($latestVersion.PlatformVersion) {
            $platformVersions += $latestVersion.PlatformVersion
        }
        
        # Process dependencies of this commerce module
        if ($null -ne $latestVersion.Dependencies -and $latestVersion.Dependencies.Count -gt 0) {
            foreach ($dep in $latestVersion.Dependencies) {
                if ($null -eq $dep -or $null -eq $dep.Id -or $null -eq $dep.Version) {
                    continue
                }
                
                $depId = $dep.Id
                $depVersion = $dep.Version
                $depIsAlpha = IsAlfa $depVersion
                
                # Check if dependency is already in the lists
                $needsUpdate = $false
                if ($depIsAlpha) {
                    if (-not $alphaModules.ContainsKey($depId)) {
                        $needsUpdate = $true
                    }
                }
                else {
                    if (-not $releaseModules.ContainsKey($depId)) {
                        $needsUpdate = $true
                    }
                }
                
                # Process the dependency to get its latest version and ensure it's included
                if ($needsUpdate) {
                    $depModuleInPackages = $edgePackages | Where-Object { $_.Id -eq $depId }
                    if ($depModuleInPackages -and $null -ne $depModuleInPackages.Versions -and $depModuleInPackages.Versions.Count -gt 0) {
                        $depLatestVersion = $depModuleInPackages.Versions[0]
                        if ($null -ne $depLatestVersion -and $null -ne $depLatestVersion.Version) {
                            $depVersionTag = $depLatestVersion.VersionTag
                            if ($null -eq $depVersionTag -or $depVersionTag -eq '') {
                                $depFullVersion = $depLatestVersion.Version
                            }
                            else {
                                $depFullVersion = "$($depLatestVersion.Version)-$depVersionTag"
                            }
                            
                            $depIsAlphaFinal = IsAlfa $depFullVersion
                            if ($depIsAlphaFinal) {
                                $alphaModules[$depId] = $depFullVersion
                                Write-Host "    Adding dependency (alpha): '$depId': $depFullVersion" -ForegroundColor Gray
                            }
                            else {
                                $releaseModules[$depId] = $depFullVersion
                                Write-Host "    Adding dependency (release): '$depId': $depFullVersion" -ForegroundColor Gray
                            }
                            
                            # Collect platform version from dependency
                            if ($depLatestVersion.PlatformVersion) {
                                $platformVersions += $depLatestVersion.PlatformVersion
                            }
                        }
                    }
                }
            }
        }
    }
    
    Write-Host "Commerce group modules processing complete.`n" -ForegroundColor Green
    
    # Determine PlatformVersion (use the highest version found, or from root module)
    if ($platformVersions.Count -gt 0) {
        # Sort versions and take the highest
        # For alpha versions, compare only the first two segments (major.minor)
        $sortedVersions = $platformVersions | Sort-Object -Descending {
            $version = $_
            # First, try to parse as regular version
            try {
                $v = [System.Version]$version
                return $v.Major * 10000 + $v.Minor
            }
            catch {
                # Fallback: extract first two segments (major.minor) for alpha versions
                if ($version -match '^(\d+)\.(\d+)') {
                    $major = [int]$matches[1]
                    $minor = [int]$matches[2]
                    # Return a comparable object (major * 10000 + minor for simple numeric comparison)
                    return $major * 10000 + $minor
                }
                else {
                    return 0
                }
            }
        }
        $packagesJson.PlatformVersion = $sortedVersions[0]
    }
    else {
        # Fallback: try to extract from root module URL or use a default
        if ($customModuleUrl -match '(\d+\.\d+\.\d+)') {
            $packagesJson.PlatformVersion = $matches[1]
        }
        else {
            $packagesJson.PlatformVersion = "3.918.0" #TBD 
            Write-Host "Warning: Platform version not found in URL or manifest, using default: 3.918.0" -ForegroundColor Yellow
        }
    }
    
    # Put empty PlatformImageTag
    $packagesJson.PlatformImageTag = ""
    
    # Build Sources array
    $githubReleasesModules = @()
    foreach ($moduleId in $releaseModules.Keys | Sort-Object) {
        $version = $releaseModules[$moduleId]
        $githubReleasesModules += @{
            Id      = $moduleId
            Version = $version
        }
    }
    
    $githubReleasesSource = @{
        Name          = "GithubReleases"
        ModuleSources = @(
            "https://raw.githubusercontent.com/VirtoCommerce/vc-modules/master/modules_v3.json"
        )
        Modules       = $githubReleasesModules
    }
    
    $azureBlobModules = @()
    foreach ($moduleId in $alphaModules.Keys | Sort-Object) {
        $version = $alphaModules[$moduleId]
        $blobName = "${moduleId}_${version}.zip"
        $azureBlobModules += @{
            Id       = $moduleId
            BlobName = $blobName
        }
    }
    
    $azureBlobSource = @{
        Name       = "AzureBlob"
        Container  = "packages"
        ServiceUri = "https://vc3prerelease.blob.core.windows.net"
        Modules    = $azureBlobModules
    }
    
    $packagesJson.Sources = @($githubReleasesSource, $azureBlobSource)
    
    # Output in packages.json format
    $packagesJson | ConvertTo-Json -Depth 10 | Set-Content -Path $OutputFile
    Write-Host "`nReport saved to: $OutputFile" -ForegroundColor Green
}
else {
    # Console output
    Write-Host "`n" + "="*80 -ForegroundColor Cyan
    Write-Host "ALPHA MODULES DEPENDENCY CHECK REPORT" -ForegroundColor Cyan
    Write-Host "="*80 -ForegroundColor Cyan
    Write-Host "Generated: $($report.GeneratedAt)" -ForegroundColor White
    Write-Host "Root Module: $($report.RootModule.ModuleId)" -ForegroundColor White
    Write-Host "Total Modules Processed: $($report.TotalModulesProcessed)" -ForegroundColor White
    Write-Host "Summary:" -ForegroundColor White
    Write-Host "  OK: $($report.Summary.OK)" -ForegroundColor Green
    Write-Host "  Warnings: $($report.Summary.Warning)" -ForegroundColor Yellow
    Write-Host "  Errors: $($report.Summary.Error)" -ForegroundColor Red
    Write-Host "`n" + "-"*80 -ForegroundColor Gray
    
    function PrintModuleDetails {
        param($module, $depth = 0)
        
        $indent = "  " * $depth
        $statusColor = switch ($module.Status) {
            'OK' { 'Green' }
            'Warning' { 'Yellow' }
            'Error' { 'Red' }
            default { 'White' }
        }
        
        Write-Host "$indent`n$indent Module: $($module.ModuleId) v$($module.Version)" -ForegroundColor $statusColor
        Write-Host "$indent Status: $($module.Status)" -ForegroundColor $statusColor
        Write-Host "$indent Is Alpha: $($module.IsAlfa)" -ForegroundColor Gray
        
        if ($module.PlatformVersion) {
            Write-Host "$indent Platform Version Required: $($module.PlatformVersion)" -ForegroundColor Gray
        }
        
        if ($module.Error) {
            Write-Host "$indent Error: $($module.Error)" -ForegroundColor Red
        }
        
        if ($null -ne $module.Dependencies -and $module.Dependencies.Count -gt 0) {
            Write-Host "$indent Dependencies:" -ForegroundColor White
            foreach ($dep in $module.Dependencies) {
                $depColor = switch ($dep.Status) {
                    'Satisfied' { 'Green' }
                    'Insufficient' { 'Yellow' }
                    'Missing' { 'Red' }
                    'Error' { 'Red' }
                    'AlphaVersion' { 'Cyan' }
                    'AlreadyProcessed' { 'Gray' }
                    default { 'White' }
                }
                $availableInfo = if ($dep.AvailableVersion) { " (Available: $($dep.AvailableVersion))" } else { "" }
                Write-Host "$indent   - $($dep.ModuleId): Required $($dep.RequiredVersion)$availableInfo" -ForegroundColor $depColor
                Write-Host "$indent     Status: $($dep.Status)" -ForegroundColor $depColor
                if ($dep.Message) {
                    Write-Host "$indent     $($dep.Message)" -ForegroundColor Gray
                }
                
                # Recursively print dependency details if it was processed
                # This handles both alpha modules (downloaded) and release versions (from modules_v3.json)
                if ($dep.CheckResult) {
                    PrintModuleDetails -module $dep.CheckResult -depth ($depth + 2)
                }
            }
        }
        else {
            Write-Host "$indent No dependencies" -ForegroundColor Gray
        }
    }
    
    PrintModuleDetails -module $rootResult -depth 0
    
    Write-Host "`n" + "="*80 -ForegroundColor Cyan
}

# Write-Host "`nDependency check complete!" -ForegroundColor Green

# Write-Host "Generated packages.json:"
# Write-Host (Get-Content ./new-packages.json)

# # buil VC solution
# Write-Host "`e[32mPlatform and modules installation started"
# vc-build install --package-manifest-path ./new-packages.json `
#     --probing-path ./publish/app_data/modules `
#     --discovery-path ./publish/modules `
#     --root ./publish `
#     --skip-dependency-solving

# Get-ChildItem * -Include *packages.json -Recurse | Remove-Item -Verbose
