# docker-restore-dump

Restores dump to MsSql via sqlcmd

## inputs:

### host:

    description: 'Sql server host'
    required: false
    default: 'localhost'

### port:

    description: 'Sql server port'
    required: false
    default: '1433'

### user:

    description: 'username'
    required: false
    default: 'sa'

### password:

    description: ''
    required: false
    default: 'v!rto_Labs!'

### dumpUrl:

    description: 'Dump file url'
    required: true

## Example of usage

```yaml
- name: Restore Dump
  uses: VirtoCommerce/vc-github-actions/docker-restore-dump@master
  with:
    dumpUrl: 'https://url_to_sql_file'
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
