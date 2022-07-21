import * as github from '@actions/github'
import * as core from '@actions/core'


const githubReleases = 'GithubReleases'
const azureBlobReleases = 'AzureBlob'
const releaseSourceTypes = ['platform', 'module'];
const releaseTypes = [githubReleases, azureBlobReleases];
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
    releaseSource: string, //platform or module
    releaseType: string, // 'GithubReleases', 'AzureBlob'
    platformVer: string,
    platformTag: string,
    moduleId: string,
    moduleVer: string,
    moduleBlob: string,
    configPath: string
}

async function createDeployPr(deployData: DeploymentData, targetRepo: RepoData, baseRepo: RepoData, gitUser: GitUser, githubToken: string, sha: string, deployContent: string): Promise <void>{

    console.log('Create deployment PR');

    const octokit = github.getOctokit(githubToken);
    const targetBranchName = `${targetRepo.taskNumber}-${targetRepo.branchName}-deployment`;

    console.log('Get base branch data');
    //Get base branch data
    const { data: baseBranch } = await octokit.rest.git.getRef({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        ref: `heads/${targetRepo.branchName}`
    });

    //Check branch exists
    let branch;
    try{
        branch = await octokit.rest.repos.getBranch({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            branch: `refs/heads/${targetBranchName}`,
        });
    } catch (err){}
    if(!branch) {

        console.log('Create branch for deployment PR');
        //Create branch for deployment PR

        const { data: targetBranch } = await octokit.rest.git.createRef({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            ref: `refs/heads/${targetBranchName}`,
            sha: baseBranch.object.sha,
        });
    }

    console.log('Push deployment config map content to target directory');
    //Push deployment config map content to target directory
    const { data: cmResult } = await octokit.rest.repos.createOrUpdateFileContents({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        path: deployData.configPath,
        branch: targetBranchName,
        content: Buffer.from(deployContent).toString("base64"),
        sha: sha,
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
        pr = await octokit.rest.pulls.list({
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
        await octokit.rest.pulls.create({
            owner: targetRepo.repoOrg,
            repo: targetRepo.repoName,
            head: `refs/heads/${targetBranchName}`,
            base: `refs/heads/${targetRepo.branchName}`,
            title: targetBranchName,
            body: `${commitPrefix} ${baseRepo.repoName} from PR ${baseRepo.pullNumber} ${baseRepo.pullHtmlUrl}`
        });
    }
}

async function createDeployCommit(deployData: DeploymentData, targetRepo: RepoData, baseRepoName: string, gitUser: GitUser, sha: string, githubToken: string, deployContent: string): Promise <void>{

    console.log('Commit deployment config content');

    const octokit = github.getOctokit(githubToken);

    console.log('Push deployment config content to the target directory');
    //Push deployment config map content to target directory
    const { data: cmResult } = await octokit.rest.repos.createOrUpdateFileContents({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        path: deployData.configPath,
        branch: targetRepo.branchName,
        content: Buffer.from(deployContent).toString("base64"),
        sha: sha,
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

function setModule (deployData: DeploymentData, content: string): string {
    console.log('Set module version');

    let vcPacakge = JSON.parse(content);

    let releasesArray = (vcPacakge.Sources.filter(x => x.Name === githubReleases))?.[0].Modules;
    let alphasArray = (vcPacakge.Sources.filter(x => x.Name === azureBlobReleases))?.[0].Modules;

    if(releasesArray){
        releasesArray = removeModuleFromArray(releasesArray, deployData.moduleId);
    }
    if(alphasArray){
        alphasArray = removeModuleFromArray(alphasArray, deployData.moduleId);
    }

    if(deployData.releaseType === githubReleases){
        releasesArray = addModuleToArray(releasesArray, deployData);
    } else{
        alphasArray = addModuleToArray(alphasArray, deployData);
    }

    const resultPackage = setSources(vcPacakge, releasesArray, alphasArray);
    let result = JSON.stringify(resultPackage, null, 2);
    return result;
}

function setSources (vcPackage: any, releasesArray: any, alphasArray: any): any {
    console.log('Set sources');

    let sources = vcPackage.Sources;
    if(releasesArray){
        sources = sources.map(x => {
            if(x.Name === githubReleases){
                x.Modules = releasesArray;
            }
            return x;
        }
        );
    }
    if(alphasArray){
        sources = sources.map(x => {
            if(x.Name === azureBlobReleases){
                x.Modules = alphasArray;
            }
            return x;
        }
        );
    }
    return sources;
}

function addModuleToArray (modules: any[], deployData: DeploymentData): any[] {
    console.log('Add module version');
    switch (deployData.releaseType) {
        case githubReleases:
            modules.push({"Id": deployData.moduleId, "Version": deployData.moduleVer});
            break;
        case azureBlobReleases:
            modules.push({"Id": deployData.moduleId, "BlobName": deployData.moduleBlob});
            break;
        default:
            console.log(`Invalid releaseType. Input parameter releaseType should contain: \x1b[0;32m${releaseTypes.join(', ')}\x1b[0m. Actual value: \x1bs[0;31m${deployData.releaseType}\x1b[0m.`);
            break;
    }
    return modules;
}

function setContent (deployData: DeploymentData, content: string): string {
    console.log('Set content');

    let deployContent;
    //Set new values in deployment config
    switch (deployData.releaseSource) {
        case releaseSourceTypes[0]: //platform
            deployContent = setPlatform(deployData.platformVer, deployData.platformTag, content);
            break;
        case releaseSourceTypes[1]://module
            deployContent = setModule(deployData, content);
            break;
        default:
            console.log(`Deployment source type is not supported. Valid values: \x1b[0;32m${releaseSourceTypes.join(', ')}\x1b[0m. Actual value: \x1b[0;31m${deployData.releaseSource}\x1b[0m.`);
    }

    return deployContent;
}

function removeModuleFromArray (modules: any[] , moduleId: string): any[] {
    console.log('Remove module from array');

    const index = modules.findIndex(m => m.Id === moduleId);

    if (index > -1) {
        modules.splice(index, 1);
    }
    return modules;
}

async function updateConfigContent(githubToken: string, deployData: DeploymentData, targetRepo: RepoData, baseRepo: RepoData, gitUser: GitUser, forceCommit: string): Promise <void>{
    console.log('Update config content');
    
    const octokit = github.getOctokit(githubToken);
    console.log('Get config content');
    //Get deployment config map content
    const {data: config }= await octokit.rest.repos.getContent({
        owner: targetRepo.repoOrg,
        repo: targetRepo.repoName,
        ref: `refs/heads/${targetRepo.branchName}`,
        path: deployData.configPath
    }) as { data: { sha: string, content: string } };

    const content = Buffer.from(config.content, 'base64').toString();
    //Set new values in deployment config
    let deployContent = setContent(deployData, content);

    switch(forceCommit){
        case "false":
            createDeployPr(deployData, targetRepo, baseRepo, gitUser, config.sha, githubToken, deployContent);
            break;
        case "true":
            createDeployCommit(deployData, targetRepo, baseRepo.repoName, gitUser, config.sha, githubToken, deployContent);
            break;
        default:
            console.log(`Input parameter forceCommit should contain "true" or "false". Current forceCommit value is "${forceCommit}"`)
    }

}

async function run(): Promise<void> {

    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
    const deployRepoName = core.getInput("deployRepo");
    const deployBranchName = core.getInput("deployBranch");
    const gitUserName = core.getInput("gitUserName");
    const gitUserEmail = core.getInput("gitUserEmail");
    const repoOrg = core.getInput("repoOrg");
    const releaseSource = core.getInput("releaseSource");
    const releaseType = core.getInput("releaseType");
    const platformVer = core.getInput("platformVer");
    const platformTag = core.getInput("platformTag");
    const moduleId = core.getInput("moduleId");
    const moduleVer = core.getInput("moduleVer");
    const moduleBlob = core.getInput("moduleBlob");
    const taskNumber = core.getInput("taskNumber");
    const configPath = core.getInput("configPath");
    const forceCommit = core.getInput("forceCommit");

    if (releaseSourceTypes.indexOf(releaseSource) === -1) { 
        core.setFailed(`Invalid releaseSource. Input parameter releaseSource should contain: \x1b[0;32m${releaseSourceTypes.join(', ')}\x1b[0m. Actual value: \x1bs[0;31m${releaseSource}\x1b[0m.`);
        return;
    }

    if (releaseTypes.indexOf(releaseType) === -1) { 
        core.setFailed(`Invalid releaseType. Input parameter releaseType should contain: \x1b[0;32m${releaseTypes.join(', ')}\x1b[0m. Actual value: \x1bs[0;31m${releaseType}\x1b[0m.`);
        return;
    }

    if (forceCommit !== "true" && forceCommit !== "false") { 
        core.setFailed(`Invalid forceCommit. Input parameter releaseSource should contain:: \x1b[0;32mtrue\x1b[0m or \x1b[0;32mfalse\x1b[0m. Actual value: \x1bs[0;31m${forceCommit}\x1b[0m.`);
        return;
    }


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
        releaseSource: releaseSource,
        releaseType: releaseType,
        platformVer: platformVer,
        platformTag: platformTag,
        moduleId: moduleId,
        moduleVer: moduleVer,
        moduleBlob: moduleBlob,
        configPath: configPath
    }

    updateConfigContent(GITHUB_TOKEN, deployData, deployRepo, prRepo, gitUser, forceCommit);

}

run().catch(error => core.setFailed(error.message));
