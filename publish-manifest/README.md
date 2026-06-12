# publish-manifest

Publishes modules.json

## inputs:

### modulesJsonUrl:

    description: "Url to modules.json"
    required: false
    default: "https://raw.githubusercontent.com/VirtoCommerce/vc-modules/master/modules_v3.json"

### packageUrl:

    description: "Package Url for modules.json"
    required: false
    default: ""

### pushChanges:

    description: "push changed modules.json to github"
    required: false
    default: "true"

### modulesJsonName:

    description: "Name of modules manifest file"
    required: false
    default: "modules_v3.json"

### modulesJsonRepo:

    description: "Repo url"
    required: false
    default: "https://github.com/VirtoCommerce/vc-modules.git"

## outputs:

### modulesJsonPath:

    description: "Path to updated modules.json"

## Example of usage

```yaml
- name: Publish Manifest
  if: ${{ github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'}}
  uses: VirtoCommerce/vc-github-actions/publish-manifest@master
  with:
    packageUrl: ${{ steps.blobRelease.outputs.packageUrl }}
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
