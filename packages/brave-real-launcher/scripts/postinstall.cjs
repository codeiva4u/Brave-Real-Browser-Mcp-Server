#!/usr/bin/env node

/**
 * Brave Real Launcher - Postinstall Script
 * Automatically checks and installs Brave Browser if not present
 * 
 * This runs after `npm install` to ensure Brave is available
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

async function postinstall() {
    console.log(`${colors.cyan}${colors.bold}🦁 brave-real-launcher postinstall${colors.reset}`);

    // Skip in CI environments (let the workflow handle installation)
    if (process.env.CI === 'true' || process.env.SKIP_BRAVE_INSTALL === 'true') {
        console.log(`${colors.yellow}⏭️  Skipping Brave auto-install (CI environment)${colors.reset}`);
        return;
    }

    try {
        // Try to dynamically import the built module
        const distPath = path.join(__dirname, '..', 'dist', 'index.js');

        // Check if dist exists (may not exist during initial npm install)
        if (!fs.existsSync(distPath)) {
            console.log(`${colors.yellow}⏭️  Build not complete yet, skipping Brave check${colors.reset}`);
            return;
        }

        // Dynamic import for ESM module
        const fileUrl = `file:///${distPath.replace(/\\/g, '/')}`;
        const module = await import(fileUrl);

        const { getInstallations, BraveInstaller } = module;

        // Check for existing Brave installations
        const installations = getInstallations();

        if (installations && installations.length > 0) {
            console.log(`${colors.green}✅ Brave Browser found: ${installations[0]}${colors.reset}`);
            return;
        }

        // Brave not found - auto-install
        console.log(`${colors.blue}📥 Brave Browser not found, installing...${colors.reset}`);

        const installer = new BraveInstaller({ silent: false });
        const result = await installer.install();

        if (result.success) {
            console.log(`${colors.green}✅ Brave Browser installed successfully!${colors.reset}`);
            console.log(`${colors.green}   Path: ${result.bravePath}${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️  Could not auto-install Brave: ${result.error}${colors.reset}`);
            console.log(`${colors.yellow}   Please install Brave manually from: https://brave.com/download${colors.reset}`);
        }
    } catch (error) {
        // Don't fail the npm install if auto-install fails
        console.log(`${colors.yellow}⚠️  Brave check skipped: ${error.message}${colors.reset}`);
    }
}

postinstall().catch(err => {
    console.log(`${colors.yellow}⚠️  Postinstall warning: ${err.message}${colors.reset}`);
    // Don't exit with error code to not break npm install
});
