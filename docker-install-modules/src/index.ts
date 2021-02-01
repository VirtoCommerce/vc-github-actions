import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as utils from '@virtocommerce/vc-actions-lib'

async function run(): Promise<void> {
    
}

run().catch(error => core.setFailed(error.message));