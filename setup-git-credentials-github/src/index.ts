import * as core from '@actions/core'
import * as exec from '@actions/exec'
import fs from 'fs'
import os from 'os'

async function getConfigHome()
{
    const xdg_home =  process.env['XDG_CONFIG_HOME'];
    if(xdg_home)
        return xdg_home;
    return `${os.homedir()}/.config`;
}

async function setupCredentials(user: string, pass: string)
{
    let githubCreds = `https://${user}:${pass}@github.com`;
    let configHome = await getConfigHome();
    await fs.mkdirSync(`${configHome}/git`, { recursive: true });
    await fs.writeFileSync(`${configHome}/git/credentials`, githubCreds, { flag: 'a', mode: 0o600 });

    await exec.exec('git', ['config', '--global', 'credential.helper', 'store']);
	await exec.exec('git', ['config', '--global', '--replace-all', 'url.https://github.com/.insteadOf', 'ssh://git@github.com/']);
	await exec.exec('git', ['config', '--global', '--add', 'url.https://github.com/.insteadOf', 'git@github.com:']);
}

async function run(): Promise<void> {
    let gitUserEmail = core.getInput("gitUserEmail");
    let gitUserName = core.getInput("gitUserName");
    let githubToken = core.getInput("githubToken") ?? process.env.GITHUB_TOKEN;
    await exec.exec(`git config --global user.email "${gitUserEmail}"`);
    await exec.exec(`git config --global user.name "${gitUserName}"`);
    await setupCredentials(gitUserName,  githubToken);
}

run().catch(error =>core.setFailed(error.message));