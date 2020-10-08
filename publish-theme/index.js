const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const path = require('path');
const utils = require('@krankenbro/virto-actions-lib');

async function run()
{
    let branchName = await utils.getBranchName(github);
    let artifactPath = await utils.findArtifact("artifacts/*.zip");
    console.log(artifactPath);
    let artifactFileName = artifactPath.split(path.sep).pop();
    console.log(artifactFileName);
    let blobUrl = `https://vc3prerelease.blob.core.windows.net/packages/${artifactFileName}`;
    console.log(`Blob url: ${blobUrl}`);
    core.setOutput('artifactPath', artifactPath);
    core.setOutput('artifactName', artifactFileName);
    blobUrl = `https://vc3prerelease.blob.core.windows.net/packages${process.env.BLOB_SAS}`;
    await exec.exec(`azcopy10 copy ${artifactPath} ${blobUrl}`).catch(err => {
        console.log(err.message);
        process.exit(1);
    }).then( exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("azcopy failed");
            process.exit(exitCode);
        }
    });

}

run().catch(err => core.setFailed(err.message));
