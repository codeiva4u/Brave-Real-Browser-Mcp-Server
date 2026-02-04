#!/usr/bin/env node
/**
 * Prepare Publish Script
 * 
 * Syncs dependency versions before npm publish.
 * npm workspaces automatically links local packages when they're in workspaces array.
 * 
 * Dependency Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton, shared)
 *   brave-real-playwright-core (standalone)
 */

const fs = require('fs');
const path = require('path');

// Package paths in dependency order (base to top)
const PACKAGES = [
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker/package.json' },
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher/package.json' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core/package.json' },
    { name: 'brave-real-playwright-core', path: 'packages/brave-real-playwright-core/package.json' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json' }
];

// Dependency mapping: package -> its local workspace dependencies
const WORKSPACE_DEPS = {
    'brave-real-browser-mcp-server': ['brave-real-puppeteer-core'],
    'brave-real-puppeteer-core': ['brave-real-launcher'],
    'brave-real-launcher': ['brave-real-blocker'],
    'brave-real-blocker': [],
    'brave-real-playwright-core': []  // Standalone, no local deps
};

function readPackageJson(pkgPath) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`   Warning: Package not found: ${pkgPath}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writePackageJson(pkgPath, data) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

console.log('\n🔄 Preparing packages for npm publish...\n');
console.log('=' .repeat(60));
console.log('📦 Dependency Chain:');
console.log('   brave-real-browser-mcp-server (top level)');
console.log('       └── brave-real-puppeteer-core');
console.log('           └── brave-real-launcher');
console.log('               └── brave-real-blocker (singleton)');
console.log('=' .repeat(60));

// Step 1: Collect all current versions
const versions = {};
for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (pkgJson) {
        versions[pkgJson.name] = pkgJson.version;
    }
}

console.log('\n📋 Current package versions:');
for (const [name, version] of Object.entries(versions)) {
    console.log(`   ${name}@${version}`);
}

// Step 2: Sync dependency versions to match current versions
console.log('\n🔧 Syncing dependency versions...\n');

let changesCount = 0;

for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (!pkgJson) continue;
    
    const workspaceDeps = WORKSPACE_DEPS[pkgJson.name] || [];
    if (workspaceDeps.length === 0) {
        console.log(`   ✅ ${pkgJson.name}: No local dependencies`);
        continue;
    }
    
    let modified = false;
    
    // Sync dependencies
    if (pkgJson.dependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.dependencies[depName]) {
                const currentVersion = versions[depName];
                const expectedVersion = `^${currentVersion}`;
                if (pkgJson.dependencies[depName] !== expectedVersion) {
                    console.log(`   🔄 ${pkgJson.name}: ${depName} ${pkgJson.dependencies[depName]} → ${expectedVersion}`);
                    pkgJson.dependencies[depName] = expectedVersion;
                    modified = true;
                    changesCount++;
                } else {
                    console.log(`   ✅ ${pkgJson.name}: ${depName} already at ${expectedVersion}`);
                }
            }
        }
    }
    
    if (modified) {
        writePackageJson(pkg.path, pkgJson);
        console.log(`   💾 Saved: ${pkg.path}`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`✅ Prepare complete! ${changesCount} dependency versions synced.`);
console.log('   Packages are ready for npm publish.');
console.log('   Run "npm publish" in each package directory in order:');
console.log('   1. brave-real-blocker');
console.log('   2. brave-real-launcher');
console.log('   3. brave-real-puppeteer-core');
console.log('   4. brave-real-browser-mcp-server');
console.log('');
console.log('📝 npm workspaces will automatically link local packages during development.');
console.log('');
