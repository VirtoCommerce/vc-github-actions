# docker-check-modules

Checks installed modules

## inputs:
 ### platformUrl:
    description: 'Platform url'
    required: false
    default: 'http://localhost:8090'
 ### login:
    description: 'Platform login'
    required: false
    default: 'admin'
 ### password:
    description: 'Platform password'
    required: false
    default: 'store'

## Example of usage

```
- name: Check Installed Modules
  uses: VirtoCommerce/vc-github-actions/docker-check-modules@master
```
