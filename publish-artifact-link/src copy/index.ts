import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    const downloadComment = 'Download artifact URL:'
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    let repoOrg = core.getInput("repoOrg");
    let artifactUrl = core.getInput("artifactUrl");
    let octokit = github.getOctokit(GITHUB_TOKEN);

    let downloadUrlBody = `${downloadComment} ${artifactUrl}`;
    const regexp = RegExp(downloadComment + '\s*.*');
    

    let currentPr = await octokit.pulls.get({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number
    });

    let body = currentPr.data.body;

    if (body.includes(downloadComment)) { 
        // Replace existing artifact URL
        
        body = body.replace(regexp, downloadUrlBody )
    }
    else {
        // Add artifact URL if not exists
        body += '\n' + downloadUrlBody;
    }

    octokit.pulls.update({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
        body: body
    })
}

run().catch(error => core.setFailed(error.message));