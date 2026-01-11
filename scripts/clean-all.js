#!/usr/bin/env node

/**
 * 🦁 Deep Clean - Remove all node_modules and build artifacts
 */

import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const PATHS = [
    '.',
    'packages/brave-real-launcher',
    'packages/brave-real-puppeteer-core',
    'packages/brave-real-browser'
];

const CLEAN = ['node_modules', 'dist', 'build', 'package-lock.json'];

console.log('\n🧹 Deep cleaning...\n');

PATHS.forEach(pkgPath => {
    const name = pkgPath === '.' ? 'mcp-server' : pkgPath.split('/').pop();
    console.log(`📁 ${name}`);

    CLEAN.forEach(item => {
        const full = join(rootDir, pkgPath, item);
        if (existsSync(full)) {
            rmSync(full, { recursive: true, force: true });
            console.log(`   🗑️  ${item}`);
        }
    });
});

console.log('\n✅ Done! Run: npm run bootstrap');
