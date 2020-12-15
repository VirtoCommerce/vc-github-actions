const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const path = require('path');
const utils = require('@virtocommerce/vc-actions-lib');

async function run()
{
    const releaseBranch = core.getInput("release_branch").toLowerCase();
    let blobDest = core.getInput("blobUrl");
    let artifactPath = core.getInput("artifactPath");
    let artifactFileName = core.getInput("artifactName");
    let branchName = await utils.getBranchName(github);
    if(!artifactPath || !artifactFileName)
    {
        artifactPath = await utils.findArtifact("artifacts/*.zip");
        console.log(artifactPath);
        artifactFileName = artifactPath.split(path.sep).pop();
        console.log(artifactFileName);
    }
    core.setOutput("artifactPath", artifactPath);
    core.setOutput("artifactName", artifactFileName);
    let blobUrl = `${blobDest}/${artifactFileName}`;
    console.log(`Blob url: ${blobUrl}`);
    core.setOutput('blobUrl', blobUrl);
    if(branchName !== releaseBranch)
    {
        blobUrl = `${blobDest}${process.env.BLOB_SAS}`;
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
}

run().catch(err => core.setFailed(err.message));
