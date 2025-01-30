param (
    [string]$customModuleId,
    [string]$customModuleUrl
)

function CompareVersions {
    param(
        [string]$currentVersion,
        [string]$requiredVersion,
        [string]$moduleId
    )
    Write-Output "Comparing versions for $moduleId module: $currentVersion vs $requiredVersion"
    if ($($currentVersion.split('.')).Length -eq $($requiredVersion.split('.')).Length){
        if ($requiredVersion.split('.')[2] -match '[A-za-z-]'){
            Write-Warning "Prerelease version required. Add $moduleId $requiredVersion to blob versions ..."
            $script:releasePackages.Remove("$moduleId")
            $script:blobPackages["$moduleId"] = "$($moduleId)_$($requiredVersion).zip"
            Continue
        }
        if ([System.Version]$currentVersion -ge [System.Version]$requiredVersion) {
            Write-Output "Dependency satisfied"
        } else {
            Write-Warning "Update required. Add $moduleId $requiredVersion to release versions ..."
            $releasePackages["$moduleId"] = "$requiredVersion"
        }
    } elseif ($($currentVersion.split('.')).Length -lt $($requiredVersion.split('.')).Length) {
        Write-Warning "Prerelease version required. Add $moduleId $requiredVersion to blob versions ..."
        $script:releasePackages.Remove("$moduleId")
        $script:blobPackages["$moduleId"] = "$($moduleId)_$($requiredVersion).zip"
    } elseif ($($currentVersion.split('.')).Length -gt $($requiredVersion.split('.')).Length) {
        Write-Warning "Prerelease version installed."
    } else {
        Write-Error "Unexpected result `n $_.Error"
        exit 1
    }
}

function ProcessCustomModule {
    param (
        [string]$CustomModuleId,
        [string]$CustomModuleUrl,
        [bool]$Cascade = $false
    )
    Write-Output "Processing '$CustomModuleId' module ..."
    $CustomModuleZip = "./$($CustomModuleId).zip"
    Write-Host "`e[33mDownload $($CustomModuleUrl) to $($CustomModuleZip)."
    # if ($CustomModuleId -ne "VirtoCommerce.Orders"){
        try {
            Invoke-WebRequest -Uri $CustomModuleUrl -OutFile $CustomModuleZip
        } catch {
            Write-Error "$_"
            exit 1
        }
    # }
    Write-Host "`e[33mExpand $($CustomModuleZip) from zip."
    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[33mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$($CustomModuleZip) deleted."
    $content = Get-Content -Path $CustomModuleId/module.manifest -Raw

    # add prerelease entry to `blobPackages` hashtable
    $version = $(Select-Xml -Content $content -XPath "//module").Node.version
    $versionTag = $(Select-Xml -Content $content -XPath "//module").Node.'version-tag'
    $fullVersion = "$version-$versionTag"
    
    # $script:blobPackages.Add($CustomModuleId,"$($CustomModuleId)_$($fullVersion).zip")
    $script:blobPackages["$CustomModuleId"] = "$($CustomModuleId)_$($fullVersion).zip"
    $script:releasePackages.Remove("$CustomModuleId")

    # resolve dependencies for custom module
    $xml = Select-Xml -Content $content -XPath "//dependencies"
    foreach ($dependency in $($xml.Node.dependency)){
        if ($null -eq $($releasePackages[$($dependency.id)])){ # case when the module is alredy added to blob realease list
            Write-Warning "There is no release version for the $($dependency.id) module. Blob version is $($blobPackages[$($dependency.id)])"
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
    
}
$blobPackages = @{}
$releasePackages = @{}
$blobPackagesProcessed = @()
$platformVersion = ''

# fetch packages.json from bundle
$(Invoke-WebRequest -Uri https://raw.githubusercontent.com/VirtoCommerce/vc-modules/refs/heads/master/bundles/latest/package.json).Content | Set-Content ./packages.json
$packagesJson = Get-Content ./packages.json -Raw | ConvertFrom-Json
$moduleList = $packagesJson.Sources | Where-Object { $_.Name -eq "GithubReleases" } | Select-Object -ExpandProperty Modules

# compose a `releasePackages` hashtable for the list of module release versions
$i = 0
while($i -lt $($moduleList.Length)){
    $releasePackages.Add("$($moduleList[$i].id)","$($moduleList[$i].version)")
    $i += 1
}

# find and remove custom module's version in `releasePackages` hashtable
ProcessCustomModule -CustomModuleId $customModuleId -CustomModuleUrl $customModuleUrl # -blobPackagesProcessed $blobPackagesProcessed

# resolve cascade dependencies
$blobPackagesCopy = @{} + $blobPackages
foreach ($key in $blobPackagesCopy.Keys){
    $blobPackagesProcessedCopy = @()
    if ($blobPackagesProcessed -notcontains $key){
        ProcessCustomModule -CustomModuleId $key -CustomModuleUrl "https://vc3prerelease.blob.core.windows.net/packages/$($blobPackages[$key])" -Cascade $true
    } else {
        Write-Output "Module $key is already in processed list"
    }
    if ($blobPackagesProcessedCopy.Length -ne 0){
        $blobPackagesProcessed += $blobPackagesProcessedCopy
    }
}
if ($blobPackagesCopy -ne $blobPackages){
    $blobPackages = $blobPackagesCopy
}
# cp "C:\Users\AndrewKubyshkin\Downloads\VirtoCommerce.Orders_3.838.0-pr-442-c4fe (1).zip" "C:\Users\AndrewKubyshkin\Documents\temp\VCST-2469-alfa-dependency-e2e\VirtoCommerce.Orders.zip"
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

echo "Release modules count: $($updatedReleaseModules.Count)"
echo "Blob modules count: $($updatedBlobModules.Count)"

# Save the changes back to the JSON file
$packagesJson.Sources[0].Modules = $updatedReleaseModules
$packagesJson.Sources[1].Modules = $updatedBlobModules
if ($platformVersion.split('.')[2] -match '[A-za-z-]'){
    $packagesJson.PlatformAssetUrl = "https://vc3prerelease.blob.core.windows.net/packages/VirtoCommerce.Platform.$platformVersion.zip"
} else {
    $packagesJson.PlatformVersion = $platformVersion
}
$packagesJson | ConvertTo-Json -Depth 10 | Set-Content -Path ./new-packages.json

echo "Generated packages.json:"
cat ./new-packages.json

# buil VC solution
# vc-build InstallModules -PackageManifestPath ./new-packages.json -ProbingPath ./platform/app_data/modules -DiscoveryPath ./platform/modules --root ./platform -SkipDependencySolving
vc-build install --package-manifest-path ./new-packages.json `
                 --probing-path ./publish/platform/app_data/modules `
                 --discovery-path ./publish/modules `
                 --root ./publish/platform `
                 --skip-dependency-solving