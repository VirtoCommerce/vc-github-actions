# publish-nuget

Publish nugets

## inputs
  
### skip

    description: 'vc-build -skip string. default value "Clean+Restore+Compile+Test"'
    required: false
    default: "Clean+Restore+Compile+Test"


## Example of usage

```
- name: Publish Nuget
  if: ${{ github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'}}
  uses: VirtoCommerce/vc-github-actions/publish-nuget@master
  with:
    skipString: 'Clean+Restore+Compile+Pack+Test'
```

## Compile action

Use @vercel/ncc tool to compile your code and modules into one file used for distribution.

-   Install vercel/ncc by running this command in your terminal.

```bash
npm i -g @vercel/ncc
```

-   Compile your index.ts file.

```bash
ncc build ./index.js --license licenses.txt
```
