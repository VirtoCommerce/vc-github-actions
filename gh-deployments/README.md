# gh-deployments

GitHub action for working painlessly with deployment statuses.

## inputs:

### token:

    description: 'GitHub token'
    required: true

### step:

    description: 'One of 'start' and 'finish''
    required: true

### auto_inactive:

    description: 'Set auto_inactive (see https://developer.github.com/v3/repos/deployments/#inactive-deployments)'
    required: false

### logs:

    description: 'URL to logs'
    required: false

### desc:

    description: 'Description to set in status'
    required: false

### ref:

    description: 'The git ref to use for the deploy, defaults to `github.ref`'
    required: false

### env:

    description: 'The name of the deployment environment for Github. (Required for `start` and `deactivate-env` only)'
    required: false

### transient:

    description: 'Whether this is a transient (short-lived) environment. (For `start` only)'
    required: false

### deployment_id:

    description: 'The deployment id to update (if specified during `start`, the deployment will be updated instead of a new one created)'
    required: false

### env_url:

    description: 'The environment URL. (For `finish` only)'
    required: false

### status:

    description: 'The deployment status. (For `finish` only)'
    required: false

### no_override:

    description: 'If 'true' (default), existing deployments of this environment are left active. Set to 'false' to mark previous deployments of this environment as inactive.'
    required: false
    default: 'true'

### log_args:

    description: 'Print arguments used by this action.'
    required: false
    default: 'false'

### repository:

    description: 'Set status for a different repository, using the format `$owner/$repository` (optional, defaults to the current repository)'
    required: false

## Example of usage

```yaml
- name: Start deployment
  uses: VirtoCommerce/vc-github-actions/gh-deployments@master
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    step: start
    env: production
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
