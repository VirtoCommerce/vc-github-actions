# check-pr-regression-label

Checks PR contain label for regression

## inputs:

### githubToken:

GitHub token

### label:

PR label for regression

### commitMessage:

Latest squash commit message which should contain PR number looks like (#123)

## outputs:

### isLabeled:

Flag describes that PR contain label

### pullNumber:

Labelled for regression PR number

## Example of usage

```
- name: Check regression label
  id: regressLabel
  uses: VirtoCommerce/vc-github-actions/check-pr-regression-label@master
  with:
    label: regression
    commitMessage: ${{ github.event.head_commit.message }}
```
