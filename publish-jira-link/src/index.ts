import * as github from "@actions/github";
import * as core from "@actions/core";

async function run(): Promise<void> {
    const GITHUB_TOKEN = core.getInput("githubToken") || process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        core.error(`Required GITHUB_TOKEN parameter is empty. Step skipped.`);
        return;
    }

    const repoOrg = core.getInput("repoOrg");
    const branchName = core.getInput("branchName");
    const baseUrl = core.getInput("baseURL");
    const downloadComment = core.getInput("downloadComment");
    const octokit = github.getOctokit(GITHUB_TOKEN);

    const jiraKeyRgx = /((([A-Z]+)|([0-9]+))+-\d+)/g;
    const jiraKeys = branchName.match(jiraKeyRgx) ?? [];

    if (jiraKeys.length === 0) {
        console.log("No Jira keys found inside PR branch name");
        return;
    }

    let currentPr = await octokit.pulls.get({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
    });

    let body = currentPr.data.body ?? "";

    const jiraLinks = jiraKeys.map((key) => baseUrl.concat(key));

    let caption = "";
    let publishString = "";

    if (jiraLinks.length === 1) {
        caption = downloadComment + " ";
        publishString = caption.concat(jiraLinks[0]);
    } else {
        //In case of plural replace last symbol to "s:" and add new line after caption
        caption = downloadComment.replace(downloadComment[downloadComment.length - 1], "s:\n");
        publishString = caption.concat(jiraLinks.join("\n"));
    }

    if (body.includes(downloadComment)) {
        body = body.replace(downloadComment, publishString);
    } else {
        body += "\n" + publishString;
    }

    octokit.pulls.update({
        owner: repoOrg,
        repo: github.context.repo.repo,
        pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
        body: body,
    });
}

run().catch((error) => core.setFailed(error.message));
