import * as core from "@actions/core";
import request from "request";

async function sendTeamsMessage(webhookUri: string, body: string) {
    request(webhookUri, {
        method: "POST",
        body: body
        })
}

async function run(): Promise<void> {
    
    const webhookUri = core.getInput("webhook_uri");
    const body = core.getInput("body");

    sendTeamsMessage(webhookUri, body)

}

run().catch(error => core.setFailed(error.message));