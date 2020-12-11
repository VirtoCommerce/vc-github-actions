const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

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

String.prototype.replaceAll = function (find, replace) 
{
    return this.split(find).join(replace);
}

async function run()
{
    
    let isPullRequest = await utils.isPullRequest(github);
    let prArg = isPullRequest ? '-PullRequest' : '';
    let branchName = await utils.getBranchName(github);
    const imageName = core.getInput("image");
    const tag = core.getInput("tag");
    const dockerUser = core.getInput("docker_user");
    const dockerToken = core.getInput("docker_token");
    const dockerHub = core.getInput("docker_hub");
    const releaseBranch = core.getInput("release_branch");
    const updateLatest = core.getInput("update_latest").toLocaleLowerCase();

    await pushImage(imageName, tag); //github

    if (updateLatest === 'true')
    {
        let newTag = 'linux-latest';
        if(branchName !== releaseBranch)
        {
            newTag = `${branchName.replaceAll('/','_')}-linux-latest`;
        }
        await changeTag(imageName, tag, newTag);
        await pushImage(imageName, newTag); //github
    }
    
    if(dockerHub === 'true')
    {
        let splitedImageName = imageName.split("/");
        let projectType = splitedImageName[splitedImageName.length-1];
        let dockerImageName = `${dockerUser}/${projectType}`;
        let dockerImageTag =  releaseBranch.localeCompare(branchName) === 0 ? "latest" : "dev-linux-experimental";
        await renameImage(imageName, tag, dockerImageName, dockerImageTag);
        await dockerHubAuth(dockerUser, dockerToken);
        await pushImage(dockerImageName, dockerImageTag); //hub.docker
    }
}

run().catch(err => core.setFailed(err));