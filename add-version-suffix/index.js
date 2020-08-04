const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

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

let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.ref : github.context.ref;
let customModuleDownloadUrl = ""
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}

async function run()
{
    const commitCount = await getCommitCount(branchName);
    await exec.exec(`vc-build ChangeVersion -CustomVersionSuffix alpha.${commitCount}`).then(exitCode => {
        if(exitCode != 0)
        {
            core.setFailed("vc-build ChangeVersion failed");
        }
    });
}

if(branchName === 'dev')
{
    run();
}