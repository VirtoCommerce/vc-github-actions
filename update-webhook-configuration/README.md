# update-webhook-configuration

Updates a webhook configured in a repository.

## inputs:

### githubToken:

    description: "GitHub token"

### repoOwner:

    description: "The account owner of the repository."
    default: "VirtoCommerce"

### repoName:

    description: "The name of the repository."

### webhookUrl:

    description: "The URL to which the payloads will be delivered."



## Example of usage

```
- name: Update or create webhook
  uses: VirtoCommerce/vc-github-actions/update-webhook-configuration@master
  with:
    repoName: "vc-github-actions"
    webhookUrl: "https:\\your-hook.url"

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
