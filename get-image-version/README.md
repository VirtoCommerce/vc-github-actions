# get-image-version

This action grabs Version and Version suffix from module.manifest, package.json or Directory.Build.props file. If Version suffix not present calculate it as a branch commits count

## inputs:

### path:

    description: 'Path to directory that contains module.manifest, package.json or Directory.Build.props'
    required: false
    default: '.'

### releaseBranch:

    description: 'Branch support preparation of a new production release'
    required: false
    default: 'master'

### projectType:

    description: 'Type of project. Allowed values "module", "theme", "platform", "storefront". If value, not specified project type will be determined automatically.'
    required: false
    default: 'auto'

## outputs:

### branchName:

    description: 'Triggered branch name'

### prefix:

    description: 'Version prefix value'

### suffix:

    description: 'Version suffix value'

### fullSuffix:

    description: 'Version suffix value formatted as suffix-branch-name'

### moduleId:

    description: 'Module Id value'

### sha:

    description: 'Version SHA value'

### shortVersion:

    description: 'Version value formatted as prefix-suffix'

### tag:

    description: 'Version value formatted as prefix-branchName-sha'

### fullVersion:

    description: 'Version value formatted as prefix-fullSuffix'

### taggedVersion:

    description: 'Version value formatted as prefix-fullSuffix-sha'

### moduleDescription:

    description: 'Module description from module.manifest'

### projectUrl:

    description: 'Module repo url'

### iconUrl:

    description: 'Url to a module icon'

## Example of usage

```yaml
- name: Get Image version
  uses: VirtoCommerce/vc-github-actions/get-image-version@master
  id: image
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
