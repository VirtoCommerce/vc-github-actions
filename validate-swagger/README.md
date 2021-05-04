# validate-swagger

Validates swagger schema

## inputs:
###  url:
    description: "Url of swagger schema"
    default: ""
    required: true
###  validatorUrl: 
    description: "Url of swagger validator"
    default: "https://validator.swagger.io/validator/debug"
    required: false

## Example of usage

```
- name: Swagger Validation
  uses: VirtoCommerce/vc-github-actions/validate-swagger@master
  with: 
    url: http://localhost:8090/docs/PlatformUI/swagger.json
```