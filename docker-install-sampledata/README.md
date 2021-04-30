# docker-install-sampledata

Installs sample data

## inputs:
###  sampleDataUrl:
    description: 'Url to sampledata'
    required: false
    default: ''
###  platformUrl:
    description: 'Platform Url'
    required: false
    default: 'http://localhost:8090'
###  login:
    description: 'Login for platform'
    required: false
    default: 'admin'
###  password:
    description: 'Password'
    required: false
    default: 'store'

## Example of usage

```
- name: Install Sampledata
  uses: VirtoCommerce/vc-github-actions/docker-install-sampledata@master
```