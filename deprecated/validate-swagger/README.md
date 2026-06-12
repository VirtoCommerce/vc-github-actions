# validate-swagger

Validates swagger schema

## inputs:

### url:

    description: "Url of swagger schema"
    required: true
    default: ""

### validatorUrl:

    description: "Url of swagger validator"
    required: false
    default: "https://validator.swagger.io/validator/debug"

## Example of usage

```yaml
- name: Swagger Validation
  uses: VirtoCommerce/vc-github-actions/validate-swagger@master
  with:
    url: http://localhost:8090/docs/PlatformUI/swagger.json
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
