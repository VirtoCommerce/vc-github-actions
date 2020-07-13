const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path')
const xml2js = require('xml2js');
const { CONNREFUSED } = require('dns');
const parser = new xml2js.Parser();

const src = __dirname;

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

function pushOutputs(prefix, suffix, moduleId) {
    var branchName = '';
    var branchPrefix = '';

    if (github.context.eventName === 'pull_request') {
        sha = github.context.payload.pull_request.head.sha;
        branchName = github.context.payload.pull_request.head.ref;
        branchPrefix = 'PR-' + branchName;
    } else {
        branchName = github.context.ref;
    } 

    if (branchName.indexOf('/refs/heads/') > -1) {
        branchName = branchName.slice('/refs/heads/'.length);
    }

    version = branchPrefix + '-' + prefix + (suffix != '' ? '-' + suffix : '-' + getCommitCount(branchName) );
    
    core.setOutput("version", version);
    core.setOutput("moduleId", moduleId)
    
    console.log(`Version is: ${version}`);
    console.log(`Module Id is: ${moduleId}`);
}

let files = findFile("src", "module.manifest");
if (files.length > 0) {
    let manifestPath = files[0];
    
    fs.readFile(manifestPath, function (err, data) {
        if (!err) {
            parser.parseString(data, function (err, json) {
                if (!err) {
                    moduleId = json.module.id[0].trim();
                    prefix = json.module.version[0].trim();
                    suffix = json.module["version-tag"][0].trim();

                    pushOutputs(prefix, suffix, moduleId);
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

                    pushOutputs(prefix, suffix, "");
                }
            });
        }
        else {
            console.log(`Cannot load file ${buildPropsFile}`);
        }
    });
}
function getCommitCount(baseBranch) {
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
      options.cwd = './';
  
      exec.exec(`${src}/commit-count.sh`, [baseBranch], options);
      const { commitCount } = JSON.parse(output);
  
      if (commitCount) {
        console.log('\x1b[32m%s\x1b[0m', `${baseBranch} branch contain: ${commitCount} commits`);
        result = commitCount;
      } else {
        core.setFailed(err);
        process.exit(1);
      }
    } catch (err) {
      core.setFailed(`Could not get commit counts because: ${err.message}`);
      process.exit(0);
    }
    return result;
  }