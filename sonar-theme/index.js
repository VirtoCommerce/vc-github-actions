const github = require('@actions/github');
const core = require('@actions/core');
const exec = require('@actions/exec');
const { runInContext } = require('vm');

let isPullRequest = github.context.eventName === 'pull_request';

let prArg = isPullRequest ? '-PullRequest' : '';
let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.base.ref : github.context.ref;
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}
let repoName = process.env.GITHUB_REPOSITORY.slice('VirtoCommerce/'.length);
let projectKey = process.env.GITHUB_REPOSITORY.replace('/', '_');

async function run()
{
    if(isPullRequest)
    {
        await exec.exec(`sonar-scanner -Dsonar.projectKey= -Dsonar.organization=virto-commerce -Dsonar.login=${process.env.SONAR_TOKEN} -Dsonar.host.url=https://sonarcloud.io -Dsonar.pullrequest.base=${github.context.payload.pull_request.base.ref} -Dsonar.pullrequest.branch=${github.context.payload.pull_request.title} -Dsonar.pullrequest.key=${github.context.payload.pull_request.number}`);
    } else {
        await exec.exec(`sonar-scanner -Dsonar.projectKey= -Dsonar.organization=virto-commerce -Dsonar.login=${process.env.SONAR_TOKEN} -Dsonar.host.url=https://sonarcloud.io -Dsonar.branch.name=${branchName}`);
    }
}

run().catch(err => {
    core.setFailed(err.message);
    process.exit(1);
});