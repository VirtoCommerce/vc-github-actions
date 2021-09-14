# Get Jira keys action

This action grabs issue keys inside event commits.

## Outputs

### `jira-keys`

Jira keys that were found in push/pull request in comma delimited format

## Example of usage

```yml
- name: Parse Jira Keys from All Commits
  uses: VirtoCommerce/vc-github-actions/get-jira-keys@master
  id: jira_keys
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
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
