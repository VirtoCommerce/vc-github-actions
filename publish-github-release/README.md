# publish-github-release

Publish github release or prerelease dependant to github.ref

## inputs:

### changelog:

    description: "Commit's messages since the latest release"
    required: false
    default: ""

### prerelease:

    description: ""
    required: false
    default: "false"

### organization:

    description: "Organization name"
    required: false
    default: "VirtoCommerce"

### skipString:

    description: "vc-build skip string"
    required: false
    default: "Clean+Restore+Compile+WebPackBuild+Test+BuildCustomApp"

### makeLatest:

    description: "make vc-build do NOT mark the release with Latest label"
    required: false
    default: "true"

## outputs:

### downloadUrl:

    description: "GitHub release download URL"

## Example of usage

```yaml
- name: Publish Github Release
  uses: VirtoCommerce/vc-github-actions/publish-github-release@master
  with:
    changelog: ${{ steps.changelog.outputs.changelog }}
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
