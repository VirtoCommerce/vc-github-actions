const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

async function run()
{
    let isPullRequest = await utils.isPullRequest(github);
    let isDependencies = await utils.isDependencies(github);

    if (isPullRequest && isDependencies) {
        console.log(`Pull request contain "dependencies" label, SonarScanner steps skipped.`);
        return;
    }

    delete process.env.JAVA_TOOL_OPTIONS;
    await exec.exec(`vc-build SonarQubeEnd -SonarAuthToken ${process.env.SONAR_TOKEN} -skip`)
}

run().catch(err => core.setFailed(err.message));