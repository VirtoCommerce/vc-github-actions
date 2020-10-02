import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as utils from '@krankenbro/virto-actions-lib'

// async function installGithubRelease()
// {
//     const ghReleaseUrl = "github.com/github-release/github-release";
//     await exec.exec(`go get ${ghReleaseUrl}`);
//     process.env.PATH = `${process.env.PATH}:${process.env.HOME}/go/bin`;
//     console.log(process.env.PATH);
//     console.log(process.env.HOME);
// }

async function run() {
    
    let blobUrl = core.getInput("blobUrl");
    let blobSAS = core.getInput("blobSAS") ?? process.env.BLOB_SAS;
    let blobUrlWithSAS = `${blobUrl}${blobSAS}`;
    let artifactPath = await utils.findArtifact("artifacts/*.zip");
    console.log(artifactPath);
    
    let artifactFileName = artifactPath.split(path.sep).pop();
    console.log(artifactFileName);
    let downloadUrl = `${blobUrl}/${artifactFileName}`;
    console.log(`Download url: ${downloadUrl}`);
    core.setOutput("blobUrl", downloadUrl);
    await exec.exec(`azcopy10 copy ${artifactPath} ${blobUrlWithSAS}`, [], { ignoreReturnCode: true, failOnStdErr: false }).catch(reason => {
        console.log(reason);
        process.exit(1);
    }).then( exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("azcopy failed");
            process.exit(exitCode);
        }
    });
    core.setOutput("packageUrl", downloadUrl);
}

// async function run() {
//     await installGithubRelease();
//     let orgName = process.env.GITHUB_REPOSITORY?.split('/')[0];
//     let changelog = core.getInput('changelog');
//     let changelogFilePath = `artifacts/changelog.txt`;
//     let branchName = await utils.getBranchName(github);
//     fs.writeFileSync(changelogFilePath, changelog);
//     let releaseNotesArg = `-ReleaseNotes "${changelogFilePath}"`;
//     await exec.exec(`vc-build Release -GitHubUser ${orgName} -GitHubToken ${process.env.GITHUB_TOKEN} -ReleaseBranch ${branchName} ${releaseNotesArg} -skip Clean+Restore+Compile+Test`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
//         if(exitCode != 0 && exitCode != 422)
//         {
//             console.log(`vc-build Release exit code: ${exitCode}`);
//         }
//     });
// }

run();