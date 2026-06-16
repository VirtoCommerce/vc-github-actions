# sonar-scanner-begin

Prepares parameters for vc-build SonarQubeStart

## inputs:

### repoOrg:

    description: 'Repo Organization/User'
    required: false
    default: 'VirtoCommerce'

### sonarOrg:

    description: 'Sonar Organization'
    required: false
    default: 'virto-commerce'

## Example of usage

```yaml
- name: SonarCloud Begin
  uses: VirtoCommerce/vc-github-actions/sonar-scanner-begin@master
  with:
    sonarOrg: 'virto-commerce'
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
