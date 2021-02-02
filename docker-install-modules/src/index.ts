import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as fs from 'fs'
import * as utils from '@virtocommerce/vc-actions-lib'
import * as yaml from 'js-yaml'

async function run(): Promise<void> {
    let manifestUrl = core.getInput("manifestUrl");
    let manifestFormat = core.getInput("manifestFormat");
    let modulesGroup = core.getInput("modulesGroup");
    let containerName = core.getInput("containerName");
    let containerDestiantion = core.getInput("containerDestination");
    let restartContainer = core.getInput("restartContainer") == 'true';

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
        let jsonString = yaml.load(fs.readFileSync(manifestPath, 'utf8')) as string;
        let doc = JSON.parse(jsonString);
        for(let module of doc['data']['modules.json']){
            let archivePath = path.join(modulesZipDir, `${module['Id']}.zip`);
            await utils.downloadFile(module['PackageUrl'], archivePath);
            await exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
        }
    }
}

run().catch(error => core.setFailed(error.message));