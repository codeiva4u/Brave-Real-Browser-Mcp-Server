#!/usr/bin/env node

/**
 * 🦁 Version Bump - Auto-fetch NPM versions and bump
 * Automatically fetches latest version from NPM and bumps accordingly
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const PACKAGES = [
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core' },
    { name: 'brave-real-blocker', path: 'packages/brave-real-blocker' },
    { name: 'brave-real-browser', path: 'packages/brave-real-browser' },
    { name: 'brave-real-browser-mcp-server', path: '.' }
];

/**
 * Fetch latest version from NPM registry
 */
function getNpmVersion(packageName) {
    try {
        const result = execSync(`npm view ${packageName} version 2>/dev/null`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        return result || '0.0.0';
    } catch (error) {
        // Package doesn't exist on NPM yet
        console.log(`   ⚠️ ${packageName} not found on NPM, using 0.0.0`);
        return '0.0.0';
    }
}

/**
 * Parse version string (handles formats like 24.34.0-patch.15)
 */
function parseVersion(version) {
    // Remove any suffix like -patch.15, -beta.1, etc.
    const cleanVersion = version.split('-')[0];
    const parts = cleanVersion.split('.').map(Number);
    return {
        major: parts[0] || 0,
        minor: parts[1] || 0,
        patch: parts[2] || 0
    };
}

/**
 * Bump version based on type
 */
function bumpVersion(version, type) {
    const { major, minor, patch } = parseVersion(version);
    switch (type) {
        case 'major': return `${major + 1}.0.0`;
        case 'minor': return `${major}.${minor + 1}.0`;
        default: return `${major}.${minor}.${patch + 1}`;
    }
}

/**
 * Get the higher of NPM version or local version, then bump
 */
function getNextVersion(npmVersion, localVersion, type) {
    const npm = parseVersion(npmVersion);
    const local = parseVersion(localVersion);

    // Use whichever is higher
    let baseVersion;
    if (npm.major > local.major) {
        baseVersion = npmVersion;
    } else if (npm.major === local.major) {
        if (npm.minor > local.minor) {
            baseVersion = npmVersion;
        } else if (npm.minor === local.minor) {
            baseVersion = npm.patch >= local.patch ? npmVersion : localVersion;
        } else {
            baseVersion = localVersion;
        }
    } else {
        baseVersion = localVersion;
    }

    return bumpVersion(baseVersion, type);
}

const type = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(type)) {
    console.log('Usage: node version-bump.js [patch|minor|major]');
    process.exit(1);
}

console.log(`\n🔢 Auto-fetching NPM versions and bumping (${type})...\n`);

PACKAGES.forEach(({ path: pkgPath, name }) => {
    const jsonPath = join(rootDir, pkgPath, 'package.json');
    if (!existsSync(jsonPath)) return;

    const pkg = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    const localVersion = pkg.version;

    // Fetch latest from NPM
    console.log(`   📦 ${name}:`);
    const npmVersion = getNpmVersion(name);
    console.log(`      Local: ${localVersion}, NPM: ${npmVersion}`);

    // Calculate next version (higher of local/npm + bump)
    const newVersion = getNextVersion(npmVersion, localVersion, type);

    pkg.version = newVersion;
    writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`      → New: ${newVersion} ✅\n`);
});

console.log('✅ All versions bumped based on NPM registry!');
