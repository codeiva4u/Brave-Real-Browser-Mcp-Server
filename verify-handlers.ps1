# Verify MCP Response Format Script
# Checks all handler functions for proper return format

Write-Host "🔍 Checking Handler Return Statements..." -ForegroundColor Cyan

$handlersPath = "src\handlers"
$issues = @()

# Get all TypeScript handler files
$handlerFiles = Get-ChildItem -Path $handlersPath -Filter "*.ts" -Recurse

foreach ($file in $handlerFiles) {
    Write-Host "`nChecking: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    
    # Check for empty return statements
    if ($content -match 'return\s*\{\s*\}') {
        $issues += "❌ $($file.Name): Found empty return {}"
        Write-Host "  ❌ Found empty return {}" -ForegroundColor Red
    }
    
    # Check for proper content array returns
    $properReturns = ([regex]::Matches($content, 'return\s*\{[^}]*content:\s*\[')).Count
    $totalReturns = ([regex]::Matches($content, 'export\s+async\s+function\s+handle')).Count
    
    Write-Host "  ✅ Functions: $totalReturns" -ForegroundColor Green
    Write-Host "  ✅ Proper Returns: $properReturns" -ForegroundColor Green
}

if ($issues.Count -eq 0) {
    Write-Host "`n✅ All handlers look good!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Issues Found:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

Write-Host "`n📊 Total Handler Files Checked: $($handlerFiles.Count)" -ForegroundColor Cyan
