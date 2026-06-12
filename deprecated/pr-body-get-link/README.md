# pr-body-get-link

Get jira keys, link to the artifact from PR body

## inputs:

### githubToken:

    description: "GitHub token"
    required: false

### repoOrg:

    description: "Repo org"
    required: false
    default: "VirtoCommerce"

### downloadComment:

    description: "Comment template"
    required: false
    default: "Download artifact URL:"

### skipArtifactUrl:

    description: "Get only jira keys, skip artifact url"
    required: false
    default: "false"

## outputs:

### artifactUrl:

    description: "Link to the deployment artifact"

### qaTaskNumber:

    description: "Jira task number to create deploy PR in QA environment"

### demoTaskNumber:

    description: "Jira task number to create deploy PR in Demo environment"

## Example of usage

```yaml
- name: Get link from PR body
  if: ${{ github.event_name == 'pull_request' }}
  id: artifactLink
  uses: VirtoCommerce/vc-github-actions/pr-body-get-link@master
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
