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
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const utils = __importStar(require("@virtocommerce/vc-actions-lib"));
const xml2js = __importStar(require("xml2js"));
const path = __importStar(require("path"));
function getTestResult(reportPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let junitContent = fs.readFileSync(reportPath);
            xml2js.parseString(junitContent, (error, result) => {
                if (error) {
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
    });
}
function run() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        let GITHUB_TOKEN = core.getInput("githubToken");
        if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
            GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        let repoOrg = core.getInput("repoOrg");
        let katalonProjectDir = core.getInput("testProjectPath");
        let publishComment = core.getInput("publishComment") === "true";
        let publishStatus = core.getInput("publishStatus") === "true";
        let pattern = path.join(katalonProjectDir, "**/JUnit_Report.xml");
        let files = yield utils.findFiles(pattern);
        let junitReportPath = files[0];
        if (junitReportPath !== undefined) {
            let testResult = yield getTestResult(junitReportPath);
            let body = `Test Suite: ${testResult.id}\nTests: ${testResult.tests}\nFailures: ${testResult.failures}\nErrors: ${testResult.errors}\nTime: ${testResult.time}\nTimestamp: ${testResult.timestamp}`;
            console.log(`Test results: ${body}`);
            let octokit = github.getOctokit(GITHUB_TOKEN);
            if (publishComment) {
                octokit.pulls.createReview({
                    owner: repoOrg,
                    repo: github.context.repo.repo,
                    pull_number: (_b = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number) !== null && _b !== void 0 ? _b : github.context.issue.number,
                    body: body,
                    event: "COMMENT"
                });
            }
            if (publishStatus) {
                octokit.repos.createCommitStatus({
                    owner: repoOrg,
                    repo: github.context.repo.repo,
                    sha: (_c = process.env.GITHUB_SHA) !== null && _c !== void 0 ? _c : github.context.sha,
                    state: testResult.errors > 0 || testResult.failures > 0 ? "failure" : "success",
                    context: "E2E Testing",
                    description: `Tests: ${testResult.tests}. Failures: ${testResult.failures}. Errors: ${testResult.errors}`,
                    target_url: `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}`
                });
            }
        }
        else {
            console.log("Katalon report is not found");
        }
    });
}
run().catch(error => core.setFailed(error.message));
