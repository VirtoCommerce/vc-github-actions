$modulesJsonUrl = "https://raw.githubusercontent.com/VirtoCommerce/vc-modules/master/modules_v3.json"
$modulesJson = Invoke-RestMethod -Method Get -Uri $modulesJsonUrl
$workflowName = "$PSScriptRoot/deploy.yml"
Remove-Item $workflowName -Force -ErrorAction SilentlyContinue
# Head
$head = @"
name: Deploy Github Actions

on:
  workflow_dispatch:

jobs:

  build:  
    runs-on: ubuntu-latest
    
    steps:

"@
Add-Content -Path $workflowName -Value $head

# Modules
foreach($module in $modulesJson)
{
    foreach($version in $module.Versions)
    {
        $packageUrl = $version.PackageUrl.split("/")
        if($packageUrl[2] -eq "github.com")
        {
            $repoName = $packageUrl[4]
            Write-Output $repoName
            $content = @"
    - name: $repoName
      uses: VirtoCommerce/vc-github-actions/deploy-workflow@dev
      env:
        GITHUB_TOKEN: `${{ secrets.REPO_TOKEN }}
        USER: `${{ env.GITHUB_USER }}
        GHA_DEPLOYMENT_FOLDER: "modules"
        REPOSITORY: "$repoName"

"@
            Add-Content -Path $workflowName -Value $content
        }
    }
}

# Storefront
$storefrontRepo = "vc-storefront"
$storefrontStep = @"
    - name: $storefrontRepo
      uses: VirtoCommerce/vc-github-actions/deploy-workflow@dev
      env:
        GITHUB_TOKEN: `${{ secrets.REPO_TOKEN }}
        USER: `${{ env.GITHUB_USER }}
        GHA_DEPLOYMENT_FOLDER: "storefront"
        REPOSITORY: "$storefrontRepo"

"@
Add-Content -Path $workflowName -Value $storefrontStep

#Platform
$platformRepo = "vc-platform"
$platformStep = @"
    - name: $platformRepo
      uses: VirtoCommerce/vc-github-actions/deploy-workflow@dev
      env:
        GITHUB_TOKEN: `${{ secrets.REPO_TOKEN }}
        USER: `${{ env.GITHUB_USER }}
        GHA_DEPLOYMENT_FOLDER: "platform"
        REPOSITORY: "$platformRepo"
"@
Add-Content -Path $workflowName -Value $platformStep