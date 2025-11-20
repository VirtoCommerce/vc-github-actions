<#
.SYNOPSIS
    Composes package.json for custom module installation.
.DESCRIPTION
    Downloads and processes custom modules, resolves dependencies, and generates an updated package.json file.
.PARAMETER customModuleId
    The ID of the custom module to process.
.PARAMETER customModuleUrl
    The URL where the custom module can be downloaded from.
.PARAMETER requiredModulesListUrl
    The URL where the required modules list can be downloaded from.
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$customModuleId,
    [Parameter(Mandatory = $true)]
    [string]$customModuleUrl,
    [string]$requiredModulesListUrl = ''
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
        [string]$moduleId,
        [string]$patchVersionRegex = '(?<patchVersion>\b\d+)[-a-zA-Z]+'
    )
    $currentVerSplitted = $currentVersion.split('.')
    $requiredVerSplitted = $requiredVersion.split('.')
    Write-Host "Comparing versions for $moduleId : $currentVersion vs $requiredVersion"
    if ($currentVerSplitted.Length -eq $requiredVerSplitted.Length) {
        if (IsAlfa $requiredVerSplitted[2] -or IsAlfa $currentVerSplitted[2]) {
            $currentPatchVersion = $requiredPatchVersion = $currentBaseVersion = $requiredBaseVersion = ''
            if ($currentVersion -match $patchVersionRegex) {
                # current version is alfa
                $currentPatchVersion = $matches['patchVersion']
                $currentBaseVersion = "$($currentVerSplitted[0]).$($currentVerSplitted[1]).$currentPatchVersion"
            }
            else {
                $currentBaseVersion = $currentVersion
            }
            if ($requiredVersion -match $patchVersionRegex) {
                # required version is alfa
                $requiredPatchVersion = $matches['patchVersion']
                $requiredBaseVersion = "$($requiredVerSplitted[0]).$($requiredVerSplitted[1]).$requiredPatchVersion"
            }
            else {
                $requiredBaseVersion = $requiredVersion
            }
            if ([System.Version]$currentBaseVersion -ge [System.Version]$requiredBaseVersion) {
                if ($moduleId -ne 'platform') {
                    Write-Warning "Adding the the current version $currentVersion to blob versions ..."
                    $script:packages["$moduleId"] = "$($moduleId)_$($currentVersion).zip"
                }
                else {
                    Write-Warning "Setting the current version $currentVersion for platform ..."
                    $script:platformVersion = "$currentVersion"
                }
            }
            else {
                if ($moduleId -ne 'platform') {
                    Write-Warning "Adding the required version $requiredVersion to blob versions ..."
                    $script:packages["$moduleId"] = "$($moduleId)_$($requiredVersion).zip"
                }
                else {
                    Write-Warning "Setting the required version $requiredVersion for platform ..."
                    $script:platformVersion = "$requiredVersion"
                }
            }
            return
        }
        if ([System.Version]$currentVersion -ge [System.Version]$requiredVersion) {
            Write-Host "Dependency satisfied"
        }
        else {
            if ($moduleId -ne 'platform') {
                Write-Warning "Update required. Add $moduleId $requiredVersion to release versions ..."
                $packages["$moduleId"] = "$($moduleId)_$requiredVersion.zip"
            }
            else {
                Write-Warning "Update required. Setting required version $requiredVersion for platform ..."
                $script:platformVersion = "$requiredVersion"
            }
        }
    }
    elseif ($currentVerSplitted.Length -lt $requiredVerSplitted.Length) {
        if ($moduleId -ne 'platform') {
            Write-Warning "Prerelease version required. Add $moduleId $requiredVersion to blob versions ..."
            # $script:releasePackages.Remove("$moduleId")
            $script:packages["$moduleId"] = "$($moduleId)_$requiredVersion.zip"
        }
        else {
            Write-Warning "Prerelease version required. Setting required version $requiredVersion for platform ..."
            $script:platformVersion = "$requiredVersion"
        }
        return
    }
    elseif ($currentVerSplitted.Length -gt $requiredVerSplitted.Length) {
        if ($moduleId -ne 'platform') {
            Write-Warning "The the current version is prerelease. Leaving as $currentVersion blob version ..."
        }
        else {
            Write-Warning "The the current version is prerelease. Leaving $currentVersion version for platform ..."
            $script:platformVersion = "$currentVersion"
        }
        return
    }
    else {
        Write-Error "Unexpected version comparison result"
        throw "Version comparison failed for module $moduleId"
    }
}

