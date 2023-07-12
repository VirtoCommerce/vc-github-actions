import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GITHUB_TOKEN) {
        core.error(`Required GITHUB_TOKEN parameter is empty. Step skipped.`);
        return;
    }
    

    let repoOrg = core.getInput("repoOrg");
    let artifactUrl = core.getInput("artifactUrl");
    let octokit = github.getOctokit(GITHUB_TOKEN);
    
    const downloadComment = core.getInput("downloadComment");
    let downloadUrlBody = `${downloadComment}\n${artifactUrl}`;
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

    // Get UrL from body
    //let result = body.match(regexp)[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)[0]
    //console.log(result); 

    octokit.pulls.update({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
        body: body
    })
}

run().catch(error => core.setFailed(error.message));
