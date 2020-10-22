const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');
const path = require('path');
const fs = require('fs');

async function restoreDependencies()
{
    await exec.exec('npm install');
    await exec.exec('npm run postinstall');
}

async function buildTheme()
{
    await exec.exec('node node_modules/gulp/bin/gulp.js compress');
}

async function run()
{
    const releaseBranch = core.getInput("release_branch");
    let versionSuffix = "";
    let branchName = await utils.getBranchName(github);
    console.log(`Branch: ${branchName}`);

    await restoreDependencies();
    await buildTheme();

// Alpha version should be created in any case except branchName is equal to releaseBranch
    if(branchName !== releaseBranch)
    {
        versionSuffix = `-${core.getInput("versionSuffix")}`;
        let versionPrefix = branchName.substring(branchName.lastIndexOf('/'),branchName.length).toLowerCase() + '-';
        let artifactPath = await utils.findArtifact("artifacts/*.zip");
        let artifactName = path.parse(artifactPath).name;
        let newArtifactName = `${versionPrefix}${artifactName}${versionSuffix}`;
        let newArtifactPath = artifactPath.replace(artifactName, newArtifactName);
        console.log(`Path: ${artifactPath}`);
        console.log(`New Path: ${newArtifactPath}`);
        fs.renameSync(artifactPath, newArtifactPath);
    }
}

run().catch(err => core.setFailed(err.message));