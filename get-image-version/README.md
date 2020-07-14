# Get Docker Image version javascript action

This action grabs Version and Version suffix from Directory.Build.Props. If Version suffix not present calculate it as a branch commits count

## Inputs

No imputs required

## Outputs

### `version`

'Version value formatted as prefix.suffix or PR-branch name-prefix.suffix'

### `moduleId`

Module Id value.

## Example usage

```
- name: Get Image version
  uses: VirtoCommerce/vc-github-actions/get-image-versiong@master
  id: image
```

Get the outputs:

```
${{ steps.image.outputs.version }}
${{ steps.image.outputs.moduleId }}
```
