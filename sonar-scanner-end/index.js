const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');

async function run()
{

    if (!process.env.SONAR_TOKEN) {
        core.error(`Required SONAR_TOKEN parameter is empty. Step skipped.`);
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