# update-jira-tasks-with-release-number

Update Jira tasks with release number

## inputs:

### client-id:

    description: 'Client ID'
    required: true

### client-secret:

    description: 'Client secret'
    required: true

### ghRepository:

    description: 'GitHub repository in format org/repo'
    required: true

### ghReleaseTag:

    description: 'GitHub release tag'
    required: true

### jiraBaseUrl:

    description: 'Jira base URL'
    required: true
    default: 'https://virtocommerce.atlassian.net'

### jiraCustomFieldId:

    description: 'Jira custom field ID to update'
    required: true

### jiraCustomFieldValue:

    description: 'Jira custom field value to set'
    required: true

## Example of usage

```yaml
- name: Update Jira tasks with release number
  uses: VirtoCommerce/vc-github-actions/update-jira-tasks-with-release-number@master
  with:
    client-id: ${{ secrets.JIRA_CLIENT_ID }}
    client-secret: ${{ secrets.JIRA_CLIENT_SECRET }}
    ghRepository: ${{ github.repository }}
    ghReleaseTag: ${{ github.event.release.tag_name }}
    jiraCustomFieldId: 'customfield_10000'
    jiraCustomFieldValue: '<value>'
```
