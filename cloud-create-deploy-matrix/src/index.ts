import * as github from '@actions/github'
import * as core from '@actions/core'


async function run(): Promise<void> {

    let environments = [];
    const confPath = core.getInput("deployConfigPath");
    const releaseBranch = core.getInput("releaseBranch");
    
    // Create a deployment matrix for dev only
    let environment = {envName: "dev", confPath: confPath}
    environments.push(environment);

    if (github.context.ref.indexOf(releaseBranch) > -1) {
        // Create a deployment matrix for dev and prod (demo)
        let environment = {envName: "prod", confPath: confPath}
        environments.push(environment);
    }

    const matrix = environments.toString();

    core.setOutput("matrix", matrix);

    console.log(`Deployment matrix is: ${matrix}`);

}
run().catch(error => core.setFailed(error.message));