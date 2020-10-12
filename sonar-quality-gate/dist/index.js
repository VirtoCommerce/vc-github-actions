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
const exec = __importStar(require("@actions/exec"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const utils = __importStar(require("@virtocommerce/vc-actions-lib"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const fs_1 = __importDefault(require("fs"));
const debug = require('debug')('sonarqube:verify:status');
const REPORT_FILE = '.sonarqube/out/.sonar/report-task.txt';
const DEFAULT_DELAY = 5;
function checkQualityGateStatus(login, password, sonarHost, projectKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const gateUrl = sonarHost +
            '/api/qualitygates/project_status?projectKey=' +
            projectKey;
        return yield checkReportStatus(login, password).then((reportStatus) => __awaiter(this, void 0, void 0, function* () {
            debug('reportStatus : ' + reportStatus);
            console.log('Check the Quality gate ' + gateUrl);
            const srvUrl = url_1.default.parse(gateUrl);
            const options = {
                host: srvUrl.hostname,
                path: srvUrl.path
            };
            yield addAuthHeader(options, login, password);
            return new Promise((resolve, reject) => {
                const req = http_1.default.request(options, response => {
                    if (response.statusCode !== 200) {
                        console.error('Error requesting the Report status');
                        reject('SonarQube replied the status code ' + response.statusCode);
                    }
                    else {
                        let body = '';
                        response.on('data', function (chunk) {
                            body += chunk;
                        });
                        req.on('error', function (err) {
                            console.error('Error requesting the Quality Gate status');
                            reject(err);
                        });
                        response.on('end', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                yield processGateResponse(body, resolve, reject);
                            });
                        });
                    }
                });
                req.end();
            });
        }));
    });
}
function processGateResponse(body, resolve, reject) {
    return __awaiter(this, void 0, void 0, function* () {
        const gateResponse = JSON.parse(body);
        const status = gateResponse.projectStatus.status;
        console.log('QUALITY GATE STATUS : ' + status);
        if (status != 'OK' && status != 'WARN') {
            console.error('QUALITY GATE HAS FAILED');
            const errors = gateResponse.projectStatus.conditions
                .filter((cond) => cond.status == 'ERROR')
                .map((cond) => `[${cond.metricKey}]: ${cond.actualValue} ${cond.comparator} ${cond.errorThreshold}`)
                .join(', ');
            debug(errors);
            reject(errors);
        }
        resolve('OK');
    });
}
function checkReportStatus(login, password = '', delayBetweenChecksInSecs = DEFAULT_DELAY) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield exec.exec("ls -al");
            yield exec.exec("ls -al .sonarqube");
            const reportInfo = fs_1.default.readFileSync(REPORT_FILE, 'utf8');
            const taskUrl = (_a = reportInfo.match(/ceTaskUrl=(.*)/)) === null || _a === void 0 ? void 0 : _a[1];
            if (taskUrl == null) {
                throw new Error("");
            }
            console.log('Report Status Url : ' + taskUrl);
            const srvUrl = url_1.default.parse(taskUrl);
            const options = {
                host: srvUrl.hostname,
                path: srvUrl.path
            };
            yield addAuthHeader(options, login, password);
            const req = http_1.default.request(options, response => {
                if (response.statusCode !== 200) {
                    console.error('Error requesting the Report status');
                    reject('SonarQube replied the status code ' + response.statusCode);
                }
                else {
                    let body = '';
                    response.on('data', function (chunk) {
                        body += chunk;
                    });
                    req.on('error', function (err) {
                        console.error('Error requesting the Report status');
                        reject(err);
                    });
                    response.on('end', function () {
                        debug('Raw response from SonarQube API');
                        debug('"' + body + '"');
                        if (body === '') {
                            resolve('');
                        }
                        else {
                            const taskResponse = JSON.parse(body);
                            resolve(taskResponse.task.status);
                        }
                    });
                }
            });
            req.end();
        })).then(status => {
            console.log('Report status : ' + status);
            if (status === '' || status === 'IN_PROGRESS' || status === 'PENDING') {
                console.log('Retry until report ends in ' + delayBetweenChecksInSecs + 's');
                return delay(delayBetweenChecksInSecs * 1000).then(() => {
                    return checkReportStatus(login, password, delayBetweenChecksInSecs);
                });
            }
            else {
                return status;
            }
        });
    });
}
function addAuthHeader(options, login, password) {
    return __awaiter(this, void 0, void 0, function* () {
        let auth = null;
        if (login !== '' && login !== undefined) {
            debug('Authentication active');
            auth = 'Basic ' + Buffer.from(login + ':' + password).toString('base64');
        }
        else {
            debug('No authentication active');
        }
        if (auth) {
            options.headers = {
                Authorization: auth
            };
        }
    });
}
function delay(t) {
    return new Promise(function (resolve) {
        setTimeout(resolve, t);
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield utils.isPullRequest(github)) {
            return;
        }
        let login = core.getInput("login");
        let password = core.getInput("password");
        let sonarHost = core.getInput("sonarHost");
        let projectKey = core.getInput("projectKey");
        yield checkQualityGateStatus(login, password, sonarHost, projectKey);
    });
}
run().catch(error => core.setFailed(error.message));
