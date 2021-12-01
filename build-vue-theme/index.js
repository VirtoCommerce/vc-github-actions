const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');
const path = require('path');
const fs = require('fs');

async function restoreDependencies()
{
    await exec.exec('npm install');
    await exec.exec('npm run compress');
}

async function run()
{
    const releaseBranch = core.getInput("releaseBranch");
    let versionSuffix = "";
    let branchName = await utils.getBranchName(github);
    console.log(`Branch: ${branchName}`);
    await restoreDependencies();

    let artifactPath = await utils.findArtifact("artifacts/*.zip");
    console.log(artifactPath);
    let artifactFileName = artifactPath.split(path.sep).pop();
    console.log(artifactFileName);
    core.setOutput('artifactPath', artifactPath);
    core.setOutput('artifactName', artifactFileName);

// Alpha version should be created in any case except branchName is equal to releaseBranch
    if(branchName !== releaseBranch)
    {
        versionSuffix = `-${core.getInput("versionSuffix")}`;
        let artifactName = path.parse(artifactPath).name;
        let newArtifactName = `${artifactName}${versionSuffix}`;
        let newArtifactPath = artifactPath.replace(artifactName, newArtifactName);
        console.log(`Path: ${artifactPath}`);
        console.log(`New Path: ${newArtifactPath}`);
        fs.renameSync(artifactPath, newArtifactPath);

        core.setOutput('artifactPath', newArtifactPath);
        core.setOutput('artifactName', newArtifactPath.split(path.sep).pop());
    }
}

run().catch(err => core.setFailed(err.message));
