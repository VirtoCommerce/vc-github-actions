import * as github from '@actions/github'
import * as core from '@actions/core'

interface Label
{
    id: number,
    node_id: string,
    url: string,
    name: string,
    description: string,
    color: string,
    default: boolean

}

function getPrNumber (commitMessage: string) {

    console.log('Get PR number from commit message');

    const regExpPr = /\(#\d*\)/;

    let result = commitMessage.match(regExpPr)?.[0].match(/\d*/)?.[0];
    console.log(`PR number is: ${result}`);
    return result;
}

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    const prLabel = core.getInput("label");
    const squashCommitMessage = core.getInput("commitMessage");
    const prNumber = getPrNumber(squashCommitMessage);

    const octokit = github.getOctokit(GITHUB_TOKEN);

    let isPrLabeled: boolean = false;
    let prUrl: string = '';

    //Get base PR
    if (typeof prNumber !== 'undefined' ){

        const { data: basePrData } = await octokit.pulls.get({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: Number(prNumber)
        });
    
        if (typeof basePrData !== 'undefined' ){
    
            let labels = basePrData.labels as Label[];
            isPrLabeled = labels.some( x  => x.name === prLabel)
            prUrl = basePrData.html_url;
        }
    }

    core.setOutput("pullNumber", prNumber);
    core.setOutput("pullUrl", prUrl);
    core.setOutput("isLabeled", isPrLabeled);

    console.log(`Squashed PR number is : ${prNumber}`);
    console.log(`PR link is : ${prUrl}`);
    console.log(`PR is contain ${prLabel} label: ${isPrLabeled}`);

}

run().catch(error => core.setFailed(error.message));

