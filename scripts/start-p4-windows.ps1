param(
  [switch]$SkipPortCleanup
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not $SkipPortCleanup) {
  foreach ($port in @(3000, 24678)) {
    $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidValue in $pids) {
      if ($pidValue -and $pidValue -ne 0) {
        Write-Host "Stopping stale PID $pidValue on port $port" -ForegroundColor Yellow
        Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
      }
    }
  }
  Start-Sleep -Seconds 1
}

Write-Host "Starting Street Interface v0.8.0-P4.1 on http://localhost:3000" -ForegroundColor Green
& npm.cmd run dev
