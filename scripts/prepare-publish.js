#!/usr/bin/env node

/**
 * 🦁 Prepare Publish - Convert * to ^version
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const PACKAGES = [
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core' },
    { name: 'brave-real-browser', path: 'packages/brave-real-browser' },
    { name: 'brave-real-browser-mcp-server', path: '.' }
];

const INTERNAL = ['brave-real-launcher', 'brave-real-puppeteer-core', 'brave-real-browser'];

function getVersion(name) {
    const pkg = PACKAGES.find(p => p.name === name);
    if (!pkg) return null;
    const path = join(rootDir, pkg.path, 'package.json');
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')).version;
}

function process(pkgPath, pkgName) {
    const path = join(rootDir, pkgPath, 'package.json');
    if (!existsSync(path)) return;

    const pkg = JSON.parse(readFileSync(path, 'utf-8'));
    let modified = false;

    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        const deps = pkg[depType];
        if (!deps) continue;

        for (const [name, version] of Object.entries(deps)) {
            if (INTERNAL.includes(name) && version === '*') {
                const v = getVersion(name);
                if (v) {
                    deps[name] = `^${v}`;
                    console.log(`   📦 ${name}: * → ^${v}`);
                    modified = true;
                }
            }
        }
    }

    if (modified) {
        writeFileSync(path + '.backup', readFileSync(path, 'utf-8'));
        writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`✅ ${pkgName}: ready`);
    }
}

/**
 * Create index.js and index.cjs for brave-real-puppeteer-core if missing
 * This ensures the package can be imported as a module
 */
function ensurePuppeteerCoreIndexFiles() {
    const puppeteerCorePath = join(rootDir, 'packages/brave-real-puppeteer-core');

    const indexJsPath = join(puppeteerCorePath, 'index.js');
    const indexCjsPath = join(puppeteerCorePath, 'index.cjs');

    const indexJsContent = `/**
 * brave-real-puppeteer-core
 * Re-exports puppeteer-core with stealth patches applied at install time
 */

// Re-export everything from puppeteer-core
export * from 'puppeteer-core';

// Import and re-export default
import puppeteerCore from 'puppeteer-core';
export default puppeteerCore;
`;

    const indexCjsContent = `/**
 * brave-real-puppeteer-core (CommonJS)
 * Re-exports puppeteer-core with stealth patches applied at install time
 */

// Re-export everything from puppeteer-core
const puppeteerCore = require('puppeteer-core');
module.exports = puppeteerCore;
`;

    if (!existsSync(indexJsPath)) {
        writeFileSync(indexJsPath, indexJsContent);
        console.log('   📄 Created index.js for brave-real-puppeteer-core');
    }

    if (!existsSync(indexCjsPath)) {
        writeFileSync(indexCjsPath, indexCjsContent);
        console.log('   📄 Created index.cjs for brave-real-puppeteer-core');
    }

    // Also ensure files array in package.json includes these
    const pkgPath = join(puppeteerCorePath, 'package.json');
    if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        let modified = false;

        if (!pkg.files) pkg.files = [];

        if (!pkg.files.includes('index.js')) {
            pkg.files.push('index.js');
            modified = true;
        }
        if (!pkg.files.includes('index.cjs')) {
            pkg.files.push('index.cjs');
            modified = true;
        }

        if (modified) {
            writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
            console.log('   📦 Updated files array in package.json');
        }
    }
}

console.log('\n🔄 Preparing for publish...\n');

// First ensure puppeteer-core has index files
console.log('🔧 Ensuring brave-real-puppeteer-core index files...');
ensurePuppeteerCoreIndexFiles();

PACKAGES.forEach(p => process(p.path, p.name));
console.log('\n✅ Done!');

