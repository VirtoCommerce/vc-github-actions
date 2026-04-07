# vc-actions-lib

Shared utility library used by GitHub Actions in this repository.

## Publishing changes

After modifying `index.js`, you **must** publish a new version to npm. Otherwise, actions that depend on this library will continue using the old code.

```bash
cd vc-actions-lib
npm version patch
npm publish --access public
```

Then rebuild every action that depends on this package:

```bash
for action in changelog-generator build-docker-image publish-docker-image publish-manifest get-image-version publish-blob-release publish-github-release publish-katalon-report; do
  cd ../$action
  npm install @virtocommerce/vc-actions-lib@latest
  npm run build
done
```

Commit the updated `dist/index.js` files in each action.

## npm authentication

Before publishing, you need to authenticate with the npm registry under the `@virtocommerce` scope.

### Using a granular access token

1. Go to https://www.npmjs.com/settings/tokens and click **"Generate New Token"** → **"Granular Access Token"**.
2. Set permissions to **Read and write** for `@virtocommerce/vc-actions-lib`.
3. Under 2FA, enable **"Bypass 2FA for automation"**.
4. Copy the token and configure npm:

```bash
npm config set //registry.npmjs.org/:_authToken=<your-token>
```

### Verify access

```bash
npm whoami
npm access list packages @virtocommerce
```

Ensure your account has publish permissions on `@virtocommerce/vc-actions-lib`.
