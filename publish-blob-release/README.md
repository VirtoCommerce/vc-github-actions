# publish-blob-release

Publishes release artifact to Azure Blob

## inputs:
### blobUrl:
    description: "Url to Azure Blob"
    default: "https://vc3prerelease.blob.core.windows.net/packages"
    required: false
### blobSAS:
    description: "Blob SAS"
    required: false
## outputs:
### packageUrl:
    description: "Package url"