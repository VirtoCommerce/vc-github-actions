const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

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
    let result = messages.split(jiraTasksRegex).join("").split(mergeRegex).join("");
    console.log(result);
    result = result.replaceAll("\n", "<br />").replaceAll("\"", "").replaceAll("<br /><br />", "<br />");
    result = `&bull; ${result}`;
    result = result.replaceAll("<br />", "<br />&bull; ");
    return result;
}

String.prototype.replaceAll = function (find, replace) 
{
    return this.split(find).join(replace);
}

async function run()
{
    let latestRelease = await utils.getLatestRelease(process.env.GITHUB_REPOSITORY);
    let commitMessages = "";
    if(latestRelease != null)
    {
        commitMessages = await getCommitMessages(latestRelease.published_at);
        commitMessages = await cleanMessages(commitMessages);
    }

    console.log(commitMessages);
    core.setOutput("changelog", commitMessages);
}

run().catch(err => {
    core.setFailed(err.message);
});