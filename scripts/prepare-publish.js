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

console.log('\n🔄 Preparing for publish...\n');
PACKAGES.forEach(p => process(p.path, p.name));
console.log('\n✅ Done!');
