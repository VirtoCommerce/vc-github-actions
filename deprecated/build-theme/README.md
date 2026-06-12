# build-theme

Builds theme

## inputs:

### releaseBranch:

    description: "Branch support preparation of a new production release"
    required: false
    default: "master"

### versionSuffix:

    description: "Suffix for prereleases"
    required: true

## outputs:

### artifactPath:

    description: 'Path to artifact'

### artifactName:

    description: 'Name of artifact'

## Example of usage

```yaml
- name: Build
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' }}
  uses: VirtoCommerce/vc-github-actions/build-theme@master
  with:
    versionSuffix: '<value>'
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
