# set-version-up

Increment version (minor or patch) in Directory.Build.props and [module.manifest]

## inputs

### versionLabel:

    description: "Accepted values minor or patch"
    required: true
    default: "minor"

## Example of usage

```
- name: Set version up
  uses: VirtoCommerce/vc-github-actions/set-version-up@master
  with:
    versionLabel: "patch"
```
