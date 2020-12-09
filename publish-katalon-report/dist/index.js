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
const fs = __importStar(require("fs"));
const utils = __importStar(require("@virtocommerce/vc-actions-lib"));
const xml2js = __importStar(require("xml2js"));
function getTestResult(reportPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let junitContent = fs.readFileSync(reportPath);
            xml2js.parseString(junitContent, (error, result) => {
                if (error) {
                    reject(error);
                }
                let suite = result.testsuites[0].testsuite;
                resolve({
                    id: suite.$.id,
                    name: suite.$.name,
                    tests: suite.$.tests,
                    failures: suite.$.failures,
                    errors: suite.$.errors,
                    time: suite.$.time,
                    timestamp: suite.$.timestamp,
                    hostname: suite.$.hostname
                });
            });
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let katalonProjectDir = core.getInput("testProjectPath");
        if (katalonProjectDir)
            katalonProjectDir += "/";
        let junitReportPath = yield utils.findFiles(`${katalonProjectDir}/**/JUnit_Report.xml`)[0];
        let testResult = yield getTestResult(junitReportPath);
        console.log(`Test results: ${JSON.stringify(testResult)}`);
    });
}
run().catch(error => core.setFailed(error.message));
