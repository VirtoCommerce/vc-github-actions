# check-acr-repos-size-limit

Check repository limit

## inputs:

### service_principal_id:

    description: "service principal id"
    required: true

### service_principal_password:

    description: "service principal passsword"
    required: true

### tenant_id:

    description: "tenant id"
    required: true

### web_hook_url:

    description: "teams web hook url notification"
    required: true

## Example of usage

```yaml
- name: Check ACR repos size limit
  uses: VirtoCommerce/vc-github-actions/check-acr-repos-size-limit@master
  with:
    service_principal_id: ${{ secrets.SERVICE_PRINCIPAL_ID }}
    service_principal_password: ${{ secrets.SERVICE_PRINCIPAL_PASSWORD }}
    tenant_id: ${{ secrets.TENANT_ID }}
    web_hook_url: ${{ secrets.TEAMS_WEBHOOK_URL }}
```
