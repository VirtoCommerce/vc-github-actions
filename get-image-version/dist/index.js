/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 471:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 256:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 198:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 934:
/***/ ((module) => {

module.exports = eval("require")("@virtocommerce/vc-actions-lib");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(471);
const exec = __nccwpck_require__(256);
const github = __nccwpck_require__(198);
const utils = __nccwpck_require__(934);
const defaultPath = '.';
const validProjectTypes = [
    utils.projectTypeTheme,
    utils.projectTypeModule,
    utils.projectTypePlatform,
    utils.projectTypeStorefront
];

function pushOutputs(branchName, prefix, suffix, moduleId, moduleDescription="", projectUrl="", iconUrl="") {
    branchName = branchName.substring(branchName.lastIndexOf('/') + 1, branchName.length).toLowerCase();
    const sha = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.sha.substring(0, 8) : github.context.sha.substring(0, 8);
    const fullSuffix = (suffix) ? suffix + '-' + branchName : branchName;
    const shortVersion = (suffix) ? prefix + '-' + suffix : prefix;
    const tag = prefix + '-' + branchName + '-' + sha;
    const fullVersion = prefix + '-' + fullSuffix;
    const taggedVersion = prefix + '-' + fullSuffix + '-' + sha;

    core.setOutput("branchName", branchName);
    core.setOutput("prefix", prefix);
    core.setOutput("suffix", suffix);
    core.setOutput("fullSuffix", fullSuffix);
    core.setOutput("moduleId", moduleId);
    core.setOutput("sha", sha);
    core.setOutput("shortVersion", shortVersion);
    core.setOutput("tag", tag);
    core.setOutput("fullVersion", fullVersion);
    core.setOutput("taggedVersion", taggedVersion);
    core.setOutput("moduleDescription", moduleDescription);
    core.setOutput("projectUrl", projectUrl);
    core.setOutput("iconUrl", iconUrl);

    console.log(`Branch name is: ${branchName}`);
    console.log(`Version prefix is: ${prefix}`);
    console.log(`Version suffix is: ${suffix}`);
    console.log(`Version fullSuffix is: ${fullSuffix}`);
    console.log(`Module Id is: ${moduleId}`);
    console.log(`SHA is: ${sha}`);
    console.log(`Short version is: ${shortVersion}`);
    console.log(`Tag is: ${tag}`);
    console.log(`Full version is: ${fullVersion}`);
    console.log(`Tagged version is: ${taggedVersion}`);
    
    console.log(`moduleDescription: ${moduleDescription}`);
    console.log(`projectUrl: ${projectUrl}`);
    console.log(`iconUrl: ${iconUrl}`);

}
async function getCommitCount(baseBranch) {
    try {
        let output = '';
        let err = '';

        // These are option configurations for the @actions/exec lib`
        const options = {};
        options.listeners = {
            stdout: (data) => {
                output += data.toString();
            },
            stderr: (data) => {
                err += data.toString();
            }
        };

        await exec.exec(`git rev-list --count ${baseBranch}`, [], options).then(exitCode => console.log(`git rev-list --count exitCode: ${exitCode}`));
        const commitCount = output.trim();

        if (commitCount) {
            console.log('\x1b[32m%s\x1b[0m', `${baseBranch} branch contain: ${commitCount} commits`);
            result = commitCount;
        } else {
            core.setFailed(err);
        }
    } catch (err) {
        core.setFailed(`Could not get commit counts because: ${err.message}`);
    }
    return result;
}

async function run() 
{
    // const releaseBranch = core.getInput("releaseBranch");
    if ( core.getInput("releaseBranch") === "master"){
        let actualBranch = github.context.ref;
        console.log(`actualBranch: ${actualBranch}`);
        if (actualBranch === "refs/heads/main"){
            const releaseBranch = "main";
        } else {
            const releaseBranch = "master";
        }
    }
    let path = core.getInput("path");
    const inputProjectType = core.getInput("projectType");
    path = path.replace(/\/+$/, ''); // remove trailing slashes
    let prefix = "";
    let suffix = "";
    let moduleId = "";
    let branchName = "";

    let projectType = validProjectTypes.includes(inputProjectType.toLowerCase()) ? inputProjectType.toLowerCase() : await utils.getProjectType();
    let versionInfo = null;
    let moduleDescription = "";
    let projectUrl = "";
    let  iconUrl = "";
    console.log(`Project Type: ${projectType}`);
    switch(projectType) {
        case utils.projectTypeTheme:
            versionInfo = await utils.getInfoFromPackageJson(`${path}/package.json`);
            prefix = versionInfo.version;
            break;
        case utils.projectTypeModule:
            let manifestPathTemplate = "src/*/module.manifest";
            if (path !== defaultPath) {
                manifestPathTemplate = `${path}/module.manifest`
            }
            let manifests = await utils.findFiles(manifestPathTemplate);
            let manifestPath = manifests[0];
            versionInfo = await utils.getInfoFromModuleManifest(manifestPath);
            let buildPropsVersionInfo = await utils.getInfoFromDirectoryBuildProps(`${path}/Directory.Build.props`);
            prefix = versionInfo.prefix;
            suffix = versionInfo.suffix;
            moduleId = versionInfo.moduleId;
            moduleDescription = versionInfo.moduleDescription;
            projectUrl = versionInfo.projectUrl;
            iconUrl = versionInfo.iconUrl;

            if(prefix !== buildPropsVersionInfo.prefix || suffix !== buildPropsVersionInfo.suffix){
                core.setFailed(`Versions in module.manifest and Directory.Build.props are different! module.manifest: ${prefix}-${suffix} vs. Directory.Build.props: ${buildPropsVersionInfo.prefix}-${buildPropsVersionInfo.suffix}`);
                console.log('Try to set an equal version number in module.manifest and Directory.Build.props');
                return;
            }
            break;
        case utils.projectTypePlatform:
        case utils.projectTypeStorefront:
            versionInfo = await utils.getInfoFromDirectoryBuildProps(`${path}/Directory.Build.props`);
            prefix = versionInfo.prefix;
            suffix = versionInfo.suffix; 
            break;
    }

    branchName = github.context.eventName.startsWith('pull_request') ? github.context.payload.pull_request.head.ref : github.context.ref;
    if (github.context.eventName.startsWith('pull_request')){
        branchName = github.context.payload.pull_request.head.ref;
    
        const sha = github.context.payload.pull_request.head.sha.substring(0, 4);
        suffix = `pr-${github.context.payload.pull_request.number}-${sha}`;
    }
    else {
        branchName = github.context.ref;
    }

    if (branchName.indexOf('refs/heads/') > -1) {
        branchName = branchName.slice('refs/heads/'.length);
    }

    if (suffix === "" && releaseBranch !== branchName) {
        getCommitCount(branchName).then(result => { pushOutputs(branchName, prefix, `alpha.${result}`, moduleId, moduleDescription, projectUrl, iconUrl); })
    } else {
        pushOutputs(branchName, prefix, suffix, moduleId, moduleDescription, projectUrl, iconUrl);
    }
}

run().catch(err => core.setFailed(err.message));
})();

module.exports = __webpack_exports__;
/******/ })()
;