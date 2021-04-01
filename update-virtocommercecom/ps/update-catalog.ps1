Param(
    $apiurl,
    $hmacAppId,
    $hmacSecret,
    $catalogId,
    $categoryId,
    $moduleId,
    $moduleUrl,
    $moduleDescription = "",
    $projectUrl = "",
    $iconUrl = ""
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
$newProductUrl = "$apiurl/api/catalog/$catalogId/categories/$categoryId/products/getnew"
$productCode = $moduleId.Replace(".", "_")
$moduleTitle = $moduleId.Substring($moduleId.IndexOf(".")+1)

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

$moduleFound = $false
foreach ($entry in $result.listEntries) {
    Write-Output $entry
    if ($entry.code -eq $productCode) {  
        $moduleFound = $true  
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

if($moduleFound -ne $true) {
    $newProduct = Invoke-RestMethod -Method Get -Uri $newProductUrl -Headers $headers
    $newProduct | Add-Member -Name "productType" -Type "NoteProperty" -Value "Digital"
    $newProduct | Add-Member -Name "vendor" -Type "NoteProperty" -Value "virtocommerce"
    $newProduct | Add-Member -Name "path" -Type "NoteProperty" -Value "Apps/Platform"
    $newProduct | Add-Member -Name "isBuyable" -Type "NoteProperty" -Value $true
    $newProduct | Add-Member -Name "maxQuantity" -Type "NoteProperty" -Value 0
    $newProduct | Add-Member -Name "minQuantity" -Type "NoteProperty" -Value 1
    $newProduct | Add-Member -Name "trackInventory" -Type "NoteProperty" -Value $false
    $newProduct | Add-Member -Name "name" -Type "NoteProperty" -Value $moduleTitle
    $newProduct | Add-Member -Name "imgSrc" -Type "NoteProperty" -Value $iconUrl
    $newProduct.code = $productCode

    Write-Output "Update properties"
    foreach($property in $newProduct.properties)
    {
        if($property.name -eq "DownloadLink")
        {
            Write-Output $property.values
            Write-Output $property.values[0].value
            #$property.values[0] | Add-Member -Name "value" -Type "NoteProperty" -Value $moduleUrl
            $property.values += getPropertyValue $property $moduleUrl
        }
        if($property.name -eq "Description"){
            #$property.values[0] | Add-Member -Name "value" -Type "NoteProperty" -Value $moduleDescription
            $property.values += getPropertyValue $property $moduleDescription
        }
        if($property.name -eq "ProjectLink"){
            #$property.values[0] | Add-Member -Name "value" -Type "NoteProperty" -Value $projectUrl
            $property.values += getPropertyValue $property $projectUrl
        }
    }
    $newProductJson = $newProduct | ConvertTo-Json -Depth 7
    $productUpdateResult = Invoke-RestMethod -Uri $productUrl -Method Post -Headers $headers -Body $newProductJson
    Write-Output $productUpdateResult
}