# docker-check-modules

Checks installed modules

## inputs:

### platformUrl:

    description: 'Platform url'
    required: false
    default: 'http://localhost:8090'

### login:

    description: 'Platform login'
    required: false
    default: 'admin'

### password:

    description: 'Platform password'
    required: false
    default: 'store'

## Example of usage

```yaml
- name: Check Installed Modules
  uses: VirtoCommerce/vc-github-actions/docker-check-modules@master
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
