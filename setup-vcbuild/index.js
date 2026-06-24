const core = require('@actions/core');
const exec = require('@actions/exec');

async function run()
{
    await exec.exec("dotnet --list-sdks");
    await exec.exec('dotnet',
        ['tool', 'install', '--global', 'VirtoCommerce.GlobalTool', '--version', '3.1000.0',
         '--add-source', 'https://api.nuget.org/v3/index.json', '--ignore-failed-sources'],
        { cwd });
    core.addPath('/home/runner/.dotnet/tools/');
}

run().catch(err => core.setFailed(err.message));
