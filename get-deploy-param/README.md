# get-deploy-param

description: 'Get deployment parameters for ArgoCD deployments'

## inputs:

### githubToken:

    description: 'GitHub token'
    required: false

### envName:

    description: 'Name for required environment parameters'
    required: true
    default: 'dev'

### deployConfigPath:

    description: 'Path to the argoDeploy.json'
    required: true
    default: 'argoDeploy.json'

## outputs:

### artifactKey:

    description: 'artifactKey value'

### deployAppName:

    description: 'deployAppName value'

### deployRepo: 

    description: 'deployRepo value'

### deployBranchDev:

    description: 'deployBranchDev value'

### deployBranchQa:

    description: 'deployBranchQa value'

### deployBranchProd:

    description: 'deployBranchProd value'

### cmPath:

    description: 'description value'

## Example of usage

```

- name: Read deployment config
  uses: VirtoCommerce/vc-github-actions/get-deploy-param@master
  id: deployConfig

```
