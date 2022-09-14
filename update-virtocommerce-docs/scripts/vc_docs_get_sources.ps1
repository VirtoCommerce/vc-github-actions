$ErrorActionPreference = 'Continue'

function Get-GithubPackageUrl {
	param (
		$Versions
	)
	foreach($version in $Versions){
		if($version.PackageUrl.Contains("github.com")){
			return $version.PackageUrl
		}
	}
	return $null
}

#Get platform src
git clone https://github.com/VirtoCommerce/vc-docs --branch "new_docs"

