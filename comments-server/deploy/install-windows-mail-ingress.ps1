# Run in Administrator PowerShell after reviewing both scripts.
# Does not change router mappings or DNS. Only SMTP port 25 is public.
$ErrorActionPreference='Stop'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if (-not ([Security.Principal.WindowsPrincipal]::new($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Please run this script from Administrator PowerShell.'
}
$target=Join-Path $env:ProgramData 'Hawks\Mail'
$source=Join-Path $PSScriptRoot 'windows-mail-ingress.ps1'
if (-not (Test-Path $source)) { throw "Missing $source" }
New-Item -ItemType Directory -Force -Path $target | Out-Null
# SYSTEM runs this code, so ordinary users must not be allowed to change it.
& icacls.exe $target /reset | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to reset service directory permissions.' }
& icacls.exe $target /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to protect service directory.' }
$taskName='Hawks Mail SMTP Ingress'
$installed=Join-Path $target 'windows-mail-ingress.ps1'
$oldTask=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
$backup=Join-Path $target ('backups\'+(Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force -Path $backup | Out-Null
if ($oldTask) {
    Export-ScheduledTask -TaskName $taskName | Set-Content (Join-Path $backup 'task.xml') -Encoding UTF8
    Stop-ScheduledTask -TaskName $taskName
}
if (Test-Path $installed) { Copy-Item $installed (Join-Path $backup 'windows-mail-ingress.ps1') }
Start-Sleep -Seconds 1
if (Get-NetTCPConnection -State Listen -LocalPort 25 -ErrorAction SilentlyContinue) {
    throw 'TCP 25 is already in use. Existing listener was preserved; resolve the conflict before installing.'
}
Copy-Item $source $installed -Force
& icacls.exe $installed /reset | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to protect installed script.' }
$action=New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$installed`""
$trigger=New-ScheduledTaskTrigger -AtStartup
$principal=New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval ([TimeSpan]::FromMinutes(1)) -StartWhenAvailable -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
$ruleName='Hawks-Mail-SMTP-Ingress'
if (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue) {
    Set-NetFirewallRule -Name $ruleName -Enabled True -Direction Inbound -Action Allow -Profile Any
} else {
    New-NetFirewallRule -Name $ruleName -DisplayName 'Hawks Mail inbound SMTP' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 25 -Profile Any -Program "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" | Out-Null
}
Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 4
Get-ScheduledTask -TaskName $taskName | Select-Object TaskName,State
Get-NetTCPConnection -State Listen -LocalPort 25 | Select-Object LocalAddress,LocalPort,OwningProcess
Write-Output 'Installed. Verify router TCP 25 forwarding and external SMTP before changing DNS MX.'
