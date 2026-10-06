param(
    [string]$Distribution = "Ubuntu-24.04",
    [string]$LinuxUser = "sean8"
)

$ErrorActionPreference = "Stop"
$wsl = "$env:SystemRoot\System32\wsl.exe"
# Both the existing boot and logon tasks can invoke this script. One instance
# holds WSL open across SSH logout and an idle desktop.
$mutex = New-Object System.Threading.Mutex($false, "Global\HawksWslKeepAlive")
$ownsMutex = $false
try {
    try { $ownsMutex = $mutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { exit 0 }
    while ($true) {
        & $wsl -d $Distribution -u root --exec /usr/bin/systemctl start tailscaled ssh
        if ($LASTEXITCODE -eq 0) {
            # A systemd service alone does not keep the WSL VM running.
            & $wsl -d $Distribution -u $LinuxUser --exec /bin/sleep infinity
        }
        Start-Sleep -Seconds 15
    }
}
finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
