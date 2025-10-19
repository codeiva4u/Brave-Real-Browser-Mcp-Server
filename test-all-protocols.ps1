# Multi-Protocol Server Test Script
Write-Host "🧪 Testing Multi-Protocol Brave Browser Server" -ForegroundColor Cyan
Write-Host "=" * 60

# Test 1: Check if build exists
Write-Host "`n1️⃣ Checking build..." -ForegroundColor Yellow
if (Test-Path ".\dist\index.js") {
    Write-Host "   ✅ Build exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build not found. Run: npm run build" -ForegroundColor Red
    exit 1
}

# Test 2: Start HTTP server in background
Write-Host "`n2️⃣ Starting HTTP server..." -ForegroundColor Yellow
$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node dist/index.js --mode http --port 3000
}
Write-Host "   ⏳ Waiting for server to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Check if server is running
$jobState = Get-Job -Id $serverJob.Id | Select-Object -ExpandProperty State
if ($jobState -eq "Running") {
    Write-Host "   ✅ HTTP server started (Job ID: $($serverJob.Id))" -ForegroundColor Green
} else {
    Write-Host "   ❌ Failed to start server" -ForegroundColor Red
    Receive-Job -Job $serverJob
    Remove-Job -Job $serverJob
    exit 1
}

# Test 3: Test HTTP API
Write-Host "`n3️⃣ Testing HTTP API endpoints..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    # Health check
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5
    Write-Host "   ✅ Health check: $($health.status)" -ForegroundColor Green
    
    # Tools list
    $tools = Invoke-RestMethod -Uri "http://localhost:3000/tools" -Method Get -TimeoutSec 5
    Write-Host "   ✅ Tools endpoint: Found $($tools.tools.Count) tools" -ForegroundColor Green
    
    Write-Host "`n   📋 Sample tools:" -ForegroundColor Cyan
    $tools.tools | Select-Object -First 10 | ForEach-Object {
        Write-Host "      - $($_.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ HTTP API test failed: $_" -ForegroundColor Red
}

# Test 4: Show server output
Write-Host "`n4️⃣ Server output (last 10 lines):" -ForegroundColor Yellow
$output = Receive-Job -Job $serverJob -Keep | Select-Object -Last 10
$output | ForEach-Object {
    Write-Host "   $_" -ForegroundColor Gray
}

# Cleanup
Write-Host "`n5️⃣ Stopping server..." -ForegroundColor Yellow
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob
Write-Host "   ✅ Server stopped" -ForegroundColor Green

# Summary
Write-Host "`n" + ("=" * 60)
Write-Host "✅ Multi-Protocol Tests Completed!" -ForegroundColor Green
Write-Host "`n📚 Available Modes:" -ForegroundColor Cyan
Write-Host "   • MCP:         node dist/index.js (default)" -ForegroundColor Gray
Write-Host "   • HTTP/WS:     node dist/index.js --mode http" -ForegroundColor Gray
Write-Host "   • LSP:         node dist/index.js --mode lsp" -ForegroundColor Gray
Write-Host "`n💡 Read MULTI_PROTOCOL_GUIDE.md for setup instructions" -ForegroundColor Yellow
