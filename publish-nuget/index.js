const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run()
{
    exec.exec(`vc-build PublishPackages -ApiKey ${process.env.NUGET_KEY} -skip Clean+Restore+Compile+Test`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
        if(exitCode != 0 && exitCode != 409)
        {
            core.setFailed("Failed to publish nugets");
        }
    });
}

if(github.ref=='refs/heads/dev' || github.ref=='refs/heads/master')
{
    run().catch(err => core.setFailed(err.message));
}