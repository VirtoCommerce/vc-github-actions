# get-deploy-param

description: 'Get deployment parameters for ArgoCD deployments'

## inputs:

### githubToken:

    description: 'GitHub token'
    required: false

### deployConfigPath:

    description: 'Path to the argoDeploy.json'
    required: true
    default: 'argoDeploy.json'

## outputs:

### artifactKey:

    description: 'artifactKey value'

### deployRepo: 

    description: 'deployRepo value'

### deployBranchQa:

    description: 'deployBranchQa value'

### deployBranchProd:

    description: 'deployBranchProd value'

### cmPath:

    description: 'description value'

## Example of usage

```

- name: Read deployment config
    uses: VirtoCommerce/vc-github-actions/create-deploy-pr@master
    id: deployConfig

```
