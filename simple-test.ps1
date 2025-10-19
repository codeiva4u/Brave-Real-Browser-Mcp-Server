# Simple Multi-Protocol Test
Write-Host "Testing Multi-Protocol Server" -ForegroundColor Cyan

# Check build
if (Test-Path ".\dist\index.js") {
    Write-Host "Build exists" -ForegroundColor Green
} else {
    Write-Host "Build not found" -ForegroundColor Red
    exit 1
}

# Start server
Write-Host "Starting HTTP server..." -ForegroundColor Yellow
$job = Start-Job { Set-Location $using:PWD; node dist/index.js --mode http --port 3000 }
Start-Sleep -Seconds 4

# Test API
Write-Host "Testing API..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$health = Invoke-RestMethod "http://localhost:3000/health" -TimeoutSec 5
Write-Host "Health: $($health.status)" -ForegroundColor Green

$tools = Invoke-RestMethod "http://localhost:3000/tools" -TimeoutSec 5
Write-Host "Tools: $($tools.tools.Count)" -ForegroundColor Green

# Cleanup
Stop-Job $job
Remove-Job $job
Write-Host "Test completed!" -ForegroundColor Green
