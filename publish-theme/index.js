const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const glob = require('glob');

async function findArtifact(pattern)
{
    let globResult = glob.sync(pattern);
    console.log(globResult);
    return globResult[0];
}

async function run()
{
    let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.ref : github.context.ref;
    if (branchName.indexOf('refs/heads/') > -1) {
        branchName = branchName.slice('refs/heads/'.length);
    }
    let artifactPath = await findArtifact("artifacts/*.zip");
    console.log(artifactPath);
    let artifactFileName = artifactPath.split(artifactPath.sep).pop();
    console.log(artifactFileName);
    core.setOutput('artifactPath', artifactPath);
    core.setOutput('artifactName', artifactFileName);
    if(branchName === 'dev')
    {
        let blobUrl = `https://vc3prerelease.blob.core.windows.net/packages${process.env.BLOB_SAS}`;
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