# get-jira-keys

Find issue keys inside event commits

## inputs:

### release:

    description: 'Release branch Jira keys search'
    required: true
    default: 'false'

### searchDepth:

    description: 'Release branch commits search history depth in days'
    required: true
    default: '21'

## outputs:

### jira-keys:

    description: 'Jira keys that were found in push/pull request in comma delimited format'

## Example of usage

```yaml
- name: Parse Jira Keys from All Commits
  uses: VirtoCommerce/vc-github-actions/get-jira-keys@master
  if: always()
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
