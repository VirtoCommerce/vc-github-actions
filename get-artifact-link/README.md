# get-artifact-link

Gets artifact link and task numbers from PR body

## inputs:

### githubToken:

    description: "GitHub token"

### repoOrg:

    description: "repo org"
    default: "VirtoCommerce"

## outputs:

### artifactUrl:

    description: "Link to artifact"

###  qaTaskNumber:

    description: "Jira task number to create deploy PR in QA environment"

####  demoTaskNumber:

    description: "Jira task number to create deploy PR in Demo environment"

## Example of usage

```
- name: Gets artifact link
  if: ${{ github.event_name == 'pull_request' }}
  id: artifactLink
  uses: VirtoCommerce/vc-github-actions/get-artifact-link@master

```
