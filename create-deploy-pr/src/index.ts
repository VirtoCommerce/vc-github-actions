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

interface DeploymentData
{
    key: string,
    keyValue: string,
    cmPath: string
}

interface PrComments
{
    downloadLink: string,
    qaTask: string,
    demoTask: string
}


async function getArtifactUrl (prComment: PrComments, prRepo: RepoData, octokit: any): Promise< { qaTaskNumber: string; demoTaskNumber: string; artifactLink: string } > {
    
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
    let artifactLink = body.match(regExpLink)?.[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)?.[0];
    return {
        qaTaskNumber: qaTaskNumber,
        demoTaskNumber: demoTaskNumber,
        artifactLink: artifactLink
    };
}

async function createDeployPr(deployData: DeploymentData, targetRepo: RepoData, baseRepo: RepoData,octokit: any): Promise <void>{

    const targetBranchName = `${targetRepo.taskNumber}-${targetRepo.branchName}-deployment`;
    
    console.log('Get base branch data');
    //Get base branch data
    const { data: baseBranch } = await octokit.git.getRef({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        ref: `heads/${targetRepo.branchName}`
    });

    //Check branch exists
    let branch;
    try{
        branch = await octokit.repos.getBranch({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            branch: `refs/heads/${targetBranchName}`,
        });
    } catch (err){}
    if(!branch) {

        console.log('Create branch for deployment PR');
        //Create branch for deployment PR

        const { data: targetBranch } = await octokit.git.createRef({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            ref: `refs/heads/${targetBranchName}`,
            sha: baseBranch.object.sha,
        });
    }

    console.log('Get deployment config map content');
    //Get deployment config map content
    const { data: cmData} = await octokit.repos.getContent({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        ref: `refs/heads/${targetBranchName}`,
        path: deployData.cmPath
    });

    let content = Buffer.from(cmData.content, 'base64').toString();
    //Set new values in deployment config map
    let deployContent = setConfigMap(deployData.key, deployData.keyValue, content);

    console.log('Push deployment config map content to target directory');
    //Push deployment config map content to target directory
    const { data: cmResult } = await octokit.repos.createOrUpdateFileContents({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        path: deployData.cmPath,
        branch: targetBranchName,
        content: Buffer.from(deployContent).toString("base64"),
        sha: cmData.sha,
        message: `Automated update ${baseRepo.repoName} from PR ${baseRepo.pullNumber}`,
        committer:{
            name: 'vc-ci',
            email: 'ci@virtocommerce.com' 
        },
        author:{
            name: 'vc-ci',
            email: 'ci@virtocommerce.com' 
        },
    });

    //Check pr exists
    let pr;
    try {
        pr = await octokit.pulls.list({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            head: `refs/heads/${targetBranchName}`,
            base: `refs/heads/${targetRepo.branchName}`,
            state: 'open'
        });
    } catch (err) {}
    console.log(pr);
    if (typeof pr.data === 'undefined' || pr.data.length === 0) {
        console.log('Create PR to head branch');
        //Create PR to head branch
        await octokit.pulls.create({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            head: `refs/heads/${targetBranchName}`,
            base: `refs/heads/${targetRepo.branchName}`,
            title: targetBranchName,
            body: `Automated update ${baseRepo.repoName} from PR ${baseRepo.pullNumber} ${baseRepo.pullHtmlUrl}`
        });
    }
}

function setConfigMap (key: string, keyValue:string, cmBody:string){
    const regexp = RegExp(key + '\s*:.*');
    let result = cmBody.replace(regexp, `${key}: ${keyValue}`);
    return result;
}

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const prComments: PrComments = {
        downloadLink: 'Download artifact URL:',
        qaTask: 'QA-test:',
        demoTask: 'Demo-test:'
    }
    const deployRepoName = core.getInput("deployRepo");
    const deployBranchName = core.getInput("deployBranch");
    const repoOrg = core.getInput("repoOrg");
    const artifactKey = core.getInput("artifactKey");
    const cmPath = core.getInput("cmPath");

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

    if (pr.artifactLink){

        console.log(`Artifact link is: ${pr.artifactLink}`); 
        core.setOutput('artifactLink', pr.artifactLink);

        const deployRepo: RepoData = {
            repoOrg: repoOrg,
            repoName: deployRepoName,
            branchName: deployBranchName,
            taskNumber: pr.qaTaskNumber
        };
        const deployData: DeploymentData ={
            key: artifactKey,
            keyValue: pr.artifactLink,
            cmPath: cmPath
        }

        createDeployPr(deployData, deployRepo, prRepo, octokit);


    } else {
        console.log(`Could not find artifact link in PR body. PR body should contain '${prComments.downloadLink}`);
        core.error(`Could not find artifact link in PR body. PR body should contain '${prComments.downloadLink}`);
        core.setFailed(`Could not find artifact link in PR body. PR body should contain '${prComments.downloadLink}`);
    }

}

run().catch(error => core.setFailed(error.message));