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
var yaml = __importStar(require("js-yaml"));
var github = __importStar(require("@actions/github"));
var core = __importStar(require("@actions/core"));
function createDeployPr(deployData, targetRepo, baseRepo, gitUser, octokit) {
    return __awaiter(this, void 0, void 0, function () {
        var targetBranchName, baseBranch, branch, err_1, targetBranch, cmData, content, deployContent, cmResult, pr, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetBranchName = targetRepo.taskNumber + "-" + targetRepo.branchName + "-deployment";
                    console.log('Get base branch data');
                    return [4, octokit.git.getRef({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: "heads/" + targetRepo.branchName
                        })];
                case 1:
                    baseBranch = (_a.sent()).data;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4, octokit.repos.getBranch({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            branch: "refs/heads/" + targetBranchName,
                        })];
                case 3:
                    branch = _a.sent();
                    return [3, 5];
                case 4:
                    err_1 = _a.sent();
                    return [3, 5];
                case 5:
                    if (!!branch) return [3, 7];
                    console.log('Create branch for deployment PR');
                    return [4, octokit.git.createRef({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: "refs/heads/" + targetBranchName,
                            sha: baseBranch.object.sha,
                        })];
                case 6:
                    targetBranch = (_a.sent()).data;
                    _a.label = 7;
                case 7:
                    console.log('Get deployment config map content');
                    return [4, octokit.repos.getContent({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: "refs/heads/" + targetBranchName,
                            path: deployData.cmPath
                        })];
                case 8:
                    cmData = (_a.sent()).data;
                    content = Buffer.from(cmData.content, 'base64').toString();
                    deployContent = setConfigMap(deployData.key, deployData.keyValue, content);
                    console.log('Push deployment config map content to target directory');
                    return [4, octokit.repos.createOrUpdateFileContents({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            path: deployData.cmPath,
                            branch: targetBranchName,
                            content: Buffer.from(deployContent).toString("base64"),
                            sha: cmData.sha,
                            message: "Automated update " + baseRepo.repoName + " from PR " + baseRepo.pullNumber,
                            committer: {
                                name: gitUser.name,
                                email: gitUser.email
                            },
                            author: {
                                name: gitUser.name,
                                email: gitUser.email
                            },
                        })];
                case 9:
                    cmResult = (_a.sent()).data;
                    _a.label = 10;
                case 10:
                    _a.trys.push([10, 12, , 13]);
                    return [4, octokit.pulls.list({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            head: targetRepo.repoOrg + ":refs/heads/" + targetBranchName,
                            base: "refs/heads/" + targetRepo.branchName,
                            state: 'open'
                        })];
                case 11:
                    pr = _a.sent();
                    return [3, 13];
                case 12:
                    err_2 = _a.sent();
                    return [3, 13];
                case 13:
                    if (!(typeof pr.data === 'undefined' || pr.data.length === 0)) return [3, 15];
                    console.log('Create PR to head branch');
                    return [4, octokit.pulls.create({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            head: "refs/heads/" + targetBranchName,
                            base: "refs/heads/" + targetRepo.branchName,
                            title: targetBranchName,
                            body: "Automated update " + baseRepo.repoName + " from PR " + baseRepo.pullNumber + " " + baseRepo.pullHtmlUrl
                        })];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15: return [2];
            }
        });
    });
}
function createDeployCommit(deployData, targetRepo, baseRepoName, gitUser, octokit) {
    return __awaiter(this, void 0, void 0, function () {
        var cmData, content, deployContent, cmResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Get deployment config map content');
                    return [4, octokit.repos.getContent({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            ref: "refs/heads/" + targetRepo.branchName,
                            path: deployData.cmPath
                        })];
                case 1:
                    cmData = (_a.sent()).data;
                    content = Buffer.from(cmData.content, 'base64').toString();
                    deployContent = setConfigMap(deployData.key, deployData.keyValue, content);
                    console.log('Push deployment config map content to target directory');
                    return [4, octokit.repos.createOrUpdateFileContents({
                            owner: targetRepo.repoOrg,
                            repo: targetRepo.repoName,
                            path: deployData.cmPath,
                            branch: targetRepo.branchName,
                            content: Buffer.from(deployContent).toString("base64"),
                            sha: cmData.sha,
                            message: "Automated update " + baseRepoName,
                            committer: {
                                name: gitUser.name,
                                email: gitUser.email
                            },
                            author: {
                                name: gitUser.name,
                                email: gitUser.email
                            },
                        })];
                case 2:
                    cmResult = (_a.sent()).data;
                    return [2];
            }
        });
    });
}
function setConfigMap(key, keyValue, cmBody) {
    var moduleKey = "VirtoCommerce.";
    var dockerKey = "docker.";
    var ghcrKey = "ghcr.";
    var result;
    try {
        if ((key.indexOf(dockerKey) > -1) || (key.indexOf(ghcrKey) > -1)) {
            console.log('setConfigMap: Docker image deployment');
            var tag = getDockerTag(keyValue);
            var doc = yaml.load(cmBody);
            var imageIndex = doc["images"].findIndex(function (x) { return x.name === key; });
            result = cmBody.replace(doc["images"][imageIndex]["newTag"], tag);
        }
        else {
            if (key.indexOf(moduleKey) > -1) {
                console.log('setConfigMap: Module deployment');
                var regexp = RegExp('"PackageUrl":\s*.*' + key + '.*');
                result = cmBody.replace(regexp, "\"PackageUrl\": \"" + keyValue + "\"");
            }
            else {
                console.log('setConfigMap: Theme deployment');
                var regexp = RegExp(key + '\s*:.*');
                result = cmBody.replace(regexp, key + ": " + keyValue);
            }
        }
    }
    catch (error) {
        core.setFailed(error.message);
        process.exit();
    }
    return result;
}
function getDockerTag(dockerLink) {
    var _a;
    var regExpDocker = /(?<=:).*/;
    var result;
    result = (_a = dockerLink.match(regExpDocker)) === null || _a === void 0 ? void 0 : _a[0];
    return result;
}
function run() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var GITHUB_TOKEN, deployRepoName, deployBranchName, gitUserName, gitUserEmail, repoOrg, artifactKey, artifactUrl, taskNumber, cmPath, forceCommit, octokit, gitUser, prRepo, deployRepo, deployData;
        return __generator(this, function (_d) {
            GITHUB_TOKEN = core.getInput("githubToken");
            if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
                GITHUB_TOKEN = process.env.GITHUB_TOKEN;
            deployRepoName = core.getInput("deployRepo");
            deployBranchName = core.getInput("deployBranch");
            gitUserName = core.getInput("gitUserName");
            gitUserEmail = core.getInput("gitUserEmail");
            repoOrg = core.getInput("repoOrg");
            artifactKey = core.getInput("artifactKey");
            artifactUrl = core.getInput("artifactUrl");
            taskNumber = core.getInput("taskNumber");
            cmPath = core.getInput("cmPath");
            forceCommit = core.getInput("forceCommit");
            octokit = github.getOctokit(GITHUB_TOKEN);
            gitUser = {
                name: gitUserName,
                email: gitUserEmail
            };
            prRepo = {
                repoOrg: repoOrg,
                repoName: github.context.repo.repo,
                pullHtmlUrl: (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.html_url,
                pullNumber: (_c = (_b = github.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.number) !== null && _c !== void 0 ? _c : github.context.issue.number
            };
            deployRepo = {
                repoOrg: repoOrg,
                repoName: deployRepoName,
                branchName: deployBranchName,
                taskNumber: taskNumber
            };
            deployData = {
                key: artifactKey,
                keyValue: artifactUrl,
                cmPath: cmPath
            };
            switch (forceCommit) {
                case "false":
                    createDeployPr(deployData, deployRepo, prRepo, gitUser, octokit);
                    break;
                case "true":
                    createDeployCommit(deployData, deployRepo, prRepo.repoName, gitUser, octokit);
                    break;
                default:
                    console.log("Input parameter forceCommit should contain \"true\" or \"false\". Current forceCommit value is \"" + forceCommit + "\"");
            }
            return [2];
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
