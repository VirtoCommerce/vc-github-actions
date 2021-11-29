# Publish Jira link action

This action publish link on Jira task in PR description.

## inputs:

### githubToken:

    description: "GitHub token"

### repoOrg:

    description: "repo org"
    default: "VirtoCommerce"

### branchName:

    description: "The name of a PR branch"

### downloadComment:

    description: "Comment template"
    default: "Jira-link:"

## Example of usage

```yml
- name: Publish Jira link
  if: github.event_name == 'pull_request'
  uses: VirtoCommerce/vc-github-actions/publish-jira-link@master
  with:
      branchName: ${{ steps.extract_branch.outputs.branch }}
      downloadComment: "Jira-link:"
  env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Compile action

Use @vercel/ncc tool to compile your code and modules into one file used for distribution.

-   Install vercel/ncc by running this command in your terminal.

```bash
npm i -g @vercel/ncc
```

-   Compile your index.ts file.

```bash
ncc build ./src/index.ts --license licenses.txt
```
