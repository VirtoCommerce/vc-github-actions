# Update Deploy Config action

This action grabs issue keys inside event commits.

## Inputs

### `gitUserEmail`

Git config user.email. Default value: `ci@virtocommerce.com`

### `gitUserName`

Git config user.name. Default value: `vc-ci`.

### `repoName`

Repository where deployment config file should be created/updated.

### `branchName`

Repository branch where deployment config file should be created/updated. Default value: `dev`.

### `configPath`

Path where config file placed in a `repoName` repository.

### `artifactKey`

artifactKey config file value. For example   "artifactKey": "VirtoCommerce.Catalog".

### `deployRepo`

deployRepo config file value. For example "deployRepo": "vc-deploy-dev" (Repository name where application deployment config placed). Default value: `vc-deploy-dev`.

### `cmPath`

cmPath config file value. For example  "cmPath": "platform-dev/resources/deployment-cm.yaml" (Path to the config map in the deployment repository). Default value: `platform-dev/resources/deployment-cm.yaml`.

### `deployAppNameDev`

dev.deployAppName config file value. For example "dev": {"deployAppName": "vcplatform-dev"} (ArgoCD application name in the dev environment).Default value: `vcplatform-dev`.
  
### `deployBranchDev`

dev.deployBranch config file value. For example "dev": {"deployBranch": "dev"} (Branch name in the deployment repository for the dev environment). Default value: `dev`.
  
### `deployAppNameQa`

qa.deployAppName config file value. For example "qa": {"deployAppName": "vcplatform-qa"} (ArgoCD application name in the qa environment). Default value: `vcplatform-qa`.

### `deployBranchQa`

qa.deployBranch config file value. For example "qa": {"deployBranch": "qa"} (Branch name in the deployment repository for the qa environment). Default value: `qa`.

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
