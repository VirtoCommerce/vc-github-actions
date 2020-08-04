const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

if(github.ref=='refs/heads/dev' || github.ref=='refs/heads/master')
{
    exec.exec(`vc-build PublishPackages -ApiKey ${process.env.NUGET_KEY} -skip Clean+Restore+Compile+Test`).then(exitCode => {
        if(exitCode != 0 || exitCode != 409)
        {
            core.setFailed("Failed to publish nugets");
        }
    });
}