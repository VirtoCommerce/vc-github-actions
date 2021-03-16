const core = require('@actions/core');
const exec = require('@actions/exec');

async function run()
{
    await exec.exec("dotnet tool install --global VirtoCommerce.GlobalTool --version 1.5.2-beta0006");
    await exec.exec("export PATH="$PATH:~/.dotnet/tools"");
}

run().catch(err => core.setFailed(err.message));
