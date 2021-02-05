import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void>{
    let platformUrl = core.getInput("platformUrl");
    let user = core.getInput('user');
    let password = core.getInput('password');

    await exec.exec(`pwsh ./scripts/check-installed-modules.ps1 -ApiUrl ${platformUrl} -Username ${user} -Password ${password}`);
}

run().catch(error => core.setFailed(error.message));