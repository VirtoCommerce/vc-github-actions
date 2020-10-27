const github = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');
const { runInContext } = require('vm');

async function run()
{
    let isPullRequest = await utils.isPullRequest(github);
    let branchName = await utils.getBranchName(github);
    let repoName = await utils.getRepoName();
    let projectKey = process.env.GITHUB_REPOSITORY.replace('/', '_');

    if(isPullRequest)
    {
        await exec.exec(`sonar-scanner -Dsonar.projectKey=${projectKey} -Dsonar.projectName=${repoName} -Dsonar.organization=virto-commerce -Dsonar.login=${process.env.SONAR_TOKEN} -Dsonar.host.url=https://sonarcloud.io -Dsonar.pullrequest.base=\"${github.context.payload.pull_request.base.ref}\" -Dsonar.pullrequest.branch=\"${github.context.payload.pull_request.title}\" -Dsonar.pullrequest.key=\"${github.context.payload.pull_request.number}\" -Dsonar.pullrequest.github.repository=\"${process.env.GITHUB_REPOSITORY}\" -Dsonar.pullrequest.provider=GitHub -Dsonar.branch=${branchName}`);
    } else {
        await exec.exec(`sonar-scanner -Dsonar.projectKey=${projectKey} -Dsonar.projectName=${repoName} -Dsonar.organization=virto-commerce -Dsonar.login=${process.env.SONAR_TOKEN} -Dsonar.host.url=https://sonarcloud.io -Dsonar.branch=${branchName}`);
    }
}

run().catch(err => {
    core.setFailed(err.message);
});