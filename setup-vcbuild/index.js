const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run()
{
    await exec.exec("dotnet tool install --global VirtoCommerce.GlobalTool");
}

run().catch(err => core.setFailed(err.message));