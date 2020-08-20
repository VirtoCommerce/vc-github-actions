const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

let isPullRequest = await utils.isPullRequest(github);

let prArg = isPullRequest ? '-PullRequest' : '';
let branchName = await utils.getBranchName(github);
let repoName = await utils.getRepoName();
if(isPullRequest)
{
    process.env.CHANGE_TARGET = github.context.payload.pull_request.base.ref;
    process.env.CHANGE_TITLE = github.context.payload.pull_request.title;
    process.env.CHANGE_ID = github.context.payload.pull_request.number;
}
let SonarAuthToken = process.env.SONAR_TOKEN;
let sonarAuthArg = `-SonarAuthToken ${SonarAuthToken}`;
let repoNameArg = `-RepoName ${repoName}`;

async function run()
{
    await exec.exec(`vc-build SonarQubeStart ${prArg} ${sonarAuthArg} ${repoNameArg}`);
}

run().catch(err => core.setFailed(err.message));