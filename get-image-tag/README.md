# Get Docker Image tag javascript action

This action grabs Version and Version suffix from Directory.Build.Props and adds SHA of the current branch or of the head branch of a pull request. 

## Inputs

No imputs required

## Outputs

### `tag`

Tag value formatted as x.x.x-sha8 or x.x.x-suffix-sha8
### `sha`

Full SHA of the current branch or of the head branch of a pull request. 

## Example usage

name: Get Image Tag
uses: VirtoCommerce/vc-github-actions/get-image-tag@master
id: image
  
...
Get the outputs:
${{ steps.image.outputs.tag }}
${{ steps.image.outputs.sha }}
