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
        type: "all",
        per_page: 100
    });

    let table = "<table>";
    let repos = reposResponse.data;
    repos.sort(function(a, b){
        return b.updated_at.localeCompare(a.updated_at);        
    });

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
            tableRow += `<a href="${workflow.url}"><img src="${workflow.badge_url}" /></a>`;
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