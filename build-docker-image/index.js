const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

async function prepareDockerfile(urls)
{
    for(let url in urls)
    {
        let filename = url.substring(url.lastIndexOf('/')+1);
        await utils.downloadFile(file, `artifacts/${filename}`);
    }
}

async function buildImage(imageName, tag)
{
    let repo = process.env.GITHUB_REPOSITORY.toLowerCase();
    let projectType = await utils.getProjectType();
    let imageName = `docker.pkg.github.com/${repo}/${projectType}`;
    core.setOutput("imageName", imageName);
    let command = `docker build artifacts --build-arg SOURCE=. --tag "${imageName}:${tag}"`;
    await exec.exec(command);
}

async function run()
{
    let branchName = await utils.getBranchName(github);
    if(branchName === 'master' || branchName === 'dev')
    {
        let dockerTag = core.getInput("tag");
        let imageName = core.getInput("imageName");
        let dockerfiles = core.getInput("dockerFiles");
        await prepareDockerfile(dockerfiles.split(";"));
        await buildImage(imageName, dockerTag)
    }
}

run().catch(err => core.setFailed(err.message));