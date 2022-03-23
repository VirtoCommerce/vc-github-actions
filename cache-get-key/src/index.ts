import * as github from '@actions/github'
import * as core from '@actions/core'

function getBranchName() {
    let branchName = '';

    if (github.context.eventName === 'pull_request'){
        branchName = github.context.payload.pull_request.head.ref;
    }
    else {
        branchName = github.context.ref;
    }

    if (branchName.indexOf('refs/heads/') > -1) {
        branchName = branchName.slice('refs/heads/'.length);
    }

    return branchName;
}

async function run(): Promise<void> {
    const runnerOs = core.getInput('runnerOs');
    const artifactName = core.getInput('artifactName');
    const sha = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.sha.substring(0, 8) : github.context.sha.substring(0, 8);
    const PR = github.context.eventName.startsWith('pull_request') ? `-PR-${github.context.payload.pull_request.number}` : '';
    
    let branchName = `-` + getBranchName();

    const shortKey = `${runnerOs}-${artifactName}${branchName}${PR}`;
    const fullKey = `${shortKey}-${sha}`;

    const dockerShortKey = `${shortKey}-docker`;
    const dockerFullKey = `${fullKey}-docker`;

    const packageShortKey = `${shortKey}-package`;
    const packageFullKey = `${fullKey}-package`;


    core.setOutput('shortKey', shortKey);
    core.setOutput('fullKey', fullKey);
    core.setOutput('dockerShortKey', dockerShortKey);
    core.setOutput('dockerFullKey', dockerFullKey);
    core.setOutput('packageShortKey', packageShortKey);
    core.setOutput('packageFullKey', packageFullKey);

    console.log(`shortKey: ${shortKey}`);
    console.log(`fullKey: ${fullKey}`);
    console.log(`dockerShortKey: ${dockerShortKey}`);
    console.log(`dockerFullKey: ${dockerFullKey}`);
    console.log(`packageShortKey: ${packageShortKey}`);
    console.log(`packageFullKey: ${packageFullKey}`);
}

run().catch(error => core.setFailed(error.message));
