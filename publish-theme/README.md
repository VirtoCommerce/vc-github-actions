# publish-theme
Publishes Theme to Azure blob or Github Release
## inputs:
### release_branch: 
    description: 'Branche support preparation of a new production release'
    required: false
    default: "master"
## outputs:
### artifactPath:
    description: 'Path to artifact'
### artifactName:
    description: 'Name of artifact'