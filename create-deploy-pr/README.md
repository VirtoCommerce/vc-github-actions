# get-artifact-link

Gets artifact link from PR comment

## inputs:

### githubToken:

    description: "GitHub token"

### repoOrg:

    description: "repo org"
    default: "VirtoCommerce"

## outputs:

### artifactUrl:

    description: "Link to artifact"

## Example of usage

```
- name: Gets artifact link
  if: ${{ github.event_name == 'pull_request' }}
  id: artifactLink
  uses: VirtoCommerce/vc-github-actions/get-artifact-link@master

```
