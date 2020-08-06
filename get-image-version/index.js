const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const { CONNREFUSED } = require('dns');
const { basename } = require('path');
const { Console } = require('console');
const parser = new xml2js.Parser();

const src = __dirname;

const baseDir = core.getInput('path');

function findFile(base, name, files, result) {
    var result = [];
    if (fs.existsSync(base)) {
        files = files || fs.readdirSync(base)
        result = result || []

        files.forEach(
            function (file) {
                var newBase = path.join(base, file)
                if (fs.statSync(newBase).isDirectory()) {
                    result = findFile(newBase, name, fs.readdirSync(newBase), result)
                }
                else {
                    if (file == name) {
                        result.push(newBase)
                    }
                }
            }
        )
    }
    return result;
}

function getPackage(packageJsonPath) {        
    let rawData = fs.readFileSync(packageJsonPath);
    let package = JSON.parse(rawData);
    return package;
}

function adjustPath(pathToAdjusting) {
    let result = pathToAdjusting;
    if(baseDir) {
        result = path.join(baseDir, pathToAdjusting);
    }
    return result;
}

function tryGetInfoFromPackageJson() {
    let result = false;
    let packageJsonPath = "package.json";    
    packageJsonPath = adjustPath(packageJsonPath);   
    console.log("package.json path: " + packageJsonPath);
    if(fs.existsSync(packageJsonPath))
    {
        let package = getPackage(packageJsonPath);
        prefix = package.version;
        result = true;
    }

    return result;
}

function tryGetInfoFromModuleManifest() {
    result = false;
    let pathToFind = "src";
    pathToFind = adjustPath(pathToFind);
    let files = findFile(pathToFind, "module.manifest");
    if (files.length > 0) {
        let manifestPath = files[0];
    
        fs.readFile(manifestPath, function (err, data) {
            if (!err) {
                parser.parseString(data, function (err, json) {
                    if (!err) {
                        moduleId = json.module.id[0].trim();
                        prefix = json.module.version[0].trim();
                        suffix = json.module["version-tag"][0].trim();
                        result = true;
                    }
                });
            }
            else {
                console.log(`Cannot load file ${manifestPath}`);
            }
        });
    }

    return result;
}

function tryGetInfoFromDirectoryBuildProps() {    
    let result = false;
    let buildPropsFile = 'Directory.Build.Props';
    buildPropsFile = adjustPath(buildPropsFile);
    if (!fs.existsSync(buildPropsFile)) {
        buildPropsFile = 'Directory.Build.props';
        buildPropsFile = adjustPath(buildPropsFile);
    }

    if(fs.existsSync(buildPropsFile)) {
        fs.readFile(buildPropsFile, function (err, data) {
            if (!err) {
                parser.parseString(data, function (err, json) {
                    if (!err) {

                        prefix = json.Project.PropertyGroup[1].VersionPrefix[0].trim();
                        suffix = json.Project.PropertyGroup[1].VersionSuffix[0].trim();

                        moduleId = "";
                        result = true;
                    }
                });
            }
            else {
                console.log(`Cannot load file ${buildPropsFile}`);
            }
        });
    }

    return result;
}

function pushOutputs(branchName, prefix, suffix, moduleId) {
    const sha = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha.substring(0, 8) : github.context.sha.substring(0, 8);
    const shortVersion = prefix + '-' + suffix;
    const tag = branchName + '-' + prefix + '-' + sha;
    const fullVersion = branchName + '-' + prefix + '-' + suffix;
    const taggedVersion = branchName + '-' + prefix + '-' + suffix+ '-' + sha;;

    core.setOutput("branchName", branchName);
    core.setOutput("prefix", prefix);
    core.setOutput("suffix", suffix);
    core.setOutput("moduleId", moduleId);
    core.setOutput("sha", sha);
    core.setOutput("shortVersion", shortVersion);
    core.setOutput("tag", tag);
    core.setOutput("fullVersion", fullVersion);
    core.setOutput("taggedVersion", taggedVersion);

    console.log(`Branch name is: ${branchName}`);
    console.log(`Version prefix is: ${prefix}`);
    console.log(`Version suffix is: ${suffix}`);
    console.log(`Module Id is: ${moduleId}`);
    console.log(`SHA is: ${sha}`);
    console.log(`Short version is: ${shortVersion}`);
    console.log(`Tag is: ${tag}`);
    console.log(`Full version is: ${fullVersion}`);
    console.log(`Tagged version is: ${taggedVersion}`);
}
async function getCommitCount(baseBranch) {
    try {
        let output = '';
        let err = '';

        // These are option configurations for the @actions/exec lib`
        const options = {};
        options.listeners = {
            stdout: (data) => {
                output += data.toString();
            },
            stderr: (data) => {
                err += data.toString();
            }
        };
        //options.cwd = './';

        //await exec.exec(`${src}/commit-count.sh`, [baseBranch], options);
        await exec.exec(`git rev-list --count ${baseBranch}`, [], options).then(exitCode => console.log(`git rev-list --count exitCode: ${exitCode}`));
        const commitCount = output.trim();

        if (commitCount) {
            console.log('\x1b[32m%s\x1b[0m', `${baseBranch} branch contain: ${commitCount} commits`);
            result = commitCount;
        } else {
            core.setFailed(err);
            process.exit(1);
        }
    } catch (err) {
        core.setFailed(`Could not get commit counts because: ${err.message}`);
        process.exit(1);
    }
    return result;
}

let prefix = "";
let suffix = "";
let moduleId = "";
let branchName = "";

// let files = findFile("src", "module.manifest");
if (tryGetInfoFromModuleManifest()) {}
else if(tryGetInfoFromPackageJson()) {}
else if (tryGetInfoFromDirectoryBuildProps()) {}
else {
    core.setFailed("No one info file was found");
}
branchName = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.ref : github.context.ref;
if (branchName.indexOf('refs/heads/') > -1) {
    branchName = branchName.slice('refs/heads/'.length);
}

if (suffix === "") {
    getCommitCount(branchName).then(result => { pushOutputs(branchName, prefix, `alpha.${result}`, moduleId); })
} else {
    pushOutputs(branchName, prefix, suffix, moduleId);
}