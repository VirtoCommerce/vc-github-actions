const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run()
{
    //vc-build SonarQubeEnd -SonarAuthToken ${{ secrets.SONAR_TOKEN }} -skip
    delete process.env.JAVA_TOOL_OPTIONS;
    process.env
    await exec.exec(`vc-build SonarQubeEnd -SonarAuthToken ${process.env.SONAR_TOKEN} -skip`)
}

run().catch(err => core.setFailed(err.message));