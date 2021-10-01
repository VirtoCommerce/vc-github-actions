import * as github from '@actions/github'
import * as core from '@actions/core'

interface EnvironmentConfig
{
    deployAppName: string;
    deployBranch: string;
    environmentId : string;
    environmentName : string;
    environmentType : string;
    environmentUrl : string;
}

interface DeployConfig
{
    artifactKey: string;
    deployRepo: string;
    cmPath: string;
    dev: EnvironmentConfig;
    qa: EnvironmentConfig;
    prod: EnvironmentConfig;
}

interface RepoData
{
    repoOrg: string,
    repoName: string,
    branchName: string,
}

async function getDeployConfig(repo: RepoData, deployConfigPath: string, githubToken: string ): Promise <string>{

    try {
        
        const octokit = github.getOctokit(githubToken);

        console.log('Get deployment config content');
        
        //Get deployment config content
        const { data: cmData} = await octokit.rest.repos.getContent({
            owner: repo.repoOrg,
            repo: repo.repoName,
            ref: repo.branchName,
            path: deployConfigPath.replace(/['"]+/g, '')
        });
    
        return Buffer.from(cmData['content'], 'base64').toString();
    
    } catch(error) {
        core.setFailed(error.message)
    }
}

async function run(): Promise<void> {
    
    const environments = [ 'dev', 'qa', 'prod' ];
    let deployConfig:DeployConfig;
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    const deployConfigPath = core.getInput("deployConfigPath");
    const envName = core.getInput("envName");

    if (!environments.includes(envName)) {
        core.setFailed(`"envName" input variable should contain "dev", "qa" or "prod" value. Actual "envName" value is: ${envName}`)
    }

    const branchName = github.context.ref;
    console.log(`Current branch ref ${branchName}`)

    const prRepo: RepoData = {
        repoOrg: github.context.repo.owner,
        repoName: github.context.repo.repo,
        branchName: branchName
    };

    const content: string = await getDeployConfig(prRepo, deployConfigPath, GITHUB_TOKEN);
    try {
        deployConfig = JSON.parse(content);
    } catch (error) {
        core.setFailed(error.message)
    }

    core.setOutput("artifactKey", deployConfig.artifactKey);
    core.setOutput("deployRepo", deployConfig.deployRepo);
    core.setOutput("cmPath", deployConfig.cmPath);
    core.setOutput("deployAppName", deployConfig[envName].deployAppName);
    core.setOutput("deployBranch", deployConfig[envName].deployBranch);
    core.setOutput("environmentId", deployConfig[envName].environmentId);
    core.setOutput("environmentName", deployConfig[envName].environmentName);
    core.setOutput("environmentType", deployConfig[envName].environmentType);
    core.setOutput("environmentUrl", deployConfig[envName].environmentUrl);
    core.setOutput("deployConfig", deployConfig);

    console.log(`artifactKey is: ${deployConfig.artifactKey}`);
    console.log(`deployRepo is: ${deployConfig.deployRepo}`);
    console.log(`cmPath is: ${deployConfig.cmPath}`);
    console.log(`${envName} deployAppName is: ${deployConfig[envName].deployAppName}`);
    console.log(`${envName} deployBranch is: ${deployConfig[envName].deployBranch}`);
    console.log(`${envName} environmentId is: ${deployConfig[envName].environmentId}`);
    console.log(`${envName} environmentName is: ${deployConfig[envName].environmentName}`);
    console.log(`${envName} environmentType is: ${deployConfig[envName].environmentType}`);
    console.log(`${envName} environmentUrl is: ${deployConfig[envName].environmentUrl}`);

}
run().catch(error => core.setFailed(error.message));