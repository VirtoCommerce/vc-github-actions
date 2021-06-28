import * as github from '@actions/github'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as utils from '@virtocommerce/vc-actions-lib'


async function commitChanges(projectType: string, path: string, newVersion: string, branchName: string): Promise<void> {
    let addPath:string;
    let gitCommand:string;

    switch (projectType)
    {
        case utils.projectTypeTheme:
            addPath = `${path}/package.json`;
            break;
        case utils.projectTypeModule:
            addPath = `${path}/Directory.Build.props ${path}/src/*/module.manifest`;
            break;
        default:
            addPath = `${path}/Directory.Build.props`;
            break;
    }

    try {
        gitCommand = `git add ${addPath}`;
        console.log(`Run command: ${gitCommand}`);
        await exec.exec(gitCommand);
    
        gitCommand = `git commit -m "Release version ${newVersion}"`;
        console.log(`Run command: ${gitCommand}`);
        await exec.exec(gitCommand);
    
        gitCommand = `git tag ${newVersion}`;
        console.log(`Run command: ${gitCommand}`);
        await exec.exec(gitCommand);
    
        gitCommand = `git push origin ${branchName}`;
        console.log(`Run command: ${gitCommand}`);
        await exec.exec(gitCommand);

    } catch (error) {
        core.setFailed(error);
    }
}

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    const versionLabel = core.getInput("versionLabel")
    let path = core.getInput("path");


    const branchName = await utils.getBranchName(github);
    const projectType = await utils.getProjectType();
    console.log(`Project type: ${projectType}`)

    let targetName:string;
    let oldVersion: string;
    let newVersion: string;

    path = path.replace(/\/+$/, ''); // remove trailing slashes

    try {
        oldVersion = (projectType === utils.projectTypeTheme) ? (await utils.getInfoFromPackageJson(`${path}/package.json`)).version : (await utils.getVersionFromDirectoryBuildProps(`${path}/Directory.Build.props`));
        console.log(`Previous version number: ${oldVersion}`)
    } catch (error) {
        core.setFailed(error);
    }

    switch (versionLabel.toLowerCase())
    {
        case "minor":
            targetName = "IncrementMinor";
            break;
        case "patch":
            targetName = "IncrementPatch";
            break;
    }

    await exec.exec(`vc-build ${targetName} -CustomVersionPrefix \"${oldVersion}\"`).then(exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("vc-build ChangeVersion failed");
        }
    });
    
    try {
        newVersion = (projectType === utils.projectTypeTheme) ? (await utils.getInfoFromPackageJson(`${path}/package.json`)).version : (await utils.getVersionFromDirectoryBuildProps(`${path}/Directory.Build.props`));
        console.log(`Current version number: ${newVersion}`);
    } catch (error) {
        core.setFailed(error);
    }

    commitChanges(projectType, path, newVersion, branchName)
}

run().catch(error => core.setFailed(error.message));