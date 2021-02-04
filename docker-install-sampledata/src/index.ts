import * as github from '@actions/github'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as urils from '@virtocommerce/vc-actions-lib'

async function run(): Promise<void> {
    let sampledataUrl = core.getInput('sampleDataUrl');
    let platformUrl = core.getInput('platformUrl');
    let login = core.getInput('login');
    let password = core.getInput('password');

    let sampleDataArg = "";
    if(sampledataUrl)
    {
        sampleDataArg = `-SampleDataSrc ${sampledataUrl}`;
    }
    await exec.exec(`pwsh -File ./scripts/setup-sampledata.ps1 -ApiUrl ${platformUrl} ${sampleDataArg} -Username ${login} -Password ${password}`);
}

run().catch(error => core.setFailed(error.message));