# get-deploy-param

description: 'Get deployment parameters for ArgoCD deployments'

## inputs:

### githubToken:

    description: 'GitHub token'
    required: false

### envName:

    description: 'Name for required environment parameters. Allowed values is: dev, qa, prod'
    required: true
    default: 'dev'

### deployConfigPath:

    description: 'Path to the argoDeploy.json'
    required: true
    default: 'argoDeploy.json'

## outputs:

### artifactKey:

    description: 'artifactKey value'

### deployRepo: 

    description: 'deployRepo value'

### deployAppName:

    description: 'Required environment deployAppName value'

### deployBranch:

    description: 'Required environment deployBranch value'

### cmPath:

    description: 'Path to config map'

### deployConfig:

    description: 'Full deploy config(for all environments)'

## Example of usage

```

- name: Read deployment config
  uses: VirtoCommerce/vc-github-actions/get-deploy-param@master
  id: deployConfig

```
