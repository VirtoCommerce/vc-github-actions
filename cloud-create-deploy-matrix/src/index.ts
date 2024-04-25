import * as github from '@actions/github'
import * as core from '@actions/core'

// Release type. Allowed values: GithubReleases, AzureBlob'
const githubReleases = 'GithubReleases'
const azureBlobReleases = 'AzureBlob'


async function run(): Promise<void> {

    let environments = [];
    const confPath = core.getInput("deployConfigPath");
    let releaseBranch = "";
    if ( core.getInput("releaseBranch") === "master"){
        let actualBranch = github.context.ref;
        if (actualBranch === "refs/heads/main"){
            releaseBranch = "main";
        } else {
            releaseBranch = "master";
        }
    } else {releaseBranch = core.getInput("releaseBranch")}
    
    // Create a deployment matrix for dev only

    if (github.context.ref.indexOf(releaseBranch) > -1) {
        // Create a deployment matrix for qa and prod (demo)
        let environment = {envName: "prod", confPath: confPath, forceCommit: "true", releaseType: githubReleases};
        environments.push(environment);
        // For QA create PR instead of deployment commit 
        environment = {envName: "qa", confPath: confPath, forceCommit: "false", releaseType: azureBlobReleases};
        environments.push(environment);

    } else {
        // Create a deployment matrix for dev only
        let environment = {envName: "dev", confPath: confPath, forceCommit: "true", releaseType: azureBlobReleases};
        environments.push(environment);
    }

    const matrix = JSON.stringify(environments);

    core.setOutput("matrix", matrix);

    console.log(`Deployment matrix is: ${matrix}`);

}
run().catch(error => core.setFailed(error.message));