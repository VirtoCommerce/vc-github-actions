import * as github from '@actions/github'
import * as core from '@actions/core'

interface DeployConfig
{
    artifactKey: string;
    deployAppName: string;
    deployRepo: string;
    deployBranchQa: string;
    deployBranchProd: string;
    cmPath: string;
}

interface RepoData
{
    repoOrg: string,
    repoName: string,
    branchName: string,
}

async function getDeployConfig(repo: RepoData, deployConfigPath: string, octokit: any): Promise <string>{

    try {
        console.log('Get deployment config content');
        //Get deployment config content
        const { data: cmData} = await octokit.repos.getContent({
            owner: repo.repoOrg,
            repo: repo.repoName,
            ref: repo.branchName,
            path: deployConfigPath
        });
    
        return Buffer.from(cmData.content, 'base64').toString();
    
    } catch(error) {
        core.setFailed(error.message)
    }
}

async function run(): Promise<void> {
    
    let deployConfig:DeployConfig;
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const deployConfigPath = core.getInput("deployConfigPath");

    const octokit = github.getOctokit(GITHUB_TOKEN);

    const branchName = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.ref : github.context.ref

    const prRepo: RepoData = {
        repoOrg: github.context.repo.owner,
        repoName: github.context.repo.repo,
        branchName: branchName
    };

    const content: string = await getDeployConfig(prRepo, deployConfigPath, octokit);
    try {
        deployConfig = JSON.parse(content);
    } catch (error) {
        core.setFailed(error.message)
    }

    core.setOutput("artifactKey", deployConfig.artifactKey);
    core.setOutput("deployAppName", deployConfig.deployRepo);
    core.setOutput("deployRepo", deployConfig.deployRepo);
    core.setOutput("deployBranchQa", deployConfig.deployBranchQa);
    core.setOutput("deployBranchProd", deployConfig.deployBranchProd);
    core.setOutput("cmPath", deployConfig.cmPath);

    console.log(`artifactKey is: ${deployConfig.artifactKey}`);
    console.log(`deployAppName is: ${deployConfig.deployAppName}`);
    console.log(`deployRepo is: ${deployConfig.deployRepo}`);
    console.log(`deployBranchQa is: ${deployConfig.deployBranchQa}`);
    console.log(`deployBranchProd is: ${deployConfig.deployBranchProd}`);
    console.log(`cmPath is: ${deployConfig.cmPath}`);
}

run().catch(error => core.setFailed(error.message));