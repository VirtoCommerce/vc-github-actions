# publish-docker-image
Publish docker image
## inputs:
### image:
    description: "Name of Docker Image"
    required: true
### tag:
    description: "Tag of Docker Image"
    required: true
### docker_user:
    description: "Docker Hub User"
    required: true
### docker_token:
    description: "Docker Hub Token"
    required: true
### docker_hub:
    description: "Publish image to hub.docker.com"
    required: false
    default: "true"
### release_branch: 
    description: "Branch support preparation of a new production release"
    required: false
    default: "master"
### update_latest: 
    description: "Update *linux-latest image"
    required: true
    default: "true"

## Example usage
```
- name: Publish Docker Image
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' }}
  uses: VirtoCommerce/vc-github-actions/publish-docker-image@master
  with:
    image: ${{ steps.dockerBuild.outputs.imageName }}
    tag: ${{ steps.image.outputs.taggedVersion }}
    docker_user: ${{ secrets.DOCKER_USERNAME }}
    docker_token: ${{ secrets.DOCKER_TOKEN }}
```