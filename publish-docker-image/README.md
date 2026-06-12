# publish-docker-image

Publish docker image

## inputs:

### image:

    description: "Name of Docker Image"
    required: true

### tag:

    description: "Tag of Docker Image"
    required: true

### dockerOrg:

    description: "docker hub organization"
    required: false
    default: "virtocommerce"

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

## Example of usage

```yaml
- name: Publish Docker Image
  if: ${{ github.ref == 'refs/heads/master' || github.ref == 'refs/heads/dev' }}
  uses: VirtoCommerce/vc-github-actions/publish-docker-image@master
  with:
    image: ${{ steps.dockerBuild.outputs.imageName }}
    tag: ${{ steps.image.outputs.taggedVersion }}
    docker_user: ${{ secrets.DOCKER_USERNAME }}
    docker_token: ${{ secrets.DOCKER_TOKEN }}
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
