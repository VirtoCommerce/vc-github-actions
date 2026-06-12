# deploy-workflow

Deploy a common Github Action to a repo.

## inputs:

### GITHUB_TOKEN:

    description: "Github secret token to allow automated publishing of artifacts to a release."
    required: true

### USER:

    description: "Organization or username."
    required: false
    default:  "VirtoCommerce"

### REPOSITORY:

    description: "Name of the repository."
    required: true

### TARGET_BRANCH:

    description: "Typically the develop or integration branch."
    required: false
    default: "dev"

### GHA_DEPLOYMENT_FOLDER:

    description: "Folder name where the to-be-deployed Github Actions reside."
    required: false
    default: ""

### COMMIT_MESSAGE:

    description: "Custom message for commit. Default message: Updating Github Action workflows."
    required: false
    default: "ci: Updating Github Action workflows"

### GHA_DEPLOY_BRANCH_NAME:

    description: "Name of the branch to be created. Default branch name: update_gha_source."
    required: false
    default: "update_gha_source"

## Example of usage

```yaml
- name: vc-module-elastic-search
  uses: VirtoCommerce/vc-github-actions/deploy-workflow@master
  env:
    GITHUB_TOKEN: ${{ secrets.REPO_TOKEN }}
    USER: ${{ env.GITHUB_USER }}
    GHA_DEPLOYMENT_FOLDER: "modules"
    REPOSITORY: "vc-module-elastic-search"
```
