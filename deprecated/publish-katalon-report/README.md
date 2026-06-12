# publish-katalon-report

Publish katalon report

## inputs:

### testProjectPath:

    description: "Path to Katalon Project"
    required: false
    default: "./"

### githubToken:

    description: "GitHub token"
    required: false

### repoOrg:

    description: "repo org"
    required: false
    default: "VirtoCommerce"

### publishComment:

    description: "Publish PR Comment"
    required: false
    default: "true"

### publishStatus:

    description: "Publish commit's status"
    required: false
    default: "false"

## Example of usage

```yaml
- name: Publish Katalon Report
  uses: VirtoCommerce/vc-github-actions/publish-katalon-report@master
  with:
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    publishComment: "true"
    publishStatus: "true"
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
