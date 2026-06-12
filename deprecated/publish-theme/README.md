# publish-theme

Publishes Theme to Azure blob or Github Release

## inputs:

### release_branch:

    description: 'Branche support preparation of a new production release'
    required: false
    default: "master"

### artifactPath:

    description: 'Path to artifact'
    required: false

### artifactName:

    description: 'Name of artifact'
    required: false

### blobUrl:

    description: 'Blob Url'
    required: false
    default: 'https://vc3prerelease.blob.core.windows.net/packages'

## outputs:

### blobUrl:

    description: 'URL to artifact'

### artifactPath:

    description: 'Path to artifact'

### artifactName:

    description: 'Name of artifact'

## Example of usage

```yaml
- name: Publish
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' || (github.event_name == 'workflow_dispatch' && github.ref != 'refs/heads/master')}}
  id: publish
  uses: VirtoCommerce/vc-github-actions/publish-theme@master
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
