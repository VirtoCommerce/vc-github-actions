# Get Image version action

This action grabs Version and Version suffix from Directory.Build.Props (for Platform and Storefront) or from module.manifest (for modules). If Version suffix does not present calculate it as a branch commits count.

## Inputs

### `path`

Path to directory that contains module.manifest, package.json or Directory.Build.Props

### 'projectType'

Type of project. Allowed values "module", "theme", "platform", "storefront". If value, not specified project type will be determined automatically.

## Outputs

### `branchName`

Triggered branch name

### `prefix`

Version prefix value

### `suffix`

Version suffix value

### `sha`

Version SHA value

### `shortVersion`

Version value formatted as prefix-suffix

### `fullVersion`

Version value formatted as branchName-prefix-suffix

### `tag`

Version value formatted as branchName-prefix-sha

### `moduleId`

Module Id value.

### `taggedVersion`

Version value formatted as branchName-prefix-suffix-sha


## Example of usage

```
- name: Get Image version
  uses: VirtoCommerce/vc-github-actions/get-image-version@v3.0.1
  id: image
```

Get the outputs:

```
${{ steps.image.branchName }}
${{ steps.image.prefix }}
${{ steps.image.suffix }}
${{ steps.image.sha }}
${{ steps.image.shortVersion }}
${{ steps.image.fullVersion }}
${{ steps.image.outputs.tag }}
${{ steps.image.outputs.moduleId }}
${{ steps.image.outputs.taggedVersion }}
```
