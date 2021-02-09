import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import path from 'path'
import fs from 'fs'

// env:
//   PLATFORM_IMAGE: ${{ inputs.platformImage }}
//   STOREFRONT_IMAGE: ${{ inputs.storefrontImage }}
//   PLATFORM_DOCKER_TAG: ${{ inputs.platformDockerTag }}
//   STOREFRONT_DOCKER_TAG: ${{ inputs.storefrontDockerTag }}

async function run(): Promise<void> {
    let platformImage = core.getInput('platformImage');
    let storefrontImage = core.getInput('storefrontImage');
    let platformDockerTag = core.getInput('platformDockerTag');
    let storefrontDockerTag = core.getInput('storefrontDockerTag');
    let envVarsArg = `-e PLATFORM_IMAGE=${platformImage} -e STOREFRONT_IMAGE=${storefrontImage} -e PLATFORM_DOCKER_TAG=${platformDockerTag} -e STOREFRONT_DOCKER_TAG=${storefrontDockerTag}`;
    let envFileContent = `PLATFORM_IMAGE=${platformImage}\nSTOREFRONT_IMAGE=${storefrontImage}\nPLATFORM_DOCKER_TAG=${platformDockerTag}\nSTOREFRONT_DOCKER_TAG=${storefrontDockerTag}`;
    fs.writeFileSync('./env_file', envFileContent);
    let composePath = path.join(__dirname, '../docker-compose.yml');
    await exec.exec(`docker-compose -f ${composePath} -f env_file up -d`);
}

run().catch(error => core.setFailed(error.message));