#!/usr/bin/env node
/**
 * Version Bump Script for Monorepo
 * 
 * Dependency Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton)
 *   brave-real-playwright-core (standalone)
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
    { name: 'brave-real-playwright-core', path: 'packages/brave-real-playwright-core/package.json', npmName: 'brave-real-playwright-core' },
    { name: 'brave-real-browser-mcp-server', path: 'package.json', npmName: 'brave-real-browser-mcp-server' }
];

function incrementVersion(version, type) {
    // Clean the version string first
    version = String(version).trim();
    
    // Handle versions with -patch suffix (e.g., "1.57.0-patch.15")
    const patchSuffixMatch = version.match(/^(.+)-patch\.(\d+)$/);
    if (patchSuffixMatch) {
        const baseVersion = patchSuffixMatch[1];
        const patchNum = parseInt(patchSuffixMatch[2], 10);
        return `${baseVersion}-patch.${patchNum + 1}`;
    }
    
    // Handle versions with -brave suffix (e.g., "24.36.1-brave.1")
    const braveSuffixMatch = version.match(/^(.+)-brave\.(\d+)$/);
    if (braveSuffixMatch) {
        const baseVersion = braveSuffixMatch[1];
        const braveNum = parseInt(braveSuffixMatch[2], 10);
        return `${baseVersion}-brave.${braveNum + 1}`;
    }
    
    // Extract only the semver part (ignore any prerelease/build metadata)
    const semverMatch = version.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!semverMatch) {
        console.warn(`  ⚠️ Invalid version format: "${version}", defaulting to 1.0.0`);
        return '1.0.1';
    }
    
    // Parse version parts, ensuring valid numbers
    let major = parseInt(semverMatch[1], 10) || 0;
    let minor = parseInt(semverMatch[2], 10) || 0;
    let patch = parseInt(semverMatch[3], 10) || 0;
    
    // Validate - must be valid numbers
    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
        console.warn(`  ⚠️ Version contains NaN: "${version}", defaulting to 1.0.1`);
        return '1.0.1';
    }
    
    switch (type) {
        case 'major':
            major++;
            minor = 0;
            patch = 0;
            break;
        case 'minor':
            minor++;
            patch = 0;
            break;
        case 'patch':
        default:
            patch++;
            break;
    }
    
    return `${major}.${minor}.${patch}`;
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
        v = String(v).trim();
        
        // Handle -patch suffix
        const patchMatch = v.match(/^(.+)-patch\.(\d+)$/);
        if (patchMatch) {
            const semverMatch = patchMatch[1].match(/^(\d+)\.(\d+)\.(\d+)/);
            if (semverMatch) {
                return [
                    parseInt(semverMatch[1], 10) || 0,
                    parseInt(semverMatch[2], 10) || 0,
                    parseInt(semverMatch[3], 10) || 0,
                    parseInt(patchMatch[2], 10) || 0
                ];
            }
        }
        
        // Handle -brave suffix
        const braveMatch = v.match(/^(.+)-brave\.(\d+)$/);
        if (braveMatch) {
            const semverMatch = braveMatch[1].match(/^(\d+)\.(\d+)\.(\d+)/);
            if (semverMatch) {
                return [
                    parseInt(semverMatch[1], 10) || 0,
                    parseInt(semverMatch[2], 10) || 0,
                    parseInt(semverMatch[3], 10) || 0,
                    parseInt(braveMatch[2], 10) || 0
                ];
            }
        }
        
        // Standard semver parsing - extract only digits
        const semverMatch = v.match(/^(\d+)\.(\d+)\.(\d+)/);
        if (semverMatch) {
            return [
                parseInt(semverMatch[1], 10) || 0,
                parseInt(semverMatch[2], 10) || 0,
                parseInt(semverMatch[3], 10) || 0
            ];
        }
        
        // Fallback - return zeros
        return [0, 0, 0];
    };
    
    const parts1 = parse(v1);
    const parts2 = parse(v2);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const a = parts1[i] || 0;
        const b = parts2[i] || 0;
        // Extra safety - ensure numbers
        const numA = isNaN(a) ? 0 : a;
        const numB = isNaN(b) ? 0 : b;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
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
