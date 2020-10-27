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
const exec = __importStar(require("@actions/exec"));
const fs = __importStar(require("fs"));
const utils = __importStar(require("@virtocommerce/vc-actions-lib"));
function installGithubRelease() {
    return __awaiter(this, void 0, void 0, function* () {
        const ghReleaseUrl = "github.com/github-release/github-release";
        yield exec.exec(`go get ${ghReleaseUrl}`);
        process.env.PATH = `${process.env.PATH}:${process.env.HOME}/go/bin`;
        console.log(process.env.PATH);
        console.log(process.env.HOME);
    });
}
function run() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const modulesJsonUrl = core.getInput("modulesJsonUrl");
        console.log(`modulesJsonUrl: ${modulesJsonUrl}`);
        let branchName = yield utils.getBranchName(github);
        yield installGithubRelease();
        let orgName = (_a = core.getInput("organization")) !== null && _a !== void 0 ? _a : (_b = process.env.GITHUB_REPOSITORY) === null || _b === void 0 ? void 0 : _b.split('/')[0];
        let changelog = core.getInput('changelog');
        let changelogFilePath = `artifacts/changelog.txt`;
        fs.writeFileSync(changelogFilePath, changelog);
        let releaseNotesArg = `-ReleaseNotes "${changelogFilePath}"`;
        yield exec.exec(`vc-build Release -GitHubUser ${orgName} -GitHubToken ${process.env.GITHUB_TOKEN} -ReleaseBranch ${branchName} ${releaseNotesArg} -skip Clean+Restore+Compile+Test`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
            if (exitCode != 0 && exitCode != 422) {
                console.log(`vc-build Release exit code: ${exitCode}`);
            }
        });
    });
}
run().catch(error => {
    core.setFailed(error.message);
});
