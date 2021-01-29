import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    const downloadComment = 'Download artifact URL:'
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    let repoOrg = core.getInput("repoOrg");
    let artifactUrl = core.getInput("artifactUrl");
    let octokit = github.getOctokit(GITHUB_TOKEN);

    
    // let pattern = path.join(katalonProjectDir, "**/JUnit_Report.xml");
    // let files = await utils.findFiles(pattern);
    // let junitReportPath = files[0];

    console.log(artifactUrl);
    
    // const artiсatList = octokit.actions.listArtifactsForRepo({
    //     owner: repoOrg,
    //     repo: github.context.repo.repo
    //   });

    // console.log('artiсatList');

    let downloadUrlBody = downloadComment + artifactUrl;
    console.log(downloadUrlBody);

    let currentPr = await octokit.pulls.get({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number
    });

    console.log(currentPr.data.body);

    if (currentPr.data.body.includes(downloadComment)) { 
        // Replace existing artifact URL
        console.log('Link exists');
        currentPr.data.body.replace(/${downloadComment}\s*/, downloadUrlBody )
        console.log(currentPr.data.body);
    }
    else {
        // Add artifact URL if not exists
        console.log('Link does not exist');
        currentPr.data.body += '\n' + downloadUrlBody;
    }

    octokit.pulls.update({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
        body: currentPr.data.body
    })

    // octokit.pulls.createReview({
    //     owner: repoOrg,
    //     repo: github.context.repo.repo,
    //     pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
    //     body: body,
    //     event: "COMMENT"
    // });

}

run().catch(error => core.setFailed(error.message));