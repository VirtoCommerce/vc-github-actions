# msteams-send-message

Publishes artifact link to PR comment

## inputs

### webhook_uri

description: "Microsoft Teams webhook URI"

required: true

### body

description: "Microsoft Teams formatted message"

required: true

Read more about Microsoft Teams message card [format](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using?tabs=cURL)

## Example of usage

```yaml
- name: Add link to PR
    if: ${{ github.event_name == 'pull_request' }}
    uses: VirtoCommerce/vc-github-actions/publish-artifact-link@VDS-414
    with:
    artifactUrl: ${{ steps.publish.outputs.blobUrl }}
```
