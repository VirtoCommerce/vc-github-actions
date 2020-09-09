const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

async function run()
{
    let isPullRequest = await utils.isPullRequest(github);

    let prArg = isPullRequest ? '-PullRequest' : '';
    let branchName = await utils.getBranchName(github);
    let repoName = await utils.getRepoName();
    let prBaseArg = "";
    let prBranchArg = "";
    let prKeyArg = "";
    let ghRepoArg = "";
    let prProviderArg = "";
    if(isPullRequest)
    {
        prBaseArg = `-SonarPRBase "${github.context.payload.pull_request.base.ref}"`;
        prBranchArg = `-SonarPRBranch "${github.context.payload.pull_request.title}"`;
        prKeyArg = `-SonarPRNumber "${github.context.payload.pull_request.number}"`;
        ghRepoArg = `-SonarGithubRepo "${process.env.GITHUB_REPOSITORY}"`;
        prProviderArg = `-SonarPRProvider "GitHub"`
    }
    let SonarAuthToken = process.env.SONAR_TOKEN;
    let sonarAuthArg = `-SonarAuthToken ${SonarAuthToken}`;
    let repoNameArg = `-RepoName ${repoName}`;

    await exec.exec(`vc-build SonarQubeStart -SonarBranchName ${branchName} ${prArg} ${sonarAuthArg} ${repoNameArg} ${prBaseArg} ${prBranchArg} ${prKeyArg} ${ghRepoArg} ${prProviderArg}`);
}

run().catch(err => core.setFailed(err.message));