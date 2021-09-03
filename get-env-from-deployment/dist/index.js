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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = __importStar(require("@actions/core"));
var exec = __importStar(require("@actions/exec"));
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var yaml = __importStar(require("yaml"));
var axios_1 = __importDefault(require("axios"));
function downloadFile(url, outFile) {
    return __awaiter(this, void 0, void 0, function () {
        var path, writer, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    path = outFile;
                    writer = fs.createWriteStream(path);
                    return [4, (0, axios_1.default)({
                            url: url,
                            method: 'GET',
                            responseType: 'stream',
                            headers: {
                                'Accept': 'application/octet-stream'
                            }
                        })];
                case 1:
                    response = _a.sent();
                    response.data.pipe(writer);
                    return [2, new Promise(function (resolve, reject) {
                            writer.on('finish', resolve);
                            writer.on('error', reject);
                        })];
            }
        });
    });
}
function getModules(modules, tmpDir, modulesDir) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, modules_1, module_1, archivePath, packageUrl, isBlob, moduleRepo, moduleDstPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, modules_1 = modules;
                    _a.label = 1;
                case 1:
                    if (!(_i < modules_1.length)) return [3, 5];
                    module_1 = modules_1[_i];
                    if (module_1['Id'] == "VirtoCommerce.PageBuilderModule")
                        return [3, 4];
                    archivePath = path.join(tmpDir, module_1['Id'] + ".zip");
                    packageUrl = module_1['PackageUrl'];
                    isBlob = packageUrl.includes("windows.net/");
                    moduleRepo = module_1['Repository'].split('/').pop();
                    console.log(packageUrl);
                    return [4, downloadFile(packageUrl, archivePath)];
                case 2:
                    _a.sent();
                    moduleDstPath = modulesDir + "/" + module_1['Id'];
                    console.log(module_1['Id'] + "\n" + moduleDstPath);
                    return [4, extractArchive(archivePath, moduleDstPath)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3, 1];
                case 5: return [2];
            }
        });
    });
}
function extractArchive(zip, out) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exec.exec("unzip " + zip + " -d \"" + out + "\"")];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var platformDir, modulesDir, storefrontDir, themeDir, manifestPath, manifestUrl, tmpDir, rawContent, parsed, i, json, _i, parsed_1, p, j, parsedJSON, platformUrl, platformZip, modules, storefrontUrl, storefrontZip, themeUrl, themeZip;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    platformDir = core.getInput("platformDir");
                    modulesDir = core.getInput("modulesDir");
                    storefrontDir = core.getInput("storefrontDir");
                    themeDir = core.getInput("themeDir");
                    manifestPath = "./modules.yaml";
                    manifestUrl = core.getInput("deploymentUrl");
                    return [4, downloadFile(manifestUrl, manifestPath)];
                case 1:
                    _a.sent();
                    tmpDir = path.join(__dirname, 'tmp');
                    return [4, fs.mkdirSync(tmpDir)];
                case 2:
                    _a.sent();
                    rawContent = fs.readFileSync(manifestPath);
                    parsed = yaml.parseAllDocuments(rawContent.toString());
                    i = 0;
                    for (_i = 0, parsed_1 = parsed; _i < parsed_1.length; _i++) {
                        p = parsed_1[_i];
                        j = p.toJSON();
                        if (j.hasOwnProperty("data")) {
                            if (j["data"].hasOwnProperty("modules.json")) {
                                json = j;
                                break;
                            }
                        }
                    }
                    parsedJSON = JSON.parse(json);
                    console.log('Download platform');
                    platformUrl = parsedJSON['data']['PLATFORM_URL'];
                    platformZip = path.join(tmpDir, 'platform.zip');
                    return [4, downloadFile(platformUrl, platformZip)];
                case 3:
                    _a.sent();
                    return [4, extractArchive(platformZip, platformDir)];
                case 4:
                    _a.sent();
                    console.log('Download modules');
                    modules = parsedJSON['data']['modules.json'];
                    return [4, getModules(modules, tmpDir, modulesDir)];
                case 5:
                    _a.sent();
                    console.log('Download storefront');
                    storefrontUrl = parsedJSON['data']['STOREFRONT_URL'];
                    storefrontZip = path.join(tmpDir, 'storefront.zip');
                    return [4, downloadFile(storefrontUrl, storefrontZip)];
                case 6:
                    _a.sent();
                    return [4, extractArchive(storefrontZip, storefrontDir)];
                case 7:
                    _a.sent();
                    console.log('Download theme');
                    themeUrl = parsedJSON['data']['THEME_URL'];
                    themeZip = path.join(tmpDir, 'theme.zip');
                    return [4, downloadFile(themeUrl, themeZip)];
                case 8:
                    _a.sent();
                    return [4, extractArchive(themeZip, themeDir)];
                case 9:
                    _a.sent();
                    return [2];
            }
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
