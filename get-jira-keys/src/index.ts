import * as github from '@actions/github'
import * as core from '@actions/core'

const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function matchKeys(message: string) {
    console.log(`Parse commit message: ${message}`)
    const matches = message?.match(regex);
    const resultArr = matches?.filter(onlyUnique);
    return resultArr;
}

async function getJiraKeysFromPr() {
    try {
        console.log("Get Jira keys from pull request");

        const payload = github.context.payload;
        const githubToken = process.env['GITHUB_TOKEN'];

        const octokit = github.getOctokit(githubToken);
        let resultArr: any = [];

        const { data } = await octokit.rest.pulls.listCommits({
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            pull_number: payload.number
        });

        data.forEach((item: any) => {
            let matchedKeys = matchKeys(item.commit.message);
            if (matchedKeys) {
                resultArr.push(matchedKeys);
            }
        });

        return resultArr.join(',');
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function getJiraKeysFromPush() {
    try {
        console.log("Get Jira keys from Push");
        const payload = github.context.payload;
        let resultArr: any = [];

        payload.commits.forEach((commit: any) => {
            let matchedKeys = matchKeys(commit.message);
            if (matchedKeys) {
                resultArr.push(matchedKeys);
            }
        });

        return resultArr.join(',');
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function run(): Promise<void> {

    let result;
    switch (github.context.eventName) {
        case 'pull_request':
            result = await getJiraKeysFromPr();
            break;
        case 'push':
            result = await getJiraKeysFromPush();
            break;
            
        default:
            break;
    }

    if (result) {
        console.log(`Detected Jira keys: ${result}`)

        // Expose created Jira keys as an output
        core.setOutput('jira-keys', result)
        return;
      }

      console.log('No Jira keys found.')

}
run().catch(error => core.setFailed(error.message));