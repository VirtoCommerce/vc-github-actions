import * as core from '@actions/core'
import * as exec from '@actions/exec'
import fs from 'fs'
import * as utils from '@virtocommerce/vc-actions-lib'
import * as rimraf from 'rimraf'


async function cloneRepo(repoUrl: string, dest: string) {
    await exec.exec(`git clone ${repoUrl} ${dest}`, [], { failOnStdErr: false });
}

async function getModuleId() {
    let manifestPathTemplate = "**/*.Web/module.manifest";
    let manifests = await utils.findFiles(manifestPathTemplate);
    let manifestPath = manifests[0];
    let versionInfo = await utils.getInfoFromModuleManifest(manifestPath);
    return versionInfo.moduleId;
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
        let vcmodulesDir = "updated-vc-modules";
        let updatedModulesJsonPath = `${vcmodulesDir}/${modulesJsonName}`;
        await cloneRepo(modulesJsonRepo, vcmodulesDir);
        let modulesJsonRepoBuffer = fs.readFileSync(updatedModulesJsonPath);
        let modulesManifest = JSON.parse(modulesJsonRepoBuffer.toString());
        let propsPath = "Directory.Build.props";
        let moduleVersion = await utils.getVersionFromDirectoryBuildProps(propsPath);
        let isManifestUpdated = false;
        console.log(`Module version: ${moduleVersion}`);
        let moduleId = await getModuleId();
        console.log(`Module id: ${moduleId}`);
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

run().catch(error => {
    console.log(error.message);
    console.log("Retry");
    rimraf.sync("./artifacts/vc-modules");
    rimraf.sync("updated-vc-modules");
    run().catch(err => core.setFailed(err.message));
});