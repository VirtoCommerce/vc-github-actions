# update-virtocommercecom

Updates Catalog in https://virtocommerce.com/apps/extensions

## inputs:

### githubToken:

    description: "Github Token"
    required: true

### login:

    description: "hmac app id"
    required: true

### password:

    description: "hmac secret"
    required: true

### catalogId:

    description: "Catalog id"
    required: false
    default: "df74feb8266e4bb79d241b9695f52ea1"

### categoryId:

    description: "Category id"
    required: false
    default: "32fff046ead84c2a8d88c57dd7289bbf"

### platformUrl:

    description: "Platform Url"
    required: false
    default: "https://admin.virtocommerce.com:443/"

### moduleId:

    description: "Module Id"
    required: true

### moduleDescription:

    description: "Module Description"
    required: false
    default: ""

### projectUrl:

    description: "Module repo url"
    required: false
    default: ""

### iconUrl:

    description: "Url to module icon"
    required: false
    default: ""

## Example of usage

```yaml
- name: Update virtocommerce.com Catalog
  uses: VirtoCommerce/vc-github-actions/update-virtocommercecom@master
  with:
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    login: ${{ secrets.HMAC_APP_ID }}
    password: ${{ secrets.HMAC_SECRET }}
    moduleId: 'VirtoCommerce.Catalog'
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
