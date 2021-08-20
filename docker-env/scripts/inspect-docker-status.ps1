function InspectContainerStatus {
    param (
        $ContainerId = "virtocommerce_vc-platform-web_1",
        [int]$TimeoutMinutes = 5,                  # Max period of time for retry attempts in minutes
        [int]$RetrySeconds = 15,                   # Period of time between retry attempts in seconds
        [int]$WaitSeconds = 0                      # Period of time before start retry attempts in seconds
    )

    [int]$maxRepeat = $TimeoutMinutes * 60 / $RetrySeconds

    Write-Host "Wait before start attempts for $WaitSeconds seconds"
    Start-Sleep -s $WaitSeconds

    $attempt = 1
    do 
    {
        Write-Host "Check $ContainerId status. Attempt # $attempt of $maxRepeat."
        $status = (docker container inspect -f '{{.State.Status}}' $ContainerId)
        Write-Output ("$ContainerId container current status is $status")
        if ($maxRepeat -gt $attempt -and $status -ne "running") {
            docker logs $ContainerId
            Start-Sleep -s $RetrySeconds
        }
        $attempt ++

    } until ($status -eq "running" -or $maxRepeat -lt $attempt)
}

