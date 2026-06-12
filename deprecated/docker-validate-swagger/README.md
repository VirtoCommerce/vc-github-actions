# docker-validate-swagger

Validates swagger schema

## inputs:
###  platformUrl:
    description: 'Platform url'
    default: 'http://localhost:8090'
    required: false
###  swaggerEndpoint:
    description: 'Endpoint of swagger schema'
    required: false
    default: '/docs/PlatformUI/swagger.json'
###  validatorUrl:
    description: 'Url to swagger validator'
    required: false
    default: 'https://validator.swagger.io/validator/debug'

## Example of usage

```
- name: Start Containers
  uses: VirtoCommerce/vc-github-actions/docker-validate-swagger@master
```