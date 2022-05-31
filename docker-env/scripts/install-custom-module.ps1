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
        Write-Host "`e[33mError ocure while $($CustomModuleId) uninstall."
    }
    Pop-Location
    Push-Location "./$($InstallFolder)/modules"
    Write-Host "`e[33mDownload $($CustomModuleUrl) to $($CustomModuleZip)."
    Invoke-WebRequest -Uri $CustomModuleUrl -OutFile $CustomModuleZip
    Write-Host "`e[33mExpand $($CustomModuleZip) from zip."
    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[33mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$($CustomModuleZip) deleted."
    Pop-Location
    Write-Host "`e[32mCustom module installed."
    Exit 0
}