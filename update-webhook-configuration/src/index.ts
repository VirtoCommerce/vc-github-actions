import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    const GITHUB_TOKEN = core.getInput("githubToken");
    const repoOwner = core.getInput("repoOwner");
    const repoName = core.getInput("repoName");
    const webhookUrl = core.getInput("webhookUrl");

    const octokit = github.getOctokit(GITHUB_TOKEN);

    try {
        let webhookList = await octokit.rest.repos.listWebhooks(
            {
                owner: repoOwner,
                repo: repoName
            }
        )
        let webhooks = webhookList.data.filter(webhook => webhook.config.url === webhookUrl);

        if (webhooks) { // update existing webhook
                console.log(`Updating webhook ${webhooks[0].id}`);
                await octokit.rest.repos.updateWebhook({
                owner: repoOwner,
                repo: repoName,
                hook_id: webhooks[0].id,
                config: {
                    url: webhookUrl,
                    content_type: "json",
                    insecure_ssl: "0"
                }
            })
        } else { // create new webhook if doesn't exist
            console.log(`Creating new webhook`);
            await octokit.rest.repos.createWebhook({
                owner: repoOwner,
                repo: repoName,
                config: {
                    url: webhookUrl,
                    content_type: "json",
                    insecure_ssl: "0"
                }
            })
        }
    } catch (error) {
        core.setFailed(`\x1b[41mUpdate webhook failed:\x1b[0m ${error}`);
        process.exit();
    }
    console.log(`\x1b[32mWebhook updated successfully\x1b[0m`);

}

run().catch(error => core.setFailed(error.message));