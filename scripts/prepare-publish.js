#!/usr/bin/env node
/**
 * Prepare Publish Script
 * 
 * Prepares packages for npm publish
 * npm workspaces automatically resolves local packages when they're in workspaces array
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

function readPackageJson(pkgPath) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    if (!fs.existsSync(fullPath)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

console.log('\n🔄 Preparing packages for publish...\n');
console.log('=' .repeat(50));

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

console.log('\n' + '=' .repeat(50));
console.log('✅ Packages ready for publish!');
console.log('   npm workspaces will resolve local packages automatically.');
console.log('');
