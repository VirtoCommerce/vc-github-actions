# docker-install-sampledata

Installs sample data

## inputs:

### sampleDataUrl:

    description: 'Url to sampledata'
    required: false
    default: ''

### platformUrl:

    description: 'Platform Url'
    required: false
    default: 'http://localhost:8090'

### login:

    description: 'Login for platform'
    required: false
    default: 'admin'

### password:

    description: 'Password'
    required: false
    default: 'store'

## Example of usage

```yaml
- name: Install Sampledata
  uses: VirtoCommerce/vc-github-actions/docker-install-sampledata@master
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
