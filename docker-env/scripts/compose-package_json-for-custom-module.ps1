<#
.SYNOPSIS
    Composes package.json for custom module installation.
.DESCRIPTION
    Downloads and processes custom modules, resolves dependencies, and generates an updated package.json file.
.PARAMETER customModuleId
    The ID of the custom module to process.
.PARAMETER customModuleUrl
    The URL where the custom module can be downloaded from.
#>
[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [string]$customModuleId,
    [Parameter(Mandatory=$true)]
    [string]$customModuleUrl
)

function CompareVersions {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$currentVersion,
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$requiredVersion,
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$moduleId
    )
    $currentVerSplitted = $currentVersion.split('.')
    $requiredVerSplitted = $requiredVersion.split('.')
    Write-Host "Comparing versions for $moduleId module: $currentVersion vs $requiredVersion"
    if ($currentVerSplitted.Length -eq $requiredVerSplitted.Length){
        if ($requiredVerSplitted[2] -match '[A-za-z-]'){
            Write-Warning "Prerelease version required. Add $moduleId $requiredVersion to blob versions ..."
            $script:releasePackages.Remove("$moduleId")
            $script:blobPackages["$moduleId"] = "$($moduleId)_$($requiredVersion).zip"
            return
        }
        if ([System.Version]$currentVersion -ge [System.Version]$requiredVersion) {
            Write-Host "Dependency satisfied"
        } else {
            Write-Warning "Update required. Add $moduleId $requiredVersion to release versions ..."
            $releasePackages["$moduleId"] = "$requiredVersion"
        }
    } elseif ($currentVerSplitted.Length -lt $requiredVerSplitted.Length) {
        Write-Warning "Prerelease version required. Add $moduleId $requiredVersion to blob versions ..."
        $script:releasePackages.Remove("$moduleId")
        $script:blobPackages["$moduleId"] = "$($moduleId)_$requiredVersion.zip"
        return
    } elseif ($currentVerSplitted.Length -gt $requiredVerSplitted.Length) {
        Write-Warning "Prerelease version installed."
        return
    } else {
        Write-Error "Unexpected version comparison result"
        throw "Version comparison failed for module $moduleId"
    }
}

function ProcessCustomModule {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$CustomModuleId,
        [Parameter(Mandatory=$true)]
        [ValidateNotNullOrEmpty()]
        [string]$CustomModuleUrl,
        [bool]$Cascade = $false
    )
    Write-Host "Processing '$CustomModuleId' module ..."
    $CustomModuleZip = "./$($CustomModuleId).zip"
    Write-Host "`e[32mDownload $($CustomModuleUrl) to $($CustomModuleZip)."
    try {
        Invoke-WebRequestWithRetry -Uri $CustomModuleUrl -OutFile $CustomModuleZip 
    } catch {
        Write-Error "$_"
        exit 1
    }
    Write-Host "`e[32mExpand $($CustomModuleZip) from zip."
    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[32mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$CustomModuleZip deleted."
    $content = Get-Content -Path $CustomModuleId/module.manifest -Raw

    # add prerelease entry to `blobPackages` hashtable
    $version = $(Select-Xml -Content $content -XPath "//module").Node.version
    $versionTag = $(Select-Xml -Content $content -XPath "//module").Node.'version-tag'
    if ($version -is [array]) {
        $version = $version[0]
    }
    if ($versionTag -is [array]) {
        $versionTag = $versionTag[0]
    }
    $fullVersion = "$version-$versionTag"
    
    $script:blobPackages["$CustomModuleId"] = "$($CustomModuleId)_$($fullVersion).zip"
    $script:releasePackages.Remove("$CustomModuleId")

    # resolve dependencies for custom module
    $xml = Select-Xml -Content $content -XPath "//dependencies"
    foreach ($dependency in $($xml.Node.dependency)){
        if ($null -eq $($releasePackages[$($dependency.id)])){ # case when the module is alredy added to blob realease list
            Write-Host "`e[32mThere is no release version for the $($dependency.id) module. Blob version is $($blobPackages[$($dependency.id)])"
        } else {
            CompareVersions -currentVersion $releasePackages[$($dependency.id)] -requiredVersion $($dependency.version) -moduleId $($dependency.id)
        }
    }
    if($cascade -eq $true){
        $script:blobPackagesProcessedCopy += "$CustomModuleId"
    } else {
        $script:blobPackagesProcessed += "$CustomModuleId"
        $script:platformVersion = $(Select-Xml -Content $content -XPath "/module/platformVersion").Node.InnerText
    }
    Remove-Item -Path ./$CustomModuleId -Force -Recurse
    Write-Host "`e[32m$CustomModuleId deleted."
}

