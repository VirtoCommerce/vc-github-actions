[CmdletBinding()]
param (
    [string]$platformUrl = 'http://localhost:8090',
    [string]$adminUsername = 'admin', 
    [string]$adminPassword = 'store',
    [string]$newAdminPassword
)

function CreateUser {
    param (
        [string]$username,
        [string]$password,
        [bool]$isAdministrator = $false,
        [string]$token,
        [string]$userType = 'Customer',
        [string]$storeId
    )
    $body = @{
        "email"           = "$username"
        "userName"        = "$username"
        "isAdministrator" = $isAdministrator
        "password"        = "$password"
        "status"          = "Approved"
        "userType"        = "$userType"
        "storeId"         = "$storeId"
    }
    $headers = @{
        "accept"        = "application/json"
        "Content-Type"  = "application/json-patch+json"
        "Authorization" = "Bearer $token"
    }
    Write-Host "Creating user $username ..."
    $result = Invoke-WebRequestWithRetry -Uri "$platformUrl/api/platform/security/users/create" -Body ($body | ConvertTo-Json) -Headers $headers -Method POST | ConvertFrom-Json
    if ($result.succeeded -eq $false) {
        Write-Error "Create user succeeded: $($result.succeeded). $($result.errors)"
    }
    else {
        Write-Host "... user $username created successfully"
    }
}

function ResetUserPassword {
    param (
        [string]$username,
        [string]$newPassword,
        [string]$token
    )

    $body = @{  
        "newPassword"                     = "$newPassword"
        "forcePasswordChangeOnNextSignIn" = $false
    }
    $headers = @{
        "Content-Type"  = "application/json-patch+json"
        "Authorization" = "Bearer $token"
    }
    Write-Host "Resetting '$username' user password ..."
    $username = [System.Web.HttpUtility]::UrlEncode($username)
    $resultResetPassword = Invoke-WebRequestWithRetry -Uri "$platformUrl/api/platform/security/users/$username/resetpassword" -Body ($body | ConvertTo-Json) -Headers $headers -Method POST | ConvertFrom-Json
    if ($resultResetPassword.succeeded -eq $false) {
        Write-Error "Reset user password succeeded: $($resultResetPassword.succeeded). $($resultResetPassword.error)"
    }
    else {
        Write-Host "... user $username password reset successfully"
    }

    # unlock user
    $body = @{
        "isLockedOut" = $false
    }
    $userId = (Invoke-WebRequestWithRetry -Uri "$platformUrl/api/platform/security/users/$username" -Headers $headers -Method GET | ConvertFrom-Json).id
    $resultUnlock = Invoke-WebRequestWithRetry -Uri "$platformUrl/api/platform/security/users/$userId/unlock" -Body ($body | ConvertTo-Json) -Headers $headers -Method POST | ConvertFrom-Json
    if ($resultUnlock.succeeded -eq $false) {
        Write-Error "Unlock user succeeded: $($resultUnlock.succeeded). $($resultUnlock.error)"
    }
    else {
        Write-Host "... user $username unlocked successfully"
    }
}

function Invoke-WebRequestWithRetry {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [string]$OutFile,
        [int]$MaxRetries = 3,
        [int]$RetryDelaySeconds = 1,
        [string]$Body = '',
        [hashtable]$Headers = @{},
        [string]$Method = 'GET'
    )
    
    $retryCount = 0
    while ($retryCount -lt $MaxRetries) {
        try {
            if ($OutFile) {
                Invoke-WebRequest -Uri $Uri -OutFile $OutFile -TimeoutSec 15 -Headers $Headers -Body $Body -Method $Method
            }
            else {
                return Invoke-WebRequest -Uri $Uri -TimeoutSec 15 -Headers $Headers -Body $Body -Method $Method
            }
            return
        }
        catch {
            $retryCount++
            if ($retryCount -eq $MaxRetries) {
                Write-Error "Failed invoke request after $MaxRetries attempts: $_"
                throw
            }
            Write-Warning "Attempt $retryCount failed, retrying in $RetryDelaySeconds seconds..."
            Start-Sleep -Seconds $RetryDelaySeconds
        }
    }
}

function SetApiKey {

    param (
        [string]$username,
        [string]$apiKey,
        [string]$token
    )
    # set api key
    $headers = @{
        "Content-Type"  = "application/json-patch+json"
        "Authorization" = "Bearer $adminToken"
    }
    Write-Host "Setting api key for user $username ..."
    $userId = (Invoke-WebRequestWithRetry -Uri "$platformUrl/api/platform/security/users/$adminUsername" -Headers $headers -Method GET | ConvertFrom-Json).id

    $body = @{
        "apiKey"   = "$apiKey"
        "userName" = "$adminUsername"
        "isActive" = $true
        "userId"   = "$userId"
    }

    $apiKeyResult = Invoke-WebRequestWithRetry -Uri "$platformUrl/api/platform/security/users/apikeys" -Body ($body | ConvertTo-Json) -Headers $headers -Method PUT
    if ($apiKeyResult.succeeded -eq $false) {
        Write-Error "Set api key for user $username succeeded: $($apiKeyResult.succeeded). $($apiKeyResult.error)"
    }
    else {
        Write-Host "... api key for user $username set successfully"
    }
}

$adminToken = ''

# get token
$body = "grant_type=password&username=$adminUsername&password=$adminPassword"
$headers = @{
    "accept"       = "application/json"
    "Content-Type" = "application/x-www-form-urlencoded"
}
$adminToken = (Invoke-WebRequestWithRetry -Uri "$platformUrl/connect/token" -Body $body -Headers $headers -Method POST).Content | ConvertFrom-Json
$adminToken = $adminToken.access_token

# change user passwords
ResetUserPassword -username "$adminUsername" -newPassword "$newAdminPassword" -token "$adminToken"