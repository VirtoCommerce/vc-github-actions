
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

    Start-Sleep -s $WaitSeconds

    $attempt = 1
    $responseStatus = 0
    do 
    {
        Start-Sleep -s $RetrySeconds
        try {
            Write-Host "Try to open $ApiUrl. Attempt # $attempt of $maxRepeat."
            $HTTP_Request = [System.Net.WebRequest]::Create($ApiUrl) # First we create the request.
            $response = $HTTP_Request.GetResponse()
            $responseStatus = [int] $response.StatusCode
        }
        finally {
            $attempt ++
            if ( $null -ne $response ) 
            {
                $response.Close()  # Finally, we clean up the http request by closing it.
            }
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

