#!/usr/bin/env node
/**
 * Restore Workspace Script
 * 
 * Restores workspace:* dependencies after npm publish.
 * This converts npm version numbers back to workspace:* for local development.
 * 
 * Dependency Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton, shared)
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

// Workspace dependencies mapping
const WORKSPACE_DEPS = {
    'brave-real-browser-mcp-server': ['brave-real-puppeteer-core'],
    'brave-real-puppeteer-core': ['brave-real-launcher'],
    'brave-real-launcher': ['brave-real-blocker'],
    'brave-real-blocker': []
};

// All workspace package names for detection
const WORKSPACE_PACKAGES = [
    'brave-real-blocker',
    'brave-real-launcher',
    'brave-real-puppeteer-core',
    'brave-real-browser-mcp-server'
];

function readPackageJson(pkgPath) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writePackageJson(pkgPath, data) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

console.log('\n🔄 Restoring workspace:* dependencies...\n');
console.log('=' .repeat(60));
console.log('📦 Dependency Chain:');
console.log('   brave-real-browser-mcp-server (top level)');
console.log('       └── brave-real-puppeteer-core');
console.log('           └── brave-real-launcher');
console.log('               └── brave-real-blocker (singleton)');
console.log('=' .repeat(60));

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
    
    // Restore dependencies
    if (pkgJson.dependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.dependencies[depName] && 
                WORKSPACE_PACKAGES.includes(depName) &&
                !pkgJson.dependencies[depName].startsWith('workspace:')) {
                console.log(`   🔄 ${pkgJson.name}: ${depName} → workspace:*`);
                pkgJson.dependencies[depName] = 'workspace:*';
                modified = true;
                changesCount++;
            }
        }
    }
    
    // Restore devDependencies
    if (pkgJson.devDependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.devDependencies[depName] && 
                WORKSPACE_PACKAGES.includes(depName) &&
                !pkgJson.devDependencies[depName].startsWith('workspace:')) {
                console.log(`   🔄 ${pkgJson.name}: ${depName} (dev) → workspace:*`);
                pkgJson.devDependencies[depName] = 'workspace:*';
                modified = true;
                changesCount++;
            }
        }
    }
    
    // Restore peerDependencies
    if (pkgJson.peerDependencies) {
        for (const depName of workspaceDeps) {
            if (pkgJson.peerDependencies[depName] && 
                WORKSPACE_PACKAGES.includes(depName) &&
                !pkgJson.peerDependencies[depName].startsWith('workspace:')) {
                console.log(`   🔄 ${pkgJson.name}: ${depName} (peer) → workspace:*`);
                pkgJson.peerDependencies[depName] = 'workspace:*';
                modified = true;
                changesCount++;
            }
        }
    }
    
    if (modified) {
        writePackageJson(pkg.path, pkgJson);
        console.log(`   💾 Saved: ${pkg.path}`);
    } else {
        console.log(`   ✅ ${pkgJson.name}: Already using workspace:*`);
    }
}

console.log('\n' + '=' .repeat(60));
console.log(`✅ Restore complete! ${changesCount} dependencies restored to workspace:*.`);
console.log('   Local development linking is now active.');
console.log('');
console.log('📝 Run "npm install" to relink workspace packages.');
console.log('');
