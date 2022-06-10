# sonar-scanner-end

Runs vc-build SonarQubeEnd

## Example of usage

```
- name: SonarCloud End
  uses: VirtoCommerce/vc-github-actions/sonar-scanner-end@master
```

## Compile action

Use @vercel/ncc tool to compile your code and modules into one file used for distribution.

-Install vercel/ncc by running this command in your terminal.

```bash
npm i -g @vercel/ncc
```

-Compile your index.ts file.

```bash
ncc build ./index.js --license licenses.txt
```

