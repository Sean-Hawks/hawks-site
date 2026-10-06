$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script in an Administrator PowerShell window."
}

$backupDir = Join-Path $env:LOCALAPPDATA ("Hawks\wsl-task-backups-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
foreach ($taskName in @("Start WSL Ubuntu Tailscale", "Start WSL Ubuntu Tailscale at Logon")) {
    Export-ScheduledTask -TaskName $taskName | Set-Content -Encoding UTF8 (Join-Path $backupDir ($taskName + ".xml"))
    $task = Get-ScheduledTask -TaskName $taskName
    $settings = $task.Settings
    $settings.ExecutionTimeLimit = "PT0S"
    $settings.RestartCount = 3
    $settings.RestartInterval = "PT1M"
    Set-ScheduledTask -TaskName $taskName -Settings $settings | Out-Null
}

& "$env:ProgramFiles\Tailscale\tailscale.exe" set --unattended=true
if ($LASTEXITCODE -ne 0) { throw "Could not enable Tailscale unattended mode." }
Start-ScheduledTask -TaskName "Start WSL Ubuntu Tailscale"
Write-Host "WSL startup tasks updated; Tailscale unattended mode enabled."
Write-Host "Backups: $backupDir"
