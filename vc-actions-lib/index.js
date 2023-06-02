const http = require('http');
const https = require('https');
const fs = require('fs');
const { request } = require("@octokit/request");
const glob = require('glob');
const xml2js = require('xml2js');

const projectTypeModule = "module";
const projectTypeTheme = "theme";
const projectTypePlatform = "platform";
const projectTypeStorefront = "storefront";

const DEPENDENCIES_LABEL = 'dependencies';

async function findArtifact(pattern)
{
    let globResult = glob.sync(pattern);
    console.log(globResult);
    return globResult[0];
}

async function findFiles(pattern)
{
    let globResult = glob.sync(pattern);
    console.log(globResult);
    return globResult;
}

async function getLatestRelease(repo)
{
    const repoUrl = `/repos/${repo}/releases`;
    const result = await request(`GET ${repoUrl}`, {
        headers: {
            authorization: 'token ' + process.env.GITHUB_TOKEN
        }
    });
   
    for (let release of result.data)
    {
        if(!release.name.startsWith("v2") && release.prerelease === false)
        {
            console.log(release);
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
    repoName = repoName.toLowerCase();

    if (repoName.includes(projectTypeModule)) {
        return projectTypeModule;
    }

    if (repoName.includes(projectTypeTheme)) {
        return projectTypeTheme;
    }

    if (repoName.includes(projectTypePlatform)) {
        return projectTypePlatform;
    }

    if (repoName.includes(projectTypeStorefront)) {
        return projectTypeStorefront;
    }
    return "Project type undefined";
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

async function isDependencies(github)
{
    if (github.context.eventName === 'pull_request') {
        return github.context.payload.pull_request.labels.some(
            (label) => label.name === DEPENDENCIES_LABEL
          );
    }
    return false;
}

function getVersionFromDirectoryBuildProps(path) {
    return new Promise((resolve) => {
        let buildPropsFile = path;
    
        if (fs.existsSync(buildPropsFile)) {
            let propsFileContent = fs.readFileSync(buildPropsFile); 
            xml2js.parseString(propsFileContent, function (err, json) {
                if (!err) {
                    const propertyGroup = json.Project.PropertyGroup;
                    const versionPrefix = propertyGroup.find(isVersion, {attributeName: "VersionPrefix"});
                    const versionSuffix = propertyGroup.find(isVersion, {attributeName: "VersionSuffix"});
                    var prefix = (versionPrefix.VersionPrefix) ? versionPrefix.VersionPrefix[0].trim() : undefined;
                    var suffix = (versionSuffix.VersionSuffix) ? versionSuffix.VersionSuffix[0].trim() : undefined;
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

function isVersion (element, index, array)
{
    return element.hasOwnProperty(this.attributeName);
}

function getInfoFromDirectoryBuildProps(path)
{
    return new Promise((resolve) => {
        let buildPropsFile = path;
    
        if (fs.existsSync(buildPropsFile)) {
            let propsFileContent = fs.readFileSync(buildPropsFile); 
            xml2js.parseString(propsFileContent, function (err, json) {
                if (!err) {
                    const propertyGroup = json.Project.PropertyGroup;
                    const versionPrefix = propertyGroup.find(isVersion, {attributeName: "VersionPrefix"});
                    const versionSuffix = propertyGroup.find(isVersion, {attributeName: "VersionSuffix"});
                    var prefix = (versionPrefix.VersionPrefix) ? versionPrefix.VersionPrefix[0].trim() : undefined;
                    var suffix = (versionSuffix.VersionSuffix) ? versionSuffix.VersionSuffix[0].trim() : undefined;

                    let version = [];
                    version.push(prefix);
                    if(suffix) version.push(suffix);
                    var result = {
                        prefix: prefix,
                        suffix: suffix,
                        version: version.join("-")
                    }
                    resolve(result);
                } else {
                    console.log(err.message);
                    reject(err);
                }
            });
        }
    });
}

function getInfoFromPackageJson(path) {
    return new Promise((resolve) => {
        let packageJsonPath = path;
                
        if (fs.existsSync(packageJsonPath)) {
            let buffer = fs.readFileSync(packageJsonPath);
            let package = JSON.parse(buffer.toString());
            let result = { 
                version: package.version
            };
            resolve(result);
        } else {
            let message = `${path} does not exists.`
            resolve(new Error(message));
        }
    });
}

function getInfoFromModuleManifest(path) {
    return new Promise((resolve) => {
        let manifestPath = path;

        fs.readFile(manifestPath, function (err, data) {
            if (!err) {
                xml2js.parseString(data, function (err, json) {
                    if (!err) {
                        let moduleId = json.module.id[0].trim();
                        let moduleDescription = "";
                        if(json.module.hasOwnProperty("description"))
                            moduleDescription = json.module.description[0];
                        let projectUrl = "";
                        if(json.module.hasOwnProperty("projectUrl"))
                            projectUrl = json.module.projectUrl[0];
                        let iconUrl = "";
                        if(json.module.hasOwnProperty("iconUrl"))
                            iconUrl = json.module.iconUrl[0];
                        let moduleTitle = "";
                        if(json.module.hasOwnProperty("title"))
                            moduleTitle = json.module.title[0];
                        let prefix = json.module.version[0].trim();
                        let suffix = "";
                        if(json.module["version-tag"] !== undefined && json.module["version-tag"])
                            suffix = json.module["version-tag"][0].trim();
                        let version = [];
                        version.push(prefix);
                        if(suffix) version.push(suffix);
                        var result = {
                            moduleId: moduleId,
                            title: moduleTitle,
                            description: moduleDescription,
                            projectUrl: projectUrl,
                            iconUrl: iconUrl,
                            prefix: prefix,
                            suffix: suffix,
                            version: version.join("-")
                        };
                        resolve(result);
                    } else {
                        reject(err);
                    }
                });
            } else {
                let message = `Cannot load file ${manifestPath}`;
                console.log(message);
                reject(new Error(message));
            }
        });
    });
}

module.exports.findArtifact = findArtifact;
module.exports.findFiles = findFiles;
module.exports.getLatestRelease = getLatestRelease;
module.exports.getBranchName = getBranchName;
module.exports.getRepoName = getRepoName;
module.exports.getProjectType = getProjectType;
module.exports.downloadFile = downloadFile;
module.exports.isPullRequest = isPullRequest;
module.exports.isDependencies = isDependencies;
module.exports.getVersionFromDirectoryBuildProps = getVersionFromDirectoryBuildProps;
module.exports.getInfoFromDirectoryBuildProps = getInfoFromDirectoryBuildProps;
module.exports.getInfoFromModuleManifest = getInfoFromModuleManifest;
module.exports.getInfoFromPackageJson = getInfoFromPackageJson;

module.exports.projectTypeModule = projectTypeModule;
module.exports.projectTypeTheme = projectTypeTheme;
module.exports.projectTypePlatform = projectTypePlatform;
module.exports.projectTypeStorefront = projectTypeStorefront;
