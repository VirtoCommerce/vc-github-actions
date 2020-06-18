param (
    [string]$GitHubToken,
    [string]$TargetRepository = $env:GITHUB_REPOSITORY,
    [string]$SourceRepository = "vc-module-order",
    [string]$BranchToSync = "feature/vp-3187-initial-ci"
)

$repoDir = $TargetRepository.Substring(($TargetRepository.IndexOf('/')+1))

git clone "https://github.com/VirtoCommerce/$($SourceRepository)"
cd $SourceRepository
git checkout $BranchToSync
cd ..
git clone "https://github.com/$($TargetRepository)"
cd $repoDir
git checkout $BranchToSync

git config --global user.email "github.actions@virtoway.com"
git config --global user.name "GitHub Actions"

$syncedFilter = "synced-*.yml"

Get-ChildItem -Path ".github/workflows" -Filter $syncedFilter | ForEach-Object {
    Remove-Item $_
}

Get-ChildItem -Path "../$($SourceRepository)/.github/workflows" -Filter $syncedFilter | ForEach-Object {
    $file = ".github/workflows/$($_.name)"
    Copy-Item $_ $file
}

cd .github/workflows

$repo = "https://github-actions:$($GitHubToken)@github.com/$($TargetRepository).git"
git add .
git commit -m "Sync workflows from $($SourceRepository)"
git push $repo