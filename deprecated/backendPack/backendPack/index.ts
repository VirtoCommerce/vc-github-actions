import * as tl from 'azure-pipelines-task-lib/task'
import * as fs from 'fs';
import * as path from 'path'

class Module {
    /**
     *
     */
    constructor(id: string, version:string) {
        this.Id = id;
        this.Version = version;
    }
    Id: string = "";
    Version: string = "";
}

class Manifest {
    PlatformVersion: string = ""
    ModuleSources: Array<string> = ["https://raw.githubusercontent.com/VirtoCommerce/vc-modules/master/modules_v3.json"];
    Modules: Array<Module> = [];
}

async function downloadArtifact(feed:string, name:string, version: string, path: string, organization: string, project: string) {
    let orgArg = `--organization "${organization}"`;
    let projectArg = `--project "${project}"`;
    let feedArg = `--feed "${feed}"`;
    let nameArg = `--name "${name}"`;
    let pathArg = `--path "${path}"`;
    let versionArg = `--version ${version}`;
    let exitCode = tl.execSync('az', `artifacts universal download ${orgArg} ${projectArg} --scope project ${feedArg} ${nameArg} ${pathArg} ${versionArg}`);
    console.log(`exitCode: ${exitCode.code}`);
}

async function convertManifest(srcPath:string, dstPath:string) {
    let manifestContent = await fs.readFileSync(srcPath as string);
    let jsonManifest = JSON.parse(manifestContent.toString());
    let platformVersion = jsonManifest.platform;
    let virtoModules = jsonManifest["virtoCommerce"];
    let dst = new Manifest;
    dst.PlatformVersion = platformVersion;
    for(let module of virtoModules){
        dst.Modules.push(new Module(module.name, module.version));
    }
    await fs.writeFileSync(dstPath, JSON.stringify(dst));
}

async function run() {
    try {
        let manifestPath = tl.getInput("manifestPath") ?? './packages.json';
        let platformPath = tl.getInput("platformPath") as string;
        let modulesPath = tl.getInput("modulesPath") as string;
        let organization = tl.getInput("organization") as string;
        let project = tl.getInput("project") as string;
        console.log(`manifestPath: ${manifestPath}`);
        let tmpPath = "./tmp";
        let vcbuildManifestPath = "./vc-package.json";
        if(!fs.existsSync(platformPath)) tl.mkdirP(platformPath);
        if(!fs.existsSync(modulesPath)) tl.mkdirP(modulesPath);
        if(!fs.existsSync(tmpPath)) tl.mkdirP(tmpPath);
        let feed = tl.getInput("feed") as string;
        
        await convertManifest(manifestPath, vcbuildManifestPath);

        let manifestContent = await fs.readFileSync(manifestPath as string);
        let jsonManifest = JSON.parse(manifestContent.toString());

        //install platform
        tl.execSync('vc-build', `cleartemp installplatform -PackageManifestPath ${vcbuildManifestPath} --root ${platformPath}`);
        
        for(let artifact of jsonManifest["custom"]){ // Install Custom modules
            let artifactFileName = `${artifact.name}_${artifact.version}.zip`;
            console.log(`Download artifact: ${artifactFileName}`);
            let artifactPath = path.join(tmpPath, artifactFileName);
            await downloadArtifact(feed, artifact.name, artifact.version, artifactPath, organization, project);
            tl.execSync('7z', `x ${artifactPath} -o${path.resolve(path.join(modulesPath, artifact.name))}`);
        }

        //Install Virto modules
        tl.execSync('vc-build', `InstallModules -PackageManifestPath ${vcbuildManifestPath} -DiscoveryPath ${modulesPath} -ProbingPath ${path.join(platformPath, "app_data", "modules")} -SkipDependencySolving -skip InstallPlatform`);

        tl.execSync('vc-build', `cleartemp`);
    }
    catch(err){
        tl.setResult(tl.TaskResult.Failed, err.message)
    }
}

run();