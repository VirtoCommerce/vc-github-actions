import * as github from '@actions/github'
import * as core from '@actions/core'
import * as matchAll from 'match-all'

const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;

async function matchKeys(commit: any) {
    let resultArr: any = [];
    const matches = matchAll(commit.message, regex).toArray();
    matches.forEach((match: any) => {
        if (resultArr.find((element: any) => element == match)) {
            // console.log(match + " is already included in result array");
        } else {
            // console.log(" adding " + match + " to result array");
            resultArr.push(match);
        }
    });
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
            let matchedKeys = matchKeys(item.commit);
            resultArr.push(matchedKeys);
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
            let matchedKeys = matchKeys(commit);
            resultArr.push(matchedKeys);
        });

        // console.log("parse-all-commits input val is false");
        // console.log("head_commit: ", payload.head_commit);
        // const matches = matchAll(payload.head_commit.message, regex).toArray();
        // const result = matches.join(',');
        // core.setOutput("jira-keys", result);

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
        console.log(`Detected issue's key: ${result}`)

        // Expose created issue's key as an output
        core.setOutput('jira-keys', result)
        return;
      }

      console.log('No issue keys found.')

}
run().catch(error => core.setFailed(error.message));