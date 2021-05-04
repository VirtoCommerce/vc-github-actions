const core = require('@actions/core');
const exec = require('@actions/exec');

async function run()
{
    await exec.exec("dotnet tool uninstall -g dotnet-sonarscanner");
    await exec.exec("dotnet tool install --global dotnet-sonarscanner --version 5.2.0")
    await exec.exec("dotnet tool install --global VirtoCommerce.GlobalTool --version 1.7.1-beta0002");
    core.addPath('/home/runner/.dotnet/tools/');
}

run().catch(err => core.setFailed(err.message));
