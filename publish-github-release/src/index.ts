import * as github from '@actions/github'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import path from 'path'
import * as utils from '@virtocommerce/vc-actions-lib'

async function installGithubRelease()
{
    const ghReleaseUrl = "github.com/github-release/github-release";
    await exec.exec(`go get ${ghReleaseUrl}`);
    process.env.PATH = `${process.env.PATH}:${process.env.HOME}/go/bin`;
    console.log(process.env.PATH);
    console.log(process.env.HOME);
}

async function getDownloadUrl() {
    
    const version = core.getInput("version");
    let result = "";
    if (version) {
        const ownerName = github.context.repo.owner;
        const repoName = github.context.repo.repo;
        const artifactPath = await utils.findArtifact("artifacts/*.zip");
        console.log(artifactPath);
        
        const artifactFileName = artifactPath.split(path.sep).pop();
        console.log(artifactFileName);
    
        const downloadUrl = `https://github.com/${ownerName}/${repoName}/releases/download/${version}/${artifactFileName}`;
        console.log(`Download url: ${downloadUrl}`);

        result = downloadUrl;

    } else {
        console.log("\x1b[33mWarning!\x1b[0m The download URL could not be generated because the version number is empty.")
    }

    return result;
}

async function run()
{
    const modulesJsonUrl = core.getInput("modulesJsonUrl");
    console.log(`modulesJsonUrl: ${modulesJsonUrl}`);
    
    let branchName = await utils.getBranchName(github);
    await installGithubRelease();
    let orgName = core.getInput("organization") ?? process.env.GITHUB_REPOSITORY?.split('/')[0];
    let changelog = core.getInput('changelog');
    let changelogFilePath = `artifacts/changelog.txt`;
    fs.writeFileSync(changelogFilePath, changelog);
    let releaseNotesArg = `-ReleaseNotes "${changelogFilePath}"`;
    await exec.exec(`vc-build Release -GitHubUser ${orgName} -GitHubToken ${process.env.GITHUB_TOKEN} -ReleaseBranch ${branchName} ${releaseNotesArg} -skip Clean+Restore+Compile+Test`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
        if(exitCode != 0 && exitCode != 422)
        {
            console.log(`vc-build Release exit code: ${exitCode}`);
        }
    });
    const downloadUrl = await getDownloadUrl();
    core.setOutput('downloadUrl',downloadUrl);
}

run().catch(error => {
	core.setFailed(error.message);
});