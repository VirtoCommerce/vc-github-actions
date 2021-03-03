"use strict";
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
const core_1 = __importDefault(require("@actions/core"));
const exec_1 = __importDefault(require("@actions/exec"));
const github_1 = __importDefault(require("@actions/github"));
const path_1 = __importDefault(require("path"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let token = core_1.default.getInput("githubToken");
        let login = core_1.default.getInput("login");
        let password = core_1.default.getInput("password");
        let catalogId = core_1.default.getInput("catalogId");
        let categoryId = core_1.default.getInput("categoryId");
        let platformUrl = core_1.default.getInput("platformUrl");
        let moduleId = core_1.default.getInput("moduleId");
        let scriptPath = path_1.default.join(__dirname, "..", "ps/update-catalog.ps1");
        let octo = github_1.default.getOctokit(token);
        let release = yield octo.repos.getLatestRelease({
            owner: github_1.default.context.repo.owner,
            repo: github_1.default.context.repo.repo
        });
        let moduleUrl = release.data.assets[0].browser_download_url;
        yield exec_1.default.exec(`pwsh ${scriptPath} -apiUrl ${platformUrl} -hmacAppId ${login} -hmacSecret ${password} -catalogId ${catalogId} -categoryId ${categoryId} -moduleId ${moduleId} -moduleUrl ${moduleUrl}`);
    });
}
run().catch(error => core_1.default.setFailed(error.message));
