
function Watch-Url-Up {
    param 
    (
        [string]$ApiUrl = "http://localhost:8090", # Host URL
        [int]$TimeoutMinutes = 15,                 # Max period of time for retry attempts in minutes
        [int]$RetrySeconds = 15,                   # Period of time between retry attempts in seconds
        [int]$WaitSeconds = 60                     # Period of time before start retry attempts in seconds
    )

    $responseStatus = 0
    [int]$maxRepeat = $TimeoutMinutes * 60 / $RetrySeconds

    Write-Host "Wait before $ApiUrl check status attempts for $WaitSeconds seconds"
    Start-Sleep -s $WaitSeconds

    $attempt = 1
    $responseStatus = 0
    do 
    {
        
        Write-Host "Try to open $ApiUrl. Attempt # $attempt of $maxRepeat."
        try {
            $response = Invoke-WebRequest $ApiUrl -Method Get
            $responseStatus = [int] $response.StatusCode
        }
        catch{
            if ($maxRepeat -gt $attempt) {
                Start-Sleep -s $RetrySeconds
            }
            $attempt ++
        }
    } until ($responseStatus -eq 200 -or $maxRepeat -lt $attempt)

    if ($responseStatus -eq 200) {
        Write-Host "$ApiUrl is up!"
        $result = $true
    }
    else {
        Write-Host "$ApiUrl may be down, please check!"
        $result = $false
    }

    return $result
}