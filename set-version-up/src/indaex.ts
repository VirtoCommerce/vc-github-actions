import * as github from '@actions/github'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as utils from '@virtocommerce/vc-actions-lib'



async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    const versionLabel = core.getInput("versionLabel")
    let path = core.getInput("path");


    const projectType = await utils.getProjectType();
    console.log(`Project type: ${projectType}`)

    let targetName:string;
    let oldVersion: string;
    let newVersion: string;
    
    path = path.replace(/\/+$/, ''); // remove trailing slashes

    oldVersion = projectType === utils.projectTypeTheme ? (await utils.getInfoFromPackageJson(`${path}/package.json`)).version : (await utils.getInfoFromDirectoryBuildProps(`${path}/Directory.Build.props`)).prefix;
    console.log(`Previous version number: ${oldVersion}`)

    switch (versionLabel.toLowerCase())
    {
        case "minor":
            targetName = "IncrementMinor";
            break;
        case "patch":
            targetName = "IncrementPatch";
            break;
    }

    await exec.exec(`vc-build ${targetName} -CustomVersionPrefix \"1.0.0\"`).then(exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("vc-build ChangeVersion failed");
        }
    });
    
    newVersion = projectType === utils.projectTypeTheme ? (await utils.getInfoFromPackageJson(`${path}/package.json`)).version : (await utils.getInfoFromDirectoryBuildProps(`${path}/Directory.Build.props`)).prefix;
    console.log(`Current version number: ${newVersion}`)
}

run().catch(error => core.setFailed(error.message));