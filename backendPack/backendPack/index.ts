import * as tl from 'azure-pipelines-task-lib/task'
import * as fs from 'fs';
import * as path from 'path'

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

async function run() {
    try {
        let manifestPath = tl.getInput("manifestPath");
        let platformPath = tl.getInput("platformPath") as string;
        let modulesPath = tl.getInput("modulesPath") as string;
        let organization = tl.getInput("organization") as string;
        let project = tl.getInput("project") as string;
        console.log(`manifestPath: ${manifestPath}`);
        let tmpPath = "./tmp";
        if(!fs.existsSync(platformPath)) tl.mkdirP(platformPath);
        if(!fs.existsSync(modulesPath)) tl.mkdirP(modulesPath);
        if(!fs.existsSync(tmpPath)) tl.mkdirP(tmpPath);
        let feed = tl.getInput("feed") as string;

        let manifestContent = await fs.readFileSync(manifestPath as string);
        let jsonManifest = JSON.parse(manifestContent.toString());

        //install platform
        tl.execSync('vc-build', `cleartemp install -platform -version ${jsonManifest.platform} --root ${platformPath}`);
        
        for(let artifact of jsonManifest["custom"]){ // Install Custom modules
            let artifactFileName = `${artifact.name}_${artifact.version}.zip`;
            console.log(`Download artifact: ${artifactFileName}`);
            let artifactPath = path.join(tmpPath, artifactFileName);
            await downloadArtifact(feed, artifact.name, artifact.version, artifactPath, organization, project);
            tl.execSync('7z', `x ${artifactPath} -o${path.resolve(path.join(modulesPath, artifact.name))}`);
        }

        for(let artifact of jsonManifest["virtoCommerce"]){ //Install Virto modules
            tl.execSync('vc-build', `Install -module ${artifact.name} -version ${artifact.version} -DiscoveryPath ${modulesPath} -ProbingPath ${path.join(platformPath, "app_data", "modules")} -SkipDependencySolving -skip InstallPlatform`);
        }
        tl.execSync('vc-build', `cleartemp`);
    }
    catch(err){
        tl.setResult(tl.TaskResult.Failed, err.message)
    }
}

run();