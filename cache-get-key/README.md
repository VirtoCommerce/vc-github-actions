# cache-get-key

Calculate unique key for artifact caching

## inputs:

### runnerOs:

    description: 'OS runner'
    required: false
    default: 'Linux'

### artifactName:

    description: 'Artifact name'
    required: false
    default: 'platform_image'

## outputs:

### shortKey:

    description: 'Short cache key'

### fullKey:

    description: 'Full cache key'

### dockerShortKey:

    description: 'Short cache key for docker image cache'

### dockerFullKey:

    description: 'Full cache key for docker image cache'

### packageShortKey:

    description: 'Short cache key for zip package cache'

### packageFullKey:

    description: 'Full cache key for zip package cache'

## Example of usage

```yaml
- name: Calculate cache key
  uses: VirtoCommerce/vc-github-actions/cache-get-key@master
  id: cache-key
  with:
    runnerOs: ${{ runner.os }}
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
