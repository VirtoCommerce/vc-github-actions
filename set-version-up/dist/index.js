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
var exec = __importStar(require("@actions/exec"));
var utils = __importStar(require("@virtocommerce/vc-actions-lib"));
function commitChanges(projectType, path, newVersion, branchName) {
    return __awaiter(this, void 0, void 0, function () {
        var addPath, gitCommand;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    switch (projectType) {
                        case utils.projectTypeTheme:
                            addPath = path + "/package.json";
                            break;
                        case utils.projectTypeModule:
                            addPath = path + "/Directory.Build.props /src/*/module.manifest";
                            break;
                        default:
                            addPath = path + "/Directory.Build.props";
                            break;
                    }
                    gitCommand = "git add " + addPath;
                    console.log("Run command: " + gitCommand);
                    return [4, exec.exec(gitCommand).then(function (exitCode) {
                            if (exitCode != 0) {
                                core.setFailed("Can`t add changes to git");
                            }
                        })];
                case 1:
                    _a.sent();
                    gitCommand = "git commit -m \"Release version " + newVersion + "\"";
                    console.log("Run command: " + gitCommand);
                    return [4, exec.exec("git commit -m \"Release version " + newVersion + "\"").then(function (exitCode) {
                            if (exitCode != 0) {
                                core.setFailed("Can`t commit changes to git");
                            }
                        })];
                case 2:
                    _a.sent();
                    gitCommand = "git tag " + newVersion;
                    console.log("Run command: " + gitCommand);
                    return [4, exec.exec("git tag " + newVersion + "\"").then(function (exitCode) {
                            if (exitCode != 0) {
                                core.setFailed("Can`t set new version tag");
                            }
                        })];
                case 3:
                    _a.sent();
                    gitCommand = "git push origin " + branchName;
                    console.log("Run command: " + gitCommand);
                    return [4, exec.exec("git tag " + newVersion + "\"").then(function (exitCode) {
                            if (exitCode != 0) {
                                core.setFailed("Can`t push changes to GitHub");
                            }
                        })];
                case 4:
                    _a.sent();
                    return [2];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var GITHUB_TOKEN, versionLabel, path, branchName, projectType, targetName, oldVersion, newVersion, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    GITHUB_TOKEN = core.getInput("githubToken");
                    if (!GITHUB_TOKEN && process.env.GITHUB_TOKEN !== undefined)
                        GITHUB_TOKEN = process.env.GITHUB_TOKEN;
                    versionLabel = core.getInput("versionLabel");
                    path = core.getInput("path");
                    return [4, utils.getBranchName(github)];
                case 1:
                    branchName = _b.sent();
                    return [4, utils.getProjectType()];
                case 2:
                    projectType = _b.sent();
                    console.log("Project type: " + projectType);
                    path = path.replace(/\/+$/, '');
                    return [4, utils.getInfoFromDirectoryBuildProps("Directory.Build.props")];
                case 3:
                    oldVersion = _b.sent();
                    console.log("Previous version number: " + oldVersion);
                    switch (versionLabel.toLowerCase()) {
                        case "minor":
                            targetName = "IncrementMinor";
                            break;
                        case "patch":
                            targetName = "IncrementPatch";
                            break;
                    }
                    return [4, exec.exec("vc-build " + targetName + " -CustomVersionPrefix \"" + oldVersion + "\"").then(function (exitCode) {
                            if (exitCode != 0) {
                                core.setFailed("vc-build ChangeVersion failed");
                            }
                        })];
                case 4:
                    _b.sent();
                    if (!(projectType === utils.projectTypeTheme)) return [3, 6];
                    return [4, utils.getInfoFromPackageJson(path + "/package.json")];
                case 5:
                    _a = (_b.sent()).version;
                    return [3, 8];
                case 6: return [4, utils.getInfoFromDirectoryBuildProps(path + "/Directory.Build.props")];
                case 7:
                    _a = (_b.sent()).prefix;
                    _b.label = 8;
                case 8:
                    newVersion = _a;
                    console.log("Current version number: " + newVersion);
                    commitChanges(projectType, path, newVersion, branchName);
                    return [2];
            }
        });
    });
}
run().catch(function (error) { return core.setFailed(error.message); });
