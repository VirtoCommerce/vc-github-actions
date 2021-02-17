import * as core from '@actions/core'
import * as exec from '@actions/exec'
import path from 'path'

async function run(): Promise<void> {
    let host = core.getInput('host');
    let port = core.getInput('port');
    let user = core.getInput('user');
    let pass = core.getInput('password');
    let dumpUrl = core.getInput('dumpUrl');
    let dumpFile = path.join(__dirname, 'dump.sql');

    await exec.exec(`wget ${dumpUrl} -O ${dumpFile}`);
    await exec.exec(`sqlcmd -S tcp:${host},${port} -U ${user} -P ${pass} -i ${dumpFile}`);
}

run().catch(error => core.setFailed(error.message));