import * as github from '@actions/github'
import * as core from '@actions/core'


const githubToken = process.env['GITHUB_TOKEN'];
const ref = github.context.ref;
const payload = github.context.payload;

const COMMITS_SEARCH_DEPTH :number = Number(core.getInput('searchDepth')); // Commit search history depth in days
const SKIP_FIRST_RELEASE_COMMIT :number = 1; // Iterate commits array from a second value if first is release commit

function onlyUnique(value, index, self) {

    return self.indexOf(value) === index;
}

function matchKeys(msg: string) {
    console.log(`Parse commit message: ${msg}`)
    
    const jiraKeyRgx = /((([A-Z]+)|([0-9]+))+-\d+)/g;
    
    const matches = msg?.match(jiraKeyRgx);
    const result = matches?.filter(onlyUnique);
    
    return result;
}

function matchRelease(msg: string) {
    const releaseRgx = /([0-9]+)\.([0-9]+)\.([0-9])/g
    return releaseRgx.test(msg);
}

function initFirstArrIdx(msg: string) {
    let result = 0;
    if (matchRelease(msg)) {
        result = SKIP_FIRST_RELEASE_COMMIT;
    }
    return result;
}

async function getJiraKeysFromPr() {
    try {
        console.log("Get Jira keys from pull request");

        const octokit = github.getOctokit(githubToken);

        let jiraKeys: string[] = [];

        const { data: pr } = await octokit.rest.pulls.get({
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            pull_number: payload.number
        });

        const { data: commits } = await octokit.rest.pulls.listCommits({
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            pull_number: payload.number
        });

        [pr.body, ...commits.map(item => item.commit.message)].forEach((str) => {
            let matchedKeys = matchKeys(str);
            if (matchedKeys) {
                jiraKeys = jiraKeys.concat(matchedKeys);
            }
        });

        jiraKeys = jiraKeys?.filter(onlyUnique);

        return jiraKeys.join(',');
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function getJiraKeysFromPush() {
    try {
        console.log("Get Jira keys from Push");

        let jiraKeys: string[] = [];

        payload.commits.forEach((commit: any) => {
            let matchedKeys = matchKeys(commit.message);
            if (matchedKeys) {
                jiraKeys = jiraKeys.concat(matchedKeys);
            }
        });

        jiraKeys = jiraKeys?.filter(onlyUnique);

        return jiraKeys.join(',');
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function getJiraKeysFromRelease() {
    try {
        console.log("Get Jira keys for latest release");

        //Commits number contains 'release/x.x.x' message
        const releaseMsgNum = 1; 

        let jiraKeys: string[] = [];
        let commits: any = [];
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

        commits = octokitResult['data'];
        if (!commits) {  // Exit if no commits on push
            return[];
        }

        let releaseCount = 0;
        let firstArrayIdx = 0;

        
        firstArrayIdx = initFirstArrIdx(commits[0]['commit']['message']);
        
        if (firstArrayIdx !== 0) {
            console.log(`First commit contains '${commits[0]['commit']['message']}'. Commit skipped.`)
        }

        for (let index = firstArrayIdx; (index < commits.length) && (releaseCount < releaseMsgNum) ; index++) {

            const elementMessage = commits[index]['commit']['message'];

            if (matchRelease(elementMessage)) {
                releaseCount++;
            }

            let matchedKeys = matchKeys(elementMessage);
            if (matchedKeys) {
                jiraKeys = jiraKeys.concat(matchedKeys);
            }
        }

        jiraKeys = jiraKeys?.filter(onlyUnique);

        return jiraKeys.join(',');
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