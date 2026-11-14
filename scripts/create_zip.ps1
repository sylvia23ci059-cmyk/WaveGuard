# Package WaveGuard KGF Project into clean zip archive using .NET ZipFile
Add-Type -AssemblyName System.IO.Compression.FileSystem

$rootZip = "C:\Users\Sylvia Trinita\OneDrive\Desktop\wavegard\WaveGuard_KGF_Complete_Project.zip"

if (Test-Path $rootZip) { Remove-Item $rootZip -Force }

$sourceDir = "C:\Users\Sylvia Trinita\OneDrive\Desktop\wavegard"
$staging = Join-Path $env:TEMP "waveguard_staging"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $staging "waveguard-kgf") | Out-Null

Write-Host "Staging clean files..."
robocopy $sourceDir (Join-Path $staging "waveguard-kgf") /E /XD node_modules .venv .git dist /XF WaveGuard_KGF_Complete_Project.zip *.pyc | Out-Null

Write-Host "Creating zip package..."
[System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $staging "waveguard-kgf"), $rootZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Write-Host "Success! Created zip archive:"
Get-Item $rootZip | Select-Object Name, Length, LastWriteTime
