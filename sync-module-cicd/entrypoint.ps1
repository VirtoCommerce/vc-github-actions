param (
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

Get-ChildItem -Path "../$($SourceRepository)/.github/workflows" -Filter "*.yml" | ForEach-Object {
    $file = ".github/workflows/$($_.name)"
    Copy-Item $_ $file
    git add $file
    git commit -m "Sync $($file) from $($SourceRepository)"
    git push
}
