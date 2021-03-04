Param(
    $apiurl,
    $hmacAppId,
    $hmacSecret,
    $catalogId,
    $categoryId,
    $moduleId,
    $moduleUrl
)

. $PSScriptRoot\utilities.ps1   

if ([string]::IsNullOrWhiteSpace($hmacAppId)) {
    $hmacAppId = "${env:HMAC_APP_ID}"
}

if ([string]::IsNullOrWhiteSpace($hmacSecret)) {
    $hmacSecret = "${env:HMAC_SECRET}"
}     

$listEntriesUrl = "$apiurl/api/catalog/listentries"
$productUrl = "$apiurl/api/catalog/products"
$productCode = $moduleId.Replace(".", "_")

# Initiate modules installation
$headerValue = Create-Authorization $hmacAppId $hmacSecret
$headers = @{
    "Authorization" = $headerValue
    "content-type"  = "application/json;charset=UTF-8"
    "accept"        = "application/json"
}

$listEntriesBody = @{
    "catalogId"        = $catalogId
    "categoryId"       = $categoryId
    "keyword"          = $productCode
    "responseGroup"    = "withCategories, withProducts"
    "searchVariations" = "false"
    "skip"             = 0
    "sort"             = "ASC"
} | ConvertTo-Json
$result = Invoke-RestMethod -Uri $listEntriesUrl -Method Post -Headers $headers -Body $listEntriesBody

foreach ($entry in $result.listEntries) {
    Write-Output $entry
    if ($entry.code -eq $productCode) {    
        $productId = $entry.id
        $productInfo = Invoke-RestMethod -Uri "$productUrl/$productId" -Method Get -Headers $headers

        Write-Output "_________"
        foreach ($property in $productInfo.properties) {
            if ($property.name -eq "DownloadLink") {
                Write-Output $property.values
                Write-Output $property.values[0].value
                $property.values[0].value = $moduleUrl
            }
        }
        $productInfoJson = $productInfo | ConvertTo-Json -Depth 7
        $productUpdateResult = Invoke-RestMethod -Uri $productUrl -Method Post -Headers $headers -Body $productInfoJson
        Write-Output $productUpdateResult
    }
}