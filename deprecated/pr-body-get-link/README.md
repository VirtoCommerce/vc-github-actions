# get-artifact-link

Gets artifact link and task numbers from PR body

## inputs:

### githubToken:

    description: "GitHub token"

### repoOrg:

    description: "repo org"
    default: "VirtoCommerce"

### downloadComment:

    description: "Comment template"
    default: "Download artifact URL:"

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
