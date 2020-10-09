import * as exec from '@actions/exec'
import * as core from '@actions/core'
import http from 'http';
import url from 'url';
import fs from 'fs';
const debug = require('debug')('sonarqube:verify:status');

const REPORT_FILE = '.scannerwork/report-task.txt';
const DEFAULT_DELAY = 5;

async function checkQualityGateStatus(login: string, password: string, sonarHost: string, projectKey: string) {
  const gateUrl =
    sonarHost +
    '/api/qualitygates/project_status?projectKey=' +
    projectKey;

  return await checkReportStatus(login, password).then(async reportStatus => {
    debug('reportStatus : ' + reportStatus);
    console.log('Check the Quality gate ' + gateUrl);
    const srvUrl = url.parse(gateUrl);

    const options = {
      host: srvUrl.hostname,
      path: srvUrl.path
    };
    await addAuthHeader(options, login, password);
    return new Promise((resolve, reject) => {
      const req = http.request(options, response => {
        if (response.statusCode !== 200) {
          console.error('Error requesting the Report status');
          reject('SonarQube replied the status code ' + response.statusCode);
        } else {
          let body = '';
          response.on('data', function(chunk) {
            body += chunk;
          });
          req.on('error', function(err) {
            console.error('Error requesting the Quality Gate status');
            reject(err);
          });
          response.on('end', async function() {
            await processGateResponse(body, resolve, reject);
          });
        }
      });
      req.end();
    });
  });
}

async function processGateResponse(body: string, resolve: any, reject: any) {
  const gateResponse = JSON.parse(body);
  const status = gateResponse.projectStatus.status;
  console.log('QUALITY GATE STATUS : ' + status);
  if (status != 'OK' && status != 'WARN') {
    console.error('QUALITY GATE HAS FAILED');
    const errors = gateResponse.projectStatus.conditions
      .filter((cond: { status: string; }) => cond.status == 'ERROR')
      .map(
        (        cond: { metricKey: any; actualValue: any; comparator: any; errorThreshold: any; }) =>
          `[${cond.metricKey}]: ${cond.actualValue} ${cond.comparator} ${cond.errorThreshold}`
      )
      .join(', ');
    debug(errors);
    reject(errors);
  }
  resolve('OK');
}

// TODO : max checks ?
/**
 *
 * @param {*} login login to the SonarQube API. Use it too for tokens. Let it empty or undefined if no authentication is required.
 * @param {*} password password to the SonarQube API. Use empty value for tokens.
 * @param {*} delayBetweenChecksInSecs Defaults to 5
 */
async function checkReportStatus(
  login: string,
  password: string = '',
  delayBetweenChecksInSecs: number = DEFAULT_DELAY
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    await exec.exec("ls -al");
    await exec.exec("ls -al .scannerwork");
    const reportInfo = fs.readFileSync(REPORT_FILE, 'utf8');
    const taskUrl = reportInfo.match(/ceTaskUrl=(.*)/)?.[1];
    if(taskUrl == null)
    {
        throw new Error("")
    }
    console.log('Report Status Url : ' + taskUrl);
    const srvUrl = url.parse(taskUrl);
    const options = {
      host: srvUrl.hostname,
      path: srvUrl.path
    };
    await addAuthHeader(options, login, password);

    const req = http.request(options, response => {
      if (response.statusCode !== 200) {
        console.error('Error requesting the Report status');
        reject('SonarQube replied the status code ' + response.statusCode);
      } else {
        let body = '';
        response.on('data', function(chunk) {
          body += chunk;
        });
        req.on('error', function(err) {
          console.error('Error requesting the Report status');
          reject(err);
        });
        response.on('end', function() {
          debug('Raw response from SonarQube API');
          debug('"' + body + '"');
          // on first call, API response might be empty
          if (body === '') {
            resolve('');
          } else {
            const taskResponse = JSON.parse(body);
            resolve(taskResponse.task.status);
          }
        });
      }
    });
    req.end();
  }).then(status => {
    console.log('Report status : ' + status);
    if (status === '' || status === 'IN_PROGRESS' || status === 'PENDING') {
      console.log(
        'Retry until report ends in ' + delayBetweenChecksInSecs + 's'
      );
      return delay(delayBetweenChecksInSecs * 1000).then(() => {
        return checkReportStatus(login, password, delayBetweenChecksInSecs);
      });
    } else {
      return status;
    }
  });
}

async function addAuthHeader(options: http.RequestOptions, login: string, password: string) {
  let auth = null;
  if (login !== '' && login !== undefined) {
    debug('Authentication active');
    auth = 'Basic ' + new Buffer(login + ':' + password).toString('base64');
  } else {
    debug('No authentication active');
  }
  if (auth) {
    options.headers = {
      Authorization: auth
    };
  }
}

// Add delay in the promise chain
function delay(t: number) {
  return new Promise(function(resolve) {
    setTimeout(resolve, t);
  });
}

async function run(): Promise<void> {
  let login = core.getInput("login");
  let password = core.getInput("password");
  let sonarHost = core.getInput("sonarHost");
  let projectKey = core.getInput("projectKey");

  await checkQualityGateStatus(login, password, sonarHost, projectKey);
}

run().catch(error => core.setFailed(error.message))