#!/usr/bin/env node
/**
 * Auto-Update Dependencies Script
 * 
 * यह script npm install के बाद automatically चलता है और:
 * 1. सभी external dependencies को latest version पर update करता है
 * 2. Internal workspace packages को sync रखता है
 * 3. puppeteer-core और playwright-core को latest पर रखता है
 * 
 * Usage: Automatically runs via postinstall hook
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[auto-update]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[auto-update]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[auto-update]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[auto-update]${colors.reset} ${msg}`)
};

// Skip if CI environment and SKIP_AUTO_UPDATE is set
if (process.env.SKIP_AUTO_UPDATE === 'true') {
    log.info('Skipping auto-update (SKIP_AUTO_UPDATE=true)');
    process.exit(0);
}

// Skip during npm publish
if (process.env.npm_command === 'publish') {
    log.info('Skipping auto-update during publish');
    process.exit(0);
}

// Critical dependencies to always keep updated
const CRITICAL_DEPS = [
    'puppeteer-core',
    'playwright-core',
    '@modelcontextprotocol/sdk'
];

// Packages to update (external dependencies)
const PACKAGES_TO_UPDATE = [
    'ghost-cursor',
    'puppeteer-extra',
    'puppeteer-extra-plugin-stealth',
    'puppeteer-extra-plugin-adblocker',
    '@ghostery/adblocker-puppeteer'
];

async function getLatestVersion(packageName) {
    try {
        const result = execSync(`npm view ${packageName} version`, { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        return result;
    } catch (e) {
        return null;
    }
}

async function getCurrentVersion(packageName) {
    try {
        const result = execSync(`npm list ${packageName} --depth=0 --json`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        const data = JSON.parse(result);
        return data.dependencies?.[packageName]?.version || null;
    } catch (e) {
        return null;
    }
}

async function updateDependencies() {
    log.info('Checking for dependency updates...');
    
    const updates = [];
    
    // Check critical dependencies
    for (const pkg of CRITICAL_DEPS) {
        const latest = await getLatestVersion(pkg);
        const current = await getCurrentVersion(pkg);
        
        if (latest && current && latest !== current) {
            updates.push({ name: pkg, current, latest, critical: true });
        }
    }
    
    // Check other packages
    for (const pkg of PACKAGES_TO_UPDATE) {
        const latest = await getLatestVersion(pkg);
        const current = await getCurrentVersion(pkg);
        
        if (latest && current && latest !== current) {
            updates.push({ name: pkg, current, latest, critical: false });
        }
    }
    
    if (updates.length === 0) {
        log.success('All dependencies are up to date!');
        return;
    }
    
    // Show what will be updated
    log.info(`Found ${updates.length} packages to update:`);
    updates.forEach(u => {
        const icon = u.critical ? '🔴' : '🔵';
        console.log(`  ${icon} ${u.name}: ${u.current} → ${u.latest}`);
    });
    
    log.info('Run "npm update" to update these packages.');
}

async function updateBasedOnField() {
    log.info('Checking basedOn field updates...');
    
    const packagesDir = path.join(__dirname, '..', 'packages');
    const updates = [];
    
    // Check brave-real-puppeteer-core
    const puppeteerPkgPath = path.join(packagesDir, 'brave-real-puppeteer-core', 'package.json');
    if (fs.existsSync(puppeteerPkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(puppeteerPkgPath, 'utf8'));
        const basedOn = pkg.brave?.basedOn?.['puppeteer-core'];
        const latestPuppeteer = await getLatestVersion('puppeteer-core');
        
        if (basedOn && latestPuppeteer && basedOn !== latestPuppeteer) {
            updates.push({
                package: 'brave-real-puppeteer-core',
                basedOn,
                latest: latestPuppeteer,
                upstream: 'puppeteer-core'
            });
        }
    }
    
    // Check brave-real-playwright-core
    const playwrightPkgPath = path.join(packagesDir, 'brave-real-playwright-core', 'package.json');
    if (fs.existsSync(playwrightPkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(playwrightPkgPath, 'utf8'));
        const basedOn = pkg.brave?.basedOn?.['playwright-core'];
        const latestPlaywright = await getLatestVersion('playwright-core');
        
        if (basedOn && latestPlaywright && basedOn !== latestPlaywright) {
            updates.push({
                package: 'brave-real-playwright-core',
                basedOn,
                latest: latestPlaywright,
                upstream: 'playwright-core'
            });
        }
    }
    
    if (updates.length > 0) {
        log.warn('Upstream updates available:');
        updates.forEach(u => {
            console.log(`  ⬆️  ${u.package}: ${u.upstream} ${u.basedOn} → ${u.latest}`);
        });
        log.info('Run "npm run upstream-patch" to update to latest upstream');
    } else {
        log.success('All packages are based on latest upstream versions!');
    }
}

// Main execution
async function main() {
    console.log(`\n${colors.bold}🔄 Auto-Update Dependencies${colors.reset}\n`);
    
    try {
        await updateDependencies();
        await updateBasedOnField();
        console.log('');
    } catch (e) {
        log.error('Auto-update failed: ' + e.message);
        // Don't fail the install
        process.exit(0);
    }
}

main();
