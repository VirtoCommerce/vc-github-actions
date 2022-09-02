import * as github from '@actions/github'
import * as core from '@actions/core'

import argoDeploy from './argoDeploy.json'
import cloudDeploy from './cloudDeploy.json'

const deployTypes = ['argoCD', 'cloud'];

const githubToken = process.env['GITHUB_TOKEN'];
const NOT_FOUND_ERROR_CODE = 404;

function initDeployConf() {
    argoDeploy.artifactKey = core.getInput("artifactKey");
    argoDeploy.deployRepo = core.getInput("deployRepo");
    argoDeploy.cmPath = core.getInput("cmPath");
    argoDeploy.dev.deployAppName = core.getInput("deployAppNameDev");
    argoDeploy.dev.deployBranch = core.getInput("deployBranchDev");
    argoDeploy.qa.deployAppName = core.getInput("deployAppNameQa");
    argoDeploy.qa.deployBranch = core.getInput("deployBranchQa");

    return argoDeploy;
}

function initcloudDeployConf() {
    cloudDeploy.artifactKey = core.getInput("artifactKey");
    cloudDeploy.deployRepo = core.getInput("deployRepo");
    cloudDeploy.dev.deployAppName = core.getInput("deployAppNameDev");
    cloudDeploy.dev.deployBranch = core.getInput("deployBranchDev");
    cloudDeploy.qa.deployAppName = core.getInput("deployAppNameQa");
    cloudDeploy.qa.deployBranch = core.getInput("deployBranchQa");
    cloudDeploy.prod.deployAppName = core.getInput("deployAppNameProd");
    cloudDeploy.prod.deployBranch = core.getInput("deployBranchProd");

    return cloudDeploy;
}

async function run(): Promise<void> {
    
    if (!githubToken){
        core.setFailed('GITHUB_TOKEN environment variable not defined');
        return;
    }

    const repoName = core.getInput("repoName");
    const branchName = core.getInput("branchName");
    const configPath = core.getInput("configPath");
    const gitUserName = core.getInput("gitUserName");
    const gitUserEmail = core.getInput("gitUserEmail");
    const deployType = core.getInput("deployType");

    if (deployTypes.indexOf(deployType) === -1) { 
        core.setFailed(`Invalid releaseSource. Input parameter releaseSource should contain: \x1b[0;32m${deployTypes.join(', ')}\x1b[0m. Actual value: \x1bs[0;31m${deployType}\x1b[0m.`);
        return;
    }

    const octokit = github.getOctokit(githubToken);

    var deployConf;
    switch (deployType) {
        case "argo":
            deployConf = initDeployConf();
            break;
        case "cloud":
            deployConf = initcloudDeployConf();
            break;
    }

    try {
        const deployConfStr = JSON.stringify(deployConf, null, '    ');

        let deployConfSha: string;
        try {
            console.log(`Try to get argoDeploy config content from ${repoName}/${branchName}/${configPath}`);
            //Get deployment config map content
            const { data: deployConfContent } = await octokit.rest.repos.getContent({
                repo: repoName,
                owner: github.context.repo.owner,
                path: configPath,
                ref: branchName,
            });
            deployConfSha = deployConfContent['sha'];
        } catch (error) {
            if (error.status !== NOT_FOUND_ERROR_CODE) {
                 core.setFailed(error.message);
                 return;
            }
            console.log(`File ${configPath} not found in ${repoName}/${branchName} repository branch.`);
            console.log(`Trying to create a new one.`);
        }
        console.log(`Push deploy config content to ${repoName}/${branchName}/${configPath}`);
        //Push deployment config map content to target directory
        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
            repo: repoName,
            owner: github.context.repo.owner,
            path: configPath,
            branch: branchName,
            content: Buffer.from(deployConfStr).toString("base64"),
            sha: deployConfSha,
            message: `ci: Updating ${configPath} deployment config`,
            committer:{
                name: gitUserName,
                email: gitUserEmail
            },
            author:{
                name: gitUserName,
                email: gitUserEmail
            },
        });
        console.log(`argoDeploy config successfully deployed to ${repoName}/${branchName}/${configPath}`);
    } catch (error) {
        console.log(error);
        core.setFailed(error);
    }
}

run().catch(error => core.setFailed(error.message));