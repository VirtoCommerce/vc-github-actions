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
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let artifactPath = core.getInput('artifactPath');
        let restartContainer = core.getInput('restartContainer') === 'true';
        let containerName = core.getInput('containerName');
        let containerDestination = core.getInput('containerDestination');
        yield exec.exec(`docker exec ${containerName} sh -c "rm -rf ${containerDestination}"`);
        let dirname = "theme";
        yield exec.exec(`unzip ${artifactPath} -d ./${dirname}`);
        yield exec.exec(`docker exec ${containerName} sh -c "mkdir -p ${containerDestination}"`);
        yield exec.exec(`docker cp ./${dirname}/default/. ${containerName}:${containerDestination}`);
        if (restartContainer) {
            yield exec.exec(`docker restart ${containerName}`);
            yield sleep(20000);
            yield exec.exec('netstat -tulpn');
        }
        yield exec.exec('docker ps -a');
    });
}
run().catch(error => core.setFailed(error.message));
