const core = require('@actions/core');
const exec = require('@actions/exec');

async function run()
{
    await exec.exec("dotnet tool install --global VirtoCommerce.GlobalTool --version 1.7.2-beta0011");
    core.addPath('/home/runner/.dotnet/tools/');
}

run().catch(err => core.setFailed(err.message));
