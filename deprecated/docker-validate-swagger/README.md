# docker-validate-swagger

Validates swagger schema

## inputs:

### platformUrl:

    description: 'Platform url'
    required: false
    default: 'http://localhost:8090'

### swaggerEndpoint:

    description: 'Endpoint of swagger schema'
    required: false
    default: '/docs/PlatformUI/swagger.json'

### validatorUrl:

    description: 'Url to swagger validator'
    required: false
    default: 'https://validator.swagger.io/validator/debug'

## Example of usage

```yaml
- name: Validate Swagger
  uses: VirtoCommerce/vc-github-actions/docker-validate-swagger@master
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
