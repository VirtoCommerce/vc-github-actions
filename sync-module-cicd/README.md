# Sync workflows from the vc-module-core

This action runs on each push to dev and syncs GitHub Workflows from the vc-module-core. 

## Inputs

### `github_token`

Personal github access with public_repo and workflow scopes. GITHUB_TOKEN doesn't work due to it doesn't have workflow scope.

## Example usage
```
- name: Sync modules workflows
    uses: VirtoCommerce/vc-github-actions/sync-module-cicd@master
    with:
    github_token: ${{ secrets.REPO_TOKEN }}
```