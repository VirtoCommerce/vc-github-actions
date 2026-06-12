# docker-install-modules

Installs modules to a docker container

## inputs:

### manifestUrl:

    description: 'Url to modules manifest '
    required: true

### manifestFormat:

    description: 'yml or json'
    required: true

### modulesGroup:

    description: 'Group of modules (commerce for example)'
    required: false

### containerName:

    description: 'Name of docker container'
    required: true

### containerDestination:

    description: 'Theme destination path inside the docker container'
    required: true

### restartContainer:

    description: 'true(by default) to restart'
    required: false
    default: 'true'

### sleepAfterRestart:

    description: 'Time in ms to wait for container restarts'
    required: false
    default: '30000'

### githubToken:

    description: 'Github Token'
    required: true

### githubUser:

    description: 'Github User or Organization'
    required: false
    default: 'VirtoCommerce'

## Example of usage

```yaml
- name: Install Modules
  uses: VirtoCommerce/vc-github-actions/docker-install-modules@master
  with:
    githubToken: ${{ secrets.REPO_TOKEN }}
    manifestUrl: 'https://raw.githubusercontent.com/VirtoCommerce/vc-webstore-deploy/qa/webstore-app/resources/deployment-cm.yaml'
    manifestFormat: 'yml'
    containerName: 'virtocommerce-vc-platform-web-1'
    containerDestination: '/opt/virtocommerce/platform/modules'
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
