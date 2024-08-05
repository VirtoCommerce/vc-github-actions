param (
        [string]$ContainerId = "virtocommerce_vc-platform-web_1",
        [int]$TimeoutMinutes = 5,                  # Max period of time for retry attempts in minutes
        [int]$RetrySeconds = 15,                   # Period of time between retry attempts in seconds
        [int]$WaitSeconds = 0                      # Period of time before start retry attempts in seconds
    )

Set-Variable -Name "TERM" -Value "xterm-color"

function InspectContainerStatus {
    param (
        [string]$ContainerId,
        [int]$TimeoutMinutes,
        [int]$RetrySeconds,
        [int]$WaitSeconds
    )

    [int]$maxRepeat = $TimeoutMinutes * 60 / $RetrySeconds

    Write-Host "`e[33mWait before check $ContainerId container status attempts for $WaitSeconds seconds." 
    Start-Sleep -s $WaitSeconds

    $attempt = 1
    do 
    {
        Write-Host "`e[33mCheck $ContainerId container status. Attempt # $attempt of $maxRepeat."
        $status = (docker container inspect -f '{{.State.Status}}' $ContainerId)
        Write-Host "`e[33m$ContainerId container current status is $status."
        docker logs $ContainerId
        if ($maxRepeat -gt $attempt -and $status -ne "running") {
            Start-Sleep -s $RetrySeconds
        }
        $attempt ++

    } until ($status -eq "running" -or $maxRepeat -lt $attempt)
}