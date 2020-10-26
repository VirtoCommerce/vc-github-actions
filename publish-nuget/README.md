# publish-nuget
Publish nugets

## Example usage
```
- name: Publish Nuget
  if: ${{ github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'}}
  uses: VirtoCommerce/vc-github-actions/publish-nuget@master
```