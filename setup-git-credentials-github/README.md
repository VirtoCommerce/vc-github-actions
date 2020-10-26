# setup-git-credentials-github
Setups credentials for git
## inputs:
### gitUserEmail:
    description: "git config user.email"
    required: false
    default: "ci@virtocommerce.com"
### gitUserName:
    description: "git config user.name"
    default: "vc-ci"
    required: false
### githubToken:
    description: "GitHub Token"
    required: false

## Example of usage
```
- name: Setup Git Credentials
  if: ${{ github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'}}
  uses: VirtoCommerce/vc-github-actions/setup-git-credentials-github@master
  with: 
    githubToken: ${{ secrets.REPO_TOKEN }}
```
