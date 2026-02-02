#!/usr/bin/env node
/**
 * Prepare Publish Script
 * 
 * Converts workspace:* dependencies to actual npm versions before publishing
 * This allows npm workspaces locally while publishing to npm registry correctly
 */

const fs = require('fs');
const path = require('path');

// Package paths in dependency order
const PACKAGES = [
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker/package.json' },
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher/package.json' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core/package.json' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json' }
];

// Backup directory for restoring after publish
const BACKUP_DIR = path.resolve(process.cwd(), '.publish-backup');

function readPackageJson(pkgPath) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writePackageJson(pkgPath, data) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

console.log('\n🔄 Preparing packages for publish...\n');
console.log('=' .repeat(50));

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Collect all current versions
const versions = {};
for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (pkgJson) {
        versions[pkgJson.name] = pkgJson.version;
    }
}

console.log('📋 Current versions:');
for (const [name, version] of Object.entries(versions)) {
    console.log(`   ${name}@${version}`);
}
console.log('');

// Process each package
for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (!pkgJson) {
        console.log(`  ⚠️ Skipping: ${pkg.path} (not found)`);
        continue;
    }
    
    // Backup original
    const backupPath = path.join(BACKUP_DIR, pkg.path.replace(/\//g, '_'));
    fs.writeFileSync(backupPath, JSON.stringify(pkgJson, null, 2));
    
    let modified = false;
    
    // Convert workspace:* to actual versions in dependencies
    if (pkgJson.dependencies) {
        for (const [depName, depVersion] of Object.entries(pkgJson.dependencies)) {
            if (depVersion.startsWith('workspace:')) {
                if (versions[depName]) {
                    pkgJson.dependencies[depName] = `^${versions[depName]}`;
                    console.log(`  🔄 ${pkgJson.name}: ${depName} → ^${versions[depName]}`);
                    modified = true;
                } else {
                    console.log(`  ⚠️ ${pkgJson.name}: ${depName} version not found!`);
                }
            }
        }
    }
    
    // Convert workspace:* in devDependencies
    if (pkgJson.devDependencies) {
        for (const [depName, depVersion] of Object.entries(pkgJson.devDependencies)) {
            if (depVersion.startsWith('workspace:')) {
                if (versions[depName]) {
                    pkgJson.devDependencies[depName] = `^${versions[depName]}`;
                    console.log(`  🔄 ${pkgJson.name} (dev): ${depName} → ^${versions[depName]}`);
                    modified = true;
                }
            }
        }
    }
    
    // Remove workspace-specific fields for publish
    if (pkgJson.private === true) {
        // Root package might be private, don't change it
        console.log(`  ℹ️ ${pkgJson.name}: private=true (kept)`);
    }
    
    if (modified) {
        writePackageJson(pkg.path, pkgJson);
        console.log(`  ✅ ${pkgJson.name}: prepared for publish`);
    } else {
        console.log(`  ✅ ${pkgJson.name}: no workspace refs`);
    }
}

console.log('\n' + '=' .repeat(50));
console.log('✅ All packages prepared for publish!');
console.log(`📁 Backups saved to: ${BACKUP_DIR}`);
console.log('');
