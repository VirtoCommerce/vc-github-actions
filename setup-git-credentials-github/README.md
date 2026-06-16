# setup-git-credentials-github

Setups credentials for git

## inputs:

### gitUserEmail:

    description: 'git config user.email'
    required: false
    default: 'ci@virtocommerce.com'

### gitUserName:

    description: 'git config user.name'
    required: false
    default: 'vc-ci'

### githubToken:

    description: 'GitHub Token'
    required: false

## Example of usage

```yaml
- name: Setup Git Credentials
  if: ${{ github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'}}
  uses: VirtoCommerce/vc-github-actions/setup-git-credentials-github@master
  with:
    githubToken: ${{ secrets.REPO_TOKEN }}
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
