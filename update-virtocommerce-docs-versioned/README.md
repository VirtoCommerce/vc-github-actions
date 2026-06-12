# update-virtocommerce-docs-versioned

Makes and updates versioned documentation for docs.virtocommerce.org using Mike

## inputs:

### githubToken:

    description: "GitHub token with push permissions to gh-pages branch"
    required: true

### ref:

    description: "Branch of vc-docs to deploy (main or release/X.0). VERSION file on that ref determines the deployed version."
    required: false
    default: "main"

### setAsLatest:

    description: "Set this version as 'latest' alias"
    required: false
    default: "true"

### setAsDefault:

    description: "Set this version as default version"
    required: false
    default: "true"

### dockerRegistry:

    description: "Docker Registry"
    required: true

### dockerUsr:

    description: "Docker User"
    required: true

### dockerPwd:

    description: "Docker Password"
    required: true

## outputs:

### docker-image-tag:

    description: "Docker image tag that was used for the build"

## Example of usage

```yaml
- name: Deploy Versioned Docs
  uses: VirtoCommerce/vc-github-actions/update-virtocommerce-docs-versioned@master
  with:
    githubToken: ${{ secrets.REPO_TOKEN }}
    ref: 'main'
    setAsLatest: 'true'
    setAsDefault: 'true'
    dockerRegistry: ${{ secrets.DOCKER_REGISTRY }}
    dockerUsr: ${{ secrets.DOCKER_USERNAME }}
    dockerPwd: ${{ secrets.DOCKER_PASSWORD }}
```

## Notes

- The deployed version is determined by the `VERSION` file at the root of the `vc-docs` branch selected via the `ref` input.
- Versioning is handled by [Mike](https://github.com/jimporter/mike), which deploys the version and maintains the version selector, pushing changes to the `gh-pages` branch.
- After a successful build, the Docker image tag used for the build is exposed through the `docker-image-tag` output.
