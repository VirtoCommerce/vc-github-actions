const github = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');
const { runInContext } = require('vm');

async function run()
{
    const projectVersion = core.getInput("projectVersion");
    const branchTarget = core.getInput("branchTarget");

    const sonarLongLiveBranches = ["master","develop","dev"];

    let isPullRequest = await utils.isPullRequest(github);
    let isDependencies = await utils.isDependencies(github);

    let branchName = await utils.getBranchName(github);
    let repoName = await utils.getRepoName();
    let projectKey = process.env.GITHUB_REPOSITORY.replace('/', '_');
    let projectVersionArg = projectVersion ? `-Dsonar.projectVersion=${projectVersion}` : "";
    let branchTargetArg = sonarLongLiveBranches.includes(branchName) ? "" : `-Dsonar.branch.target=${branchTarget}`;

    if (isPullRequest && isDependencies) {
        console.log(`Pull request contain "dependencies" label, SonarScanner steps skipped.`);
        return;
    }

    if(isPullRequest)
    {
        let prTitle = github.context.payload.pull_request.title.split("\"").join("");
        await exec.exec(`sonar-scanner -Dsonar.projectKey=${projectKey} -Dsonar.projectName=${repoName} -Dsonar.organization=virto-commerce -Dsonar.login=${process.env.SONAR_TOKEN} ${projectVersionArg} -Dsonar.host.url=https://sonarcloud.io -Dsonar.pullrequest.base=\"${github.context.payload.pull_request.base.ref}\" -Dsonar.pullrequest.branch=\"${prTitle}\" -Dsonar.pullrequest.key=\"${github.context.payload.pull_request.number}\" -Dsonar.pullrequest.github.repository=\"${process.env.GITHUB_REPOSITORY}\" -Dsonar.pullrequest.provider=GitHub`);
    } else {
        await exec.exec(`sonar-scanner -Dsonar.projectKey=${projectKey} -Dsonar.projectName=${repoName} -Dsonar.organization=virto-commerce -Dsonar.login=${process.env.SONAR_TOKEN} ${projectVersionArg} -Dsonar.host.url=https://sonarcloud.io -Dsonar.branch.name=${branchName} ${branchTargetArg}`);
    }
}

run().catch(err => {
    core.setFailed(err.message);
});