# create-deploy-pr

 creates deploy PR for artifact in PR comment

## inputs:

### githubToken:

    description: "GitHub token"

### gitUserEmail:

    description: "git config user.email"
    required: false
    default: "ci@virtocommerce.com"

### gitUserName:

    description: "git config user.name"
    default: "vc-ci"
    required: false

### repoOrg:

    description: "Repo org"
    default: "VirtoCommerce"

### deployRepo:

    description: "Deployment repository name"
    required: true
    default: "vc-webstore-deploy"

### deployBranch:

    description: "Base branch for new deployment PR"
    required: true
    default: "qa"

### artifactKey:

    description: "ArgoCD config map key for changed artifact"
    required: true

### artifactUrl:

      description: "Link to changed artifact"
      required: true

### taskNumber:

    description: "Jira task number to create deploy PR in QA or Demo environment"
    required: true

### cmPath:

    description: "Path to config map in repository"
    required: true
    default: "webstore-app/resources/deployment-cm.yaml"

### forceCommit:

    description: "Flag to create deploy commit without PR. If true - create commit into deployBranch and don`t create PR"
    required: true
    default: "false"

## Example of usage

```

- name: Create deploy step
    if: ${{ github.event_name == 'pull_request' }}
    uses: VirtoCommerce/vc-github-actions/create-deploy-pr@master
    with:
        deployRepo: "vc-webstore-deploy"
        deployBranch: "demo"
        artifactKey: "B2B_THEME_URL"
        artifactUrl: "${{ steps.artifactLink.outputs.artifactUrl }}"
        taskNumber: "${{ steps.artifactLink.outputs.demoTaskNumber }}"
    
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
