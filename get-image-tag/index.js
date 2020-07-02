const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const { CONNREFUSED } = require('dns');
const parser = new xml2js.Parser();

function findFile(base,name,files,result) 
{
    files = files || fs.readdirSync(base) 
    result = result || [] 

    files.forEach( 
        function (file) {
            var newbase = path.join(base,file)
            if ( fs.statSync(newbase).isDirectory() )
            {
                result = findFile(newbase,name,fs.readdirSync(newbase),result)
            }
            else
            {
                if ( file == name )
                {
                    result.push(newbase)
                } 
            }
        }
    )
    return result
}

let prefix = "";
let suffix = "";
let moduleId = "";

let files = findFile("src", "module.manifest");
if (files.length > 0) {
    let manifestPath = files[0];
    fs.readFile(manifestPath, function (err, data) {
        if (!err) {
            parser.parseString(data, function (err, json) {
                if (!err) {
                    console.log(json.module.id[0]);
                    console.log(json.module["version-tag"][0]);
                    console.log(json.module["version-tag"]);
                    moduleId = json.module.id[0].trim();
                    prefix = json.module.version[0];
                    suffix = json.module["version-tag"][0].trim();
                }
            });
        }
        else {
            console.log(`Cannot load file ${manifestPath}`);
        }
    });
}
else {
    let buildPropsFile = 'Directory.Build.Props';
    if (!fs.existsSync(buildPropsFile)) {
        buildPropsFile = 'Directory.Build.props';
    }
    
    fs.readFile(buildPropsFile, function (err, data) {
        if (!err) {
            parser.parseString(data, function (err, json) {
                if (!err) {
                    var propertyGroup = json.Project.PropertyGroup.pop();
                    
                    prefix = propertyGroup.VersionPrefix[0].trim();
                    suffix = propertyGroup.VersionSuffix[0].trim();
                }
            });
        }
        else {
            console.log(`Cannot load file ${buildPropsFile}`);
        }
    });
}

const sha = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;
const version = prefix + (suffix != '' ? '-' + suffix : '') + '-' + sha.substring(0, 8);
core.setOutput("sha", sha);                    
core.setOutput("tag", version);
core.setOutput("moduleId", moduleId)

console.log(`Version tag is: ${version}`);
console.log(`Head sha is: ${sha}`);
console.log(`Module Id is: ${moduleId}`);