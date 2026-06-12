# sonar-theme

SonarQube Analysis

## inputs:

### projectVersion:

    description: 'Theme version'
    required: false
    default: ''

### branchTarget:

    description: 'Target branch name for sonar branch analysis'
    required: true
    default: 'dev'

## Example of usage

```yaml
- name: SonarCloud Scan
  uses: VirtoCommerce/vc-github-actions/sonar-theme@master
  with:
    branchTarget: 'dev'
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
