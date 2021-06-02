const core = require('@actions/core');
const github = require('@actions/github');

const DEPENDENCIES_LABEL = 'dependencies';

async function run()
{
    console.log(github.context.payload.pull_request.labels);
    if (
        context.payload.pull_request.labels.some(
          (label) => label.name === DEPENDENCIES_LABEL
        )
      ){
        console.log(`Pull request contain "${DEPENDENCIES_LABEL}", SonarScanner steps skipped`);
    } else {
        
    }
}
run().catch(err => core.setFailed(err.message));