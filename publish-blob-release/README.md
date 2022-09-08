# publish-blob-release

Publishes release artifact to Azure Blob

## inputs:

### blobUrl:

    description: "Url to Azure Blob"
    default: "https://vc3prerelease.blob.core.windows.net/packages"
    required: false

### blobSAS:

    description: "Blob SAS"
    required: false

## outputs:

### packageUrl:

    description: "Package url"

### blobId:

    description: "Blob id"

## Example of usage

```
- name: Publish to Blob
  if: ${{ github.ref == 'refs/heads/dev' }}
  id: blobRelease
  uses: VirtoCommerce/vc-github-actions/publish-blob-release@master
  with:
    blobSAS: ${{ secrets.BLOB_TOKEN }}
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