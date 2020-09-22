const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

async function run()
{
    let branchName = await utils.getBranchName(github);
    if(branchName === 'dev' || branchName === 'master')
    {
        await exec.exec(`vc-build PublishPackages -ApiKey ${process.env.NUGET_KEY} -skip Clean+Restore+Compile+Test`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
            if(exitCode != 0 && exitCode != 409)
            {
                core.setFailed("Failed to publish nugets");
            }
        });
    }
}

run().catch(err => core.setFailed(err.message));