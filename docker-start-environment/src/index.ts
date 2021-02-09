import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'


// env:
//   PLATFORM_IMAGE: ${{ inputs.platformImage }}
//   STOREFRONT_IMAGE: ${{ inputs.storefrontImage }}
//   PLATFORM_DOCKER_TAG: ${{ inputs.platformDockerTag }}
//   STOREFRONT_DOCKER_TAG: ${{ inputs.storefrontDockerTag }}

async function run(): Promise<void> {
    let actionPath = core.getInput('actionPath');
    let platformImage = core.getInput('platformImage');
    let storefrontImage = core.getInput('storefrontImage');
    let platformDockerTag = core.getInput('platformDockerTag');
    let storefrontDockerTag = core.getInput('storefrontDockerTag');
    let envVarsArg = `-e PLATFORM_IMAGE=${platformImage} -e STOREFRONT_IMAGE=${storefrontImage} -e PLATFORM_DOCKER_TAG=${platformDockerTag} -e STOREFRONT_DOCKER_TAG=${storefrontDockerTag}`;
    let composePath = `${actionPath}/docker-compose.yml`;
    await exec.exec(`docker-compose up -f ${composePath} -d ${envVarsArg}`);
}

run().catch(error => core.setFailed(error.message));