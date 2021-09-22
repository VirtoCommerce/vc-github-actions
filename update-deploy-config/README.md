# Update Deploy Config action

This action grabs issue keys inside event commits.

## Inputs

### `gitUserEmail`

Git config user.email. Default value `ci@virtocommerce.com`

### `gitUserName`

Git config user.name. Default value `vc-ci`

### `repoName`

Repository where deployment config file should be created/updated

### `branchName`

Repository branch where deployment config file should be created/updated. Default value: 'dev'

### `artifactKey`

artifactKey config file value. For example   "artifactKey": "VirtoCommerce.Catalog"

### `templatePath`

    Path where config template file placed

### `configPath`

Path where config file placed in a `repoName` repository

## Example of usage

> Note! GITHUB_TOKEN environment variable should be defined.

```yml
- name: Update Deploy Config 
  uses: VirtoCommerce/vc-github-actions/update-deploy-config@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    repoName: 'vc-module-catalog'
    artifactKey: 'VirtoCommerce.Catalog'
    configPath: '.deployments/argoDeploy.json'
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
