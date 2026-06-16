# check-pr-regression-label

Checks PR contain label for regression

## inputs:

### githubToken:

    description: "GitHub token"
    required: false

### label:

    description: "PR label for regression"
    required: true
    default: "regression"

### commitMessage:

    description: "Latest squash commit message which should contain PR number looks like (#123)"
    required: true

## outputs:

### isLabeled:

    description: "True if base PR contain label"

### pullNumber:

    description: "PR number labeled for regression "

### pullUrl:

    description: "PR link"

## Example of usage

```yaml
- name: Check regression label
  id: regressLabel
  uses: VirtoCommerce/vc-github-actions/check-pr-regression-label@master
  with:
    label: regression
    commitMessage: ${{ github.event.head_commit.message }}
```

## Compile action

Use @vercel/ncc tool to compile your code and modules into one file used for distribution.

- Install vercel/ncc by running this command in your terminal.

```bash
npm i -g @vercel/ncc
```

- Compile your index.ts file.

```bash
ncc build ./src/index.ts --license licenses.txt
```
