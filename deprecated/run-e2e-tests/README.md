# run-e2e-tests

Runs GraphQL Tests

## inputs:

### adminPassword:

    description: 'Admin Password'
    required: true

### adminUsername:

    description: 'Admin Username'
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

### testSecretEnvFile:

    description: 'Test secret environment file content'
    required: true

### vctestingPath:

    description: 'UI tests path'
    required: true

### vctestingRepo:

    description: 'UI tests repository'
    required: true

### vctestingRepoBranch:

    description: 'UI tests repository branch'
    required: true

### skipDocCountVerification:

    description: 'Comma-separated document types whose post-reindex count check should be skipped (reindex still runs). Use when the seed dataset has 0 records for a type. Example: ''PickupLocation'' or ''PickupLocation,ContentFile''.'
    required: false
    default: ''

## Example of usage

```yaml
- name: Run E2E Tests
  uses: VirtoCommerce/vc-github-actions/run-e2e-tests@master
  with:
    adminPassword: ${{ secrets.ADMIN_PASSWORD }}
    adminUsername: ${{ secrets.ADMIN_USERNAME }}
    backUrl: 'http://localhost:8090'
    baseUrl: 'http://localhost'
    browser: 'chromium'
    testSecretEnvFile: ${{ secrets.TEST_SECRET_ENV_FILE }}
    vctestingPath: 'vc-testing'
    vctestingRepo: 'VirtoCommerce/vc-testing'
    vctestingRepoBranch: 'master'
```
