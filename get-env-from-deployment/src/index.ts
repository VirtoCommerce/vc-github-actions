import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'yaml'
import Axios from 'axios'
import { tmpdir } from 'os'

async function downloadFile(url: string, outFile: string) {
    const path = outFile;
    const writer = fs.createWriteStream(path);
  
    const response = await Axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
          'Accept': 'application/octet-stream'
      }
    })
    
    response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
}

async function getModules(modules: any, tmpDir: string, modulesDir: string) {
    
    for(let module of modules){
        if(module['Id'] == "VirtoCommerce.PageBuilderModule")
            continue;
        let archivePath = path.join(tmpDir, `${module['Id']}.zip`);
        let packageUrl = module['PackageUrl'] as string;
        let isBlob = packageUrl.includes("windows.net/");
        let moduleRepo = module['Repository'].split('/').pop() as string;
        console.log(packageUrl);
        await downloadFile(packageUrl, archivePath);
        let moduleDstPath = `${modulesDir}/${module['Id']}`;
        console.log(`${module['Id']}\n${moduleDstPath}`);
        await extractArchive(archivePath, moduleDstPath);
    }
}

async function extractArchive(zip:string, out: string) {
    await exec.exec(`unzip ${zip} -d \"${out}\"`);
}

async function run(): Promise<void> {
    let platformDir = core.getInput("platformDir");
    let modulesDir = core.getInput("modulesDir");
    let storefrontDir = core.getInput("storefrontDir");
    let themeDir = core.getInput("themeDir");
    let manifestPath = `./modules.yaml`;
    let manifestUrl = core.getInput("deploymentUrl");
    await downloadFile(manifestUrl, manifestPath);

    let tmpDir = path.join(__dirname, 'tmp');
    await fs.mkdirSync(tmpDir);

    let rawContent = fs.readFileSync(manifestPath);
    let parsed = yaml.parseAllDocuments(rawContent.toString());
    let i = 0;
    let json: any;
    for(let p of parsed){
        let j = p.toJSON();
        if(j.hasOwnProperty("data")){
            if(j["data"].hasOwnProperty("modules.json")){
                json = j;
                break;
            }
        }
    }
    let  parsedJSON = JSON.parse(json);
    //platform
    console.log('Download platform');
    let platformUrl = parsedJSON['data']['PLATFORM_URL'];
    let platformZip = path.join(tmpDir, 'platform.zip');
    await downloadFile(platformUrl, platformZip);
    await extractArchive(platformZip, platformDir);
    //modules
    console.log('Download modules');
    let modules = parsedJSON['data']['modules.json'];
    await getModules(modules, tmpDir, modulesDir);
    //storefront
    console.log('Download storefront');
    let storefrontUrl = parsedJSON['data']['STOREFRONT_URL'];
    let storefrontZip = path.join(tmpDir, 'storefront.zip');
    await downloadFile(storefrontUrl, storefrontZip);
    await extractArchive(storefrontZip, storefrontDir);
    //theme
    console.log('Download theme');
    let themeUrl = parsedJSON['data']['THEME_URL'];
    let themeZip = path.join(tmpDir, 'theme.zip');
    await downloadFile(themeUrl, themeZip);
    await extractArchive(themeZip, themeDir);
}

run().catch(error => core.setFailed(error.message));
