import * as github from '@actions/github'
import * as core from '@actions/core'

async function run(): Promise<void> {
    
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    let repoOrg = core.getInput("repoOrg");
    
    // let pattern = path.join(katalonProjectDir, "**/JUnit_Report.xml");
    // let files = await utils.findFiles(pattern);
    // let junitReportPath = files[0];
    
    let octokit = github.getOctokit(GITHUB_TOKEN);
    console.log('Get octokit');

    console.log(repoOrg);
    console.log(github.context.repo.repo);
    const artiсatList = octokit.actions.listArtifactsForRepo({
        owner: repoOrg,
        repo: github.context.repo.repo
      });

    // let artiсatList = await octokit.actions.listArtifactsForRepo({
    //     owner: repoOrg,
    //     repo: github.context.repo.repo
    //   });
    
    console.log('artiсatList');
    console.log(artiсatList);
    
    // let artiсatURL = octokit.actions.downloadArtifact({
    //     repoOrg,
    //     github.context.repo.repo,
    //     artifact_id,
    //     'zip'
    //   });
    
    let body = `Download artifact URL: `;
    // let body = `Download artifact URL: ${articatURL}`;
    // console.log(body);

    octokit.pulls.createReview({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
        body: body,
        event: "COMMENT"
    });
    console.log('PR');
}

run().catch(error => core.setFailed(error.message));