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
    - name: Send a message to Microsoft Teams
      uses: VirtoCommerce/vc-github-actions/msteams-send-message@master
      with:
        body: '{
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": "On ${{github.repository}} repository",
    "sections": [
        {
            "activityTitle": "Regression PR created/updated",
            "activitySubtitle": "On **[${{github.repository}}](${{github.server_url}}/${{github.repository}})** repository",
            "facts": [
                {
                    "name": "Repository",
                    "value": "[${{github.repository}}](${{github.server_url}}/${{github.repository}})"
                },
                {
                    "name": "Pull request",
                    "value": "[${{ github.event.pull_request.number }}](${{ github.event.pull_request._links.html.href }})"
                }
            ],
            "markdown": true
        }
    ],
    "potentialAction": [ {
        "@type": "OpenUri",
        "name": "View Pull Request",
        "targets": [{
            "os": "default",
            "uri": "${{ github.event.pull_request._links.html.href }}"
        }]
    }]

}'  # the body of the message
        webhook_uri: ${{ secrets.TEAMS_WEBHOOK }} 

```
