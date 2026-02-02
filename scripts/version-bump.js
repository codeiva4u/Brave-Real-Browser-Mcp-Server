#!/usr/bin/env node
/**
 * Version Bump Script for Monorepo
 * 
 * Dependency Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton)
 * 
 * Usage: node scripts/version-bump.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');

const INCREMENT_TYPE = process.argv[2] || 'patch';

// Package paths in dependency order (base first)
const PACKAGES = [
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker/package.json' },
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher/package.json' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core/package.json' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json' }
];

function incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch (type) {
        case 'major':
            parts[0]++;
            parts[1] = 0;
            parts[2] = 0;
            break;
        case 'minor':
            parts[1]++;
            parts[2] = 0;
            break;
        case 'patch':
        default:
            parts[2]++;
            break;
    }
    
    return parts.join('.');
}

function readPackageJson(pkgPath) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️ Package not found: ${pkgPath}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function writePackageJson(pkgPath, data) {
    const fullPath = path.resolve(process.cwd(), pkgPath);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
}

console.log(`\n📈 Version Bump: ${INCREMENT_TYPE.toUpperCase()}\n`);
console.log('=' .repeat(50));

const newVersions = {};

// Step 1: Bump all package versions
for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (!pkgJson) continue;
    
    const oldVersion = pkgJson.version;
    const newVersion = incrementVersion(oldVersion, INCREMENT_TYPE);
    
    pkgJson.version = newVersion;
    newVersions[pkgJson.name] = newVersion;
    
    writePackageJson(pkg.path, pkgJson);
    console.log(`✅ ${pkgJson.name}: ${oldVersion} → ${newVersion}`);
}

console.log('\n' + '=' .repeat(50));
console.log('📦 Updating cross-dependencies...\n');

// Step 2: Update cross-references with new versions
for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (!pkgJson) continue;
    
    let updated = false;
    
    // Update dependencies
    if (pkgJson.dependencies) {
        for (const [depName, depVersion] of Object.entries(pkgJson.dependencies)) {
            if (newVersions[depName]) {
                pkgJson.dependencies[depName] = `^${newVersions[depName]}`;
                console.log(`  🔗 ${pkgJson.name}: ${depName} → ^${newVersions[depName]}`);
                updated = true;
            }
        }
    }
    
    // Update devDependencies
    if (pkgJson.devDependencies) {
        for (const [depName, depVersion] of Object.entries(pkgJson.devDependencies)) {
            if (newVersions[depName]) {
                pkgJson.devDependencies[depName] = `^${newVersions[depName]}`;
                console.log(`  🔗 ${pkgJson.name} (dev): ${depName} → ^${newVersions[depName]}`);
                updated = true;
            }
        }
    }
    
    if (updated) {
        writePackageJson(pkg.path, pkgJson);
    }
}

console.log('\n' + '=' .repeat(50));
console.log('✅ Version bump complete!\n');

// Print summary
console.log('📋 New Versions:');
for (const [name, version] of Object.entries(newVersions)) {
    console.log(`   ${name}@${version}`);
}
console.log('');
