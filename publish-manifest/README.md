# publish-munifest
Publishes modules.json
## inputs:
### modulesJsonUrl:
    description: "Url to modules.json"
    default: "https://raw.githubusercontent.com/VirtoCommerce/vc-modules/master/modules_v3.json"
    required: false
### packageUrl:
    description: "Package Url for modules.json"
    default: ""
    required: false
### pushChanges: 
    description: "push changed modules.json to github"
    default: "true"
    required: false
### modulesJsonName:
    description: "Name of modules manifest file"
    required: false
    default: "modules_v3.json"
### modulesJsonRepo:
    description: "Repo url"
    required: false
    default: "https://github.com/VirtoCommerce/vc-modules.git"
## outputs:
### modulesJsonPath:
    description: "Path to updated modules.json"

## Example of usage
```
- name: Publish Manifest
  if: ${{ github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/master'}}
  uses: VirtoCommerce/vc-github-actions/publish-manifest@master
  with:
    packageUrl: ${{ steps.blobRelease.outputs.packageUrl }}
```
