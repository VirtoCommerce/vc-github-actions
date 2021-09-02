const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

async function prepareDockerfile(urls)
{
    console.log(urls);
    for(let url of urls.split(';'))
    {
        if(url)
        {
            let filename = url.substring(url.lastIndexOf('/')+1);
            console.log(`Filename: ${filename}`);
            let outName = `artifacts/${filename}`;
            console.log(outName);
            await exec.exec(`cat ${outName}`);
            await utils.downloadFile(url, outName);
        }
    }
}

async function buildImage(imageName, tag)
{
    let repo = process.env.GITHUB_REPOSITORY.toLowerCase();
    let repoOwner = repo.split('/')[0];
    let imageFullName = `ghcr.io/${repoOwner}/${imageName}`;
    core.setOutput("imageName", imageFullName);
    let command = `docker build artifacts --build-arg SOURCE=. --tag "${imageFullName}:${tag}"`;
    await exec.exec(command);
}

async function run()
{
    let dockerTag = core.getInput("tag");
    let imageName = core.getInput("imageName");
    let dockerfiles = core.getInput("dockerFiles");
    if(!imageName)
    {
        imageName = await utils.getProjectType();
    }
    await prepareDockerfile(dockerfiles);
    await buildImage(imageName, dockerTag)
}

run().catch(err => core.setFailed(err.message));
