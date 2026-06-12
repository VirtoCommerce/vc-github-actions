import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
    let platformUrl = core.getInput('platformUrl');
    let swaggerEndpoint = core.getInput('swaggerEndpoint');
    let validatorUrl = core.getInput('validatorUrl');
    let swaggerUrl = `${platformUrl}${swaggerEndpoint}`;

    await exec.exec(`wget -d -t 5 --retry-connrefused ${swaggerUrl} -O ./swagger.json`);
    await exec.exec(`vc-build ValidateSwaggerSchema -SwaggerSchemaPath ./swagger.json -SwaggerValidatorUri ${validatorUrl}`);
}

run().catch(error => core.setFailed(error.message));