const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const xml2js = require('xml2js');
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

let files = findFile(src, "module.manifest");
console.log(files);


let path = 'Directory.Build.Props';
if (!fs.existsSync(path)) {
    path = 'Directory.Build.props';
}

fs.readFile(path, function (err, data) {
    if (!err) {
        parser.parseString(data, function (err, json) {
            if (!err) {
                var propertyGroup = json.Project.PropertyGroup.pop();
                
                var prefix = propertyGroup.VersionPrefix[0].trim();
                var suffix = propertyGroup.VersionSuffix[0].trim();

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
