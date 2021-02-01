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
function getArtifactUrl(downloadComment, repoOrg, octokit) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var regexp, regExpTask, currentPr, taskNumber, body, artifactLink;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    regexp = RegExp(downloadComment + '\s*.*');
                    regExpTask = /\w+-\d+/;
                    return [4, octokit.pulls.get({
                            owner: repoOrg,
                            repo: github.context.repo.repo,
                            pull_number: (_b = (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number) !== null && _b !== void 0 ? _b : github.context.issue.number
                        })];
                case 1:
                    currentPr = _f.sent();
                    taskNumber = (_c = currentPr.data.title.match(regExpTask)) === null || _c === void 0 ? void 0 : _c[0];
                    body = currentPr.data.body;
                    console.log(currentPr.data.title);
                    console.log(body);
                    artifactLink = (_e = (_d = body.match(regexp)) === null || _d === void 0 ? void 0 : _d[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)) === null || _e === void 0 ? void 0 : _e[0];
                    return [2, {
                            taskNumber: taskNumber,
                            artifactLink: artifactLink
                        }];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var GITHUB_TOKEN, downloadComment, deployRepo, deployBranch, repoOrg, octokit, pr, baseBranch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    GITHUB_TOKEN = core.getInput("githubToken");
                    if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
                        GITHUB_TOKEN = process.env.GITHUB_TOKEN;
                    downloadComment = 'Download artifact URL:';
                    deployRepo = core.getInput("deployRepo");
                    deployBranch = core.getInput("deployBranch");
                    repoOrg = core.getInput("repoOrg");
                    octokit = github.getOctokit(GITHUB_TOKEN);
                    return [4, getArtifactUrl(downloadComment, repoOrg, octokit)];
                case 1:
                    pr = _a.sent();
                    if (!pr.artifactLink) return [3, 4];
                    console.log("Artifact link is: " + pr.artifactLink);
                    core.setOutput('artifactLink', pr.artifactLink);
                    return [4, octokit.git.getRef({
                            owner: repoOrg,
                            repo: deployRepo,
                            ref: "heads/" + deployBranch
                        })];
                case 2:
                    baseBranch = (_a.sent()).data;
                    return [4, octokit.git.createRef({
                            owner: repoOrg,
                            repo: deployRepo,
                            ref: "refs/heads/" + pr.taskNumber + "-" + deployBranch + " deployment",
                            sha: baseBranch.object.sha,
                        })];
                case 3:
                    _a.sent();
                    return [3, 5];
                case 4:
                    console.log("Could not find artifact link in PR body. PR body should contain '" + downloadComment + " artifact URL");
                    core.error("Could not find artifact link in PR body. PR body should contain '" + downloadComment + " artifact URL");
                    core.setFailed("Could not find artifact link in PR body. PR body should contain '" + downloadComment + " artifact URL");
                    _a.label = 5;
                case 5: return [2];
            }
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
