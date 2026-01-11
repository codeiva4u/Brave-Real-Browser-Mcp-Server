#!/usr/bin/env node

/**
 * 🦁 Publish All - Ordered publish
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const isDryRun = process.argv.includes('--dry-run');

const PUBLISH_ORDER = [
    { name: 'brave-real-launcher', path: 'packages/brave-real-launcher' },
    { name: 'brave-real-puppeteer-core', path: 'packages/brave-real-puppeteer-core' },
    { name: 'brave-real-browser', path: 'packages/brave-real-browser' },
    { name: 'brave-real-browser-mcp-server', path: '.' }
];

function run(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true });
        proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
        proc.on('error', reject);
    });
}

async function runScript(name) {
    console.log(`\n📜 Running ${name}...`);
    await run('node', [join(__dirname, `${name}.js`)], rootDir);
}

async function publish(pkg) {
    console.log(`\n📦 Publishing ${pkg.name}...`);
    const args = isDryRun ? ['publish', '--dry-run', '--access', 'public'] : ['publish', '--access', 'public'];
    await run('npm', args, join(rootDir, pkg.path));
    console.log(`✅ ${pkg.name} ${isDryRun ? '(dry run)' : 'published'}!`);
}

async function main() {
    console.log('\n🦁 Publish All Packages');
    console.log('='.repeat(40));

    if (isDryRun) console.log('🧪 DRY RUN MODE\n');

    try {
        await runScript('prepare-publish');
        await runScript('build-all');

        for (const pkg of PUBLISH_ORDER) {
            await publish(pkg);
        }

        console.log('\n🎉 All packages published!');
    } catch (e) {
        console.log(`\n💥 Failed: ${e.message}`);
        throw e;
    } finally {
        await runScript('restore-workspace');
    }
}

main().catch(() => process.exit(1));
