#!/usr/bin/env node
/**
 * 🔍 Version Checker for Puppeteer-Core and Playwright-Core
 * Automatically checks for new versions and updates if needed
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class VersionChecker {
    constructor() {
        this.packageJsonPath = path.join(process.cwd(), 'package.json');
        this.currentVersions = {};
        this.latestVersions = {};
        this.hasUpdates = false;
    }

    /**
     * Get current versions from package.json
     */
    getCurrentVersions() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            
            this.currentVersions = {
                'puppeteer-core': packageJson.dependencies?.['puppeteer-core']?.replace('^', '') || packageJson.optionalDependencies?.['puppeteer-core']?.replace('^', '') || 'not-installed',
                'playwright-core': packageJson.optionalDependencies?.['playwright-core']?.replace('^', '') || 'not-installed'
            };

            console.log('📋 Current Versions:');
            console.log(`   🎭 Puppeteer-core: ${this.currentVersions['puppeteer-core']}`);
            console.log(`   🎪 Playwright-core: ${this.currentVersions['playwright-core']}\n`);
        } catch (error) {
            console.error('❌ Error reading package.json:', error.message);
            process.exit(1);
        }
    }

    /**
     * Get latest versions from NPM
     */
    async getLatestVersions() {
        const packages = ['puppeteer-core', 'playwright-core'];
        
        console.log('🔍 Checking for latest versions...');
        
        for (const pkg of packages) {
            try {
                const result = execSync(`npm show ${pkg} version`, { encoding: 'utf8' }).trim();
                this.latestVersions[pkg] = result;
                console.log(`   ✅ ${pkg}: ${result}`);
            } catch (error) {
                console.error(`❌ Error checking ${pkg}:`, error.message);
                this.latestVersions[pkg] = 'error';
            }
        }
        console.log('');
    }

    /**
     * Compare versions and check for updates
     */
    checkForUpdates() {
        console.log('🔄 Comparing versions...');
        
        for (const pkg of Object.keys(this.currentVersions)) {
            const current = this.currentVersions[pkg];
            const latest = this.latestVersions[pkg];
            
            if (current === 'not-installed') {
                console.log(`   ⚠️  ${pkg}: Not installed`);
                continue;
            }
            
            if (latest === 'error') {
                console.log(`   ❌ ${pkg}: Error checking version`);
                continue;
            }
            
            if (current !== latest) {
                console.log(`   🆕 ${pkg}: ${current} → ${latest} (UPDATE AVAILABLE)`);
                this.hasUpdates = true;
            } else {
                console.log(`   ✅ ${pkg}: ${current} (UP TO DATE)`);
            }
        }
        console.log('');
    }

    /**
     * Update package.json with new versions
     */
    updatePackageJson() {
        if (!this.hasUpdates) {
            console.log('✅ No updates needed. All packages are up to date.');
            return false;
        }

        try {
            console.log('📝 Updating package.json...');
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            
            // Update versions
            for (const pkg of Object.keys(this.currentVersions)) {
                if (this.currentVersions[pkg] !== this.latestVersions[pkg] && 
                    this.latestVersions[pkg] !== 'error' && 
                    this.currentVersions[pkg] !== 'not-installed') {
                    
                    // Update in dependencies first, then optionalDependencies
                    if (packageJson.dependencies?.[pkg]) {
                        packageJson.dependencies[pkg] = `^${this.latestVersions[pkg]}`;
                        console.log(`   ✅ Updated ${pkg} to ^${this.latestVersions[pkg]} in dependencies`);
                    } else if (packageJson.optionalDependencies?.[pkg]) {
                        packageJson.optionalDependencies[pkg] = `^${this.latestVersions[pkg]}`;
                        console.log(`   ✅ Updated ${pkg} to ^${this.latestVersions[pkg]} in optionalDependencies`);
                    }
                }
            }

            // Write updated package.json
            fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            console.log('✅ package.json updated successfully!\n');
            return true;
        } catch (error) {
            console.error('❌ Error updating package.json:', error.message);
            return false;
        }
    }

    /**
     * Set GitHub Actions output for workflow
     */
    setGitHubOutput() {
        if (process.env.GITHUB_OUTPUT) {
            const outputData = [
                `has_updates=${this.hasUpdates}`,
                `puppeteer_current=${this.currentVersions['puppeteer-core']}`,
                `puppeteer_latest=${this.latestVersions['puppeteer-core']}`,
                `playwright_current=${this.currentVersions['playwright-core']}`,
                `playwright_latest=${this.latestVersions['playwright-core']}`
            ].join('\n');

            fs.appendFileSync(process.env.GITHUB_OUTPUT, outputData + '\n');
            console.log('📤 GitHub Actions output variables set');
        }
    }

    /**
     * Main execution function
     */
    async run() {
        console.log('🔍 REBROWSER STEALTH - VERSION CHECKER');
        console.log('=====================================\n');

        // Get current versions
        this.getCurrentVersions();
        
        // Get latest versions
        await this.getLatestVersions();
        
        // Check for updates
        this.checkForUpdates();
        
        // Update package.json if needed (skip if --check-only)
        const updated = checkOnly ? false : this.updatePackageJson();
        
        // Set GitHub Actions outputs
        this.setGitHubOutput();
        
        // Exit with appropriate code
        if (this.hasUpdates) {
            console.log('🎉 Updates were found!');
            console.log(checkOnly ? '   (Check-only mode: no changes applied)' : '   Next steps: Install new packages and apply patches');
            process.exit(0); // Success with updates
        } else {
            console.log('✅ All packages are up to date!');
            process.exit(0); // Success - no updates needed
        }
    }
}

// Command line arguments handling
const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');
const verbose = args.includes('--verbose');

if (args.includes('--help')) {
    console.log(`
🔍 Version Checker Usage:

  node check-versions.js [options]

Options:
  --check-only     Only check versions, don't update package.json
  --verbose        Show detailed output
  --help          Show this help message

Examples:
  node check-versions.js                 # Check and update if needed
  node check-versions.js --check-only    # Only check versions
  node check-versions.js --verbose       # Detailed output
`);
    process.exit(0);
}

// Run the version checker
const checker = new VersionChecker();
checker.run().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});
