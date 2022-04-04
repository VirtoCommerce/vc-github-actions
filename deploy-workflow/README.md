# deploy-workflow

Deploys workflows for platform, storefront, modules, themes

## inputs:
### GITHUB_TOKEN:
    description: "Github secret token to allow automated publishing of artifacts to a release."
    required: true
### USER:
    default:  "VirtoCommerce"
    description: "Organization or username."
    required: false
### REPOSITORY:
    description: "Name of the repository."
    required: true
### TARGET_BRANCH:
    default: "dev"
    description: "Typically the develop or integration branch."
    required: false
### GHA_DEPLOYMENT_FOLDER:
    default: ""
    description: "Folder name where the to-be-deployed Github Actions reside."
    required: false
### COMMIT_MESSAGE:
    default: "ci: Updating Github Action workflows"
    description: "Custom message for commit. Default message: ci: Updating Github Action workflows"
    required: false
### GHA_DEPLOY_BRANCH_NAME:
    default: "update_gha_source"
    description: "Name of the branch to be created. Default branch name: update_gha_source."
    required: false

## Example of usage
```
- name: vc-module-elastic-search
  uses: VirtoCommerce/vc-github-actions/deploy-workflow@master
  env:
    GITHUB_TOKEN: ${{ secrets.REPO_TOKEN }}
    USER: ${{ env.GITHUB_USER }}
    GHA_DEPLOYMENT_FOLDER: "modules"
    REPOSITORY: "vc-module-elastic-search"
```
