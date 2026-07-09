const core = require('@actions/core');
const exec = require('@actions/exec');

async function run()
{
    const cwd = process.env.RUNNER_TEMP || os.homedir();
    
    await exec.exec("dotnet --list-sdks");
    await exec.exec('dotnet',
        ['tool', 'install', '--global', 'VirtoCommerce.GlobalTool', '--version', '3.1001.0-alpha.296',
         '--add-source', 'https://api.nuget.org/v3/index.json', '--ignore-failed-sources'],
        { cwd });
    core.addPath('/home/runner/.dotnet/tools/');
}

run().catch(err => core.setFailed(err.message));
