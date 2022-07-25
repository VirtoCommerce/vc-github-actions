# Create a ContainerRegistryClient that will authenticate through Active Directory
from azure.containerregistry import ContainerRegistryClient
from azure.identity import DefaultAzureCredential
import os
import logging
import pymsteams
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


AZURE_CLIENT_ID = os.environ['INPUT_SERVICE_PRINCIPAL_ID']
AZURE_CLIENT_SECRET = os.environ['INPUT_SERVICE_PRINCIPAL_PASSWORD']
AZURE_TENANT_ID = os.environ['INPUT_TENANT_ID']
WEB_HOOK_URL = os.environ['INPUT_WEB_HOOK_URL']
login_cmd = "az login --service-principal -u {AZURE_CLIENT_ID} -p {AZURE_CLIENT_SECRET} --tenant {AZURE_TENANT_ID}".format(AZURE_CLIENT_ID = AZURE_CLIENT_ID, AZURE_CLIENT_SECRET = AZURE_CLIENT_SECRET, AZURE_TENANT_ID = AZURE_TENANT_ID)


endpoint = "virtopaasregistrymain.azurecr.io"
audience = "https://management.azure.com"
client = ContainerRegistryClient(endpoint, DefaultAzureCredential(), audience=audience)



scope_names = {
    'vcpt/platform': 'vcpt-repo-scope',
    'vcpt/docs': 'vcpt-repo-scope',
    'vcpt/storefront': 'vcpt-repo-scope',
    'virtostart/platform':'virtostart-scope',
    'virtostart/storefront':'virtostart-scope',
    'tokyo/docs': 'tokyo-scope',
    'tokyo/platform': 'tokyo-scope',
    'vcmp/platform':'vcmp-scope',
    'vcmp/storefront':'vcmp-scope',
    'hxp/platform':'hxp-scope',
    'hxp/storefront':'hxp-scope'
}

with ContainerRegistryClient(endpoint, DefaultAzureCredential(), audience="https://management.azure.com") as client:
    for repository in client.list_repository_names():
        repository_size = 0
        repository_properties = client.get_repository_properties(repository)
        for manifest in client.list_manifest_properties(repository):
                repository_size += manifest._size_in_bytes
        if repository_size > 10000000000:
            log.info(repository + ' size has been exceeded')
            cmd = "az acr scope-map update --registry VirtoPaaSRegistryMain --resource-group eastus-vc-master --name {scope_name} --remove-repository {repository} content/write".format(scope_name = scope_names[repository], repository = repository)
            myTeamsMessage = pymsteams.connectorcard(WEB_HOOK_URL)
            myTeamsMessage.text(repository + ' size has been exceeded. Permission')
            myTeamsMessage.send()
            os.system(cmd)


                                            
              
