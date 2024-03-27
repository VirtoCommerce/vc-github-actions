Set-Variable -Name "TERM" -Value "xterm-color"

function InstallCustomModule {
    param (
        [string]$InstallFolder,# = "modules", # Folder where vc-package.json placed
        [string]$CustomModuleId ,#= "VirtoCommerce.Quote", # CustomModuleId to reinstall
        [string]$CustomModuleUrl #= "https://vc3prerelease.blob.core.windows.net/packages/VirtoCommerce.Quote_3.804.0-alpha.393-dev.zip"
    )

    Write-Host "`e[33mInstall Custom Modules step started."
    $CustomModuleZip = "./$($CustomModuleId).zip"
    Push-Location "./$($InstallFolder)"
    pwd
    ls
    Write-Host "`e[33mTry to uninstall $($CustomModuleId)."
    try {
        & "vc-build uninstall -module $($CustomModuleId)"
#        & vc-build uninstall -module $($CustomModuleId)
        Write-Host "`e[32m$($CustomModuleId) successfull uninstalled."
    }
    catch {
        Write-Host "`e[31mError ocure while $($CustomModuleId) uninstall."
    }
    # Pop-Location
    Push-Location "./$($InstallFolder)/" #modules"
    Write-Host "`e[33mDownload $($CustomModuleUrl) to $($CustomModuleZip)."
    Invoke-WebRequest -Uri $CustomModuleUrl -OutFile $CustomModuleZip
    Write-Host "`e[33mExpand $($CustomModuleZip) from zip."
    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[33mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$($CustomModuleZip) deleted."
    Write-Host "`e[32mDependency check for $CustomModuleId started."
    echo "ls:"
    pwd
    ls
    echo "ls ..:"
    ls ..
    $moduleList = Get-ChildItem -Path ./ -Directory -Name
    echo "Found modules: $moduleList"
    $installList = @()
    $installHash = @{}
    $i = 0
    $content = Get-Content -Path $CustomModuleId/module.manifest -Raw
    $xml = Select-Xml -Content $content -XPath "//dependencies"
    foreach ($node in $xml){
        while ($i -lt $($node.Node.dependency.id.Length)){
            $installHash.Add("$($node.Node.dependency.id[$i])","$($node.Node.dependency.version[$i])")
            $installList += $($node.Node.dependency.id[$i])
            $i += 1
        }
    }
    Pop-Location
    echo "Install list: $installList"
    foreach ($m in $installList) { # $($node.Node.dependency.id)) {
        echo "Processing $m ..."
        if ($moduleList -contains $m) {
            echo "Module $m is found. Skipping installation"
        } else {
            $version = $installHash[$m]
            echo "Installing dependent module $m version $version" #version $($node.Node.dependency.version)"
            vc-build install -module $m -version $version #-SkipDependencySolving
        }
    }
    Write-Host "`e[32mCustom module installed."
    #Pop-Location
    Exit 0
}
InstallCustomModule -InstallFolder modules -CustomModuleId VirtoCommerce.Quote -CustomModuleUrl https://vc3prerelease.blob.core.windows.net/packages/VirtoCommerce.Quote_3.804.0-alpha.393-dev.zip