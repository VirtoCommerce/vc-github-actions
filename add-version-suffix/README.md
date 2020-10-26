# add-version-suffix
Adds version suffix in Directory.Build.props and [module.manifest] for prerelease (alpha version)

## inputs
### versionSuffix:
    description: "Version suffix"
    required: false
    default: ""

## Example usage
```
- name: Add version suffix
  uses: VirtoCommerce/vc-github-actions/add-version-suffix@master
```