import * as github from '@actions/github'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as utils from '@virtocommerce/vc-actions-lib'
import * as xml2js from 'xml2js'
import * as path from 'path'

//<testsuite name="DRAFT.Platform_Customer_Organization" tests="7" failures="0" errors="1" time="13.943" timestamp="2020-11-05 15:03:44" hostname="admin - FIX-PC" id="Test Suites/DRAFT/DRAFT.Platform_Customer_Organization">
interface TestResult {
    id: string,
    name: string,
    tests: number,
    failures: number,
    errors: number,
    time: string,
    timestamp: string,
    hostname: string
}

async function getTestResult(reportPath:string): Promise<TestResult> {
    return new Promise((resolve, reject) => {
        let junitContent = fs.readFileSync(reportPath);
        xml2js.parseString(junitContent, (error, result)=>{
            if(error)
            {
                reject(error);
            }
            let suite = result.testsuites.testsuite[0];
            resolve({
                id: suite.$.id,
                name: suite.$.name,
                tests: suite.$.tests,
                failures: suite.$.failures,
                errors: suite.$.errors,
                time: suite.$.time,
                timestamp: suite.$.timestamp,
                hostname: suite.$.hostname
            });
        });
    });
}

async function run(): Promise<void> {
    let GITHUB_TOKEN = core.getInput("githubToken");
    if(!GITHUB_TOKEN  && process.env.GITHUB_TOKEN !== undefined) GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    let repoOrg = core.getInput("repoOrg");
    let katalonProjectDir = core.getInput("testProjectPath");
    let publishComment = core.getInput("publishComment") === "true";
    let publishStatus = core.getInput("publishStatus") === "true";
    let pattern = path.join(katalonProjectDir, "**/JUnit_Report.xml");
    let files = await utils.findFiles(pattern);
    let junitReportPath = files[0];
    if(junitReportPath !== undefined)
    {
        let testResult = await getTestResult(junitReportPath);
        let body = `Test Suite: ${testResult.id}\nTests: ${testResult.tests}\nFailures: ${testResult.failures}\nErrors: ${testResult.errors}\nTime: ${testResult.time}\nTimestamp: ${testResult.timestamp}`;
        console.log(`Test results: ${body}`);
        let octokit = github.getOctokit(GITHUB_TOKEN);
        if(publishComment)
        {
            octokit.pulls.createReview({
                owner: repoOrg,
                repo: github.context.repo.repo,
                pull_number: github.context.payload.pull_request?.number ?? github.context.issue.number,
                body: body,
                event: "COMMENT"
            });
        }
        if(publishStatus)
        {
            octokit.repos.createCommitStatus({
                owner: repoOrg,
                repo: github.context.repo.repo,
                sha: process.env.GITHUB_SHA ?? github.context.sha,
                state: testResult.errors > 0 || testResult.failures > 0 ? "failure" : "success",
                context: "E2E Testing",
                description: `Tests: ${testResult.tests}. Failures: ${testResult.failures}. Errors: ${testResult.errors}`,
                target_url: `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}`
            });
        }
    } else {
        console.log("Katalon report is not found");
    }
}

run().catch(error => core.setFailed(error.message));