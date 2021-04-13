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

interface RepoData
{
    repoOrg: string,
    repoName: string,
    branchName?: string,
    taskNumber?: string,
    pullHtmlUrl?: string
    pullNumber?: number
}


function getPrNumber (commitMessage: string): number{
    
    console.log('PR number from commit message');

    const regExpPr = /\(#\d*\)/;

    let result: number = Number(commitMessage.match(regExpPr)?.[0].match(/\d*/)?.[0]);
    
    return result;

}

async function checkPrLabel( repo: RepoData, labelName: string, octokit: any ): Promise <boolean>{

    let isPrLabeled: boolean = false;

    //Get base PR
    const { data: basePrData } = await octokit.pulls.get({
        owner: repo.repoOrg,
        repo: repo.repoName,
        pull_number: repo.pullNumber
    });

    if (typeof basePrData !== 'undefined' && basePrData.length > 0){

        let labels = basePrData.labels as Label[];
        isPrLabeled = labels.some( x  => x.name === labelName)
    }
    return isPrLabeled;
}

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const targetBranchName = core.getInput("targetBranch");
    const prLabel = core.getInput("label");
    const squashCommitMessage = core.getInput("commitMessage");
    const prNumber = getPrNumber(squashCommitMessage);

    const octokit = github.getOctokit(GITHUB_TOKEN);

    const repo: RepoData = {
        repoOrg: github.context.repo.owner,
        repoName: github.context.repo.repo,
        branchName: targetBranchName,
        pullNumber: prNumber
    };

    const isPrLabeled = checkPrLabel(repo, prLabel, octokit);

    core.setOutput("pullNumber", prNumber);
    core.setOutput("isLabeled", isPrLabeled);

    console.log(`Squash PR number is : ${prNumber}`);
    console.log(`PR is contain ${prLabel} label: ${isPrLabeled}`);

}

run().catch(error => core.setFailed(error.message));

