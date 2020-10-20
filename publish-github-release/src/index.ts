import * as github from '@actions/github'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as utils from '@krankenbro/virto-actions-lib'

async function installGithubRelease()
{
    const ghReleaseUrl = "github.com/github-release/github-release";
    await exec.exec(`go get ${ghReleaseUrl}`);
    process.env.PATH = `${process.env.PATH}:${process.env.HOME}/go/bin`;
    console.log(process.env.PATH);
    console.log(process.env.HOME);
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
}

run().catch(error => {
	core.setFailed(error.message);
});