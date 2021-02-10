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
    let composeProjectName = core.getInput('composeProjectName');
    let envFileContent = `PLATFORM_IMAGE=${platformImage}\nSTOREFRONT_IMAGE=${storefrontImage}\nPLATFORM_DOCKER_TAG=${platformDockerTag}\nSTOREFRONT_DOCKER_TAG=${storefrontDockerTag}`;
    fs.writeFileSync('./.env', envFileContent);
    let composePath = path.join(__dirname, '../docker-compose.yml');
    await exec.exec(`docker-compose -p ${composeProjectName} -f ${composePath} --env-file ./.env up -d`);
}

run().catch(error => core.setFailed(error.message));