# publish-katalon-report

Publishes Katalon test report as a PR comment and/or GitHub commit status. Parses `JUnit_Report.xml` files, posts a formatted summary with pass/fail counts and progress bar, and optionally sets the commit status to `success` or `failure`.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `testProjectPath` | Path to Katalon Project | No | `./` |
| `githubToken` | GitHub token | No | |
| `repoOrg` | Repository organization | No | `VirtoCommerce` |
| `publishComment` | Publish PR comment with test results | No | `true` |
| `publishStatus` | Publish commit status | No | `false` |

## Example of usage

```yaml
- name: Publish Katalon Report
  uses: VirtoCommerce/vc-github-actions/publish-katalon-report@master
  with:
    testProjectPath: "./katalon-project"
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    publishComment: "true"
    publishStatus: "true"
```

## Build

```bash
npm install
npm run build
```

This compiles `src/index.ts` and bundles it into `dist/index.js` using [@vercel/ncc](https://github.com/vercel/ncc). The `dist/index.js` file must be committed, as GitHub Actions runs it directly.
