# cloud-create-deploy-matrix

description: 'Create a matrix of deployment environments'

## inputs
  
### deployConfigPath

    description: 'Path to the deployment configuration file'
    default: '.deployment/module/cloudDeploy.json'

### releaseBranch

    description: 'The release branch'
    default: 'master'

## outputs

### matrix:
    description: 'Matrix of deployment environments'

## Example of usage

```
- name: Create deployment matrix
  uses: VirtoCommerce/vc-github-actions/cloud-create-deploy-matrix@master
  id: deployMatrix

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