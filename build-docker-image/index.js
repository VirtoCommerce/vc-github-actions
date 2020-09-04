const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@krankenbro/virto-actions-lib');

const platformDockerfileUrl = "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/platform/Dockerfile";
const waitScriptUrl = "https://github.com/VirtoCommerce/vc-docker/blob/master/linux/platform/wait-for-it.sh";
const storefrontDockerfileUrl = "https://raw.githubusercontent.com/VirtoCommerce/vc-docker/master/linux/storefront/Dockerfile";

async function prepareDockerfile()
{
    let projectType = await utils.getProjectType();
    if(projectType === 'platform')
    {
        await utils.downloadFile(platformDockerfileUrl, "artifacts/Dockerfile");
        await utils.downloadFile(waitScriptUrl, "artifacts/wait-for-it.sh");
    }
    else if(projectType === 'storefront')
    {
        await utils.downloadFile(storefrontDockerfileUrl, "artifacts/Dockerfile")
    }
}

async function buildImage(tag)
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
        await prepareDockerfile();
        let dockerTag = core.getInput("tag");
        await buildImage(dockerTag)
    }
}

run().catch(err => core.setFailed(err.message));