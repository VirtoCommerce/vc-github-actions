import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import fs from 'fs'
import os from 'os'
import * as utils from '@krankenbro/virto-actions-lib'
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

async function run(): Promise<void> {
    let packageUrl = core.getInput('packageUrl');
    let pushChanges = core.getInput("pushChanges");
    let modulesJsonName = core.getInput("modulesJsonName");
    let modulesJsonRepo = core.getInput("modulesJsonRepo");
    let customModulepackageUrl = packageUrl ? `-CustomModulePackageUri ${packageUrl}` : "";
    await exec.exec(`vc-build PublishModuleManifest ${customModulepackageUrl} -PushChanges ${pushChanges} -ModulesJsonRepoUrl ${modulesJsonRepo} -ModulesJsonName ${modulesJsonName}`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
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
        const modulesJsonFromRepoFileName = "modules_v3.json";
        let modulesJsonUrl = core.getInput("modulesJsonUrl");
        await downloadFile(modulesJsonUrl, modulesJsonFromRepoFileName);
        let modulesJsonRepoBuffer = fs.readFileSync(modulesJsonFromRepoFileName);
        let modulesJsonLocalBuffer = fs.readFileSync(modulesJsonPath);
        if(!modulesJsonRepoBuffer.equals(modulesJsonLocalBuffer))
        {
            console.log(`Buffers length(local, repo): ${modulesJsonLocalBuffer.length}, ${modulesJsonRepoBuffer.length}`);
            core.setFailed("modules.json has not been updated");
        }
    }
}

run().catch(error => core.setFailed(error.message));