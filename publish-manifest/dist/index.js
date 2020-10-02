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
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const axios_1 = __importDefault(require("axios"));
function getConfigHome() {
    return __awaiter(this, void 0, void 0, function* () {
        const xdg_home = process.env['XDG_CONFIG_HOME'];
        if (xdg_home)
            return xdg_home;
        return `${os_1.default.homedir()}/.config`;
    });
}
function setupCredentials(user, pass) {
    return __awaiter(this, void 0, void 0, function* () {
        let githubCreds = `https://${user}:${pass}@github.com`;
        let configHome = yield getConfigHome();
        yield fs_1.default.mkdirSync(`${configHome}/git`, { recursive: true });
        yield fs_1.default.writeFileSync(`${configHome}/git/credentials`, githubCreds, { flag: 'a', mode: 0o600 });
        yield exec.exec('git', ['config', '--global', 'credential.helper', 'store']);
        yield exec.exec('git', ['config', '--global', '--replace-all', 'url.https://github.com/.insteadOf', 'ssh://git@github.com/']);
        yield exec.exec('git', ['config', '--global', '--add', 'url.https://github.com/.insteadOf', 'git@github.com:']);
    });
}
function downloadFile(url, outFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = outFile;
        const writer = fs_1.default.createWriteStream(path);
        const response = yield axios_1.default({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    });
}
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let packageUrl = core.getInput('packageUrl');
        let customModulepackageUrl = packageUrl ? `-CustomModulePackageUri ${packageUrl}` : "";
        let gitUserEmail = core.getInput("gitUserEmail");
        let gitUserName = core.getInput("gitUserName");
        let githubToken = (_a = core.getInput("githubToken")) !== null && _a !== void 0 ? _a : process.env.GITHUB_TOKEN;
        yield exec.exec(`git config --global user.email "${gitUserEmail}"`);
        yield exec.exec(`git config --global user.name "${gitUserName}"`);
        yield setupCredentials(gitUserName, githubToken);
        yield exec.exec(`vc-build PublishModuleManifest ${customModulepackageUrl}`, [], { ignoreReturnCode: true, failOnStdErr: false }).then(exitCode => {
            console.log(`Exit code: ${exitCode}`);
            if (exitCode != 0 && exitCode != 423 && exitCode != 167) {
                core.setFailed("Failed to update modules.json");
            }
        }).catch(err => {
            console.log(`Error: ${err.message}`);
        });
    });
}
run().catch(error => core.setFailed(error.message));
