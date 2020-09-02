const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');
const path = require('path');
const fs = require('fs');

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
            process.exit(1);
        }
    } catch (err) {
        core.setFailed(`Could not get commit counts because: ${err.message}`);
        process.exit(1);
    }
    return result;
}

async function restoreDependencies()
{
    await exec.exec('npm install');
    await exec.exec('npm run postinstall');
}

async function buildTheme()
{
    await exec.exec('node node_modules/gulp/bin/gulp.js compress');
}

async function run()
{
    let versionSuffix = "";
    if(utils.getBranchName(github) === 'dev')
    {
        let commitNumber = await getCommitCount('dev');
        versionSuffix = `-alpha.${commitNumber}`;
    }

    await restoreDependencies();
    await buildTheme();

    if(utils.getBranchName(github) === 'dev')
    {
        let artifactPath = await utils.findArtifact("artifacts/*.zip");
        let artifactName = path.parse(artifactPath).name;
        let newArtifactName = `${artifactName}${versionSuffix}`;
        let newArtifactPath = artifactPath.replace(artifactName, newArtifactName);
        fs.renameSync(artifactPath, newArtifactPath);
    }
}

run().catch(err => core.setFailed(err.message));