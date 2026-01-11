#!/usr/bin/env node

/**
 * 🦁 Restore Workspace - Restore * after publish
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
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

console.log('\n🔄 Restoring * dependencies...\n');

PACKAGES.forEach(({ path: pkgPath, name }) => {
    const jsonPath = join(rootDir, pkgPath, 'package.json');
    const backupPath = jsonPath + '.backup';

    if (existsSync(backupPath)) {
        writeFileSync(jsonPath, readFileSync(backupPath, 'utf-8'));
        unlinkSync(backupPath);
        console.log(`✅ ${name}: restored`);
    }
});

console.log('\n✅ Done!');
