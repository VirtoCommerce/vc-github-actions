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
os.system(login_cmd)

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

ENTERPRISE_LIMIT = 10000000000
PRO_LIMIT = 6000000000
STARTUP_LIMIT = 3000000000

tier_map = {
    'vcpt/platform': ENTERPRISE_LIMIT,
    'vcpt/docs': ENTERPRISE_LIMIT,
    'vcpt/storefront': ENTERPRISE_LIMIT,
    'virtostart/platform': ENTERPRISE_LIMIT,
    'virtostart/storefront': ENTERPRISE_LIMIT,
    'tokyo/docs': ENTERPRISE_LIMIT,
    'tokyo/platform': ENTERPRISE_LIMIT,
    'vcmp/platform': ENTERPRISE_LIMIT,
    'vcmp/storefront':ENTERPRISE_LIMIT,
    'hxp/platform': ENTERPRISE_LIMIT,
    'hxp/storefront': ENTERPRISE_LIMIT
}

with ContainerRegistryClient(endpoint, DefaultAzureCredential(), audience="https://management.azure.com") as client:
    for repository in client.list_repository_names():
        repository_size = 0
        repository_properties = client.get_repository_properties(repository)
        for manifest in client.list_manifest_properties(repository):
                repository_size += manifest._size_in_bytes
        if repository_size > tier_map[repository]:
            log.info(repository + ' size has been exceeded')
            cmd = "az acr scope-map update --registry VirtoPaaSRegistryMain --resource-group eastus-vc-master --name {scope_name} --remove-repository {repository} content/write".format(scope_name = scope_names[repository], repository = repository)
            myTeamsMessage = pymsteams.connectorcard(WEB_HOOK_URL)
            myTeamsMessage.text(repository + ' size has been exceeded. Permission')
            myTeamsMessage.send()
            os.system(cmd)


                                            
              
