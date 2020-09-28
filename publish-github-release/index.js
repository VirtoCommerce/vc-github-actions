const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const path = require('path');
const os = require('os');
const fs = require('fs');
const utils = require('@krankenbro/virto-actions-lib');
const tc = require('@actions/tool-cache');
const { parseString } = require('xml2js');
const xmlParseString = require("xml2js").parseString;
const https = require('https')

async function installGithubRelease()
{
    const ghReleaseUrl = "github.com/github-release/github-release";
    await exec.exec(`go get ${ghReleaseUrl}`);
    process.env.PATH = `${process.env.PATH}:${process.env.HOME}/go/bin`;
    console.log(process.env.PATH);
    console.log(process.env.HOME);
}

async function getConfigHome()
{
    const xdg_home =  process.env['XDG_CONFIG_HOME'];
    if(xdg_home)
        return xdg_home;
    return `${os.homedir()}/.config`;
}

async function setupCredentials(user, pass)
{
    let githubCreds = `https://${user}:${pass}@github.com`;
    let configHome = await getConfigHome();
    await fs.mkdirSync(`${configHome}/git`, { recursive: true });
    await fs.writeFileSync(`${configHome}/git/credentials`, githubCreds, { flag: 'a', mode: 0o600 });

    await exec.exec('git', ['config', '--global', 'credential.helper', 'store']);
	await exec.exec('git', ['config', '--global', '--replace-all', 'url.https://github.com/.insteadOf', 'ssh://git@github.com/']);
	await exec.exec('git', ['config', '--global', '--add', 'url.https://github.com/.insteadOf', 'git@github.com:']);
}

async function run()
{
    const modulesJsonUrl = core.getInput("modulesJsonUrl");
    console.log(`modulesJsonUrl: ${modulesJsonUrl}`);
    const modulesJsonPath = "modules_v3.json";
    const modulesJsonFile = fs.createWriteStream(modulesJsonPath);
    https.get(modulesJsonUrl, function(response){
        response.pipe(modulesJsonFile);
    });
    let branchName = await utils.getBranchName(github);
    let customModuleDownloadUrl = "";
    let prereleasePackageUrl = "";
    let blobUrl = core.getInput("blobUrl");
    if(branchName === 'dev')
    {
        let blobUrlWithSAS = `${blobUrl}${process.env.BLOB_SAS}`;
        let artifactPath = await utils.findArtifact("artifacts/*.zip");
        console.log(artifactPath);
        
        let artifactFileName = artifactPath.split(path.sep).pop();
        console.log(artifactFileName);
        let downloadUrl = `${blobUrl}/${artifactFileName}`;
        console.log(`Download url: ${downloadUrl}`);
        core.setOutput("blobUrl", downloadUrl);
        await exec.exec(`azcopy10 copy ${artifactPath} ${blobUrlWithSAS}`, [], { ignoreReturnCode: true, failOnStdErr: false }).catch(reason => {
            console.log(reason);
            process.exit(1);
        }).then( exitCode => {
            if(exitCode != 0)
            {
                core.setFailed("azcopy failed");
                process.exit(exitCode);
            }
        });
        prereleasePackageUrl = downloadUrl;
        customModuleDownloadUrl = `-CustomModulePackageUri ${downloadUrl}`;
    } 
    else if(branchName === 'master')
    {
        await installGithubRelease();
        let orgName = process.env.GITHUB_REPOSITORY.split('/')[0];
        let changelog = core.getInput('changelog');
        let changelogFilePath = `artifacts/changelog.txt`;
        fs.writeFileSync(changelogFilePath, changelog);
        let releaseNotesArg = `-ReleaseNotes "${changelogFilePath}"`;
        await exec.exec(`vc-build Release -GitHubUser ${orgName} -GitHubToken ${process.env.GITHUB_TOKEN} -ReleaseBranch ${branchName} ${releaseNotesArg} -skip Clean+Restore+Compile+Test`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
            if(exitCode != 0 && exitCode != 422)
            {
                console.log(`vc-build Release exit code: ${exitCode}`);
            }
        });
    }

    let projectType = await utils.getProjectType();

    if((branchName === 'dev' || branchName === 'master') && projectType == 'module')
    {
        await exec.exec(`git config --global user.email "ci@virtocommerce.com"`);
        await exec.exec(`git config --global user.name "vc-ci"`);
        await setupCredentials('vc-ci', process.env.GITHUB_TOKEN);
        await exec.exec(`vc-build PublishModuleManifest ${customModuleDownloadUrl}`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
            console.log(`Exit code: ${exitCode}`);
            if(exitCode != 0 && exitCode != 423 && exitCode != 167)
            {
                core.setFailed("Failed to update modules.json");
            }
        }).catch(err => {
            console.log(`Error: ${err.message}`);
        });
        const repoName = await utils.getRepoName();
        const modulesJson = JSON.parse(fs.readFileSync(modulesJsonPath));
        let moduleId = "";
        let isModulesJsonUpdated = false;
        let manifestFile = await utils.findArtifact("artifacts/*/module.manifest");
        xmlParseString(fs.readFileSync(manifestFile), function(err, result) {
            moduleId = result.module.id[0];
        });

        for(let module of modulesJson)
        {
            if(module["Id"] === moduleId)
            {
                for(let versionInfo of module["Versions"])
                {
                    if(branchName === 'dev')
                    {
                        console.log(`${versionInfo["PackageUrl"]} == ${prereleasePackageUrl}`);
                        if(versionInfo["PackageUrl"] == prereleasePackageUrl)
                        {
                            isModulesJsonUpdated = true;
                        }
                    }
                    if(branchName === 'master')
                    {
                        xmlParseString(fs.readFileSync(manifestFile), function(err, result) {
                            if(versionInfo["Version"]===result.module.version[0] && !versionInfo["VersionTag"]){
                                isModulesJsonUpdated = true;
                            }
                        });
                    }
                }
            }
        }
        if(!isModulesJsonUpdated)
        {
            core.setFailed("modules.json has not been updated");
        }
    }
}

run().catch(error => {
	core.setFailed(error.message);
});