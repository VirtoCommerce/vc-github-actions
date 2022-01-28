import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
    let myOutput = '';
    let myError = '';
    
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          myOutput += data.toString();
        },
        stderr: (data: Buffer) => {
          myError += data.toString();
        }
      }
    };
    const dockerTar = core.getInput('dockerTar')
    exec.exec('docker', ['load', '--input', dockerTar], options )
    console.log(myOutput);
    console.log(myError);
}

run().catch(error => core.setFailed(error.message));
