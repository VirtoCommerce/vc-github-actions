# build-docker-image

Builds a docker image

## inputs
### imageName: 
    description: "Name of Docker Image"
    required: true
### tag:
    description: "Tag of Docker Image"
    required: true
### dockerFiles:
    description: "Files urls for build docker image"
    required: true
## outputs:
### imageName: 
    description: "Name of Docker Image"

## Example of usage
```
- name: Build Docker Image
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' }}
  id: dockerBuild
  uses: VirtoCommerce/vc-github-actions/build-docker-image@dev
  with:
    imageName: "platform"
    tag: ${{ steps.image.outputs.taggedVersion }}
    dockerFiles: "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/Dockerfile;https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/wait-for-it.sh"
```
