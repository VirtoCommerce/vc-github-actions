# run-pytest-tests

Runs Auto Tests

## inputs:

### adminPassword:

    description: 'Admin Password'
    required: true

### adminUsername:

    description: 'Admin Username'
    required: true

### apiKey:

    description: 'API Key'
    required: true

### backUrl:

    description: 'Back URL'
    required: true

### baseUrl:

    description: 'Base URL'
    required: true

### browser:

    description: 'Browser'
    required: true

### pytestMarkers:

    description: 'Additional pytest -m marker expression, AND-combined with each suite''s default markers. Leave empty to use defaults only.'
    required: false
    default: ''

### skipDocCountVerification:

    description: 'Comma-separated document types whose post-reindex count check should be skipped (reindex still runs). Use when the seed dataset has 0 records for a type. Example: ''PickupLocation'' or ''PickupLocation,ContentFile''.'
    required: false
    default: ''

### testSecretEnvFile:

    description: 'Test secret environment file content'
    required: true

### testSuites:

    description: 'Comma-separated list of suites to run. Any subset of: graphql, restapi, e2e'
    required: false
    default: 'graphql,restapi,e2e'

### vctestingPath:

    description: 'UI tests path'
    required: true

### vctestingRepo:

    description: 'UI tests repository'
    required: true

### vctestingRepoBranch:

    description: 'UI tests repository branch'
    required: true

### artifactSuffix:

    description: 'Suffix appended to the uploaded artifact name (e.g., a matrix dimension)'
    required: false
    default: ''

## Example of usage

```yaml
- name: Run Auto Tests
  uses: VirtoCommerce/vc-github-actions/run-pytest-tests@master
  with:
    adminPassword: ${{ secrets.ADMIN_PASSWORD }}
    adminUsername: admin
    apiKey: ${{ secrets.API_KEY }}
    backUrl: http://localhost:8090
    baseUrl: http://localhost
    browser: chromium
    testSecretEnvFile: ${{ secrets.TEST_SECRET_ENV_FILE }}
    vctestingPath: vc-testing
    vctestingRepo: VirtoCommerce/vc-testing
    vctestingRepoBranch: main
```
