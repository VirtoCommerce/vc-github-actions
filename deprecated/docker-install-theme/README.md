# docker-install-theme

Installs a theme to docker container

## inputs:

### artifactPath:

    description: 'Path to a theme artifact'
    required: true

### containerName:

    description: 'Name of docker container'
    required: true

### containerDestination:

    description: 'Theme destination path inside the docker container'
    required: true

### restartContainer:

    description: 'true to restart'
    required: false
    default: 'false'

## Example of usage

```yaml
- name: Install Theme
  uses: VirtoCommerce/vc-github-actions/docker-install-theme@master
  with:
    artifactPath: ${{ steps.build.outputs.artifactPath }}
    containerName: 'virtocommerce-vc-frontend-web-1'
    containerDestination: '/opt/virtocommerce/frontend/wwwroot/cms-content/Themes/B2B-store/default'
    restartContainer: 'true'
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
