const { execute } = require("katalon-cli/src/katalon-studio");
const core = require("@actions/core");

const user_version = core.getInput("version");
const user_projectPath = core.getInput("projectPath");
const user_args = core.getInput("args");

const retryCount = 180; // Waiting ~3 hours (180 * 60 seconds)
const retryTimeout = 60000; // 60 seconds

async function run() {
    for (let i = 0; i < retryCount; i++) {
        try {
            console.log(`Attempt ${i + 1} from ${retryCount} to execute Katalon Studio...`);
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
                console.log(`Katalon Studio execution succeeded.`);
                return;
            } else if (status === 3 || status === 2) {
                if (i < retryCount - 1) {
                    console.log(`Katalon Studio execution failed with status 3. Retrying... (attempt ${i + 1} from ${retryCount}, waiting ${retryTimeout / 1000}s before next try)`);
                    await new Promise(resolve => setTimeout(resolve, retryTimeout));
                }
                else {
                    console.log(`Katalon Studio execution failed with status 3 after ${retryCount} retriess`);
                    core.setFailed(`Katalon Studio execution failed with status 3 after ${retryCount} retries.`);
                    return;
                }
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
