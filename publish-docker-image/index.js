const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

let isPullRequest = github.context.eventName === 'pull_request';

let prArg = isPullRequest ? '-PullRequest' : '';
let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.base.ref : github.context.ref;
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}

async function pushImage(image, tag)
{
    let command = `docker push ${image}:${tag}`;
    await exec.exec(command);
}

async function changeTag(image, oldTag, newTag)
{
    await renameImage(image, oldTag, image, newTag);
}

async function renameImage(oldName, oldTag, newName, newTag)
{
    let command = `docker tag ${oldName}:${oldTag} ${newName}:${newTag}`;
    await exec.exec(command);
}

async function dockerHubAuth(user, pass)
{
    await exec.exec(`docker login -u ${user} -p ${pass}`);
}

async function run()
{
    const imageName = core.getInput("imageName");
    const tag = core.getInput("tag");
    const dockerUser = core.getInput("docker_user");
    const dockerToken = core.getInput("docker_token");

    await pushImage(imageName, tag); //github
    
    let newTag = '';
    if(branchName === 'master')
    {
        newTag = 'linux-latest';
    }
    else if(isPullRequest)
    {
        let prNumber = github.context.payload.pull_request.number;
        newTag = `pr${prNumber}`;
    }
    else 
    {
        newTag = `${branchName}-linux-latest`;
    }
    await changeTag(imageName, tag, newTag);
    await pushImage(imageName, newTag); //github
    
    //hub.docker
    let splitedImageName = imageName.split("/");
    let projectType = splitedImageName[splitedImageName.length-1];
    let dockerImageName = `${dockerUser}/${projectType}`;
    let dockerImageTag =  branchName === 'master' ? "linux-experimental" : "dev-linux-experimental"
    await renameImage(imageName, tag, dockerImageName, dockerImageTag);
    await dockerHubAuth(dockerUser, dockerToken);
    await pushImage(newImageName, dockerImageTag);
}

run().catch(err => core.setFailed(err));