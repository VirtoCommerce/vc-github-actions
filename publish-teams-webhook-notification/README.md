# publish-teams-webhook-notification

Publish Teams Webhook Notification

## inputs:

### teamsWebhookUrl:

    description: 'Teams Webhook Url'
    required: true

### mentions:

    description: 'Mentions'
    required: true

### title:

    description: 'Message Title'
    required: true

### workflowName:

    description: 'Workflow Name'
    required: true

### buildId:

    description: 'Build Id'
    required: true

### githubRepo:

    description: 'Github Repository'
    required: true

## Example of usage

```yaml
- name: Publish Teams Webhook Notification
  uses: VirtoCommerce/vc-github-actions/publish-teams-webhook-notification@master
  with:
    teamsWebhookUrl: ${{ secrets.TEAMS_WEBHOOK_URL }}
    mentions: '<mentions>'
    title: '<message title>'
    workflowName: ${{ github.workflow }}
    buildId: ${{ github.run_id }}
    githubRepo: ${{ github.repository }}
```
