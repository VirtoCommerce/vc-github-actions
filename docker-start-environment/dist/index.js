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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let platformImage = core.getInput('platformImage');
        let storefrontImage = core.getInput('storefrontImage');
        let platformDockerTag = core.getInput('platformDockerTag');
        let storefrontDockerTag = core.getInput('storefrontDockerTag');
        let envVarsArg = `-e PLATFORM_IMAGE=${platformImage} -e STOREFRONT_IMAGE=${storefrontImage} -e PLATFORM_DOCKER_TAG=${platformDockerTag} -e STOREFRONT_DOCKER_TAG=${storefrontDockerTag}`;
        let envFileContent = `PLATFORM_IMAGE=${platformImage}\nSTOREFRONT_IMAGE=${storefrontImage}\nPLATFORM_DOCKER_TAG=${platformDockerTag}\nSTOREFRONT_DOCKER_TAG=${storefrontDockerTag}`;
        fs_1.default.writeFileSync('./env_file', envFileContent);
        let composePath = path_1.default.join(__dirname, '../docker-compose.yml');
        yield exec.exec(`docker-compose -f ${composePath} -f env_file up -d`);
    });
}
run().catch(error => core.setFailed(error.message));
