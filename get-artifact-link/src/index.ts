import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    const downloadComment = 'Download artifact URL:'
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    let repoOrg = core.getInput("repoOrg");
        let octokit = github.getOctokit(GITHUB_TOKEN);

    const regexp = RegExp(downloadComment + '\s*.*');

    let currentPr = await octokit.pulls.get({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number
    });

    let body = currentPr.data.body;

    // Get UrL from body
    let artifactLink = body.match(regexp)[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)[0]
    console.log(`Artifact link is: ${artifactLink}`); 
    core.setOutput('artifactLink', artifactLink);

}

run().catch(error => core.setFailed(error.message));