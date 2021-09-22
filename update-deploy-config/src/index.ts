import * as github from '@actions/github'
import * as core from '@actions/core'

import argoDeploy from './argoDeploy.json'

const githubToken = process.env['GITHUB_TOKEN'];

interface GitUser 
{
    name: string,
    email: string
}

interface RepoData
{
    repoOrg: string,
    repoName: string,
    branchName?: string,
    configPath?: string
}

async function run(): Promise<void> {
    
    if (!githubToken){
        core.setFailed('GITHUB_TOKEN environment variable not defined');
        return;
    }

    const repoName = core.getInput("repoName");
    const branchName = core.getInput("branchName");
    const artifactKey = core.getInput("artifactKey");
    const configPath = core.getInput("configPath");
    const gitUserName = core.getInput("gitUserName");
    const gitUserEmail = core.getInput("gitUserEmail");

    const octokit = github.getOctokit(githubToken);

    
    argoDeploy.artifactKey = artifactKey;

    try {
        const { data } = await octokit.rest.repos.createOrUpdateFileContents({
            repo: repoName,
            owner: github.context.repo.owner,
            path: configPath,
            branch: branchName,
            content: Buffer.from(JSON.stringify(argoDeploy)).toString("base64"),
            message: `Automated update ${configPath} deployment config`,
            committer:{
                name: gitUserName,
                email: gitUserEmail
            },
            author:{
                name: gitUserName,
                email: gitUserEmail
            },
        });
        console.log(data);
    } catch (error) {
        console.log(error);
    }
}

run().catch(error => core.setFailed(error.message));