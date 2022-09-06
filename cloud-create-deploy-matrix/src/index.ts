import * as github from '@actions/github'
import * as core from '@actions/core'


async function run(): Promise<void> {

    
    const environments = [ 'dev', 'qa', 'prod' ];
    let environment = {envName: "dev", confPath: "cloudDeploy.json"}
        
    const deployConfigPath = core.getInput("deployConfigPath");
    const confPath = core.getInput("deployConfigPath");

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

    core.setOutput("matrix", matrix);

    console.log(`Deployment matrix is: ${matrix}`);

}
run().catch(error => core.setFailed(error.message));