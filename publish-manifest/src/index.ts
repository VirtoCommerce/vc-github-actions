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

async function setupCredentials(user: string, pass: string)
{
    let githubCreds = `https://${user}:${pass}@github.com`;
    let configHome = await getConfigHome();
    await fs.mkdirSync(`${configHome}/git`, { recursive: true });
    await fs.writeFileSync(`${configHome}/git/credentials`, githubCreds, { flag: 'a', mode: 0o600 });

    await exec.exec('git', ['config', '--global', 'credential.helper', 'store']);
	await exec.exec('git', ['config', '--global', '--replace-all', 'url.https://github.com/.insteadOf', 'ssh://git@github.com/']);
	await exec.exec('git', ['config', '--global', '--add', 'url.https://github.com/.insteadOf', 'git@github.com:']);
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
    let customModulepackageUrl = packageUrl ? `-CustomModulePackageUri ${packageUrl}` : "";
    let gitUserEmail = core.getInput("gitUserEmail");
    let gitUserName = core.getInput("gitUserName");
    let githubToken = core.getInput("githubToken") ?? process.env.GITHUB_TOKEN;
    await exec.exec(`git config --global user.email "${gitUserEmail}"`);
    await exec.exec(`git config --global user.name "${gitUserName}"`);
    await setupCredentials(gitUserName,  githubToken);
    await exec.exec(`vc-build PublishModuleManifest ${customModulepackageUrl}`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
    console.log(`Exit code: ${exitCode}`);
    if(exitCode != 0 && exitCode != 423 && exitCode != 167)
    {
        core.setFailed("Failed to update modules.json");
    }
    }).catch(err => {
        console.log(`Error: ${err.message}`);
    });

    // const modulesJsonPath = "modules_v3.json";
    // await downloadFile(modulesJsonUrl, modulesJsonPath);
    // let modulesJsonRawContent = fs.readFileSync(modulesJsonPath).toString();
    // const modulesJson = JSON.parse(modulesJsonRawContent);
    // let moduleId = "";
    // let isModulesJsonUpdated = false;
    // let manifestFile = await utils.findArtifact("artifacts/*/module.manifest");
    // xmlParseString(fs.readFileSync(manifestFile), function(err: Error, result: any) {
    //     moduleId = result.module.id[0];
    // });

    // for(let module of modulesJson)
    // {
    //     if(module["Id"] === moduleId)
    //     {
    //         for(let versionInfo of module["Versions"])
    //         {
    //             if(branchName === 'dev')
    //             {
    //                 console.log(`${versionInfo["PackageUrl"]} == ${prereleasePackageUrl}`);
    //                 if(versionInfo["PackageUrl"] == prereleasePackageUrl)
    //                 {
    //                     isModulesJsonUpdated = true;
    //                 }
    //             }
    //             if(branchName === 'master')
    //             {
    //                 xmlParseString(fs.readFileSync(manifestFile), function(err, result) {
    //                     if(versionInfo["Version"]===result.module.version[0] && !versionInfo["VersionTag"]){
    //                         isModulesJsonUpdated = true;
    //                     }
    //                 });
    //             }
    //         }
    //     }
    // }
    // if(!isModulesJsonUpdated)
    // {
    //     core.setFailed("modules.json has not been updated");
    // }
}

run().catch(error => core.setFailed(error.message));