# Publish Jira link action

This action publish link on Jira task in PR description.

## inputs:

### githubToken:

    description: "GitHub token"
    required: false

### repoOrg:

    description: "repo org"
    required: false
    default: "VirtoCommerce"

### branchName:

    description: "Pull request branch name"
    required: true

### baseURL:

    description: "Base Jira URL"
    required: false
    default: 'https://virtocommerce.atlassian.net/browse/'

### downloadComment:

    description: "Comment template"
    required: false
    default: "Jira-link:"

## Example of usage

```yml
- name: Publish Jira link
  if: github.event_name == 'pull_request'
  uses: VirtoCommerce/vc-github-actions/publish-jira-link@master
  with:
      branchName: ${{ steps.extract_branch.outputs.branch }}
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
