# publish-theme

Publishes Theme to Azure blob or Github Release

## inputs:

### release_branch: 

    description: 'Branche support preparation of a new production release'
    required: false
    default: "master"

## outputs:

### artifactPath:

    description: 'Path to artifact'

### artifactName:

    description: 'Name of artifact'

### blobUrl:

    description: 'URL to artifact'

## Example of usage

```
- name: Publish
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' || (github.event_name == 'workflow_dispatch' && github.ref != 'refs/heads/master')}}
  id: publish
  uses: VirtoCommerce/vc-github-actions/publish-theme@master
```
