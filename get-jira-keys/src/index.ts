import * as github from '@actions/github'
import * as core from '@actions/core'
import { release } from 'os';

const githubToken = process.env['GITHUB_TOKEN'];
const ref = github.context.ref;
const payload = github.context.payload;

const regex = /((([A-Z]+)|([0-9]+))+-\d+)/g;
const COMMITS_SEARCH_DEPTH :number = Number(core.getInput('searchDepth')); // Commit search history depth in days

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

async function getJiraKeysFromRelease() {
    try {
        console.log("Get Jira keys from from latest release");

        let resultArr: any = [];
        let commitsArr: any = [];
        let date = new Date();

        //Set commits search history depth
        date.setDate(date.getDate() - COMMITS_SEARCH_DEPTH);
        const sinceIsoString = date.toISOString();

        console.log(`Trying to search all commits in ${ref} brunch since ${sinceIsoString}`);

        const octokit = github.getOctokit(githubToken);

        const octokitResult = await octokit.rest.repos.listCommits({
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            sha: ref,
            since: sinceIsoString,
            per_page: 100,
        });

        commitsArr = octokitResult['data'];
//        console.log(JSON.stringify(commitsArr, null, '  '));

        for (let index = 0; index < commitsArr.length; index++) {
            const elementMessage = commitsArr[index]['commit']['message'];
            const elementDate = commitsArr[index]['commit']['committer']['date'];
            console.log(`${elementDate} - ${elementMessage}`)
        }

        // commitsArr.forEach((commit: any) => {
        //     let matchedKeys = matchKeys(commit.message);
        //     if (matchedKeys) {
        //         resultArr.push(matchedKeys);
        //     }
        // });

        return resultArr.join(',');
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function run(): Promise<void> {
    const release: boolean = core.getInput(`release`).includes(`true`);
    let result;
    switch (github.context.eventName) {
        case 'pull_request':
            result = await getJiraKeysFromPr();
            break;
        case 'push':
            if (release) {
                result = await getJiraKeysFromRelease();
            } else {
                result = await getJiraKeysFromPush();
            }
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