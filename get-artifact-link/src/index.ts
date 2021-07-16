import * as github from '@actions/github'
import * as core from '@actions/core'

interface RepoData
{
    repoOrg: string,
    repoName: string,
    branchName?: string,
    taskNumber?: string,
    pullHtmlUrl?: string
    pullNumber?: number
}

interface PrComments
{
    downloadLink: string,
    qaTask: string,
    demoTask: string
}


async function getArtifactUrl (prComment: PrComments, prRepo: RepoData, octokit: any): Promise< { qaTaskNumber: string; demoTaskNumber: string; artifactUrl: string } > {
    
    console.log('Get UrL and task numbers from PR body');

    const regExpLink = RegExp(prComment.downloadLink + '\s*.*');
    const regExpQa = RegExp(prComment.qaTask + '\s*.*');
    const regExpDemo = RegExp(prComment.demoTask + '\s*.*');
    const regExpTask = /\w+-\d+/

    //Get PR data
    let currentPr = await octokit.pulls.get({
        owner: prRepo.repoOrg,
        repo: prRepo.repoName,
        pull_number: prRepo.pullNumber
    });

    let body = currentPr.data.body;

    let qaTaskNumber = body.match(regExpQa)?.[0].match(regExpTask)?.[0];
    let demoTaskNumber = body.match(regExpDemo)?.[0].match(regExpTask)?.[0];
    

    // Get UrL from body
    let artifactUrl = body.match(regExpLink)?.[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)?.[0];
    return {
        qaTaskNumber: qaTaskNumber,
        demoTaskNumber: demoTaskNumber,
        artifactUrl: artifactUrl
    };
}

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const prComments: PrComments = {
        downloadLink: core.getInput("downloadComment"),
        qaTask: 'QA-test:',
        demoTask: 'Demo-test:'
    }
    const repoOrg = core.getInput("repoOrg");

    const octokit = github.getOctokit(GITHUB_TOKEN);

    github.context.payload.pull_request?.html_url

    const prRepo: RepoData = {
        repoOrg: repoOrg,
        repoName: github.context.repo.repo,
        pullHtmlUrl: github.context.payload.pull_request?.html_url,
        pullNumber: github.context.payload.pull_request?.number ?? github.context.issue.number
    };
    github.context.payload.pull_request?.html_url

    let pr = await getArtifactUrl (prComments, prRepo, octokit);

    if (pr.artifactUrl){

        console.log(`Artifact Url is: ${pr.artifactUrl}`); 
        core.setOutput('artifactUrl', pr.artifactUrl);
        console.log(`QA task number is: ${pr.qaTaskNumber}`); 
        core.setOutput('qaTaskNumber', pr.qaTaskNumber);
        console.log(`Demo task number is: ${pr.demoTaskNumber}`); 
        core.setOutput('demoTaskNumber', pr.demoTaskNumber);



    } else {
        console.log(`Could not find artifact link in PR body. PR body should contain '${prComments.downloadLink}`);
        core.error(`Could not find artifact link in PR body. PR body should contain '${prComments.downloadLink}`);
        core.setFailed(`Could not find artifact link in PR body. PR body should contain '${prComments.downloadLink}`);
    }

}

run().catch(error => core.setFailed(error.message));