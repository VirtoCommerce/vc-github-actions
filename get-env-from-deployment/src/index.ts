import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'yaml'

async function run(): Promise<void> {
    
}

run().catch(error => core.setFailed(error.message));