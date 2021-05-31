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
function getDeployConfig(repo, deployConfigPath, octokit) {
    return __awaiter(this, void 0, void 0, function () {
        var cmData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('Get deployment config content');
                    return [4, octokit.repos.getContent({
                            owner: repo.repoOrg,
                            repo: repo.repoName,
                            ref: repo.branchName,
                            path: deployConfigPath
                        })];
                case 1:
                    cmData = (_a.sent()).data;
                    return [2, Buffer.from(cmData.content, 'base64').toString()];
                case 2:
                    error_1 = _a.sent();
                    core.setFailed(error_1.message);
                    return [3, 3];
                case 3: return [2];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var deployConfig, GITHUB_TOKEN, deployConfigPath, envName, octokit, branchName, prRepo, content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    GITHUB_TOKEN = core.getInput("githubToken");
                    if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
                        GITHUB_TOKEN = process.env.GITHUB_TOKEN;
                    deployConfigPath = core.getInput("deployConfigPath");
                    envName = core.getInput("envName");
                    octokit = github.getOctokit(GITHUB_TOKEN);
                    branchName = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.ref : github.context.ref;
                    prRepo = {
                        repoOrg: github.context.repo.owner,
                        repoName: github.context.repo.repo,
                        branchName: branchName
                    };
                    return [4, getDeployConfig(prRepo, deployConfigPath, octokit)];
                case 1:
                    content = _a.sent();
                    try {
                        deployConfig = JSON.parse(content);
                    }
                    catch (error) {
                        core.setFailed(error.message);
                    }
                    core.setOutput("artifactKey", deployConfig.artifactKey);
                    core.setOutput("deployRepo", deployConfig.deployRepo);
                    core.setOutput("deployAppName", deployConfig[envName].deployAppName);
                    core.setOutput("deployBranch", deployConfig[envName].deployBranch);
                    core.setOutput("cmPath", deployConfig.cmPath);
                    core.setOutput("deployConfig", deployConfig);
                    console.log("artifactKey is: " + deployConfig.artifactKey);
                    console.log("deployRepo is: " + deployConfig.deployRepo);
                    console.log("cmPath is: " + deployConfig.cmPath);
                    console.log("dev is: " + deployConfig['dev']);
                    console.log("qa  is: " + deployConfig['qa']);
                    console.log("prod  is: " + deployConfig['prod']);
                    return [2];
            }
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
