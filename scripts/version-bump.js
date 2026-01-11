#!/usr/bin/env node

/**
 * 🦁 Version Bump - Sync bump all packages
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

function bump(version, type) {
    const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
    switch (type) {
        case 'major': return `${major + 1}.0.0`;
        case 'minor': return `${major}.${minor + 1}.0`;
        default: return `${major}.${minor}.${patch + 1}`;
    }
}

const type = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(type)) {
    console.log('Usage: node version-bump.js [patch|minor|major]');
    process.exit(1);
}

console.log(`\n🔢 Bumping versions (${type})...\n`);

PACKAGES.forEach(({ path: pkgPath, name }) => {
    const jsonPath = join(rootDir, pkgPath, 'package.json');
    if (!existsSync(jsonPath)) return;

    const pkg = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    const oldV = pkg.version;
    const newV = bump(oldV, type);

    pkg.version = newV;
    writeFileSync(jsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`   ${name}: ${oldV} → ${newV}`);
});

console.log('\n✅ Done! Now run: npm run publish-all');
