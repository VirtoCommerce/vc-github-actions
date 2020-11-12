import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import fs from 'fs'
import os from 'os'
import * as utils from '@virtocommerce/vc-actions-lib'
import Axios from 'axios'
import { parseString as xmlParseString } from 'xml2js'

async function getConfigHome()
{
    const xdg_home =  process.env['XDG_CONFIG_HOME'];
    if(xdg_home)
        return xdg_home;
    return `${os.homedir()}/.config`;
}

async function downloadFile(url: string, outFile: string) {
    const path = outFile;
    const writer = fs.createWriteStream(path);
  
    const response = await Axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })
  
    response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
}

async function findModuleId(repoName: string, modulesManifest: any) {
    for(let module of modulesManifest)
    {
        for(let versionInfo of module.Versions)
        {
            if(versionInfo.PackageUrl.includes(`/${repoName}/`))
            {
                return module.Id;
            }
        }
    }
}

async function run(): Promise<void> {
    let packageUrl = core.getInput('packageUrl');
    let pushChanges = core.getInput("pushChanges");
    let modulesJsonName = core.getInput("modulesJsonName");
    let modulesJsonRepo = core.getInput("modulesJsonRepo");
    let customModulepackageUrl = packageUrl ? `-CustomModulePackageUri ${packageUrl}` : "";
    let skipParam = "";
    if(pushChanges !== "true")
    {
        skipParam = "-skip PublishManifestGit";
    }
    await exec.exec(`vc-build PublishModuleManifest ${customModulepackageUrl} -ModulesJsonRepoUrl ${modulesJsonRepo} -ModulesJsonName ${modulesJsonName} ${skipParam}`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
    console.log(`Exit code: ${exitCode}`);
    if(exitCode != 0 && exitCode != 423 && exitCode != 167)
    {
        core.setFailed("Failed to update modules.json");
    }
    }).catch(err => {
        console.log(`Error: ${err.message}`);
    });

    let modulesJsonPath =  await utils.findArtifact(`artifacts/*/${modulesJsonName}`);
    core.setOutput("modulesJsonPath", modulesJsonPath)

    // Check modules.json in repo
    if(pushChanges === "true")
    {
        let modulesJsonUrl = core.getInput("modulesJsonUrl");
        await downloadFile(modulesJsonUrl, modulesJsonName);
        let modulesJsonRepoBuffer = fs.readFileSync(modulesJsonName);
        let modulesManifest = JSON.parse(modulesJsonRepoBuffer.toString());
        let propsPath = "Directory.Build.props";
        let moduleVersion = await utils.getVersionFromDirectoryBuildProps(propsPath);
        let isManifestUpdated = false;
        let repoName = await utils.getRepoName();
        console.log(`Module version: ${moduleVersion}`);
        let moduleId = await findModuleId(repoName, modulesManifest);
        for(let module of modulesManifest)
        {
            if(moduleId === module.Id)
            {
                for(let versionInfo of module.Versions)
                {
                    let versionArr = [];
                    versionArr.push(versionInfo.Version);
                    if(versionInfo.VersionTag) versionArr.push(versionInfo.VersionTag);
                    let manifestVersion = versionArr.join("-");
                    console.log(`Module ${module.Id} found, version: ${manifestVersion}`);
                    if(moduleVersion === manifestVersion)
                    {
                        isManifestUpdated = true;
                    }
                }
            }
        }
        if(!isManifestUpdated)
        {
            core.setFailed(`${modulesJsonName} is not updated`);
        }
    }
}

run().catch(error => core.setFailed(error.message));