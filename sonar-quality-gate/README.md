# sonar-quality-gate

Check SonarQube quality gate status after project scan

## inputs:

### login:

      description: "Username or Token"
      required: true

### password:
      description: "Password (is only needed if username instead of token)"
      default: ""
      required: false

### sonarHost:
      description: "Sonar Server Url"
      default: "https://sonarcloud.io"
      required: false

### projectKey:
      description: "Project key"
      default: ""
      required: false

## Example of usage

```
- name: Quality Gate
  uses: VirtoCommerce/vc-github-actions/sonar-quality-gate@master
  with:
    login: ${{secrets.SONAR_TOKEN}}
```
