const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');
const Axios = require('axios');
const fs = require('fs');

async function downloadFile(url, outFile) {
    const path = outFile;
    const writer = fs.createWriteStream(path);
  
    const response = await Axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
          'Accept': 'application/octet-stream'
      }
    })
    
    response.data.pipe(writer)
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
}

async function prepareDockerfile(urls)
{
    console.log(urls);
    for(let url of urls.split(';'))
    {
        if(url)
        {
            let filename = url.substring(url.lastIndexOf('/')+1);
            console.log(`Filename: ${filename}`);
            let outName = `artifacts/${filename}`;
            console.log(outName);
            await downloadFile(url, outName);
        }
    }
    await exec.exec(`cat artifacts/Dockerfile`);
}

async function buildImage(imageName, tag)
{
    let imageFullName = `ghcr.io/${github.context.repo.owner}/${imageName}`;
    core.setOutput("imageName", imageFullName);
    core.info(`imageFullName is: ${imageFullName}`);
    let command = `docker build artifacts --build-arg SOURCE=. --tag "${imageFullName}:${tag}"`;
    await exec.exec(command);
}

async function run()
{
    let dockerTag = core.getInput("tag");
    let imageName = core.getInput("imageName");
    let dockerfiles = core.getInput("dockerFiles");
    if(!imageName)
    {
        imageName = await utils.getProjectType();
    }
    await prepareDockerfile(dockerfiles);
    await buildImage(imageName, dockerTag)
}

run().catch(err => core.setFailed(err.message));
