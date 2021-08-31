const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

async function run()
{
    let isPullRequest = await utils.isPullRequest(github);
    let SonarAuthToken = process.env.SONAR_TOKEN;

    let prArg = isPullRequest ? '-PullRequest' : '';
    let branchName = await utils.getBranchName(github);
    let repoName = await utils.getRepoName();
    let prBaseArg = "";
    let prBranchArg = "";
    let prKeyArg = "";
    let ghRepoArg = "";
    let prProviderArg = "";

    if (!SonarAuthToken) {
        core.error(`Required SONAR_TOKEN parameter is empty. Step skipped.`);
        return;
    }

    if(isPullRequest)
    {
        prBaseArg = `-SonarPRBase "${github.context.payload.pull_request.base.ref}"`;
        let prTitle = github.context.payload.pull_request.title.split("\"").join("");
        prBranchArg = `-SonarPRBranch \"${prTitle}\"`;
        prKeyArg = `-SonarPRNumber "${github.context.payload.pull_request.number}"`;
        ghRepoArg = `-SonarGithubRepo "${process.env.GITHUB_REPOSITORY}"`;
        prProviderArg = `-SonarPRProvider "GitHub"`
    }

    let sonarAuthArg = `-SonarAuthToken ${SonarAuthToken}`;
    let repoNameArg = `-RepoName ${repoName}`;

    await exec.exec(`vc-build SonarQubeStart -SonarBranchName ${branchName} ${prArg} ${sonarAuthArg} ${repoNameArg} ${prBaseArg} ${prBranchArg} ${prKeyArg} ${ghRepoArg} ${prProviderArg}`);
}

run().catch(err => core.setFailed(err.message));