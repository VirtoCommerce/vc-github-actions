# docker-start-environment

Starts Docker Environment

## inputs:
###  platformDockerTag:
    description: 'Platform Docker Tag'
    required: false
    default: 'dev-linux-latest'
###  storefrontDockerTag:
    description: 'Storefront Docker Tag'
    required: false
    default: 'dev-linux-latest'
###  platformImage:
    description: 'Platform Docker Image'
    required: false
###  storefrontImage:
    description: 'Storefront Docker Image'
    required: false
###  composeProjectName:
    description: 'Value for COMPOSE_PROJECT_NAME env variable'
    required: false
    default: 'virtocommerce'

## Example of usage

```
- name: Start Containers
  uses: VirtoCommerce/vc-github-actions/docker-start-environment@master
  with: 
    platformImage: docker.pkg.github.com/virtocommerce/vc-platform/platform
    platformDockerTag: 3.49.0-master-182936ca
    storefrontImage: docker.pkg.github.com/virtocommerce/vc-demo-storefront/demo-storefront
    storefrontDockerTag: 1.10.0-alpha.1012-upstream-dev-672f462a
```