Set-Variable -Name "TERM" -Value "xterm-color"

function InstallCustomModule {
    param (
        [string]$InstallFolder = "modules", # Folder where vc-package.json placed
        [string]$CustomModuleId, # CustomModuleId to reinstall
        [string]$CustomModuleUrl
    )

    Write-Host "`e[33mInstall Custom Modules step started."
    $CustomModuleZip = "./$($CustomModuleId).zip"
    Push-Location "./$($InstallFolder)"
    Write-Host "`e[33mTry to uninstall $($CustomModuleId)."
    try {
        & "vc-build uninstall -module $($CustomModuleId)"
#        & vc-build uninstall -module $($CustomModuleId)
        Write-Host "`e[32m$($CustomModuleId) successfull uninstalled."
    }
    catch {
        Write-Host "`e[31mError ocure while $($CustomModuleId) uninstall."
    }
    Pop-Location
    Push-Location "./$($InstallFolder)/" #modules"
    Write-Host "`e[33mDownload $($CustomModuleUrl) to $($CustomModuleZip)."
    Invoke-WebRequest -Uri $CustomModuleUrl -OutFile $CustomModuleZip
    Write-Host "`e[33mExpand $($CustomModuleZip) from zip."
    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[33mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$($CustomModuleZip) deleted."
    Write-Host "`e[32mDependency installation for $CustomModuleId started."
    $content = Get-Content -Path $CustomModuleId/module.manifest -Raw
    $xml = Select-Xml -Content $content -XPath "//dependencies"
    Pop-Location
    $moduleList = Get-ChildItem -Path $InstallFolder -Directory -Name
    foreach ($node in $xml) {
        $installList += $node.Node.dependency.id
    }
        foreach ($m in $installList) { # $($node.Node.dependency.id)) {
            if ($moduleList -contains $m) {
                echo "Module $m is found. Skipping installation"
            } else {
                echo "Installing dependent module $m " #version $($node.Node.dependency.version)"
                vc-build install -module $m
            }
        }
    Write-Host "`e[32mCustom module installed."
    Exit 0
}
InstallCustomModule -InstallFolder modules -CustomModuleId VirtoCommerce.Quote -CustomModuleUrl https://vc3prerelease.blob.core.windows.net/packages/VirtoCommerce.Quote_3.804.0-alpha.393-dev.zip