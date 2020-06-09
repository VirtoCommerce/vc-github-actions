const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

String.isNullOrEmpty = function(value) {
    return !(typeof value === "string" && value.length > 0);
}



var prefix = '5.0.0';
var suffix = '';

sha = github.context.eventName === 'pull_request' ? github.context.payload.pull_request.head.sha : github.context.sha;

let version = prefix + (suffix != '' ? '-' + suffix : '') + '-' + sha.substring(0, 8);

core.setOutput("tag", version);
core.setOutput("sha", sha);

console.log(`Version tag is: ${version}`);
console.log(`Head sha is: ${sha}`);
