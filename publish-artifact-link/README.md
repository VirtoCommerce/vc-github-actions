# publish-artifact-link

Publishes artifact link to PR comment

## inputs:

### githubToken:

    description: "GitHub token"
    required: false

### repoOrg:

    description: "repo org"
    required: false
    default: "VirtoCommerce"

### artifactUrl:

    description: "Link to artifact"
    required: true

### downloadComment:

    description: "Comment template"
    required: false
    default: "Download artifact URL:"

## Example of usage

```yaml
- name: Add link to PR
  if: ${{ github.event_name == 'pull_request' }}
  uses: VirtoCommerce/vc-github-actions/publish-artifact-link@master
  with:
    artifactUrl: ${{ steps.publish.outputs.blobUrl }}
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
