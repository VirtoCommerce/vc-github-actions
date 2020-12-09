const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const utils = require('@virtocommerce/vc-actions-lib');

function pushOutputs(branchName, prefix, suffix, moduleId) {
    branchName = branchName.substring(branchName.lastIndexOf('/') + 1, branchName.length).toLowerCase();
    const sha = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.sha.substring(0, 8) : github.context.sha.substring(0, 8);
    const fullSuffix = (suffix) ? suffix + '-' + branchName : branchName;
    const shortVersion = (suffix) ? prefix + '-' + suffix : prefix;
    const tag = prefix + '-' + branchName + '-' + sha;
    const fullVersion = prefix + '-' + fullSuffix;
    const taggedVersion = prefix + '-' + fullSuffix + '-' + sha;

    core.setOutput("branchName", branchName);
    core.setOutput("prefix", prefix);
    core.setOutput("suffix", suffix);
    core.setOutput("fullSuffix", fullSuffix);
    core.setOutput("moduleId", moduleId);
    core.setOutput("sha", sha);
    core.setOutput("shortVersion", shortVersion);
    core.setOutput("tag", tag);
    core.setOutput("fullVersion", fullVersion);
    core.setOutput("taggedVersion", taggedVersion);

    console.log(`Branch name is: ${branchName}`);
    console.log(`Version prefix is: ${prefix}`);
    console.log(`Version suffix is: ${suffix}`);
    console.log(`Version fullSuffix is: ${fullSuffix}`);
    console.log(`Module Id is: ${moduleId}`);
    console.log(`SHA is: ${sha}`);
    console.log(`Short version is: ${shortVersion}`);
    console.log(`Tag is: ${tag}`);
    console.log(`Full version is: ${fullVersion}`);
    console.log(`Tagged version is: ${taggedVersion}`);
}
async function getCommitCount(baseBranch) {
    try {
        let output = '';
        let err = '';

        // These are option configurations for the @actions/exec lib`
        const options = {};
        options.listeners = {
            stdout: (data) => {
                output += data.toString();
            },
            stderr: (data) => {
                err += data.toString();
            }
        };

        await exec.exec(`git rev-list --count ${baseBranch}`, [], options).then(exitCode => console.log(`git rev-list --count exitCode: ${exitCode}`));
        const commitCount = output.trim();

        if (commitCount) {
            console.log('\x1b[32m%s\x1b[0m', `${baseBranch} branch contain: ${commitCount} commits`);
            result = commitCount;
        } else {
            core.setFailed(err);
        }
    } catch (err) {
        core.setFailed(`Could not get commit counts because: ${err.message}`);
    }
    return result;
}

async function getProjectType()
{
    let propsExists = fs.existsSync("Directory.Build.props");
    let manifestExists = utils.findFiles("src/*/module.manifest").length > 0;
    if(!propsExists)
    {
        return "theme";
    }
    if(manifestExists)
    {
        return "module";
    }
    if(propsExists && !manifestExists)
    {
        return "platform"; //or storefront
    }
}


async function run() 
{
    const releaseBranch = core.getInput("releaseBranch");
    let prefix = "";
    let suffix = "";
    let moduleId = "";
    let branchName = "";
    let projectType = await getProjectType();
    let manifestPath = utils.findFiles("src/*/module.manifest")[0];
    switch(projectType) {
        case "theme":
            prefix = utils.getInfoFromPackageJson("package.json").version;
            break;
        case "module":
            let versionInfo = utils.getInfoFromModuleManifest(manifestPath);
            prefix = versionInfo.prefix;
            suffix = versionInfo.suffix;
            moduleId = versionInfo.moduleId;
            break;
        case "platform":
            let versionInfo = utils.getInfoFromDirectoryBuildProps("Directory.Build.props");
            prefix = versionInfo.prefix;
            suffix = versionInfo.suffix; 
            break;
    }

    branchName = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.ref : github.context.ref;
    if (github.context.eventName.startsWith('pull_request')){
        branchName = github.context.payload.pull_request.head.ref;
        suffix = 'pr-' + github.context.payload.pull_request.number;
    }
    else {
        branchName = github.context.ref;
    }

    if (branchName.indexOf('refs/heads/') > -1) {
        branchName = branchName.slice('refs/heads/'.length);
    }

    if (suffix === "" && releaseBranch !== branchName) {
        getCommitCount(branchName).then(result => { pushOutputs(branchName, prefix, `alpha.${result}`, moduleId); })
    } else {
        pushOutputs(branchName, prefix, suffix, moduleId);
    }
}

run().catch(err => core.setFailed(err.message));