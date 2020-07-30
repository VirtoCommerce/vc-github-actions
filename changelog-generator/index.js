const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const { exception } = require('console');

let orgName = process.env.GITHUB_REPOSITORY.split('/')[0];
let repoName = process.env.GITHUB_REPOSITORY.split('/')[1];

async function getLatestRelease(orgName, repoName)
{
    let octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    let releases =  (await octokit.repos.listReleases()).data;
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

let latestRelease = getLatestRelease(orgName, repoName);
let commitMessages = getCommitMessages(latestRelease.published_at);
core.setOutput("changelog", commitMessages);