const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

async function run()
{
    let versionSuffix = core.getInput("versionSuffix");
    if(versionSuffix)
    {
        await exec.exec(`vc-build ChangeVersion -CustomVersionSuffix \"${versionSuffix}\"`).then(exitCode => {
            if(exitCode != 0)
            {
                core.setFailed("vc-build ChangeVersion failed");
            }
        });
    }

}

run().catch(err => {
    core.setFailed(err.message);
});