# docker-env-full

Runs Docker Environment

## inputs:

### customModuleId:

    description: 'Custom Module id'
    required: false
    default: ''

### customModuleUrl:

    description: 'Custom module Module url'
    required: false
    default: ''

### customPackagesJsonUrl:

    description: 'Custom packages.json file Url'
    required: false
    default: ''

### frontendDockerTag:

    description: 'Frontend Docker Tag'
    required: false
    default: 'local-latest'

### frontendImage:

    description: 'Frontend Docker Image'
    required: false
    default: 'nginx_frontend'

### frontendZipUrl:

    description: 'Frontend Zip Url'
    required: false

### installCustomModule:

    description: 'Enable or disable custom module ver. installation'
    required: false
    default: 'false'

### installModules:

    description: 'Enable or disable "Install Modules" step'
    required: false
    default: 'true'

### installSampleData:

    description: 'Enable or disable "Install Sample Data" step'
    required: true
    default: 'true'

### platformDockerTag:

    description: 'Platform Docker Tag'
    required: false
    default: 'local-latest'

### platformImage:

    description: 'Platform Docker Image'
    required: false
    default: 'platform'

### requiredModulesListUrl:

    description: 'The URL of the JSON file with the required modules list'
    required: false
    default: ''

### testSecretEnvFile:

    description: 'Test secret environment file content'
    required: true

### dockerFiles:

    description: 'Docker files'
    required: false
    default: 'https://raw.githubusercontent.com/VirtoCommerce/vc-docker/feat/net10/linux/platform/Dockerfile;https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/wait-for-it.sh'

### sendgridApiKey:

    description: 'SendGrid API Key'
    required: true

### envDir:

    description: 'Directory with environment files'
    required: false
    default: '.'

### databaseProvider:

    description: 'Database provider: sqlserver | mysql | postgres'
    required: false
    default: 'sqlserver'

### prebuiltImageArtifact:

    description: |
      Name of a workflow artifact containing a `docker save` tar of the platform image.
      When set, the action downloads and `docker load`s it instead of building or pulling.

      BREAKING CONTRACT — when this input is set, the following inputs MUST be at the listed values
      (the action will fail-fast with an actionable error otherwise):
        - installModules:        'false'  (a volume mount would otherwise shadow the baked-in modules)
        - installCustomModule:   'false'  (the build step would overwrite the loaded image tag)
        - customPackagesJsonUrl: ''       (the build step would overwrite the loaded image tag)
    required: false
    default: ''

### appInsightsInstrumentationKey:

    description: 'Application Insights instrumentation key (GUID). Passed to the platform container as `ApplicationInsights:InstrumentationKey`.'
    required: false
    default: ''

## Example of usage

```yaml
- name: Run Docker Environment
  uses: VirtoCommerce/vc-github-actions/docker-env-full@master
  with:
    installModules: 'true'
    installSampleData: 'true'
    platformImage: 'platform'
    frontendImage: 'nginx_frontend'
    testSecretEnvFile: ${{ secrets.TEST_SECRET_ENV_FILE }}
    sendgridApiKey: ${{ secrets.SENDGRID_API_KEY }}
    databaseProvider: 'sqlserver'
```
