# sonar-quality-gate

Check SonarQube quality gate status after project scan

## inputs:

### login:

    description: 'Username or Token'
    required: true

### password:

    description: 'Password (is only needed if username instead of token)'
    required: false
    default: ''

### sonarHost:

    description: 'Sonar Server Url'
    required: false
    default: 'https://sonarcloud.io'

### projectKey:

    description: 'Project key'
    required: false
    default: ''

## Example of usage

```yaml
- name: Quality Gate
  uses: VirtoCommerce/vc-github-actions/sonar-quality-gate@master
  with:
    login: ${{ secrets.SONAR_TOKEN }}
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
