param(
    [Parameter(Mandatory = $true)]
    [string]$teamsWebhookUrl,
    [hashtable[]]$mentions,
    [string]$title,
    [string]$workflowName,
    [string]$buildId,
    [string]$githubRepo
)
$mentionTags = ($mentions | ForEach-Object { "<at>$($_.name)</at>" }) -join ", "
$body = @{
    type        = "message"
    attachments = @(@{
            contentType = "application/vnd.microsoft.card.adaptive"
            contentUrl  = $null
            content     = @{
                type    = "AdaptiveCard"
                version = "1.4"
                body    = @(
                    @{
                        type   = "TextBlock"
                        text   = "🚨 $title"
                        weight = "Bolder"
                        color  = "Attention"
                        size   = "Large"
                    },
                    @{
                        type = "TextBlock"
                        text = "$mentionTags please check pipeline **$workflowName** - Run **$buildId** - [View Run](https://github.com/$githubRepo/actions/runs/$buildId)"
                        wrap = $true
                    }
                )
                msteams = @{
                    entities = @(
                        $mentions | ForEach-Object {
                            @{
                                type      = "mention"
                                text      = "<at>$($_.name)</at>"
                                mentioned = @{
                                    id   = $_.id
                                    name = $_.name
                                }
                            }
                        }
                    )
                }
            }
        })
} | ConvertTo-Json -Depth 10
$callResult = Invoke-RestMethod -Uri $teamsWebhookUrl -Method Post -Body $body -ContentType 'application/json'
if ($callResult -eq '1') {
    Write-Output "Message sent to Teams"
}
else {
    Write-Output "There was an error sending the message to Teams"
    Write-Output "Call result: $callResult"
    exit 1
}