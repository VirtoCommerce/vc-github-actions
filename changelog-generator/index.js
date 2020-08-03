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

    const options = {};
    options.listeners = {
        stdout: (data) => {
            output += data.toString();
        },
        stderr: (data) => {
            err += data.toString();
        }
    };
    await exec.exec(`git log --pretty=format:"%s (%h)" --since="${since}"`, [], options).then(exitCode => console.log(`git log --pretty=format:"%s (%h)" --since exitCode: ${exitCode}`));
    const commitMessages = output.trim();
    return commitMessages;
}

async function cleanMessages(messages)
{
    let jiraTasksRegex = /^#*[A-Z]{2,5}-\d{2,4}:{0,1}\s*/mi;
    let mergeRegex = /^Merge.*$/mi;
    console.log(`Before: \n ${messages}`);
    let result = messages.split().join().replaceAll(jiraTasksRegex, "").toString().replace(mergeRegex, "");
    console.log(resuilt);
    result = result.replace("\n", "<br />").replace("\"", "").replace("<br /><br />", "<br />");
    result = "&bull; ${result}".replace("<br />", "<br />&bull; ");
    return result;
}

async function run()
{
    let releases = JSON.parse(core.getInput('releases_list'));
    let latestRelease = await getLatestRelease(releases);
    let commitMessages = await getCommitMessages(latestRelease.published_at);
    commitMessages = await cleanMessages(commitMessages);

    console.log(commitMessages);
    core.setOutput("changelog", commitMessages);
}

run();