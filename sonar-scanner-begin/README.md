# sonar-scanner-begin
Prepares parameters for vc-build SonarQubeStart

## inputs
```
  repoOrg:
    description: "Repo Organization/User"
    required: false
    default: "VirtoCommerce"  
  sonarOrg:
    description: "Sonar Organization"
    required: false
    default: "virto-commerce"
```

## Example of usage

```
- name: SonarCloud Begin
  uses: VirtoCommerce/vc-github-actions/sonar-scanner-begin@master
  with:
   sonarOrg: "virto-commerce" 

```
