# build-docker-image

Build docker image

## inputs:

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

```yaml
- name: Build Docker Image
  id: dockerBuild
  uses: VirtoCommerce/vc-github-actions/build-docker-image@master
  with:
    imageName: "platform"
    tag: ${{ steps.image.outputs.taggedVersion }}
    dockerFiles: "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/Dockerfile;https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/wait-for-it.sh"
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
