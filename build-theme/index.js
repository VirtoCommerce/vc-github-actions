const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

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
    await restoreDependencies();
    await buildTheme();
}

run().catch(err => core.setFailed(err.message));