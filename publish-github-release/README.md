# publish-github-release
Publish github release or prerelease dependant to github.ref
## inputs:
### changelog:
    description: "Commit's messages since the latest release"
    default: ""
    required: false
### prerelease:
    description: ""
    default: "false"
    required: false
### organization:
    description: "Organization name"
    default: "VirtoCommerce"
    required: false