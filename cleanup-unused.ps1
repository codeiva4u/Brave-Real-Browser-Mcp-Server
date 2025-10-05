# Cleanup script for unused files and folders
# Run this script to remove files/folders that are not used by the project

Write-Host "🧹 Starting cleanup of unused files..." -ForegroundColor Cyan

# Documentation files (optional - you may want to keep some)
$docsToRemove = @(
    "CLAUDE.md",
    "FINAL_FIX_EXPLANATION.md",
    "FIX_SUMMARY_HINDI.md",
    "SUCCESS_REPORT.md",
    "TESTING.md",
    "TESTING_CHECKLIST.md",
    "TEST_REPORT.md"
)

# Test/Debug scripts
$scriptsToRemove = @(
    "debug-server.cjs",
    "test-form-live.cjs",
    "test-runner.js"
)

# Folders to remove
$foldersToRemove = @(
    "test-brave",
    "handlers",
    "tests"
)

# Misc files
$miscToRemove = @(
    ".FullName"
)

# Remove documentation files
Write-Host "`n📄 Removing documentation files..." -ForegroundColor Yellow
foreach ($file in $docsToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $file" -ForegroundColor Gray
    }
}

# Remove test/debug scripts
Write-Host "`n🔧 Removing test/debug scripts..." -ForegroundColor Yellow
foreach ($file in $scriptsToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $file" -ForegroundColor Gray
    }
}

# Remove folders
Write-Host "`n📁 Removing unused folders..." -ForegroundColor Yellow
foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Remove-Item $folder -Recurse -Force
        Write-Host "   ✅ Removed: $folder/" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $folder/" -ForegroundColor Gray
    }
}

# Remove misc files
Write-Host "`n🗑️  Removing miscellaneous files..." -ForegroundColor Yellow
foreach ($file in $miscToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $file" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Cleanup complete!" -ForegroundColor Cyan
Write-Host "`n⚠️  Note: After cleanup, update package.json scripts if needed" -ForegroundColor Yellow
Write-Host "   (Remove references to test:brave, test:full, test:dashboard)" -ForegroundColor Yellow
