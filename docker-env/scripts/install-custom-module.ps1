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
        vc-build uninstall -module $($CustomModuleId)
        Write-Host "`e[32m$($CustomModuleId) successfully uninstalled."
    }
    catch {
        Write-Host "`e[31mError occurred while uninstalling $($CustomModuleId)."
        Write-Host "`e[31mError Message: $($_.Exception.Message)"
        Write-Host "`e[31mStack Trace: $($_.Exception.StackTrace)"
    }
    Push-Location "./modules" #modules"
    Write-Host "`e[33mDownload $($CustomModuleUrl) to $($CustomModuleZip)."
    Invoke-WebRequest -Uri $CustomModuleUrl -OutFile $CustomModuleZip
    Write-Host "`e[33mExpand $($CustomModuleZip) from zip."
    Expand-Archive $CustomModuleZip -Force
    Write-Host "`e[33mDelete $($CustomModuleZip)."
    Remove-Item -Path $CustomModuleZip
    Write-Host "`e[32m$($CustomModuleZip) deleted."
    Write-Host "`e[32mDependency check for $CustomModuleId started."
    $moduleList = Get-ChildItem -Path ./ -Directory -Name
    $installHash = @{}
    $i = 0
    $content = Get-Content -Path $CustomModuleId/module.manifest -Raw
    $xml = Select-Xml -Content $content -XPath "//dependencies"
    while($i -lt $($xml.Node.dependency.Length)){
        $installHash.Add("$($xml.Node.dependency[$i].id)","$($xml.Node.dependency[$i].version)")
        $i += 1
    }
    Pop-Location
    foreach ($m in $($xml.Node.dependency.id)) {
        if ($moduleList -contains $m) {
        } else {
            $version = $installHash[$m]
            Write-Host "Installing dependent module $m version $version"
            vc-build install -module $m -version $version -SkipDependencySolving
        }
    }
    Write-Host "`e[32mCustom module installed."
    Exit 0
}
