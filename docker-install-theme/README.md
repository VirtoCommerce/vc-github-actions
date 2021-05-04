# docker-install-theme

Installs a theme to docker container

## inputs:
###  artifactPath:
    description: 'Path to a theme artifact'
    required: true
###  containerName:
    description: 'Name of docker container'
    required: true
###  containerDestination:
    description: 'Theme destination path inside the docker container'
    required: true
###  restartContainer:
    description: 'true to restart'
    required: false
    default: 'false'

## Example of usage

```
- name: Install Theme
  uses: VirtoCommerce/vc-github-actions/docker-install-theme@master
  with:
    artifactPath: ${{ steps.build.outputs.artifactPath }}
    containerName: 'virtocommerce_vc-storefront-web_1'
    containerDestination: '/opt/virtocommerce/storefront/wwwroot/cms-content/Themes/B2B-store/default'
    restartContainer: 'true'
```