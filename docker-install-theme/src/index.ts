import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as utils from '@virtocommerce/vc-actions-lib'

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
} 

async function run(): Promise<void> {
    let artifactPath = core.getInput('artifactPath');
    let restartContainer = core.getInput('restartContainer') === 'true';
    let containerName = core.getInput('containerName');
    let containerDestination = core.getInput('containerDestination');

    artifactPath = path.join(__dirname, "theme.zip");
    await exec.exec(`wget https://vc3prerelease.blob.core.windows.net/packages/vc-demo-theme-b2b-1.10.0-alpha.1625.zip -O ${artifactPath}`);

    await exec.exec(`docker exec ${containerName} sh -c "rm -rf ${containerDestination}"`);
    let dirname = "theme"; //containerDestination.split(path.sep).pop();
    await exec.exec(`unzip ${artifactPath} -d ./${dirname}`);
    await exec.exec(`docker exec ${containerName} sh -c "mkdir -p ${containerDestination}"`)
    await exec.exec(`docker cp ./${dirname}/default/. ${containerName}:${containerDestination}`);
    await exec.exec(`docker exec ${containerName} sh -c "chmod -R 777 ${containerDestination}"`);
    await exec.exec(`docker exec ${containerName} sh -c "ls -al ${containerDestination}/templates"`);
    if(restartContainer)
    {
        await exec.exec(`docker restart ${containerName}`);
        await sleep(20000);
        await exec.exec('netstat -tulpn');
    }
    await exec.exec('docker ps -a');
}

run().catch(error => core.setFailed(error.message));