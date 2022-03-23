# cache-get-key'

Calculate unique key for artifact caching

## How to build

* Install vercel/ncc by running this command in your terminal. `npm i -g @vercel/ncc`
* Compile your index.ts file. `ncc build ./src/index.ts --license licenses.txt`

## inputs:

### runnerOs:

description: 'OS runner'
default: 'Linux'
required: false

### artifactName:

description: 'Artifact name'
default: 'platform_image'
required: false

## outputs:

## shortKey:

description: 'Short cache key'

### fullKey:

description: 'Full cache key'

## dockerShortKey:

description: 'Short cache key for docker image cache'

### dockerFullKey:

description: 'Full cache key for docker image cache'

## packageShortKey:

description: 'Short cache key for zip package cache'

### packageFullKey:

description: 'Full cache key for zip package cache'


## Example of usage

```
    - name: Calculate cache key
      uses: VirtoCommerce/vc-github-actions/docker-load-image@master
      id: cache-key
      with:
        runnerOs: ${{ runner.os  }}
        artifactName: 'platform'
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
