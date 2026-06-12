# update-virtocommerce-docs

Makes and updates documentation for docs.virtocommerce.org

## inputs:

### azureSubscriptionId:

    description: "Azure Subscription ID"
    required: true

### azureResourceGroupName:

    description: "Azure Resource Group Name"
    required: true

### azureWebAppName:

    description: "Azure WebApp Name"
    required: true

### azureTenantId:

    description: ""
    required: true

### azureApiKey:

    description: ""
    required: true

### azureAppId:

    description: ""
    required: true

### dockerRegistry:

    description: "Docker Registry"
    required: true

### dockerUsr:

    description: "Docker User"
    required: true

### dockerPwd:

    description: "Docker Passsword"
    required: true

## Example of usage

```yaml
- name: Update docs.virtocommerce.org
  uses: VirtoCommerce/vc-github-actions/update-virtocommerce-docs@master
  with:
    azureSubscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    azureResourceGroupName: ${{ secrets.AZURE_RESOURCE_GROUP }}
    azureWebAppName: ${{ secrets.AZURE_WEBAPP_NAME }}
    azureTenantId: ${{ secrets.AZURE_TENANT_ID }}
    azureApiKey: ${{ secrets.AZURE_API_KEY }}
    azureAppId: ${{ secrets.AZURE_APP_ID }}
    dockerRegistry: ${{ secrets.DOCKER_REGISTRY }}
    dockerUsr: ${{ secrets.DOCKER_USERNAME }}
    dockerPwd: ${{ secrets.DOCKER_PASSWORD }}
```
