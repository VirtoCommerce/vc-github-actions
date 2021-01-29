import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    
    const GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const downloadComment = 'Download artifact URL:'
    const deployRepo = core.getInput("deployRepo");
    const deployBranch = core.getInput("deployBranch");
    const repoOrg = core.getInput("repoOrg");

    const octokit = github.getOctokit(GITHUB_TOKEN);

    const regexp = RegExp(downloadComment + '\s*.*');
    const regExpTask = /\w+-\d+/

    let currentPr = await octokit.pulls.get({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number
    });

    let taskNumber = currentPr.data.title.match(regExpTask)?.[0];
    let body = currentPr.data.body;

    console.log(currentPr.data.title);
    console.log(body);

    // Get UrL from body
    let artifactLink = body.match(regexp)?.[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)?.[0];

    console.log(`Artifact link is: ${artifactLink}`); 
    core.setOutput('artifactLink', artifactLink);

    const { data: baseBranch } = await octokit.git.getRef({
        owner: repoOrg,
        repo: deployRepo,
        ref: `heads/${deployBranch}`
    });

    await octokit.git.createRef({
        owner: repoOrg,
        repo: deployRepo,
        ref: `refs/heads/${taskNumber}`,
        sha: baseBranch.object.sha,
    });

}

run().catch(error => core.setFailed(error.message));