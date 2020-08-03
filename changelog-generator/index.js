const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function getLatestRelease(releases)
{
    console.log(releases);
    for(let release of releases)
    {
        if(!release.name.startsWith("v2") && release.prerelease === false)
        {
            return release;
        }
    }
    throw new exception("No github releases found");
}

async function getCommitMessages(since)
{
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

    //await exec.exec(`${src}/commit-count.sh`, [baseBranch], options);
    await exec.exec(`git log --pretty=format:"%s (%h)" --since="${since}"`, [], options).then(exitCode => console.log(`git log --pretty=format:"%s (%h)" --since exitCode: ${exitCode}`));
    const commitMessages = output;
    return commitMessages;
}

let releases = core.getInput('releases_list');
let latestRelease = getLatestRelease(releases);
let commitMessages = getCommitMessages(latestRelease.published_at);
console.log(commitMessages);
core.setOutput("changelog", commitMessages);