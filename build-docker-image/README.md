# build-docker-image

Builds a docker image

## How to build

* Install vercel/ncc by running this command in your terminal. `npm i -g @vercel/ncc`
* Compile your index.js file. `ncc build index.js --license licenses.txt`

## inputs

###  outputs:

    description: "Output destination"
    default: ''
    required: false
### imageName:

    description: "Name of Docker Image"
    required: true

### tag:

    description: "Tag of Docker Image"
    required: true

### dockerFiles:

    description: "Files urls for build docker image"
    required: true

## Example of usage

```
- name: Build Docker Image
  id: dockerBuild
  uses: VirtoCommerce/vc-github-actions/build-docker-image@master
  with:
    imageName: "platform"
    tag: ${{ steps.image.outputs.taggedVersion }}
    dockerFiles: "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/Dockerfile;https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/wait-for-it.sh"
```
