# publish-katalon-report

Publishes katalon report to the github commit's status

## inputs:
###  testProjectPath:
    description: "Path to Katalon Project"
    required: false
    default: "./"
###  githubToken:
    description: "GitHub token"
    required: false
###  repoOrg:
    description: "repo org"
    required: false
    default: "VirtoCommerce"
###  publishComment:
    description: "Publish PR Comment"
    required: false
    default: "true"
###  publishStatus:
    description: "Publish commit's status"
    required: false
    default: "false"

## Example of usage

```
- name: Start Containers
  uses: VirtoCommerce/vc-github-actions/publish-katalon-report@master
```