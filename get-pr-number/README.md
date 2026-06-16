# get-pr-number

Get the PR number associated with a branch

## inputs:

### repo:

    description: 'Repository for PR lookup'
    required: true

### branch:

    description: 'Branch for PR lookup'
    required: true

## outputs:

### prNumber:

    description: 'The PR number associated with the branch'

## Example of usage

```yaml
- name: Get PR number
  id: pr
  uses: VirtoCommerce/vc-github-actions/get-pr-number@master
  with:
    repo: ${{ github.repository }}
    branch: ${{ github.ref_name }}
```
