import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as utils from '@virtocommerce/vc-actions-lib'
import path from 'path';

async function run() {
    let token = core.getInput("githubToken");
    let login = core.getInput("login");
    let password = core.getInput("password");
    let catalogId = core.getInput("catalogId");
    let categoryId = core.getInput("categoryId");
    let platformUrl = core.getInput("platformUrl");
    let moduleId = core.getInput("moduleId");
    let moduleDesc =  core.getInput("moduleDescription");
    let projectUrl = core.getInput("projectUrl");
    let iconUrl = core.getInput("iconUrl");
    let scriptPath = path.join(__dirname, "..", "ps/update-catalog.ps1");
    let moduleTitle = moduleId.substr(moduleId.indexOf(".")+1);

    let manifestPathTemplate = "src/*/module.manifest";
    let manifests = await utils.findFiles(manifestPathTemplate);
    if(manifests.length > 0){
        let versionInfo = await utils.getInfoFromModuleManifest(manifests[0]);
        moduleTitle = versionInfo.title;
        moduleDesc = versionInfo.description;
        projectUrl = versionInfo.projectUrl;
        iconUrl = versionInfo.iconUrl;

        // moduleId: moduleId,
        // title: moduleTitle,
        // description: moduleDescription,
        // projectUrl: projectUrl,
        // iconUrl: iconUrl,
        // prefix: prefix,
        // suffix: suffix,
        // version: version.join("-")

    }

    let octo = github.getOctokit(token);
    let release = await octo.repos.getLatestRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    });
    let moduleUrl = release.data.assets[0].browser_download_url

    let moduleDescriptionArg = "";
    let projectUrlArg = "";
    let iconUrlArg = "";
    if(moduleDesc)
        moduleDescriptionArg = `-moduleDescription \"${moduleDesc}\"`;
    if(projectUrl)
        projectUrlArg = `-projectUrl \"${projectUrl}\"`;
    if(iconUrl)
        iconUrlArg = `-iconUrl \"${iconUrl}\"`;
    await exec.exec(`pwsh ${scriptPath} -apiUrl ${platformUrl} -hmacAppId ${login} -hmacSecret ${password} -catalogId ${catalogId} -categoryId ${categoryId} -moduleId ${moduleId} -moduleUrl ${moduleUrl} ${moduleDescriptionArg} ${projectUrlArg} ${iconUrlArg} -moduleTitle "${moduleTitle}"`);
    
}

run().catch(error => core.setFailed(error.message));