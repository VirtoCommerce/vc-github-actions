# set-version-up

Increment version (minor or patch) in Directory.Build.props and [module.manifest]

## inputs:

### githubToken:

    description: 'GitHub Token'
    required: false

### path:

    description: 'Path to directory that contains module.manifest, package.json or Directory.Build.props'
    required: false
    default: '.'

### versionLabel:

    description: 'Accepted values: minor or patch'
    required: true
    default: 'minor'

## Example of usage

```yaml
- name: Set version up
  uses: VirtoCommerce/vc-github-actions/set-version-up@master
  with:
    versionLabel: 'patch'
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
