const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

async function getCommitCount(baseBranch) {
    let result;
    try {
        let output = '';
        let err = '';

        // These are option configurations for the @actions/exec lib`
        const options = {};
        options.listeners = {
            stdout: (data) => {
                output += data.toString();
            },
            stderr: (data) => {
                err += data.toString();
            }
        };
        //options.cwd = './';

        //await exec.exec(`${src}/commit-count.sh`, [baseBranch], options);f
        await exec.exec(`git rev-list --count ${baseBranch}`, [], options).then(exitCode => console.log(`git rev-list --count exitCode: ${exitCode}`));
        const commitCount = output.trim();

        if (commitCount) {
            console.log('\x1b[32m%s\x1b[0m', `${baseBranch} branch contain: ${commitCount} commits`);
            result = commitCount;
        } else {
            core.setFailed(err);
            process.exit(1);
        }
    } catch (err) {
        core.setFailed(`Could not get commit counts because: ${err.message}`);
        process.exit(1);
    }
    return result;
}

async function run()
{
    let branchName = await utils.getBranchName(github);
    let versionSuffix = core.getInput("versionSuffix");
    if(!versionSuffix)
    {
        const commitCount = await getCommitCount(branchName);
        versionSuffix = `alpha.${commitCount}`;
    }
    await exec.exec(`vc-build ChangeVersion -CustomVersionSuffix \"${versionSuffix}\"`).then(exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("vc-build ChangeVersion failed");
        }
    });

}

run().catch(err => {
    core.setFailed(err.message);
});