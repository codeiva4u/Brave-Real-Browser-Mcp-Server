#!/usr/bin/env node
/**
 * Restore Workspace Script
 * 
 * Restores workspace:* dependencies after publishing
 * Reverts changes made by prepare-publish.js
 */

const fs = require('fs');
const path = require('path');

// Package paths
const PACKAGES = [
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker/package.json' },
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher/package.json' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core/package.json' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json' }
];

const BACKUP_DIR = path.resolve(process.cwd(), '.publish-backup');

console.log('\n🔄 Restoring workspace dependencies...\n');
console.log('=' .repeat(50));

if (!fs.existsSync(BACKUP_DIR)) {
    console.log('⚠️ No backup directory found. Nothing to restore.');
    process.exit(0);
}

let restoredCount = 0;

for (const pkg of PACKAGES) {
    const backupPath = path.join(BACKUP_DIR, pkg.path.replace(/\//g, '_'));
    const targetPath = path.resolve(process.cwd(), pkg.path);
    
    if (fs.existsSync(backupPath)) {
        const backupData = fs.readFileSync(backupPath, 'utf-8');
        fs.writeFileSync(targetPath, backupData);
        console.log(`  ✅ Restored: ${pkg.name}`);
        restoredCount++;
        
        // Remove backup file
        fs.unlinkSync(backupPath);
    } else {
        console.log(`  ⚠️ No backup for: ${pkg.name}`);
    }
}

// Clean up backup directory if empty
try {
    const remaining = fs.readdirSync(BACKUP_DIR);
    if (remaining.length === 0) {
        fs.rmdirSync(BACKUP_DIR);
        console.log('\n📁 Backup directory cleaned up');
    }
} catch (e) {
    // Ignore cleanup errors
}

console.log('\n' + '=' .repeat(50));
console.log(`✅ Restored ${restoredCount} packages to workspace mode`);
console.log('');
