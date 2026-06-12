# docker-restore-dump

Restores dump to MsSql via sqlcmd

## inputs:
###  host:
    description: 'Sql server host'
    required: false
    default: "localhost"
###  port:
    description: 'Sql server port'
    required: false
    default: '1433'
###  user:
    description: 'username'
    required: false
    default: 'sa'
###  password:
    description: ''
    required: false
    default: 'v!rto_Labs!'
###  dumpUrl:
    description: 'Dump file url'
    required: true 

## Example of usage

```
- name: Restore Dump
  uses: VirtoCommerce/vc-github-actions/docker-restore-dump@master
  with:
    dumpUrl: 'https://url_to_sql_file'
```