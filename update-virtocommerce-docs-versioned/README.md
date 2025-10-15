# Update Virto Commerce Documentation (Versioned)

GitHub Action for deploying versioned Virto Commerce documentation using Mike.

## Features

- **Independent Versioning**: Each subsite (marketplace/developer-guide, platform/user-guide, etc.) has independent version management
- **Mike Integration**: Uses Mike for version deployment and version selector
- **URL Structure**: `/marketplace/developer-guide/1.0/`, `/platform/user-guide/3.2025-S13/`
- **Docker Deployment**: Builds and deploys to Azure via Docker container
- **Nginx Configuration**: Optimized for versioned documentation with proper routing

## Usage

```yaml
- name: Deploy Versioned Docs
  uses: VirtoCommerce/vc-github-actions/update-virtocommerce-docs-versioned@main
  with:
    version: '3.2025-S13'
    setAsLatest: 'true'
    setAsDefault: 'false'
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

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `version` | Yes | - | Documentation version to deploy (e.g., "3.2025-S13", "1.0") |
| `setAsLatest` | No | `true` | Set this version as 'latest' alias |
| `setAsDefault` | No | `false` | Set this version as default version |
| `azureSubscriptionId` | Yes | - | Azure Subscription ID |
| `azureResourceGroupName` | Yes | - | Azure Resource Group Name |
| `azureWebAppName` | Yes | - | Azure WebApp Name |
| `azureTenantId` | Yes | - | Azure Tenant ID |
| `azureApiKey` | Yes | - | Azure API Key |
| `azureAppId` | Yes | - | Azure App ID |
| `dockerRegistry` | Yes | - | Docker Registry URL |
| `dockerUsr` | Yes | - | Docker Registry Username |
| `dockerPwd` | Yes | - | Docker Registry Password |

## Versioned Subsites

The action deploys versions for the following subsites independently:

1. `marketplace/developer-guide`
2. `marketplace/user-guide`
3. `platform/developer-guide`
4. `platform/user-guide`
5. `platform/deployment-on-cloud`
6. `storefront/developer-guide`
7. `storefront/user-guide`

## Version Structure

Versions are stored in gh-pages branch:

```
gh-pages/
├── marketplace/
│   ├── developer-guide/
│   │   ├── 1.0/
│   │   ├── 1.1/
│   │   ├── latest/
│   │   └── versions.json
│   └── user-guide/
│       ├── 1.0/
│       └── versions.json
├── platform/
│   ├── developer-guide/
│   │   ├── 3.2025-S11/
│   │   ├── 3.2025-S12/
│   │   ├── 3.2025-S13/
│   │   ├── latest/
│   │   └── versions.json
│   └── user-guide/
│       └── versions.json
└── storefront/
    ├── developer-guide/
    │   └── versions.json
    └── user-guide/
        └── versions.json
```

## URL Examples

After deployment, documentation is accessible at:

- `https://docs.virtocommerce.org/marketplace/developer-guide/1.0/`
- `https://docs.virtocommerce.org/platform/user-guide/3.2025-S13/`
- `https://docs.virtocommerce.org/storefront/developer-guide/latest/`
- `https://docs.virtocommerce.org/` (root site, non-versioned)

## Differences from Non-Versioned Action

| Feature | Non-Versioned | Versioned |
|---------|---------------|-----------|
| Subsites | Single build for all | Independent version per subsite |
| URL Structure | `/platform/developer-guide/` | `/platform/developer-guide/1.0/` |
| Version Selector | No | Yes (per subsite) |
| Mike Integration | No | Yes |
| gh-pages Branch | Not used | Required |
| Docker Image | `docs` | `docs-versioned` |
| Nginx Config | `nginx.default.conf` | `nginx.versioned.conf` |

## Workflow Example

```yaml
name: Deploy Versioned Documentation

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Deploy Versioned Docs
        uses: VirtoCommerce/vc-github-actions/update-virtocommerce-docs-versioned@main
        with:
          version: ${{ steps.version.outputs.VERSION }}
          setAsLatest: 'true'
          setAsDefault: 'true'
          # ... other inputs
```

## Version Management

### Deploy New Version

Create a new tag or trigger workflow with version parameter:

```bash
# Create tag
git tag v3.2025-S13
git push origin v3.2025-S13

# Or manually trigger workflow with version input
```

### Set Latest Alias

```yaml
setAsLatest: 'true'  # Updates 'latest' alias to point to this version
```

### Set Default Version

```yaml
setAsDefault: 'true'  # Sets this version as default (root URL redirects here)
```

## Troubleshooting

### Version Selector Not Appearing

- Verify `versions.json` exists in gh-pages branch
- Check nginx configuration for version selector routes
- Clear browser cache

### Wrong Default Version

Check deployment logs for "Set as default" step. Redeploy with `setAsDefault: 'true'`.

### Missing Versions

List versions in gh-pages branch:

```bash
git checkout gh-pages
ls marketplace/developer-guide/
```

## Support

For issues or questions:
- Check [vc-docs/VERSIONING.md](https://github.com/VirtoCommerce/vc-docs/blob/main/VERSIONING.md)
- Review Mike documentation: https://github.com/jimporter/mike
- Contact DevOps team

