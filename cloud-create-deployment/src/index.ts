import * as github from '@actions/github'
import * as core from '@actions/core'

const deploymentSourceTypes = ['platform', 'module'];
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
    deploymentSource: string,
    platformVer: string,
    platformTag: string,
    moduleId: string,
    moduleVer: string,
    moduleLink: string,
    configPath: string
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
        path: deployData.configPath
    });

    let content = Buffer.from(cmData.content, 'base64').toString();
    //Set new values in deployment config map
    let deployContent = setContent(deployData, content);

    console.log('Push deployment config map content to target directory');
    //Push deployment config map content to target directory
    const { data: cmResult } = await octokit.repos.createOrUpdateFileContents({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        path: deployData.configPath,
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
        path: deployData.configPath
    });

    const content = Buffer.from(cmData.content, 'base64').toString();
    //Set new values in deployment config
    let deployContent = setContent(deployData, content);

    console.log('Push deployment config map content to target directory');
    //Push deployment config map content to target directory
    const { data: cmResult } = await octokit.repos.createOrUpdateFileContents({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        path: deployData.configPath,
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

function setPlatform (verValue:string, tagValue:string, content:string){
    console.log('Set platform version');

    const version = "PlatformVersion"
    const imageTag = "PlatformImageTag";
    let vcPacakge = JSON.parse(content);
    vcPacakge[version] = verValue;
    vcPacakge[imageTag] = tagValue;
    let result = JSON.stringify(vcPacakge, null, 2);
    return result;
}

function setModule (moduleId: string, moduleVer: string, moduleLink: string, content: string): string {
    console.log('Set module version');

    let newContent = content;
    newContent = newContent.replace(/\$\{moduleId\}/g, moduleId);
    newContent = newContent.replace(/\$\{moduleVer\}/g, moduleVer);
    newContent = newContent.replace(/\$\{moduleLink\}/g, moduleLink);
    return newContent;
}

function setContent (deployData: DeploymentData, content: string): string {
    console.log('Set content');

    let deployContent;
    //Set new values in deployment config
    switch (deployData.deploymentSource) {
        case deploymentSourceTypes[0]: //platform
            deployContent = setPlatform(deployData.platformVer, deployData.platformTag, content);
            break;
        case deploymentSourceTypes[1]://module
            deployContent = setModule(deployData.moduleId, deployData.moduleVer, deployData.moduleLink, content);
            break;
        default:
            console.log(`Deployment source type is not supported. Valid values: \033[0;32m${deploymentSourceTypes.join(', ')}\033[0m. Actual value: \033[0;31m${deployData.deploymentSource}\033[0m.`);
    }

    return deployContent;
}

async function run(): Promise<void> {

    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const deployRepoName = core.getInput("deployRepo");
    const deployBranchName = core.getInput("deployBranch");
    const gitUserName = core.getInput("gitUserName");
    const gitUserEmail = core.getInput("gitUserEmail");
    const repoOrg = core.getInput("repoOrg");
    const deploymentSource = core.getInput("deploymentSource");
    const platformVer = core.getInput("platformVer");
    const platformTag = core.getInput("platformTag");
    const moduleId = core.getInput("moduleId");
    const moduleVer = core.getInput("moduleVer");
    const moduleLink = core.getInput("moduleLink");
    const taskNumber = core.getInput("taskNumber");
    const configPath = core.getInput("configPath");
    const forceCommit = core.getInput("forceCommit");

    if (deploymentSourceTypes.indexOf(deploymentSource) === -1) { 
        core.setFailed(`Invalid deploymentSource. Valid values: \033[0;32m${deploymentSourceTypes.join(', ')}\033[0m. Actual value: \033[0;31m${deploymentSource}\033[0m.`);
        return;
    }
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
        deploymentSource: deploymentSource,
        platformVer: platformVer,
        platformTag: platformTag,
        moduleId: moduleId,
        moduleVer: moduleVer,
        moduleLink: moduleLink,
        configPath: configPath
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
