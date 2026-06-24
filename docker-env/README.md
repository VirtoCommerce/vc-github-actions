# docker-env

Runs Docker Environment

## inputs:

### githubUser:

    description: 'User for github packages'
    required: true

### githubToken:

    description: 'Token for github packages'
    required: true

### dockerTag:

    description: 'Docker tag'
    required: false

### platformDockerTag:

    description: 'Platform Docker Tag'
    required: false
    default: 'local-latest'

### platformImage:

    description: 'Platform Docker Image'
    required: false

### validateSwagger:

    description: 'Enable or disable swagger validation'
    required: false
    default: 'true'

### installCustomModule:

    description: 'Enable or disable custom module ver. installation'
    required: false
    default: 'false'

### customModuleId:

    description: 'Custom Module id'
    required: false
    default: ''

### customModuleUrl:

    description: 'Custom module Module url'
    required: false
    default: ''

### requiredModulesListUrl:

    description: 'The URL of the JSON file with the required modules list'
    required: false
    default: ''

### installModules:

    description: 'Enable or disable "Install Modules" step'
    required: false
    default: 'true'

### installSampleData:

    description: 'Enable or disable "Install Sample Data" step'
    required: true
    default: 'true'

### envDir:

    description: 'Directory with environment files'
    required: true
    default: '.'

### appInsightsInstrumentationKey:

    description: 'Application Insights instrumentation key (GUID). Passed to the platform container as `ApplicationInsights:InstrumentationKey`. When set, the run waits ~40s at the end so the short-lived container flushes its telemetry.'
    required: false
    default: ''

## Example of usage

```yaml
- name: Run Docker Environment
  uses: VirtoCommerce/vc-github-actions/docker-env@master
  with:
    githubUser: ${{ github.actor }}
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    platformImage: 'platform'
    installModules: 'true'
    installSampleData: 'true'
    envDir: '.'
```
