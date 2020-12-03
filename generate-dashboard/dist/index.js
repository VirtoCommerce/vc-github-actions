"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs = __importStar(require("fs"));
;
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const GITHUB_TOKEN = core.getInput("githubToken");
        const ORGANIZATION = core.getInput("organization");
        const PAGE_NAME = core.getInput("pageName");
        let octokit = github.getOctokit(GITHUB_TOKEN);
        let reposResponse = yield octokit.repos.listForOrg({
            org: ORGANIZATION,
            type: "all",
            per_page: 100,
            sort: "updated"
        });
        let table = "<table>";
        let repos = reposResponse.data;
        let workflowsArray = ["Module CI", "Platform CI", "Storefront CI", "Theme CI", "Build CI"];
        for (let repo of repos) {
            let workflows = yield octokit.actions.listRepoWorkflows({
                owner: ORGANIZATION,
                repo: repo.name
            });
            console.log(repo.name);
            if (workflows.data.total_count === 0) {
                continue;
            }
            for (let workflow of workflows.data.workflows) {
                if (workflowsArray.includes(workflow.name)) {
                    let tableRow = `<tr><td><a href="${repo.html_url}">${repo.name}</a></td><td>`;
                    let runs = yield octokit.actions.listWorkflowRuns({
                        owner: ORGANIZATION,
                        repo: repo.name,
                        workflow_id: workflow.id,
                        per_page: 1
                    });
                    tableRow += `<a href="${(_a = runs.data.workflow_runs[0]) === null || _a === void 0 ? void 0 : _a.html_url}"><img src="${workflow.badge_url}" /></a>`;
                    tableRow += "</td></tr>";
                    table += tableRow;
                }
            }
        }
        table += "</table>";
        let pagePath = `${__dirname}/${PAGE_NAME}`;
        fs.writeFileSync(pagePath, table);
        core.setOutput("result", pagePath);
    });
}
run().catch(error => core.setFailed(error.message));
