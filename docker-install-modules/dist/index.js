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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const utils = __importStar(require("@virtocommerce/vc-actions-lib"));
const yaml = __importStar(require("yaml"));
const axios_1 = __importDefault(require("axios"));
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function downloadFile(url, outFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = outFile;
        const writer = fs.createWriteStream(path);
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
    return __awaiter(this, void 0, void 0, function* () {
        let manifestUrl = core.getInput("manifestUrl");
        let manifestFormat = core.getInput("manifestFormat");
        let modulesGroup = core.getInput("modulesGroup");
        let containerName = core.getInput("containerName");
        let containerDestination = core.getInput("containerDestination");
        let restartContainer = core.getInput("restartContainer") == 'true';
        let sleepAfterRestart = Number.parseInt(core.getInput("sleepAfterRestart"));
        let manifestPath = `./modules.${manifestFormat}`;
        yield downloadFile(manifestUrl, manifestPath);
        let modulesDir = __dirname + 'Modules';
        let modulesZipDir = __dirname + 'ModulesZip';
        yield fs.mkdirSync(modulesDir);
        yield fs.mkdirSync(modulesZipDir);
        if (manifestFormat == 'json') {
            let jsonString = fs.readFileSync(manifestPath, 'utf8');
            let doc = JSON.parse(jsonString);
            for (let module of doc) {
                if (modulesGroup && !module['Groups'].includes(modulesGroup)) {
                    continue;
                }
                for (let moduleVersion of module.Version) {
                    if (moduleVersion.VersionTag) {
                        continue;
                    }
                    let archivePath = path.join(modulesZipDir, `${module['Id']}.zip`);
                    yield utils.downloadFile(moduleVersion['PackageUrl'], archivePath);
                    yield exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
                }
            }
        }
        else if (manifestFormat == 'yml') {
            let rawContent = fs.readFileSync(manifestPath);
            let jsonString = yaml.parse(rawContent.toString());
            console.log(jsonString);
            console.log(jsonString['data']['modules.json']);
            let doc = yield JSON.parse(jsonString);
            for (let module of doc['data']['modules.json']) {
                let archivePath = path.join(modulesZipDir, `${module['Id']}.zip`);
                yield utils.downloadFile(module['PackageUrl'], archivePath);
                yield exec.exec(`unzip ${archivePath} -d ${modulesDir}/${module['Id']}`);
            }
        }
        yield exec.exec(`docker cp ./${modulesDir}/. ${containerName}:${containerDestination}`);
        if (restartContainer) {
            yield exec.exec(`docker restart ${containerName}`);
            yield sleep(sleepAfterRestart);
        }
    });
}
run().catch(error => core.setFailed(error.message));