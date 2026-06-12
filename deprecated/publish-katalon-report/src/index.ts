import * as github from '@actions/github'
import * as core from '@actions/core'
import * as fs from 'fs'
import * as utils from '@virtocommerce/vc-actions-lib'
import * as xml2js from 'xml2js'
import * as path from 'path'

interface TestResult {
    id: string
    name: string
    tests: number
    failures: number
    errors: number
    time: string
    timestamp: string
    hostname: string
}

async function getTestResult(reportPath: string): Promise<TestResult> {
    return new Promise((resolve, reject) => {
        const junitContent = fs.readFileSync(reportPath)
        xml2js.parseString(junitContent, (error, result) => {
            if (error) { reject(error); return }
            const suite = result.testsuites.testsuite[0]
            resolve({
                id: suite.$.id,
                name: suite.$.name,
                tests: Number(suite.$.tests),
                failures: Number(suite.$.failures),
                errors: Number(suite.$.errors),
                time: suite.$.time,
                timestamp: suite.$.timestamp,
                hostname: suite.$.hostname
            })
        })
    })
}

function buildCommentBody(testResult: TestResult, runUrl: string): string {
    const { tests, failures, errors, id, time, timestamp } = testResult
    const failed = failures + errors
    const passed = tests - failed
    const status = failed === 0 ? '✅ PASSED' : '❌ FAILED'

    return [
        `## 🧪 Katalon Test Report — ${status}`,
        ``,
        `| 🔢 Total | ✅ Passed | ❌ Failed |`,
        `|:--------:|:---------:|:---------:|`,
        `| **${tests}** | **${passed}** | **${failed}** |`,
        ``,
        `<details>`,
        `<summary>📋 Suite details</summary>`,
        ``,
        `| | |`,
        `|---|---|`,
        `| **Suite** | \`${id}\` |`,
        `| **Failures** | ${failures} |`,
        `| **Errors** | ${errors} |`,
        `| **Timestamp** | ${timestamp} |`,
        ``,
        `</details>`,
        ``,
        `> 🔗 [View run](${runUrl}) · Commit: \`${(process.env.GITHUB_SHA ?? '').slice(0, 7)}\``,
    ].join('\n')
}

const COMMENT_MARKER = '<!-- katalon-test-report -->'

async function upsertComment(octokit: ReturnType<typeof github.getOctokit>, owner: string, repo: string, prNumber: number, body: string): Promise<void> {
    const markedBody = `${COMMENT_MARKER}\n${body}`

    // Find existing bot comment with our hidden marker
    const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: prNumber })
    const existing = comments.data.find(
        (c: { body?: string | null }) => c.body?.includes(COMMENT_MARKER)
    )

    if (existing) {
        await octokit.rest.issues.updateComment({
            owner,
            repo,
            comment_id: existing.id,
            body: markedBody
        })
    } else {
        await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: markedBody
        })
    }
}

async function run(): Promise<void> {
    let GITHUB_TOKEN = core.getInput('githubToken')
    if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN) GITHUB_TOKEN = process.env.GITHUB_TOKEN

    if (!GITHUB_TOKEN) {
        core.error('Required GITHUB_TOKEN parameter is empty. Step skipped.')
        return
    }

    const repoOrg = core.getInput('repoOrg')
    const katalonProjectDir = core.getInput('testProjectPath')
    const publishComment = core.getInput('publishComment') === 'true'
    const publishStatus = core.getInput('publishStatus') === 'true'

    const pattern = path.join(katalonProjectDir, '**/JUnit_Report.xml')
    const files = await utils.findFiles(pattern)
    const junitReportPath = files[0]

    if (!junitReportPath) {
        console.log('Katalon report is not found')
        return
    }

    const testResult = await getTestResult(junitReportPath)
    const runUrl = `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}`
    const body = buildCommentBody(testResult, runUrl)

    console.log(`Test results:\n${body}`)

    const octokit = github.getOctokit(GITHUB_TOKEN)
    const prNumber = github.context.payload.pull_request?.number ?? github.context.issue.number
    const failed = testResult.failures + testResult.errors

    if (publishComment) {
        await upsertComment(octokit, repoOrg, github.context.repo.repo, prNumber, body)
    }

    if (publishStatus) {
        await octokit.rest.repos.createCommitStatus({
            owner: repoOrg,
            repo: github.context.repo.repo,
            sha: process.env.GITHUB_SHA ?? github.context.sha,
            state: failed > 0 ? 'failure' : 'success',
            context: 'E2E Testing',
            description: `Tests: ${testResult.tests}. Failures: ${testResult.failures}. Errors: ${testResult.errors}`,
            target_url: runUrl
        })
    }
}

run().catch(error => core.setFailed(error.message))