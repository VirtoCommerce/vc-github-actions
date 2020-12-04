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
        sort: "updated"
    });


    let table = `| Repo name | Workflow status | Runs at | Duration |\n`;
    table += `|---|---|---|---|\n`;
    let tableRow;
    let repos = reposResponse.data;

    let workflowsArray = ["Module CI", "Platform CI","Storefront CI", "Theme CI", "Build CI"]

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
     
        for(let workflow of workflows.data.workflows as Workflow[])
        {
            tableRow = `|[${repo.name}](${repo.html_url})|`;
            let runs = await octokit.actions.listWorkflowRuns({
                owner: ORGANIZATION,
                repo: repo.name,
                workflow_id: workflow.id,
                per_page: 1
            });
            
            tableRow += `[![Workflow badge](${workflow.badge_url})](${runs.data.workflow_runs[0]?.html_url})|${runs.data.workflow_runs[0]?.updated_at}|`;
            if (runs.data.workflow_runs[0]?.id)
            {
                let workflowUsage = await octokit.actions.getWorkflowRunUsage({
                    owner: ORGANIZATION,
                    repo: repo.name,
                    run_id: runs.data.workflow_runs[0]?.id
                    });
                    var date = new Date(workflowUsage.data.run_duration_ms);
                    var h = date.getHours();
                    var m = date.getMinutes();
                    var s = date.getSeconds();
                    tableRow += `${h * 60 + m}m ${s}s|\n`;
            }
            else 
            {
                tableRow += `|\n`;
            }
            table += tableRow;

        }
    }
    
    let pagePath = `${__dirname}/${PAGE_NAME}`;
    fs.writeFileSync(pagePath, table);
    core.setOutput("result", pagePath);
}

run().catch(error => core.setFailed(error.message));