function ProcessCustomModule {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$CustomModuleId,
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$CustomModuleUrl,
        [bool]$recursive = $false
    )
    Write-Host "Processing '$CustomModuleId' module ..."
    $CustomModuleZip = "./$($CustomModuleId).zip"
    Write-Host "`e[32mDownload $($CustomModuleUrl) to $($CustomModuleZip)."

    Invoke-WebRequestWithRetry -Uri $CustomModuleUrl -OutFile $CustomModuleZip

    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[32mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$CustomModuleZip deleted."
    $content = Get-Content -Path $CustomModuleId/module.manifest -Raw

    # add prerelease entry to `blobPackages` hashtable
    $node = $(Select-Xml -Content $content -XPath "//module").Node
    $version = $node.version
    $versionTag = $node.'version-tag'
    if ($version -is [array]) {
        $version = $version[0]
    }
    if ($versionTag -is [array]) {
        $versionTag = $versionTag[0]
    }
    if ($versionTag -eq '') {
        $fullVersion = "$version"
    }
    else {
        $fullVersion = "$version-$versionTag"
    }

    $script:packages["$CustomModuleId"] = "$($CustomModuleId)_$($fullVersion).zip"

    # resolve dependencies for custom module
    $xmlDependency = $(Select-Xml -Content $content -XPath "//dependencies").Node.dependency

    if ($recursive -eq $true) {
        foreach ($dependency in $xmlDependency) {
            if ($script:packages["$($dependency.id)"] -match "\w._(.*).zip") {
                CompareVersions -currentVersion $Matches[1] -requiredVersion $($dependency.version) -moduleId $($dependency.id)
            }
            else {
                Write-Warning "Unable to parse version from packages list. Tried $packages[$key] -match '\w._(.*).zip'"
            }
            Write-Host "`e[32mAdd the $($dependency.id) module $($dependency.version) version to the dependencies list"
        }
        CompareVersions -currentVersion $script:platformVersion -requiredVersion $(Select-Xml -Content $content -XPath "/module/platformVersion").Node.InnerText -moduleId 'platform'
    }
    else {
        foreach ($dependency in $xmlDependency) {
            $script:dependencyList["$($dependency.id)"] = "$($dependency.version)"
            Write-Host "`e[32mAdd the $($dependency.id) module $($dependency.version) version to the dependencies list"
        }
        $script:packagesProcessed += "$CustomModuleId"
        $script:platformVersion = $(Select-Xml -Content $content -XPath "/module/platformVersion").Node.InnerText
    }
    Remove-Item -Path ./"$CustomModuleId" -Force -Recurse
    Write-Host "`e[32m$CustomModuleId deleted."
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



$packages = @{}
$packagesProcessed = @()
$dependencyList = @{}
$platformVersion = ''
$blobPackagesUrl = "https://vc3prerelease.blob.core.windows.net/packages"

# add required module and platform versions from $requiredModulesListUrl
if ($requiredModulesListUrl -ne '') {
    $requiredModulesListContent = $(Invoke-WebRequestWithRetry -Uri $requiredModulesListUrl).Content
    $requiredModulesListJson = $requiredModulesListContent | ConvertFrom-Json
    $requiredModulesListJson | ForEach-Object {
        if ($_.Id -eq 'VirtoCommerce.Platform') {
            $platformVersion = $_.Version
        }
        else {
            $packages["$($_.Id)"] = "$($_.Id)_$($_.Version).zip"
        }
    }
}

$edgePackages = $(Invoke-WebRequestWithRetry -Uri https://raw.githubusercontent.com/VirtoCommerce/vc-modules/refs/heads/master/modules_v3.json).Content | ConvertFrom-Json -Depth 10

# add modules from the "commerce" group
$commerceModules = $($edgePackages | Where-Object { $_.Groups -eq 'commerce' } | Select-Object -ExcludeProperty Versions).Id
foreach ($mm in $commerceModules) {
    if ($null -eq $packages["$mm"]) {
        $packages["$mm"] = "$($mm)_$($($edgePackages | Where-Object { $_.Id -eq $mm } | Select-Object -ExpandProperty Versions)[0].Version).zip"
    }
}

# add VirtoCommerce.CustomerExportImport for importing customers
if ($null -ne $packages["VirtoCommerce.Quote"]) {
    $packages["VirtoCommerce.Quote"] = "VirtoCommerce.Quote_$($($edgePackages | Where-Object { $_.Id -eq 'VirtoCommerce.Quote' } | Select-Object -ExpandProperty Versions)[0].Version).zip"
}

# process the initial first custom module
ProcessCustomModule -CustomModuleId $customModuleId -CustomModuleUrl $customModuleUrl # -blobPackagesProcessed $blobPackagesProcessed

# resolve first level dependencies
foreach ($key in $dependencyList.Keys) {
    # add dep to packages
    if ($packages["$key"] -match "\w._(.*).zip") {
        CompareVersions -currentVersion $Matches[1] -requiredVersion $dependencyList["$key"] -moduleId $key
    }
    else {
        Write-Warning "Unable to parse version from packages list. Tried $packages[$key] -match '\w._(.*).zip'"
    }
    # get dep2lev
    if ($($dependencyList["$key"].split('.')[2]) -notmatch '[A-za-z-]' -and $packagesProcessed -notcontains $key) {
        # release version
        Write-Host "Processing dependent module '$key' ..."
        $i = 0
        $deps = $($edgePackages | Where-Object { $_.Id -eq $key } | Select-Object -ExpandProperty Versions)[0].Dependencies
        if ($deps) {
            $deps.GetEnumerator()
            while ($i -lt $deps.Count) {
                $id = $deps[$i].Id
                $version = $deps[$i].Version
                if ($packages.Keys -contains $id) {
                    if ($packages["$id"] -match '(?<=_)(\d+\.\d+\.\d+)(?=\.zip)') {
                        CompareVersions -currentVersion $matches[0] -requiredVersion $version -moduleId $id
                    }
                }
                else {
                    $packages["$id"] = "$($id)_$($version).zip"
                }
                $platformVersionDep = $($edgePackages | Where-Object { $_.Id -eq $key } | Select-Object -ExpandProperty Versions)[0].PlatformVersion
                CompareVersions -currentVersion $platformVersion -requiredVersion $platformVersionDep -moduleId platform
                $i += 1
            }
        }
        $packagesProcessed += "$key"
    }
    elseif ($($dependencyList["$key"].split('.')[2]) -match '[A-za-z-]' -and $packagesProcessed -notcontains $key) {
        # blob version
        Write-Host "Processing dependent module '$key' ..."
        $packagesProcessed += "$key"
        $customModuleUrl = "$blobPackagesUrl/$($key)_$($dependencyList["$key"]).zip"
        ProcessCustomModule -CustomModuleId $key -CustomModuleUrl $customModuleUrl -recursive $true
    }
}

# resolve recursive dependencies
$attempts = 0
while ($attempts -le 10) {
    # make 10 check cycles of $packages
    $packagesCopy = @{} + $packages
    foreach ($key in $packagesCopy.Keys) {
        if ($($packages["$key"].split('.')[2]) -notmatch '[A-za-z-]' -and $packagesProcessed -notcontains $key) {
            # release version
            Write-Host "Processing dependent module '$key' ..."
            $i = 0
            $deps = $($edgePackages | Where-Object { $_.Id -eq $key } | Select-Object -ExpandProperty Versions)[0].Dependencies
            if ($deps) {
                $deps.GetEnumerator()
                while ($i -lt $deps.Count) {
                    $id = $deps[$i].Id
                    $version = $deps[$i].Version
                    if ($packages.Keys -contains $id) {
                        if ($packages["$id"] -match '(?<=_)(\d+\.\d+\.\d+)(?=\.zip)') {
                            CompareVersions -currentVersion $matches[0] -requiredVersion $version -moduleId $id
                        }
                        else {
                            CompareVersions -currentVersion $packages["$id"] -requiredVersion $version -moduleId $id
                        }
                    }
                    else {
                        $packages["$id"] = "$($id)_$($version).zip"
                    }
                    # compare platform for every dep
                    $depsPlatform = $($edgePackages | Where-Object { $_.Id -eq $key } | Select-Object -ExpandProperty Versions)[0].PlatformVersion
                    CompareVersions -currentVersion $platformVersion -requiredVersion $depsPlatform -moduleId 'platform'
                    $i += 1
                }
            }
            $packagesProcessed += "$key"
        }
        elseif ($($packages["$key"].split('.')[2]) -match '[A-za-z-]' -and $packagesProcessed -notcontains $key) {
            # blob version
            Write-Host "Processing dependent module '$key' ..."
            $customModuleUrl = "$blobPackagesUrl/$($key)_$($packages["$key"]).zip"
            ProcessCustomModule -CustomModuleId $key -CustomModuleUrl $customModuleUrl -recursive $true
            $packagesProcessed += "$key"
        }
    }
    $attempts += 1
}

# compose a packages.json file
$updatedReleaseModules = @()
$updatedBlobModules = @()

foreach ($p in $packages.Keys) {
    if ($($packages["$p"].split('.')[3]) -match '[A-za-z-]') {
        # blob version
        $m = [ordered]@{}
        $m.Add("Id", "$p")
        $m.Add("BlobName", "$($packages["$p"])")
        $updatedBlobModules += $m
    }
    elseif ($($packages["$p"].split('.')[3]) -match '\d+') {
        # release version
        $m = [ordered]@{}
        $m.Add("Id", "$p")
        $packages["$p"] -match '(?<=_)(\d+\.\d+\.\d+)(?=\.zip)' > $null
        $version = $Matches[0]
        $m.Add("Version", "$version")
        $updatedReleaseModules += $m
    }
}

Write-Host "`e[32mModules processing complete!"
Write-Host "`e[32mRelease modules count: $($updatedReleaseModules.Count)"
Write-Host "`e[32mBlob modules count: $($updatedBlobModules.Count)"


$packagesJson = $(Invoke-WebRequestWithRetry -Uri https://raw.githubusercontent.com/VirtoCommerce/vc-modules/refs/heads/master/bundles/latest/package.json).Content | ConvertFrom-Json

# Check the case if platform version is alfa
$($packagesJson.Sources | Where-Object { $_.Name -eq 'AzureBlob' }).Modules = $updatedBlobModules
$($packagesJson.Sources | Where-Object { $_.Name -eq 'GithubReleases' }).Modules = $updatedReleaseModules
if ($platformVersion.split('.')[2] -match '[A-za-z-]') {
    $packagesJson | Add-Member -MemberType NoteProperty -Name "PlatformAssetUrl" -Value "$blobPackagesUrl/VirtoCommerce.Platform.$platformVersion.zip" -Force
}
else {
    $packagesJson.PlatformVersion = $platformVersion
}
# Save the changes back to the JSON file
$packagesJson | ConvertTo-Json -Depth 10 | Set-Content -Path ./new-packages.json

Write-Host "Generated packages.json:"
Write-Host (Get-Content ./new-packages.json)

# buil VC solution
Write-Host "`e[32mPlatform and modules installation started"
vc-build install --package-manifest-path ./new-packages.json `
    --probing-path ./publish/app_data/modules `
    --discovery-path ./publish/modules `
    --root ./publish `
    --skip-dependency-solving

Get-ChildItem * -Include *packages.json -Recurse | Remove-Item -Verbose
