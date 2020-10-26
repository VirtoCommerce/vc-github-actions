# sonar-scanner-begin
Prepares parameters for vc-build SonarQubeStart
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