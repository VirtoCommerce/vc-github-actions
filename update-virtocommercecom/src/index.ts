import core from '@actions/core';
import exec from '@actions/exec';
import github from '@actions/github';
import path from 'path';

async function run() {
    let token = core.getInput("githubToken");
    let login = core.getInput("login");
    let password = core.getInput("password");
    let catalogId = core.getInput("catalogId");
    let categoryId = core.getInput("categoryId");
    let platformUrl = core.getInput("platformUrl");
    let moduleId = core.getInput("moduleId");
    let scriptPath = path.join(__dirname, "..", "ps/update-catalog.ps1");

    let octo = github.getOctokit(token);
    let release = await octo.repos.getLatestRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo
    });
    let moduleUrl = release.data.assets[0].browser_download_url

    await exec.exec(`pwsh ${scriptPath} -apiUrl ${platformUrl} -hmacAppId ${login} -hmacSecret ${password} -catalogId ${catalogId} -categoryId ${categoryId} -moduleId ${moduleId} -moduleUrl ${moduleUrl}`);
    
}

run().catch(error => core.setFailed(error.message));