const core = require('@actions/core');
const github = require('@actions/github');

async function run()
{
    console.log(github.context.payload.pull_request.labels);
}
run().catch(err => core.setFailed(err.message));