const { execute } = require("katalon-cli/src/katalon-studio");
const core = require("@actions/core");
const exec = require("@actions/exec");

const user_version = core.getInput("version");
const user_projectPath = core.getInput("projectPath");
const user_args = core.getInput("args");
const xvfbConf = core.getInput("xvfbConfiguration");

try {
  // let displays = exec.exec("xrandr --query");
  // if(user_args.indexOf("-webui.autoUpdateDrivers") == -1){
  //   user_args = `${user_args} -webui.autoUpdateDrivers=true`;
  // }
  execute(user_version, "", user_projectPath, user_args, "", "--auto-servernum --server-args=\"-screen 0 1920x1080x24\"", { // -n 99 --server-args="-screen 99 1920x1080x24
    info: function (message) {
      console.log(message);
    },
    debug: function (message) {
      console.log(message);
    },
    error: function (message) {
      console.error(message);
    },
  })
    .then((status) => {
      if (status !== 0) {
        core.setFailed(`Exit code ${status}.`);
      }
    })
    .catch((err) => {
      console.error(err);
      core.setFailed(err);
    });
} catch (error) {
  console.error(error);
  core.setFailed(error.message);
}