function Invoke-WebRequestWithRetry {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory=$true)]
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
            } else {
                return Invoke-WebRequest -Uri $Uri -TimeoutSec 15
            }
            return
        }
        catch {
            $retryCount++
            if ($retryCount -eq $MaxRetries) {
                Write-Error "Failed to download after $MaxRetries attempts: $_"
                throw
            }
            Write-Warning "Attempt $retryCount failed, retrying in $RetryDelaySeconds seconds..."
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }
}

$blobPackages = @{}
$releasePackages = @{}
$blobPackagesProcessed = @()
$platformVersion = ''
$blobPackagesUrl = "https://vc3prerelease.blob.core.windows.net/packages"

# fetch packages.json from bundle
$(Invoke-WebRequestWithRetry -Uri https://raw.githubusercontent.com/VirtoCommerce/vc-deploy-dev/refs/heads/virtostart/backend/packages.json).Content | Set-Content ./packages.json
$packagesJson = Get-Content ./packages.json -Raw | ConvertFrom-Json
$releaseList = $packagesJson.Sources | Where-Object { $_.Name -eq "GithubReleases" } | Select-Object -ExpandProperty Modules
$blobList = $packagesJson.Sources | Where-Object { $_.Name -eq "AzureBlob" } | Select-Object -ExpandProperty Modules

# compose a `releasePackages` hashtable for the list of module release versions
$i = 0
while($i -lt $($releaseList.Length)){
    $releasePackages.Add("$($releaseList[$i].id)","$($releaseList[$i].version)")
    $i += 1
}
$b = 0
while($b -lt $($blobList.Length)){
    $blobPackages.Add("$(($blobList[$b].BlobName).Split('_')[0])","$($blobList[$b].BlobName)")
    $b += 1
}

# find and remove custom module's version in `releasePackages` hashtable
ProcessCustomModule -CustomModuleId $customModuleId -CustomModuleUrl $customModuleUrl # -blobPackagesProcessed $blobPackagesProcessed

# resolve cascade dependencies
$blobPackagesCopy = @{} + $blobPackages
foreach ($key in $blobPackagesCopy.Keys){
    $blobPackagesProcessedCopy = @()
    if ($blobPackagesProcessed -notcontains $key){
        ProcessCustomModule -CustomModuleId $key -CustomModuleUrl "$blobPackagesUrl/$($blobPackages[$key])" -Cascade $true
    } 
    if ($blobPackagesProcessedCopy.Length -ne 0){
        $blobPackagesProcessed += $blobPackagesProcessedCopy
    }
}
if ($blobPackagesCopy -ne $blobPackages){
    $blobPackages = $blobPackagesCopy
}
$updatedReleaseModules = @()
$updatedBlobModules = @()

foreach ($releasePkg in $releasePackages.Keys){
    $m = [ordered]@{}
    $m.Add("Id","$releasePkg")
    $m.Add("Version", "$($releasePackages.$releasePkg)")
    $updatedReleaseModules += $m
}

foreach ($blobPkg in $blobPackages.Keys){
    $m = [ordered]@{}
    $m.Add("Id","$blobPkg")
    $m.Add("BlobName", "$($blobPackages.$blobPkg)")
    $updatedBlobModules += $m
}

Write-Host "`e[32mModules processing complete!"
Write-Host "`e[32mRelease modules count: $($updatedReleaseModules.Count)"
Write-Host "`e[32mBlob modules count: $($updatedBlobModules.Count)"

# Save the changes back to the JSON file
$packagesJson.Sources[1].Modules = $updatedReleaseModules
$packagesJson.Sources[0].Modules = $updatedBlobModules
if ($platformVersion.split('.')[2] -match '[A-za-z-]'){
    $packagesJson.PlatformAssetUrl = "$blobPackagesUrl/VirtoCommerce.Platform.$platformVersion.zip"
} else {
    $packagesJson.PlatformVersion = $platformVersion
}
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