#!/usr/bin/env node

/**
 * Version Synchronization Checker
 * Ensures package.json versions match installed node_modules versions
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

class VersionSyncChecker {
    constructor() {
        this.packageJsonPath = resolve(projectRoot, 'package.json');
        this.packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
        this.issues = [];
    }

    /**
     * Extract version from package.json across all dependency sections
     */
    getExpectedVersion(packageName) {
        const locations = [
            this.packageJson.dependencies?.[packageName],
            this.packageJson.optionalDependencies?.[packageName],
            this.packageJson.devDependencies?.[packageName],
            this.packageJson.peerDependencies?.[packageName]
        ];

        for (const version of locations) {
            if (version) {
                return version.replace(/^[~^]/, '');
            }
        }
        return null;
    }

    /**
     * Get installed version from node_modules
     */
    getInstalledVersion(packageName) {
        try {
            const installedPackageJsonPath = resolve(projectRoot, 'node_modules', packageName, 'package.json');
            if (!existsSync(installedPackageJsonPath)) {
                return null;
            }
            
            const installedPackageJson = JSON.parse(readFileSync(installedPackageJsonPath, 'utf8'));
            return installedPackageJson.version;
        } catch (error) {
            return null;
        }
    }

    /**
     * Check a single package version
     */
    checkPackageVersion(packageName) {
        const expectedVersion = this.getExpectedVersion(packageName);
        const installedVersion = this.getInstalledVersion(packageName);

        console.log(`\n🔍 Checking ${packageName}:`);

        if (!expectedVersion) {
            console.log(`   ❌ Not found in package.json`);
            this.issues.push(`${packageName}: Not found in package.json`);
            return false;
        }

        if (!installedVersion) {
            console.log(`   ❌ Not installed (Expected: ${expectedVersion})`);
            this.issues.push(`${packageName}: Not installed, expected ${expectedVersion}`);
            return false;
        }

        if (expectedVersion === installedVersion) {
            console.log(`   ✅ Version sync OK: ${installedVersion}`);
            return true;
        } else {
            console.log(`   🔄 Version mismatch:`);
            console.log(`      Expected: ${expectedVersion}`);
            console.log(`      Installed: ${installedVersion}`);
            this.issues.push(`${packageName}: Expected ${expectedVersion}, installed ${installedVersion}`);
            return false;
        }
    }

    /**
     * Check all relevant packages
     */
    checkAllVersions() {
        console.log('🔍 Version Synchronization Check');
        console.log('================================\n');

        const packagesToCheck = ['puppeteer-core', 'playwright-core', 'yargs'];
        let allGood = true;

        for (const packageName of packagesToCheck) {
            const isGood = this.checkPackageVersion(packageName);
            allGood = allGood && isGood;
        }

        console.log('\n📊 Summary:');
        console.log('===========');

        if (allGood) {
            console.log('✅ All versions are synchronized!');
            console.log('🚀 Ready for package creation and publishing');
        } else {
            console.log('❌ Version synchronization issues detected:');
            this.issues.forEach(issue => console.log(`   • ${issue}`));
            console.log('\n🔧 Recommended actions:');
            console.log('   1. Run: npm install');
            console.log('   2. Or update package.json versions manually');
            console.log('   3. Then re-run this check');
        }

        return allGood;
    }

    /**
     * Auto-fix version mismatches (install correct versions)
     */
    autoFix() {
        console.log('\n🔧 Auto-fixing version mismatches...\n');

        const packagesToFix = ['puppeteer-core', 'playwright-core'];
        
        for (const packageName of packagesToFix) {
            const expectedVersion = this.getExpectedVersion(packageName);
            const installedVersion = this.getInstalledVersion(packageName);

            if (expectedVersion && expectedVersion !== installedVersion) {
                console.log(`🔄 Installing ${packageName}@${expectedVersion}...`);
                try {
                    execSync(`npm install ${packageName}@${expectedVersion}`, {
                        cwd: projectRoot,
                        stdio: 'inherit'
                    });
                    console.log(`✅ Successfully installed ${packageName}@${expectedVersion}`);
                } catch (error) {
                    console.error(`❌ Failed to install ${packageName}@${expectedVersion}:`, error.message);
                }
            }
        }

        console.log('\n🔍 Re-checking after auto-fix...');
        return this.checkAllVersions();
    }

    /**
     * Show current versions table
     */
    showVersionsTable() {
        console.log('📋 Current Versions Table');
        console.log('=========================\n');

        const packages = ['puppeteer-core', 'playwright-core', 'yargs'];
        
        console.log('Package'.padEnd(20) + 'Expected'.padEnd(15) + 'Installed'.padEnd(15) + 'Status');
        console.log('-'.repeat(65));

        packages.forEach(packageName => {
            const expected = this.getExpectedVersion(packageName) || 'N/A';
            const installed = this.getInstalledVersion(packageName) || 'Not Installed';
            const status = expected === installed ? '✅ OK' : '❌ MISMATCH';

            console.log(
                packageName.padEnd(20) + 
                expected.padEnd(15) + 
                installed.padEnd(15) + 
                status
            );
        });

        console.log('\n');
    }
}

// CLI execution
const checker = new VersionSyncChecker();

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'check':
    case undefined:
        checker.showVersionsTable();
        const allGood = checker.checkAllVersions();
        process.exit(allGood ? 0 : 1);
        break;
        
    case 'fix':
        checker.showVersionsTable();
        checker.autoFix();
        break;
        
    case 'table':
        checker.showVersionsTable();
        break;
        
    case 'help':
        console.log('🔍 Version Sync Checker Usage:');
        console.log('==============================\n');
        console.log('node scripts/version-sync-checker.js [command]\n');
        console.log('Commands:');
        console.log('  check (default) - Check version synchronization');
        console.log('  fix            - Auto-fix version mismatches');
        console.log('  table          - Show versions table only');
        console.log('  help           - Show this help message');
        break;
        
    default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Run "node scripts/version-sync-checker.js help" for usage info');
        process.exit(1);
}