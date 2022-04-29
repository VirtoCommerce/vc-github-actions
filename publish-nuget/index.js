const core = require('@actions/core');
const exec = require('@actions/exec');

async function run()
{
    const skip = core.getInput('skipString');
    await exec.exec(`vc-build PublishPackages -ApiKey ${process.env.NUGET_KEY} -skip ${skip}`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
        if(exitCode != 0 && exitCode != 409)
        {
            core.setFailed("Failed to publish nugets");
        }
    });
}

run().catch(err => core.setFailed(err.message));