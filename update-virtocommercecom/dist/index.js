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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const github = __importStar(require("@actions/github"));
const path_1 = __importDefault(require("path"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let token = core.getInput("githubToken");
        let login = core.getInput("login");
        let password = core.getInput("password");
        let catalogId = core.getInput("catalogId");
        let categoryId = core.getInput("categoryId");
        let platformUrl = core.getInput("platformUrl");
        let moduleId = core.getInput("moduleId");
        let moduleDesc = core.getInput("moduleDesccription");
        let projectUrl = core.getInput("projectUrl");
        let iconUrl = core.getInput("iconUrl");
        let scriptPath = path_1.default.join(__dirname, "..", "ps/update-catalog.ps1");
        let octo = github.getOctokit(token);
        let release = yield octo.repos.getLatestRelease({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        });
        let moduleUrl = release.data.assets[0].browser_download_url;
        yield exec.exec(`pwsh ${scriptPath} -apiUrl ${platformUrl} -hmacAppId ${login} -hmacSecret ${password} -catalogId ${catalogId} -categoryId ${categoryId} -moduleId ${moduleId} -moduleUrl ${moduleUrl} -moduleDescription ${moduleDesc} -projectUrl ${projectUrl} -iconUrl ${iconUrl}`);
    });
}
run().catch(error => core.setFailed(error.message));
