import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import fs from 'fs'
import os from 'os'
import path from 'path'
import * as utils from '@virtocommerce/vc-actions-lib'

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

    if (!process.env.BLOB_SAS) {
        core.error(`Required BLOB_SAS parameter is empty. Step skipped.`);
        return;
    }

    let blobUrlWithSAS = `${blobUrl}${blobSAS}`;
    let artifactPath = await utils.findArtifact("artifacts/*.zip");
    console.log(artifactPath);
    
    let artifactFileName = artifactPath.split(path.sep).pop();
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
    console.log(`blobId is: ${artifactFileName}`);
    core.setOutput("blobId", artifactFileName);
}

run().catch(error => core.setFailed(error.message));