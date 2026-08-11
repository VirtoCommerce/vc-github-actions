Param(
    [parameter(Mandatory = $true)]
    $ApiUrl,
    $Username = "admin",
    $Password = "store",
    $ContainerId = "virtocommerce-vc-platform-web-1",
    $watchUrlScriptPath = "./scripts/watch-url-up.ps1"
)

. $watchUrlScriptPath

$appAuthUrl = "$ApiUrl/connect/token"
$checkModulesUrl = "$ApiUrl/api/platform/modules"

function Get-AuthToken {
    param (
        $appAuthUrl,
        $username,
        $password
    )
    Write-Output "Get-AuthToken: appAuthUrl $appAuthUrl"
    $grant_type = "password"
    $content_type = "application/x-www-form-urlencoded"

    $body = @{username = $username; password = $password; grant_type = $grant_type }
    $response = Invoke-WebRequest -Uri $appAuthUrl -Method Post -ContentType $content_type -Body $body -SkipCertificateCheck -MaximumRetryCount 5 -RetryIntervalSec 5
    $responseContent = $response.Content | ConvertFrom-Json
    return $responseContent.access_token
}

# WaitSeconds 0: the caller (docker-env-full's "Start containers" step) already confirmed
# vc-platform-web is running via InspectContainerStatus before this script runs, so there's
# no reason to blind-sleep before the first HTTP check — a not-yet-ready app just fails the
# first attempt and falls into the normal RetrySeconds retry loop below, at no extra cost.
$platformIsUp = (Watch-Url-Up -ApiUrl $ApiUrl -TimeoutMinutes 15 -RetrySeconds 5 -WaitSeconds 0 -ContainerId $ContainerId)

if ($platformIsUp) {
    $authToken = (Get-AuthToken $appAuthUrl $Username $Password)[1]
    $headers = @{}
    $headers.Add("Authorization", "Bearer $authToken")
    $modules = Invoke-RestMethod $checkModulesUrl -Method Get -Headers $headers -SkipCertificateCheck -MaximumRetryCount 5 -RetryIntervalSec 5
    $installedModules = 0
    if ($modules.Length -le 0) {
        Write-Output "No module's info returned"
        exit 1
    }
    Foreach ($module in $modules) {
        if ($module.isInstalled) {
            Write-Host "`e[32m$($module.id) version $($module.version) is installed"
            $installedModules++
        }
        if ($module.validationErrors.Length -gt 0) {
            Write-Output $module.id
            Write-Output $module.validationErrors
            exit 1
        }
    }
    Write-Output "Modules installed: $installedModules"
    if ($installedModules -lt 23) {
        exit 1
    }
}

