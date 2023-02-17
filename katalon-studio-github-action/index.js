const { execute } = require("katalon-cli/src/katalon-studio");
const core = require("@actions/core");

const user_version = core.getInput("version");
const user_projectPath = core.getInput("projectPath");
const user_args = core.getInput("args");

const retryCount = 3;
const retryTimeout = 600000;

async function run() {
    for (let i = 0; i < retryCount; i++) {
        try {
            const status = await execute(user_version, "", user_projectPath, user_args, "", "--auto-servernum --server-args=\"-screen 0 1920x1080x24\"", {
                info: function (message) {
                    console.log(message);
                },
                debug: function (message) {
                    console.log(message);
                },
                error: function (message) {
                    console.error(message);
                },
            });

            if (status === 0) {
                console.log("Katalon Studio execution succeeded.");
                return;
            } else if (status === 3 && i < retryCount - 1) {
                console.log("Katalon Studio execution failed with status 3. Retrying...");
                await new Promise(resolve => setTimeout(resolve, retryTimeout));
            } else {
                core.setFailed(`Katalon Studio execution failed with status ${status}.`);
                return;
            }
        } catch (err) {
            console.error(err);
            core.setFailed(err);
            return;
        }
    }
}

run();
