import * as core from '@actions/core'
import * as exec from '@actions/exec'
import path from 'path'

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function run(): Promise<void> {
    let host = core.getInput('host');
    let port = core.getInput('port');
    let user = core.getInput('user');
    let pass = core.getInput('password');
    let dumpUrl = core.getInput('dumpUrl');
    let dumpFile = path.join(__dirname, 'dump.sql');

    await exec.exec(`docker stop virtocommerce_vc-platform-web_1`);
    await exec.exec(`wget ${dumpUrl} -O ${dumpFile}`);
    await exec.exec(`sqlcmd -S tcp:${host},${port} -U ${user} -P ${pass} -i ${dumpFile}`);
    await exec.exec(`docker start virtocommerce_vc-platform-web_1`);
    await sleep(30000);
}

run().catch(error => core.setFailed(error.message));