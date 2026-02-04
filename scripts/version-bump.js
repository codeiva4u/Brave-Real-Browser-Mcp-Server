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
 * 
 * IMPORTANT: This script now fetches the latest version from NPM
 * to ensure we don't try to publish an already existing version.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INCREMENT_TYPE = process.argv[2] || 'patch';

// Package paths in dependency order (base first)
const PACKAGES = [
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker/package.json', npmName: 'brave-real-blocker' },
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher/package.json', npmName: 'brave-real-launcher' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core/package.json', npmName: 'brave-real-puppeteer-core' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json', npmName: 'brave-real-browser-mcp-server' }
];

function incrementVersion(version, type) {
    // Handle versions with -patch suffix (e.g., "1.57.0-patch.15")
    const patchSuffixMatch = version.match(/^(.+)-patch\.(\d+)$/);
    if (patchSuffixMatch) {
        const baseVersion = patchSuffixMatch[1];
        const patchNum = parseInt(patchSuffixMatch[2], 10);
        return `${baseVersion}-patch.${patchNum + 1}`;
    }
    
    // Standard semver handling
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

function getNpmVersion(packageName) {
    try {
        const result = execSync(`npm view ${packageName} version`, { 
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'] // Suppress stderr
        });
        return result.trim();
    } catch (error) {
        // Package doesn't exist on NPM yet
        return null;
    }
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

function compareVersions(v1, v2) {
    // Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
    const parse = (v) => {
        const patchMatch = v.match(/^(.+)-patch\.(\d+)$/);
        if (patchMatch) {
            const base = patchMatch[1].split('.').map(Number);
            return [...base, parseInt(patchMatch[2], 10)];
        }
        return v.split('.').map(Number);
    };
    
    const parts1 = parse(v1);
    const parts2 = parse(v2);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const a = parts1[i] || 0;
        const b = parts2[i] || 0;
        if (a > b) return 1;
        if (a < b) return -1;
    }
    return 0;
}

console.log(`\n📈 Version Bump: ${INCREMENT_TYPE.toUpperCase()}\n`);
console.log('='.repeat(60));
console.log('🔍 Checking NPM versions first...\n');

const newVersions = {};

// Step 1: Fetch NPM versions and calculate new versions
for (const pkg of PACKAGES) {
    const pkgJson = readPackageJson(pkg.path);
    if (!pkgJson) continue;
    
    const localVersion = pkgJson.version;
    const npmVersion = getNpmVersion(pkg.npmName);
    
    // Use the higher of local or NPM version as base
    let baseVersion = localVersion;
    if (npmVersion && compareVersions(npmVersion, localVersion) > 0) {
        baseVersion = npmVersion;
        console.log(`  📦 ${pkg.name}: NPM version (${npmVersion}) > local (${localVersion})`);
        console.log(`     Using NPM version as base`);
    } else {
        console.log(`  📦 ${pkg.name}: local (${localVersion})${npmVersion ? ` | NPM (${npmVersion})` : ' | Not on NPM'}`);
    }
    
    // Calculate new version
    const newVersion = incrementVersion(baseVersion, INCREMENT_TYPE);
    
    pkgJson.version = newVersion;
    newVersions[pkgJson.name] = newVersion;
    
    writePackageJson(pkg.path, pkgJson);
    console.log(`  ✅ ${pkgJson.name}: ${baseVersion} → ${newVersion}\n`);
}

console.log('='.repeat(60));
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

console.log('\n' + '='.repeat(60));
console.log('✅ Version bump complete!\n');

// Print summary
console.log('📋 New Versions (will be published):');
for (const [name, version] of Object.entries(newVersions)) {
    console.log(`   ${name}@${version}`);
}
console.log('');
