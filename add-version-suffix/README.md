# add-version-suffix

Adds version suffix in Directory.Build.props and [module.manifest] for prerelease (alpha version)

## inputs:

### versionSuffix:

    description: "Version suffix"
    required: false
    default: ""

## Example of usage

```yaml
- name: Add version suffix
  uses: VirtoCommerce/vc-github-actions/add-version-suffix@master
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
