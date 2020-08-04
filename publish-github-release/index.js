const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const glob = require('glob').Glob;
const path = require('path');
const { exit } = require('process');

let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.ref : github.context.ref;
let customModuleDownloadUrl = ""
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}
if(branchName === 'dev')
{
    let blobUrl = `https://vc3prerelease.blob.core.windows.net/packages${process.env.BLOB_SAS}`;
    let artifactPath = "";
    glob("artifacts/*.zip", (err, matches) => {
        if(err != null || matches.length < 1)
        {
            core.setFailed(err);
        }
        artifactPath = matches[0];
    });
    let artifactFileName = artifactPath.split(path.sep).pop();
    let downloadUrl = `https://vc3prerelease.blob.core.windows.net/packages/${artifactFileName}`;
    exec.exec(`azcopy10 copy ${artifactPath} ${blobUrl}`).then( exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("azcopy failed");
        }
    });
    customModuleDownloadUrl = `-CustomModulePackageUri ${downloadUrl}`;
} 
else if(branchName === 'master')
{
    let orgName = process.env.GITHUB_REPOSITORY.split('/')[0];
    let changelog = core.getInput('changelog');
    let releaseNotesArg = `-ReleaseNotes ${changelog}`;
    exec.exec(`vc-build Release -GitHubUser ${orgName} -GitHubToken ${process.env.GITHUB_TOKEN} -ReleaseBranch ${branchName} ${releaseNotesArg} -skip Clean+Restore+Compile+Test`).then(exitCode => {
        if(exitCode != 0 || exitCode != 422)
        {
            core.setFailed("Failed to release");
        }
    });
}

if(branchName === 'dev' || branchName === 'master')
{
    exec.exec(`vc-build PublishModuleManifest ${customModuleDownloadUrl}`).then(exitCode => {
        if(exitCode != 0 || exitCode != 423)
        {
            core.setFailed("Failed to update modules.json");
        }
    });
}