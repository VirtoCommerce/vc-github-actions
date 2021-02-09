import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as path from 'path'
import * as fs from 'fs'
import * as utils from '@virtocommerce/vc-actions-lib'
import * as yaml from 'yaml'
import Axios from 'axios'

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// function yamlToJson(yamlContent: string): Promise<string> {
//     return new Promise((resolve) => {
//         let result = yaml.load(yamlContent, {
//             json: true
//         }) as string;
//         resolve(result);
//     })
// }

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

function getTagFromUrl(url: string): string
{
    let splitted = url.split('/');
    return splitted[splitted.length - 2];
}

async function run(): Promise<void> {
    let manifestUrl = core.getInput("manifestUrl");
    let manifestFormat = core.getInput("manifestFormat");
    let modulesGroup = core.getInput("modulesGroup");
    let containerName = core.getInput("containerName");
    let containerDestination = core.getInput("containerDestination");
    let restartContainer = core.getInput("restartContainer") == 'true';
    let sleepAfterRestart = Number.parseInt(core.getInput("sleepAfterRestart"));
    let githubToken = core.getInput('githubToken');
    let githubUser = core.getInput('githubUser');

    let octokit = github.getOctokit(githubToken);

    let manifestPath = `./modules.${manifestFormat}`;
    await downloadFile(manifestUrl, manifestPath);
    let modulesDir = path.join(__dirname, 'Modules');
    let modulesZipDir = path.join(__dirname, 'ModulesZip');
    await fs.mkdirSync(modulesDir);
    await fs.mkdirSync(modulesZipDir);
    if(manifestFormat == 'json')
    {
        let jsonString = fs.readFileSync(manifestPath, 'utf8');
        let doc = JSON.parse(jsonString);
        for(let module of doc)
        {
            if(modulesGroup && !module['Groups'].includes(modulesGroup))
            {
                continue;
            }
            for(let moduleVersion of module.Version)
            {
                if(moduleVersion.VersionTag)
                {
                    continue;
                }
                let archivePath = path.join(modulesZipDir, `${module['Id']}.zip`);
                await downloadFile(moduleVersion['PackageUrl'], archivePath);
                await exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
            }
        }
    }
    else if(manifestFormat == 'yml')
    {
        let rawContent = fs.readFileSync(manifestPath);
        let json = yaml.parse(rawContent.toString());
        let modules = JSON.parse(json['data']['modules.json'] as string)
        for(let module of modules){
            if(module['Id'] == "VirtoCommerce.PageBuilderModule")
                continue;
            let archivePath = path.join(modulesZipDir, `${module['Id']}.zip`);
            let packageUrl = module['PackageUrl'];
            let moduleRepo = module['Repository'].split('/').pop() as string;
            console.log(packageUrl);
            let tag = getTagFromUrl(packageUrl);
            console.log(`owner: ${githubUser}; repo: ${moduleRepo}; tag: ${tag}`);
            let release = await octokit.repos.getReleaseByTag({
                owner: githubUser,
                repo: moduleRepo,
                tag: tag
            });
            
            let assetUrl = release.data.zipball_url as string;
            console.log(assetUrl);
            await downloadFile(assetUrl, archivePath);
            await exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
        }
    }
    await exec.exec(`chmod -R 777 ${modulesDir}`);
    await exec.exec(`docker cp ${modulesDir} ${containerName}:${containerDestination}`);
    if(restartContainer)
    {
        await exec.exec(`docker restart ${containerName}`);
        await sleep(sleepAfterRestart);
    }
}

run().catch(error => core.setFailed(error.message));