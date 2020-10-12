const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

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
    const imageName = core.getInput("image").toLocaleLowerCase();
    const tag = core.getInput("tag").toLocaleLowerCase();
    const dockerUser = core.getInput("docker_user").toLocaleLowerCase();
    const dockerToken = core.getInput("docker_token").toLocaleLowerCase();
    const dockerHub = core.getInput("docker_hub").toLocaleLowerCase();
    const releaseBranch = core.getInput("release_branch").toLocaleLowerCase();
    const updateLatest = core.getInput("update_latest").toLocaleLowerCase();

    console.log('PushImage start')

    await pushImage(imageName, tag); //github
    
    console.log('PushImage done')
    
    let newTag = '';
    if (updateLatest === 'true')
    {
        if(branchName === releaseBranch)
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
            newTag = `${branchName.replaceAll('/','_')}-linux-latest`;
        }
        await changeTag(imageName, tag, newTag);
        console.log('changeTag done')
        await pushImage(imageName, newTag); //github
        console.log('push new tag done')
    }
    
    if(dockerHub === 'true')
    {
        //hub.docker
        let splitedImageName = imageName.split("/");
        let projectType = splitedImageName[splitedImageName.length-1];
        let dockerImageName = `${dockerUser}/${projectType}`;
        let dockerImageTag =  branchName === 'master' ? "linux-experimental" : "dev-linux-experimental"
        await renameImage(imageName, tag, dockerImageName, dockerImageTag);
        await dockerHubAuth(dockerUser, dockerToken);
        await pushImage(dockerImageName, dockerImageTag);
    }
}

run().catch(err => core.setFailed(err));