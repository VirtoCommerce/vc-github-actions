
# docker-load-image

Load docker image from input tar. Set output full docker imageName:tag

## How to build

* Install vercel/ncc by running this command in your terminal. `npm i -g @vercel/ncc`
* Compile your index.ts file. `ncc build ./src/index.ts --license licenses.txt`

## inputs:

### dockerTar:

description: 'Path to the image tar'
default: 'platform_image.tar'
required: false

## outputs:

### image:

description: 'Published image name'

### tag:

description: 'Published image tag'

## Example of usage

```
    - name: Load Docker image 
      uses: VirtoCommerce/vc-github-actions/docker-load-image@master
      with:
        dockerTar: ${{ env.DOCKER_TAR }}

```
