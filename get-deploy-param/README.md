# get-deploy-param

Get deployment parameters for ArgoCD deployments

## inputs:

### githubToken:

    description: 'GitHub token'
    required: false

### envName:

    description: 'Name for required environment parameters. Allowed values are: dev, qa, prod'
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

### cmPath:

    description: 'Path to config map'

### deployAppName:

    description: 'Required environment deployAppName value'

### deployBranch:

    description: 'Required environment deployBranch value'

### environmentId:

    description: 'Environment Id'

### environmentName:

    description: 'Environment name'

### environmentType:

    description: 'Environment type Allowed values are: [production, staging, testing, development, unmapped]'

### environmentUrl:

    description: 'Link to deployed app'

### deployConfig:

    description: 'Full deploy config(for all environments)'

## Example of usage

```yaml
- name: Read deployment config
  uses: VirtoCommerce/vc-github-actions/get-deploy-param@master
  id: deployConfig
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
