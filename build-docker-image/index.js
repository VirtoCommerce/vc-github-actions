const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

async function prepareDockerfile(urls)
{
    console.log(urls.toString());
    for(let url in urls)
    {
        if(url != 0)
        {
            let filename = url.substring(url.lastIndexOf('/')+1);
            console.log(`Filename: ${filename}`);
            let outName = `artifacts/${filename}`;
            console.log(outName);
            await utils.downloadFile(url, outName);
        }
    }
}

async function buildImage(imageName, tag)
{
    let repo = await utils.getRepoName();
    let imageFullName = `docker.pkg.github.com/${repo}/${imageName}`;
    core.setOutput("imageName", imageFullName);
    let command = `docker build artifacts --build-arg SOURCE=. --tag "${imageFullName}:${tag}"`;
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