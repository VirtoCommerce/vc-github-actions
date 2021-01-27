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

    await exec.exec(`docker exec ${containerName} sh -c "rm -rf ${containerDestination}"`);
    let dirname = containerDestination.split(path.sep).pop();
    await exec.exec(`unzip ${artifactPath} -d ./${dirname}`);
    await exec.exec(`docker cp ./${dirname}/. ${containerName}:${containerDestination}`);
    if(restartContainer)
    {
        await exec.exec(`docker restart ${containerName}`);
        await sleep(30000);
        await exec.exec('docker restart virtocommerce_vc-storefront-web_1');
        await sleep(30000);
        await exec.exec('docker logs virtocommerce_vc-storefront-web_1');
        await sleep(90000);
        await exec.exec('netstat -tulpn');
        //wget http://example.com/page.php -qO-
        await exec.exec('wget http://localhost:8080 -qO-');
        await exec.exec('wget http://127.0.0.1:8080 -qO-');
    }
    await exec.exec('docker ps -a');
}

run().catch(error => core.setFailed(error.message));