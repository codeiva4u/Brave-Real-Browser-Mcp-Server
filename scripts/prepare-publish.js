#!/usr/bin/env node
/**
 * Prepare Publish Script
 * 
 * Converts workspace:* dependencies to actual npm version numbers for publishing.
 * This is required because npm registry doesn't understand workspace:* protocol.
 * 
 * Dependency Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton, shared)
 */

const fs = require('fs');
const path = require('path');

// Package paths in dependency order (base to top)
const PACKAGES = [
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker/package.json' },
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher/package.json' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core/package.json' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json' }
];

// Dependency mapping: package -> its workspace dependencies
const WORKSPACE_DEPS = {
    'brave-real-browser-mcp-server': ['brave-real-puppeteer-core'],
    'brave-real-puppeteer-core': ['brave-real-launcher'],
    'brave-real-launcher': ['brave-real-blocker'],
    'brave-real-blocker': []
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

// Step 2: Convert workspace:* to actual versions
console.log('\n🔧 Converting workspace:* to npm versions...\n');

let changesCount = 0;

for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (!pkgJson) continue;
    
    const workspaceDeps = WORKSPACE_DEPS[pkgJson.name] || [];
    if (workspaceDeps.length === 0) {
        console.log(`   ✅ ${pkgJson.name}: No workspace dependencies`);
        continue;
    }
    
    let modified = false;
    
    // Check dependencies
    if (pkgJson.dependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.dependencies[depName] && pkgJson.dependencies[depName].startsWith('workspace:')) {
                const actualVersion = versions[depName];
                if (actualVersion) {
                    console.log(`   🔄 ${pkgJson.name}: ${depName} workspace:* → ^${actualVersion}`);
                    pkgJson.dependencies[depName] = `^${actualVersion}`;
                    modified = true;
                    changesCount++;
                }
            }
        }
    }
    
    // Check devDependencies
    if (pkgJson.devDependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.devDependencies[depName] && pkgJson.devDependencies[depName].startsWith('workspace:')) {
                const actualVersion = versions[depName];
                if (actualVersion) {
                    console.log(`   🔄 ${pkgJson.name}: ${depName} (dev) workspace:* → ^${actualVersion}`);
                    pkgJson.devDependencies[depName] = `^${actualVersion}`;
                    modified = true;
                    changesCount++;
                }
            }
        }
    }
    
    // Check peerDependencies
    if (pkgJson.peerDependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.peerDependencies[depName] && pkgJson.peerDependencies[depName].startsWith('workspace:')) {
                const actualVersion = versions[depName];
                if (actualVersion) {
                    console.log(`   🔄 ${pkgJson.name}: ${depName} (peer) workspace:* → ^${actualVersion}`);
                    pkgJson.peerDependencies[depName] = `^${actualVersion}`;
                    modified = true;
                    changesCount++;
                }
            }
        }
    }
    
    if (modified) {
        writePackageJson(pkg.path, pkgJson);
        console.log(`   💾 Saved: ${pkg.path}`);
    } else {
        console.log(`   ✅ ${pkgJson.name}: No changes needed`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`✅ Prepare complete! ${changesCount} workspace:* dependencies converted.`);
console.log('   Packages are ready for npm publish.');
console.log('   Run "npm publish" in each package directory in order:');
console.log('   1. brave-real-blocker');
console.log('   2. brave-real-launcher');
console.log('   3. brave-real-puppeteer-core');
console.log('   4. brave-real-browser-mcp-server');
console.log('');
console.log('📝 After publishing, run: node scripts/restore-workspace.js');
console.log('');
