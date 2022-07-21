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

### releaseSource:

    description: "Release source. Allowed values: platform, module"
    required: true

### releaseType:

    description: "Release type. Allowed values: release, alpha"
    required: true

### platformVer:

    description: "Deploying Platform version"
    required: false

### platformTag:

    description: "Deploying Platform version"
    required: false

### moduleId:

    description: "Deploying Module id"
    required: false

### moduleVer:

    description: "Deploying Module version"
    required: false

### moduleLink:

    description: "Deploying Module link"
    required: false

### taskNumber:

    description: "Jira task number to create deploy PR in QA or Demo environment"
    required: true

### configPath:

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
        deployRepo: "vc-deploy-dev"
        deployBranch: "vcpt"
        releaseSource: "platform"
        releaseType: "GithubReleases"
        platformVer: "1.0.0"
        platformTag: "1.0.0-master-1234abcd"
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
