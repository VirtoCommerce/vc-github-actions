# publish-github-release

Publish github release or prerelease dependant to github.ref

## inputs:

### changelog:

    description: "Commit's messages since the latest release"
    default: ""
    required: false

### prerelease:

    description: ""
    default: "false"
    required: false

### organization:

    description: "Organization name"
    default: "VirtoCommerce"
    required: false

### version:

    description: "Version number in xx.yy.zz format"
    default: ""
    required: false

## outputs:

### downloadUrl:

    description: "GitHub release download URL"

## Example of usage

```yml
- name: Publish Github Release
  with:
    changelog: ${{ steps.changelog.outputs.changelog }}
    version: ${{ steps.image.outputs.shortVersion }}
  uses: VirtoCommerce/vc-github-actions/publish-github-release@master
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
