# Get Jira keys action

This action grabs issue keys inside event commits.

## Outputs

### `jira-keys`

Jira keys that were found in push/pull request in comma delimited format



## Example of usage

```
- name: Get Image version
  uses: VirtoCommerce/vc-github-actions/get-jira-keys@master
  id: jira_keys
```