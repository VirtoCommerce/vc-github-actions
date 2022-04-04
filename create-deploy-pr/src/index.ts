import * as yaml from 'js-yaml'
import * as github from '@actions/github'
import * as core from '@actions/core'


const commitPrefix: string = 'ci: Automated update';
interface GitUser 
{
    name: string,
    email: string
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

interface DeploymentData
{
    key: string,
    keyValue: string,
    cmPath: string
}

async function createDeployPr(deployData: DeploymentData, targetRepo: RepoData, baseRepo: RepoData, gitUser: GitUser, octokit: any): Promise <void>{

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
        message: `${commitPrefix} ${baseRepo.repoName} from PR ${baseRepo.pullNumber}`,
        committer:{
            name: gitUser.name,
            email: gitUser.email
        },
        author:{
            name: gitUser.name,
            email: gitUser.email
        },
    });

    //Check pr exists
    let pr;
    try {
        pr = await octokit.pulls.list({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            head: `${targetRepo.repoOrg}:refs/heads/${targetBranchName}`,
            base: `refs/heads/${targetRepo.branchName}`,
            state: 'open'
        });
    } catch (err) {}
    
    if (typeof pr.data === 'undefined' || pr.data.length === 0) {
        console.log('Create PR to head branch');
        //Create PR to head branch
        await octokit.pulls.create({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            head: `refs/heads/${targetBranchName}`,
            base: `refs/heads/${targetRepo.branchName}`,
            title: targetBranchName,
            body: `${commitPrefix} ${baseRepo.repoName} from PR ${baseRepo.pullNumber} ${baseRepo.pullHtmlUrl}`
        });
    }
}

async function createDeployCommit(deployData: DeploymentData, targetRepo: RepoData, baseRepoName: string, gitUser: GitUser, octokit: any): Promise <void>{

    console.log('Get deployment config map content');
    //Get deployment config map content
    const { data: cmData} = await octokit.repos.getContent({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        ref: `refs/heads/${targetRepo.branchName}`,
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
        branch: targetRepo.branchName,
        content: Buffer.from(deployContent).toString("base64"),
        sha: cmData.sha,
        message: `${commitPrefix} ${baseRepoName}`,
        committer:{
            name: gitUser.name,
            email: gitUser.email
        },
        author:{
            name: gitUser.name,
            email: gitUser.email
        },
    });
}

function setConfigMap (key: string, keyValue:string, cmBody:string){
    const moduleKey = "VirtoCommerce."
    const dockerKey = "docker.";
    const ghcrKey = "ghcr.";
    let result;

    try {
        if((key.indexOf(dockerKey) > -1) || (key.indexOf(ghcrKey) > -1)){ //  Docker image deployment
            console.log('setConfigMap: Docker image deployment')
            
            const tag = getDockerTag(keyValue);
            const doc = yaml.load(cmBody);

            let imageIndex = doc["images"].findIndex( x => x.name === key);

            result = cmBody.replace(doc["images"][imageIndex]["newTag"], tag);

        } else {
            if(key.indexOf(moduleKey) > -1){ //  Module deployment
                console.log('setConfigMap: Module deployment');
                const regexp = RegExp('"PackageUrl":\s*.*' + key +'_.*');
                result = cmBody.replace(regexp, `"PackageUrl": "${keyValue}"`);
            } else { //  Theme deployment
                console.log('setConfigMap: Theme deployment')
                const regexp = RegExp(key + '\s*:.*');
                result = cmBody.replace(regexp, `${key}: ${keyValue}`);
            }
        }
    } catch (error) { 
        core.setFailed(error.message);
        process.exit();
    }
    return result;
}
function getDockerTag (dockerLink: string){
    const regExpDocker = /(?<=:).*/;
    let result;

    result = dockerLink.match(regExpDocker)?.[0];

    return result;
}

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const deployRepoName = core.getInput("deployRepo");
    const deployBranchName = core.getInput("deployBranch");
    const gitUserName = core.getInput("gitUserName");
    const gitUserEmail = core.getInput("gitUserEmail");
    const repoOrg = core.getInput("repoOrg");
    const artifactKey = core.getInput("artifactKey");
    const artifactUrl = core.getInput("artifactUrl");
    const taskNumber = core.getInput("taskNumber");
    const cmPath = core.getInput("cmPath");
    const forceCommit = core.getInput("forceCommit");

    const octokit = github.getOctokit(GITHUB_TOKEN);

    const gitUser: GitUser = {
        name: gitUserName,
        email: gitUserEmail
    }
    const prRepo: RepoData = {
        repoOrg: repoOrg,
        repoName: github.context.repo.repo,
        pullHtmlUrl: github.context.payload.pull_request?.html_url,
        pullNumber: github.context.payload.pull_request?.number ?? github.context.issue.number
    };
    
    const deployRepo: RepoData = {
        repoOrg: repoOrg,
        repoName: deployRepoName,
        branchName: deployBranchName,
        taskNumber: taskNumber
    };
    const deployData: DeploymentData ={
        key: artifactKey,
        keyValue: artifactUrl,
        cmPath: cmPath
    }

    switch(forceCommit){
        case "false":
            createDeployPr(deployData, deployRepo, prRepo, gitUser, octokit);
            break;
        case "true":
            createDeployCommit(deployData, deployRepo, prRepo.repoName, gitUser, octokit);
            break;
        default:
            console.log(`Input parameter forceCommit should contain "true" or "false". Current forceCommit value is "${forceCommit}"`)
    }

}

run().catch(error => core.setFailed(error.message));
