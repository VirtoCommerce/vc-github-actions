# cloud-create-deployment

Create deployment commit or PR

## inputs:

### githubToken:

    description: "GitHub token"
    required: false

### gitUserEmail:

    description: "git config user.email"
    required: false
    default: "ci@virtocommerce.com"

### gitUserName:

    description: "git config user.name"
    required: false
    default: "vc-ci"

### repoOrg:

    description: "Repo org"
    required: false
    default: "VirtoCommerce"

### deployRepo:

    description: "Deployment repository name"
    required: true
    default: "vc-deploy-dev"

### deployBranch:

    description: "Base branch for new deployment"
    required: true
    default: "vcpt"

### releaseSource:

    description: "Release source. Allowed values: platform, module, customApp"
    required: true

### releaseType:

    description: "Release type. Allowed values: 'GithubReleases', 'AzureBlob'"
    required: true

### artifactKey:

    description: "CustomApp artifact key"
    required: false
    default: "Tag"

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

### moduleBlob:

    description: "Deploying Module blob name"
    required: false

### taskNumber:

    description: "Jira task number to create deploy commit or PR in QA or Demo environment"
    required: false

### configPath:

    description: "Path to config in repository"
    required: true

### forceCommit:

    description: "Flag to create deploy commit without PR. If true - create commit into deployBranch and don`t create PR"
    required: true
    default: "true"

## Example of usage

```yaml
- name: Create deployment
  uses: VirtoCommerce/vc-github-actions/cloud-create-deployment@master
  with:
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    deployRepo: "vc-deploy-dev"
    deployBranch: "vcpt"
    releaseSource: "platform"
    releaseType: "GithubReleases"
    platformVer: "1.0.0"
    platformTag: "1.0.0-master-1234abcd"
    configPath: "argoDeploy.json"
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
