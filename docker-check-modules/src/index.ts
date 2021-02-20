import * as core from '@actions/core'
import * as exec from '@actions/exec'
import path from 'path'

async function run(): Promise<void>{
    let platformUrl = core.getInput("platformUrl");
    let user = core.getInput('login');
    let password = core.getInput('password');

    let scriptPath = path.join(__dirname, '..', 'scripts/check-installed-modules.ps1');
    await exec.exec(`pwsh ${scriptPath} -ApiUrl ${platformUrl} -Username ${user} -Password ${password}`);
}

run().catch(error => core.setFailed(error.message));