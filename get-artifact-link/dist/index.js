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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var github = __importStar(require("@actions/github"));
var core = __importStar(require("@actions/core"));
function getArtifactUrl(downloadComment, prRepo, octokit) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var regexp, regExpTask, currentPr, taskNumber, body, artifactLink;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    regexp = RegExp(downloadComment + '\s*.*');
                    regExpTask = /\w+-\d+/;
                    console.log('Start - getArtifactUrl');
                    return [4, octokit.pulls.get({
                            owner: prRepo.repoOrg,
                            repo: prRepo.repoName,
                            pull_number: prRepo.pullNumber
                        })];
                case 1:
                    currentPr = _d.sent();
                    taskNumber = (_a = currentPr.data.title.match(regExpTask)) === null || _a === void 0 ? void 0 : _a[0];
                    body = currentPr.data.body;
                    artifactLink = (_c = (_b = body.match(regexp)) === null || _b === void 0 ? void 0 : _b[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)) === null || _c === void 0 ? void 0 : _c[0];
                    console.log('Finish- getArtifactUrl');
                    return [2, {
                            taskNumber: taskNumber,
                            artifactLink: artifactLink
                        }];
            }
        });
    });
}
function createDeployPr(deployData, targetRepo, baseRepo, octokit) {
    return __awaiter(this, void 0, void 0, function () {
        var targetBranchName, baseBranch, targetBranch, cmData, content, deployContent, cmResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Start - createDeployPrl');
                    targetBranchName = "refs/heads/" + targetRepo.taskNumber + "-" + targetRepo.branchName + "-deployment";
                    console.log('Get base branch data');
                    return [4, octokit.git.getRef({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: "heads/" + targetRepo.branchName
                        })];
                case 1:
                    baseBranch = (_a.sent()).data;
                    console.log("Base branch SHA - " + baseBranch.object.sha);
                    console.log('Create branch for deployment PR');
                    return [4, octokit.git.createRef({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: targetBranchName,
                            sha: baseBranch.object.sha,
                        })];
                case 2:
                    targetBranch = (_a.sent()).data;
                    console.log("Target branch - " + targetBranch);
                    console.log('Get deployment config map content');
                    return [4, octokit.repos.getContent({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: targetBranchName,
                            path: deployData.cmPath
                        })];
                case 3:
                    cmData = (_a.sent()).data;
                    content = Buffer.from(cmData.content, 'base64').toString();
                    deployContent = setConfigMap(deployData.key, deployData.keyValue, content);
                    console.log('Push deployment config map content to target directory');
                    return [4, octokit.repos.createOrUpdateFileContents({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: targetBranchName,
                            path: deployData.cmPath,
                            content: deployContent,
                            sha: cmData.sha,
                            message: "Automated update " + baseRepo.repoName + " from PR " + baseRepo.pullNumber,
                            committer: {
                                name: 'GitHub Actions',
                                email: 'github.actions@virtoway.com'
                            },
                            author: {
                                name: 'GitHub Actions',
                                email: 'github.actions@virtoway.com'
                            },
                        })];
                case 4:
                    cmResult = (_a.sent()).data;
                    console.log('Create PR to head branch');
                    return [4, octokit.pulls.create({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            head: targetRepo.branchName,
                            base: targetBranchName,
                            title: targetRepo.taskNumber + "-" + targetRepo.branchName + " deployment",
                            body: "Automated update " + baseRepo.repoName + " from PR " + baseRepo.pullNumber + " " + baseRepo.pullHtmlUrl
                        })];
                case 5:
                    _a.sent();
                    console.log('Finish - createDeployPrl');
                    return [2];
            }
        });
    });
}
function setConfigMap(key, keyValue, cmBody) {
    var regexp = RegExp(key + '\s*:.*');
    var result = cmBody.replace(regexp, key + ": " + keyValue);
    return result;
}
function run() {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var GITHUB_TOKEN, downloadComment, deployRepoName, deployBranchName, repoOrg, artifactKey, cmPath, octokit, prRepo, pr, deployRepo, deployData;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    GITHUB_TOKEN = core.getInput("githubToken");
                    if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
                        GITHUB_TOKEN = process.env.GITHUB_TOKEN;
                    downloadComment = 'Download artifact URL:';
                    deployRepoName = core.getInput("deployRepo");
                    deployBranchName = core.getInput("deployBranch");
                    repoOrg = core.getInput("repoOrg");
                    artifactKey = core.getInput("artifactKey");
                    cmPath = core.getInput("cmPath");
                    octokit = github.getOctokit(GITHUB_TOKEN);
                    (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.html_url;
                    prRepo = {
                        repoOrg: repoOrg,
                        repoName: github.context.repo.repo,
                        pullHtmlUrl: (_b = github.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.html_url,
                        pullNumber: (_d = (_c = github.context.payload.pull_request) === null || _c === void 0 ? void 0 : _c.number) !== null && _d !== void 0 ? _d : github.context.issue.number
                    };
                    (_e = github.context.payload.pull_request) === null || _e === void 0 ? void 0 : _e.html_url;
                    return [4, getArtifactUrl(downloadComment, prRepo, octokit)];
                case 1:
                    pr = _f.sent();
                    if (pr.artifactLink) {
                        console.log("Artifact link is: " + pr.artifactLink);
                        core.setOutput('artifactLink', pr.artifactLink);
                        deployRepo = {
                            repoOrg: repoOrg,
                            repoName: deployRepoName,
                            branchName: deployBranchName,
                            taskNumber: pr.taskNumber
                        };
                        deployData = {
                            key: artifactKey,
                            keyValue: pr.artifactLink,
                            cmPath: cmPath
                        };
                        createDeployPr(deployData, deployRepo, prRepo, octokit);
                    }
                    else {
                        console.log("Could not find artifact link in PR body. PR body should contain '" + downloadComment + " artifact URL");
                        core.error("Could not find artifact link in PR body. PR body should contain '" + downloadComment + " artifact URL");
                        core.setFailed("Could not find artifact link in PR body. PR body should contain '" + downloadComment + " artifact URL");
                    }
                    return [2];
            }
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
