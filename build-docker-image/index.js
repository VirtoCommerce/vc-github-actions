const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const http = require('http');
const fs = require('fs');

let branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.ref : github.context.ref;
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}
const platformDockerfileUrl = "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/Dockerfile";
const waitScriptUrl = "https://github.com/VirtoCommerce/vc-docker/blob/master/linux/platform/wait-for-it.sh";
const storefrontDockerfileUrl = "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/storefront/Dockerfile";

async function getProjectType()
{
    let repoName = process.env.GITHUB_REPOSITORY.split("/")[1];
    let projectType = repoName.split("-")[1];
    return projectType;
}

async function downloadFile(url, outPath)
{
    const file = fs.createWriteStream(outPath);
    const request = http.get(url, function(response) {
        response.pipe(file);
    });
}

async function prepareDockerfile()
{
    let projectType = await getProjectType();
    if(projectType === 'platform')
    {
        await downloadFile(platformDockerfileUrl, "artifacts/Dockerfile");
        await downloadFile(waitScriptUrl, "artifacts/wait-for-it.sh");
    }
    else if(projectType === 'storefront')
    {
        await downloadFile(storefrontDockerfileUrl, "artifacts/Dockerfile")
    }
}

async function buildImage(tag)
{
    let repo = process.env.GITHUB_REPOSITORY.toLowerCase();
    let projectType = await getProjectType();
    let imageName = `docker.pkg.github.com/${repo}/${projectType}`;
    core.setOutput("imageName", imageName);
    let command = `docker build artifacts --build-arg SOURCE=. --tag "${imageName}:${tag}"`;
    await exec.exec(command);
}

async function run()
{
    await prepareDockerfile();
    let dockerTag = core.getInput("tag");
    await buildImage(dockerTag)
}

if(branchName === 'master' || branchName === 'dev')
{
    run().catch(err => core.setFailed(err.message));
}