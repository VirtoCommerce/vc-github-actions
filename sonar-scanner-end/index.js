const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');
const fs = require('fs');

async function run()
{
    let isDependencies = await utils.isDependencies(github);

    if (isDependencies) {
         console.log(`Pull request contain "dependencies" label, SonarScanner steps skipped.`);
         return;
    }
    const emptyCoverageContent = '<coverage version="1"></coverage>';
    const coveragePath = './.tmp/coverage.xml'
    if(!fs.existsSync(coveragePath)){
        fs.writeFileSync(coveragePath, emptyCoverageContent);
    }
    delete process.env.JAVA_TOOL_OPTIONS;
    await exec.exec(`vc-build SonarQubeEnd -SonarAuthToken ${process.env.SONAR_TOKEN} -skip`)
}

run().catch(err => core.setFailed(err.message));