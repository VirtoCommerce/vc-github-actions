import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as utils from '@virtocommerce/vc-actions-lib'

async function run(): Promise<void> {
    let schemaUrl = core.getInput("url");
    let swaggerSchemaFile = "swagger.json";
    let validatorUrl = core.getInput("validatorUrl");
    await utils.downloadFile(schemaUrl, swaggerSchemaFile);
    await exec.exec(`vc-build ValidateSwaggerSchema -SwaggerSchemaPath ${swaggerSchemaFile} -SwaggerValidatorUri ${validatorUrl}`);
}