# publish-artifact-link

Publishes artifact link to PR comment

## inputs:

### githubToken:

    description: "GitHub token"

### repoOrg:

    description: "repo org"
    default: "VirtoCommerce"

### artifactUrl:

    description: "Link to artifact"
    
### downloadComment:

    description: "Comment template"
    default: "Download artifact URL:"

## Example of usage

```
- name: Add link to PR
    if: ${{ github.event_name == 'pull_request' }}
    uses: VirtoCommerce/vc-github-actions/publish-artifact-link@master
    with:
      artifactUrl: ${{ steps.publish.outputs.blobUrl }}
```
