const http = require('http');
const https = require('https');
const fs = require('fs');
const { request } = require("@octokit/request");
const glob = require('glob');
const xml2js = require('xml2js');

async function findArtifact(pattern)
{
    let globResult = glob.sync(pattern);
    console.log(globResult);
    return globResult[0];
}

async function getLatestRelease(repo)
{
    const repoUrl = `/repos/${repo}/releases`;
    const result = await request(`GET ${repoUrl}`, {
        headers: {
            authorization: process.env.GITHUB_TOKEN
        }
    });
    releases = result.data;
    console.log(releases);
    for(let release of releases)
    {
        if(!release.name.startsWith("v2") && release.prerelease === false)
        {
            return release;
        }
    }
    console.log("No github releases found");
    return null;
}

async function getBranchName(github)
{
    let branchName = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.ref : github.context.ref;
    if (branchName.indexOf('refs/heads/') > -1) {
        branchName = branchName.slice('refs/heads/'.length);
    }
    return branchName;
}

async function getRepoName()
{
    return process.env.GITHUB_REPOSITORY.split("/")[1];
}

async function getProjectType()
{
    let repoName = await getRepoName();
    let projectType = repoName.split("-")[1];
    return projectType;
}

async function downloadFile(url, outPath)
{
    const file = fs.createWriteStream(outPath);
    const request = (url.substr(0, 5) == 'https' ? https : http).get(url, function(response) {
        response.pipe(file);
    });
}

async function isPullRequest(github)
{
    return github.context.eventName === 'pull_request';
}

function getVersionFromDirectoryBuildProps(path) {
    return new Promise((resolve) => {
        let buildPropsFile = path;
    
        if (fs.existsSync(buildPropsFile)) {
            let propsFileContent = fs.readFileSync(buildPropsFile); 
            xml2js.parseString(propsFileContent, function (err, json) {
                if (!err) {
                    let prefix = (json.Project.PropertyGroup[1] || json.Project.PropertyGroup[0]).VersionPrefix[0].trim();
                    let suffix = (json.Project.PropertyGroup[1] || json.Project.PropertyGroup[0]).VersionSuffix[0].trim();
                    let result = [];
                    result.push(prefix);
                    if(suffix) result.push(suffix);
                    resolve(result.join("-"));
                } else {
                    console.log(err.message);
                    reject("");
                }
            });
        }
    });
}

module.exports.findArtifact = findArtifact;
module.exports.getLatestRelease = getLatestRelease;
module.exports.getBranchName = getBranchName;
module.exports.getRepoName = getRepoName;
module.exports.getProjectType = getProjectType;
module.exports.downloadFile = downloadFile;
module.exports.isPullRequest = isPullRequest;
module.exports.getVersionFromDirectoryBuildProps = getVersionFromDirectoryBuildProps;