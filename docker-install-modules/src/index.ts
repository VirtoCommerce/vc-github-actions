import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import * as utils from '@virtocommerce/vc-actions-lib'
import * as yaml from 'js-yaml'

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function yamlToJson(yamlContent: string): Promise<string> {
    return new Promise((resolve) => {
        let result = yaml.load(yamlContent) as string;
        resolve(result);
    })
}

async function run(): Promise<void> {
    let manifestUrl = core.getInput("manifestUrl");
    let manifestFormat = core.getInput("manifestFormat");
    let modulesGroup = core.getInput("modulesGroup");
    let containerName = core.getInput("containerName");
    let containerDestination = core.getInput("containerDestination");
    let restartContainer = core.getInput("restartContainer") == 'true';
    let sleepAfterRestart = Number.parseInt(core.getInput("sleepAfterRestart"));

    let manifestPath = `modules.${manifestFormat}`;
    await utils.downloadFile(manifestUrl, manifestPath);
    let modulesJson;
    let modulesDir = __dirname + 'Modules';
    let modulesZipDir = __dirname + 'ModulesZip'
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
                await utils.downloadFile(moduleVersion['PackageUrl'], archivePath);
                await exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
            }
        }
    }
    else if(manifestFormat == 'yml')
    {
        let rawContent = fs.readFileSync(manifestPath, 'utf8');
        console.log(rawContent);
        let jsonString = await yamlToJson(rawContent);
        console.log(jsonString);
        let doc = await JSON.parse(jsonString);
        for(let module of doc['data']['modules.json']){
            let archivePath = path.join(modulesZipDir, `${module['Id']}.zip`);
            await utils.downloadFile(module['PackageUrl'], archivePath);
            await exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
        }
    }
    await exec.exec(`docker cp ./${modulesDir}/. ${containerName}:${containerDestination}`);
    if(restartContainer)
    {
        await exec.exec(`docker restart ${containerName}`);
        await sleep(sleepAfterRestart);
    }
}

run().catch(error => core.setFailed(error.message));