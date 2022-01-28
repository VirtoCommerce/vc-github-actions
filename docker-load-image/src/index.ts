import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
    let execOutput = '';
    let execError = '';
    
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          execOutput += data.toString();
        },
        stderr: (data: Buffer) => {
          execError += data.toString();
        }
      }
    };
    const dockerTar = core.getInput('dockerTar')
    await exec.exec('docker', ['load', '--input', dockerTar], options );
    if (execOutput) {
        const splittedOutput = execOutput.split(':',3);
        const image = splittedOutput[1].trim();
        const tag = splittedOutput[2].trim();

        core.setOutput('image', image);
        core.setOutput('tag', tag);

        console.log(`image: ${image}`);
        console.log(`tag: ${tag}`);

    }
}

run().catch(error => core.setFailed(error.message));
