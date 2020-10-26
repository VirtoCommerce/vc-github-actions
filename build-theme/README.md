# build-theme

Builds theme using gulp compress

## inputs:
### releaseBranch: 
    description: "Branch support preparation of a new production release"
    required: false
    default: "master"
### versionSuffix:
    description: "Suffix for prereleases"
    required: true

## Example of usage
```
- name: Build
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' }}
  uses: VirtoCommerce/vc-github-actions/build-theme@master
```
