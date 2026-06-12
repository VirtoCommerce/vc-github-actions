# docker-load-image

Load docker image from input tar. Set output full docker imageName:tag

## inputs:

### dockerTar:

    description: 'Path to the image tar'
    required: false
    default: 'platform_image.tar'

## outputs:

### image:

    description: 'Published image name'

### tag:

    description: 'Published image tag'

## Example of usage

```yaml
- name: Load Docker image
  uses: VirtoCommerce/vc-github-actions/docker-load-image@master
  with:
    dockerTar: ${{ env.DOCKER_TAR }}
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
