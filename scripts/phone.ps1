# Point the phone's localhost at this machine, after every replug.
#
#   Vite          localhost:5173 -> the dev server
#   MinIO         localhost:9000 -> media, because image URLs are absolute
#   DevTools      127.0.0.1:9223 -> the phone's browser, for CDP from the PC
#
# Run it from anywhere: pwsh scripts/phone.ps1

$ErrorActionPreference = 'Stop'

function Find-Adb {
    $onPath = Get-Command adb -ErrorAction SilentlyContinue
    if ($onPath) { return $onPath.Source }
    $winget = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe'
    if (Test-Path $winget) { return $winget }
    throw "adb not found. Install it with: winget install Google.PlatformTools"
}

function Test-Port([int]$port) {
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $client.Connect('127.0.0.1', $port)
        $client.Close()
        return $true
    } catch { return $false }
}

$adb = Find-Adb

# Wrapped, because one device comes back as a bare string and indexing that
# yields its first character rather than the line.
$devices = @(& $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\S' })
if ($devices.Count -eq 0) { throw "No phone attached. Plug it in and unlock it." }
if ($devices -match 'unauthorized') { throw "Phone attached but unauthorized: accept the USB debugging prompt on it." }
Write-Host "phone:    $($devices[0])"

# Vite binds ::1 alone often enough to be worth checking: adb dials 127.0.0.1,
# so the phone gets connection refused while the PC's localhost works fine.
$viteTarget = 5173
if (-not (Test-Port 5173)) {
    if (Test-Port 5180) {
        $viteTarget = 5180
        Write-Host "vite:     not on 127.0.0.1:5173, using the bridge on 5180"
    } else {
        Write-Warning "Nothing answers on 127.0.0.1:5173. If Vite is running, it is bound to ::1 only."
        Write-Warning "Start the bridge, then rerun:  node scripts/vite-bridge.mjs"
    }
}

& $adb reverse tcp:5173 "tcp:$viteTarget" | Out-Null
& $adb reverse tcp:9000 tcp:9000 | Out-Null
& $adb forward tcp:9223 localabstract:chrome_devtools_remote | Out-Null

Write-Host "reverse:  5173 -> $viteTarget, 9000 -> 9000"
Write-Host "forward:  9223 -> the phone's browser"

if (-not (Test-Port 9000)) { Write-Warning "MinIO is not answering on 127.0.0.1:9000, so images will fail on the phone. Run docker compose up -d in backend/." }

Write-Host ""
Write-Host "Open http://localhost:5173 on the phone."
