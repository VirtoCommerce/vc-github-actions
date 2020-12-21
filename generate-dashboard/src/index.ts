import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';

interface Workflow {
    id: number;
    node_id: string;
    name: string;
    path: string;
    state: string;
    created_at: string;
    updated_at: string;
    url: string;
    html_url: string;
    badge_url: string;
};

async function run(): Promise<void> {
    const GITHUB_TOKEN = core.getInput("githubToken");
    const ORGANIZATION = core.getInput("organization");
    const PAGE_NAME = core.getInput("pageName");
    let octokit = github.getOctokit(GITHUB_TOKEN);

    let reposResponse = await octokit.repos.listForOrg({
        org: ORGANIZATION,
        per_page: 100,
        sort: "pushed"
    });

    let timestamp = new Date().toUTCString();
    let table = `<p>Updated: ${timestamp}</p><table>`;
    let repos = reposResponse.data;

    for(let repo of repos)
    {
        let workflows = await octokit.actions.listRepoWorkflows({
            owner: ORGANIZATION,
            repo: repo.name
        });
        if(workflows.data.total_count === 0)
        {
            continue;
        }
        let tableRow = `<tr><td><a href="${repo.html_url}">${repo.name}</a></td><td>`;
        for(let workflow of workflows.data.workflows as Workflow[])
        {
            let runs = await octokit.actions.listWorkflowRuns({
                owner: ORGANIZATION,
                repo: repo.name,
                workflow_id: workflow.id,
                per_page: 1
            });
            tableRow += `<a href="${runs.data.workflow_runs[0]?.html_url}"><img src="${workflow.badge_url}" /></a>`;
        }
        tableRow += "</td></tr>";
        table += tableRow;
    }
    table += "</table>";
    
    let pagePath = `${__dirname}/${PAGE_NAME}`;
    fs.writeFileSync(pagePath, table);
    core.setOutput("result", pagePath);
}

run().catch(error => core.setFailed(error.message));