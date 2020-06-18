param (
    [string]$Repository,
    [string]$RepositoryOwner,
    [string]$SourceRepository = "vc-module-catalog",
    [string]$BranchToSync = "feature/vp-3187-initial-ci"
)

$repoDir = $Repository.Substring($RepositoryOwner.Length + 1)

git clone "https://github.com/VirtoCommerce/$($SourceRepository)"
cd $SourceRepository
git checkout $BranchToSync
cd ..
git clone "https://github.com/$($Repository)"
cd $repoDir
git checkout $BranchToSync
cd ..

Get-ChildItem -Path "$($SourceRepository)/.github/workflows" -Filter "*.yml" | ForEach-Object {
    Copy-Item $_ "$($repoDir)/.github/workflows/$($_.name)"
}
