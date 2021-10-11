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
var tl = __importStar(require("azure-pipelines-task-lib/task"));
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
function downloadArtifact(feed, name, version, path, organization, project) {
    return __awaiter(this, void 0, void 0, function () {
        var orgArg, projectArg, feedArg, nameArg, pathArg, versionArg, exitCode;
        return __generator(this, function (_a) {
            orgArg = "--organization \"" + organization + "\"";
            projectArg = "--project \"" + project + "\"";
            feedArg = "--feed \"" + feed + "\"";
            nameArg = "--name \"" + name + "\"";
            pathArg = "--path \"" + path + "\"";
            versionArg = "--version " + version;
            exitCode = tl.execSync('az', "artifacts universal download " + orgArg + " " + projectArg + " --scope project " + feedArg + " " + nameArg + " " + pathArg + " " + versionArg);
            console.log("exitCode: " + exitCode.code);
            return [2];
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var manifestPath, platformPath, modulesPath, organization, project, tmpPath, feed, manifestContent, jsonManifest, _i, _a, artifact, artifactFileName, artifactPath, _b, _c, artifact, err_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 6, , 7]);
                    manifestPath = tl.getInput("manifestPath");
                    platformPath = tl.getInput("platformPath");
                    modulesPath = tl.getInput("modulesPath");
                    organization = tl.getInput("organization");
                    project = tl.getInput("project");
                    console.log("manifestPath: " + manifestPath);
                    tmpPath = "./tmp";
                    if (!fs.existsSync(platformPath))
                        tl.mkdirP(platformPath);
                    if (!fs.existsSync(modulesPath))
                        tl.mkdirP(modulesPath);
                    if (!fs.existsSync(tmpPath))
                        tl.mkdirP(tmpPath);
                    feed = tl.getInput("feed");
                    return [4, fs.readFileSync(manifestPath)];
                case 1:
                    manifestContent = _d.sent();
                    jsonManifest = JSON.parse(manifestContent.toString());
                    tl.execSync('vc-build', "cleartemp install -platform -version " + jsonManifest.platform + " --root " + platformPath);
                    _i = 0, _a = jsonManifest["custom"];
                    _d.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3, 5];
                    artifact = _a[_i];
                    artifactFileName = artifact.name + "_" + artifact.version + ".zip";
                    console.log("Download artifact: " + artifactFileName);
                    artifactPath = path.join(tmpPath, artifactFileName);
                    return [4, downloadArtifact(feed, artifact.name, artifact.version, artifactPath, organization, project)];
                case 3:
                    _d.sent();
                    tl.execSync('7z', "x " + artifactPath + " -o" + path.resolve(path.join(modulesPath, artifact.name)));
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3, 2];
                case 5:
                    for (_b = 0, _c = jsonManifest["virtoCommerce"]; _b < _c.length; _b++) {
                        artifact = _c[_b];
                        tl.execSync('vc-build', "Install -module " + artifact.name + " -version " + artifact.version + " -DiscoveryPath " + modulesPath + " -ProbingPath " + path.join(platformPath, "app_data", "modules") + " -SkipDependencySolving -skip InstallPlatform");
                    }
                    tl.execSync('vc-build', "cleartemp");
                    return [3, 7];
                case 6:
                    err_1 = _d.sent();
                    tl.setResult(tl.TaskResult.Failed, err_1.message);
                    return [3, 7];
                case 7: return [2];
            }
        });
    });
}
run();
