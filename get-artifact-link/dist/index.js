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
function getArtifactUrl(prComment, prRepo, octokit) {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function () {
        var regExpLink, regExpQa, regExpDemo, regExpTask, currentPr, body, qaTaskNumber, demoTaskNumber, artifactUrl;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    console.log('Get UrL and task numbers from PR body');
                    regExpLink = RegExp(prComment.downloadLink + '\s*.*');
                    regExpQa = RegExp(prComment.qaTask + '\s*.*');
                    regExpDemo = RegExp(prComment.demoTask + '\s*.*');
                    regExpTask = /\w+-\d+/;
                    return [4, octokit.pulls.get({
                            owner: prRepo.repoOrg,
                            repo: prRepo.repoName,
                            pull_number: prRepo.pullNumber
                        })];
                case 1:
                    currentPr = _g.sent();
                    body = currentPr.data.body;
                    qaTaskNumber = (_b = (_a = body.match(regExpQa)) === null || _a === void 0 ? void 0 : _a[0].match(regExpTask)) === null || _b === void 0 ? void 0 : _b[0];
                    demoTaskNumber = (_d = (_c = body.match(regExpDemo)) === null || _c === void 0 ? void 0 : _c[0].match(regExpTask)) === null || _d === void 0 ? void 0 : _d[0];
                    artifactUrl = (_f = (_e = body.match(regExpLink)) === null || _e === void 0 ? void 0 : _e[0].match(/[-a-zA-Z0-9@:%_\+.~#?&\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/=]*)?/gi)) === null || _f === void 0 ? void 0 : _f[0];
                    return [2, {
                            qaTaskNumber: qaTaskNumber,
                            demoTaskNumber: demoTaskNumber,
                            artifactUrl: artifactUrl
                        }];
            }
        });
    });
}
function run() {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var GITHUB_TOKEN, prComments, repoOrg, octokit, prRepo, pr;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    GITHUB_TOKEN = core.getInput("githubToken");
                    if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
                        GITHUB_TOKEN = process.env.GITHUB_TOKEN;
                    prComments = {
                        downloadLink: core.getInput("downloadComment"),
                        qaTask: 'QA-test:',
                        demoTask: 'Demo-test:'
                    };
                    repoOrg = core.getInput("repoOrg");
                    octokit = github.getOctokit(GITHUB_TOKEN);
                    (_a = github.context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.html_url;
                    prRepo = {
                        repoOrg: repoOrg,
                        repoName: github.context.repo.repo,
                        pullHtmlUrl: (_b = github.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.html_url,
                        pullNumber: (_d = (_c = github.context.payload.pull_request) === null || _c === void 0 ? void 0 : _c.number) !== null && _d !== void 0 ? _d : github.context.issue.number
                    };
                    (_e = github.context.payload.pull_request) === null || _e === void 0 ? void 0 : _e.html_url;
                    return [4, getArtifactUrl(prComments, prRepo, octokit)];
                case 1:
                    pr = _f.sent();
                    if (pr.artifactUrl) {
                        console.log("Artifact Url is: " + pr.artifactUrl);
                        core.setOutput('artifactUrl', pr.artifactUrl);
                        console.log("QA task number is: " + pr.qaTaskNumber);
                        core.setOutput('qaTaskNumber', pr.qaTaskNumber);
                        console.log("Demo task number is: " + pr.demoTaskNumber);
                        core.setOutput('demoTaskNumber', pr.demoTaskNumber);
                    }
                    else {
                        console.log("Could not find artifact link in PR body. PR body should contain '" + prComments.downloadLink);
                        core.error("Could not find artifact link in PR body. PR body should contain '" + prComments.downloadLink);
                        core.setFailed("Could not find artifact link in PR body. PR body should contain '" + prComments.downloadLink);
                    }
                    return [2];
            }
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
