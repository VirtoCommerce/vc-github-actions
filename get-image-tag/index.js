const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

String.isNullOrEmpty = function(value) {
    return !(typeof value === "string" && value.length > 0);
}

let path = 'Directory.Build.Props';
if (!fs.existsSync(path)) {
    path = 'Directory.Build.props';
}

fs.readFile(path, function (err, data) {
    if (!err) {
        parser.parseString(data, function (err, json) {
            if (!err) {
                var prefix = json.Project.PropertyGroup[1].VersionPrefix[0].trim();
                var suffix = json.Project.PropertyGroup[1].VersionSuffix[0].trim();

                sha = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;
        
                let version = prefix + (suffix != '' ? '-' + suffix : '') + '-' + sha.substring(0, 8);
        
                core.setOutput("tag", version);
                core.setOutput("sha", sha);
        
                console.log(`Version tag is: ${version}`);
                console.log(`Head sha is: ${sha}`);
            }
        });
    }
    else {
        console.log(`Cannot load file ${path}`);
    }
});
