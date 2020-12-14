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
    let repoOrg = core.getInput("repoOrg")
    let katalonProjectDir = core.getInput("testProjectPath");
    let pattern = path.join(katalonProjectDir, "**/JUnit_Report.xml");
    let files = await utils.findFiles(pattern);
    let junitReportPath = files[0];
    let testResult = await getTestResult(junitReportPath);

    let body = `Test Suite: ${testResult.id}\nTests: ${testResult.tests}\nFailures: ${testResult.failures}\nErrors: ${testResult.errors}\nTime: ${testResult.time}\nTimestamp: ${testResult.timestamp}`;
    console.log(`Test results: ${body}`);
    let octokit = github.getOctokit(GITHUB_TOKEN);
    octokit.pulls.createReview({
        owner: repoOrg,
        repo: "vc-github-actions",
        pull_number: 46,
        body: body,
        event: "COMMENT"
    })
}

run().catch(error => core.setFailed(error.message));