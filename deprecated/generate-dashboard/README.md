# generate-dashboard

Generates dashboard with workflows statuses

## inputs:

### githubToken:

    description: 'Github Token'
    required: true

### pageName:

    description: 'Name of wiki page file'
    required: false
    default: 'Home.md'

### organization:

    description: 'Organization name'
    required: false
    default: 'VirtoCommerce'

## outputs:

### result:

    description: 'Path to the result file'

## Example of usage

```yaml
- name: Generate Dashboard
  uses: VirtoCommerce/vc-github-actions/generate-dashboard@master
  with:
    githubToken: ${{ secrets.GITHUB_TOKEN }}
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
