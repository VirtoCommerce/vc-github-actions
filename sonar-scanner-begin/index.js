const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

let isPullRequest = github.context.eventName === 'pull_request';
let prArg = isPullRequest ? '-PullRequest' : '';
console.log(`github.context.eventName ${github.context.eventName} === pull _request ? ${github.context.eventName === 'pull_request'}`);
console.log(`${github.context.payload.pull_request} : ${github.context.ref}`);
let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.base.ref : github.context.ref;
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}
let repoName = process.env.GITHUB_REPOSITORY.slice('VirtoCommerce/'.length);
if(isPullRequest)
{
    process.env.CHANGE_TARGET = github.context.payload.pull_request.base.ref;
    process.env.CHANGE_TITLE = github.context.payload.pull_request.title;
    process.env.CHANGE_ID = github.context.payload.pull_request.number;
}
let SonarAuthToken = process.env.SONAR_TOKEN;
let sonarAuthArg = `-SonarAuthToken ${SonarAuthToken}`;
let repoNameArg = `-RepoName ${repoName}`;

console.log(`Debug: ${prArg} ${sonarAuthArg} ${repoNameArg} ${process.env.GITHUB_REPOSITORY} ${branchName} ${process.env.SONAR_TOKEN.length}`)

exec.exec(`vc-build SonarQubeStart ${prArg} ${sonarAuthArg} ${repoNameArg}`);