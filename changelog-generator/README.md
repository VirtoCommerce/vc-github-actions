# changelog-generator

Generates changelog

## outputs:

### changelog:

    description: 'Result'

## Example of usage

```yaml
- name: Get changelog
  id: changelog
  uses: VirtoCommerce/vc-github-actions/changelog-generator@master
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
