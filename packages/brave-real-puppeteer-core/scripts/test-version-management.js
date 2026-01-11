#!/usr/bin/env node

/**
 * Test Version Management Script
 * Tests semantic versioning and package creation locally
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

class VersionTester {
    constructor() {
        this.packageJsonPath = resolve(projectRoot, 'package.json');
        this.packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    }

    /**
     * Test semantic version validation
     */
    testSemanticVersioning() {
        console.log('🧪 Testing Semantic Versioning...\n');

        const currentVersion = this.packageJson.version;
        console.log(`Current version: ${currentVersion}`);

        // Test version format validation
        const semverPattern = /^\d+\.\d+\.\d+$/;
        
        if (semverPattern.test(currentVersion)) {
            console.log('✅ Version format is valid semantic versioning');
        } else {
            console.error('❌ Version format is NOT valid semantic versioning');
            console.log('Expected format: x.y.z (e.g., 1.0.0, 2.1.3)');
            return false;
        }

        // Test version increments
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        
        const patchVersion = `${major}.${minor}.${patch + 1}`;
        const minorVersion = `${major}.${minor + 1}.0`;
        const majorVersion = `${major + 1}.0.0`;

        console.log(`\nVersion increments would be:`);
        console.log(`  Patch: ${currentVersion} → ${patchVersion}`);
        console.log(`  Minor: ${currentVersion} → ${minorVersion}`);
        console.log(`  Major: ${currentVersion} → ${majorVersion}`);

        return true;
    }

    /**
     * Test latest dependencies fetching
     */
    async testLatestDependencies() {
        console.log('\n📦 Testing Latest Dependencies Fetching...\n');

        try {
            // Get latest puppeteer version
            const puppeteerVersion = execSync('npm view puppeteer-core version', { 
                encoding: 'utf8',
                cwd: projectRoot 
            }).trim();
            console.log(`🎭 Latest Puppeteer Core: ${puppeteerVersion}`);

            // Get latest playwright version
            const playwrightVersion = execSync('npm view playwright-core version', { 
                encoding: 'utf8',
                cwd: projectRoot 
            }).trim();
            console.log(`🎪 Latest Playwright Core: ${playwrightVersion}`);

            // Compare with current dependencies
            const currentPuppeteer = this.packageJson.optionalDependencies?.['puppeteer-core']?.replace(/^[~^]/, '');
            const currentPlaywright = this.packageJson.optionalDependencies?.['playwright-core']?.replace(/^[~^]/, '');

            console.log(`\nCurrent vs Latest:`);
            console.log(`  Puppeteer: ${currentPuppeteer} vs ${puppeteerVersion}`);
            console.log(`  Playwright: ${currentPlaywright} vs ${playwrightVersion}`);

            if (currentPuppeteer !== puppeteerVersion) {
                console.log(`🔄 Puppeteer can be updated`);
            } else {
                console.log(`✅ Puppeteer is up to date`);
            }

            if (currentPlaywright !== playwrightVersion) {
                console.log(`🔄 Playwright can be updated`);
            } else {
                console.log(`✅ Playwright is up to date`);
            }

            return { puppeteerVersion, playwrightVersion };

        } catch (error) {
            console.error('❌ Failed to fetch latest versions:', error.message);
            return null;
        }
    }

    /**
     * Test package creation
     */
    async testPackageCreation() {
        console.log('\n📦 Testing Package Creation...\n');

        try {
            // Test puppeteer package creation
            console.log('Creating test Brave Puppeteer package...');
            execSync('node ./scripts/create-brave-package.js --engine=puppeteer --output=test-dist', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            console.log('Creating test Brave Playwright package...');
            execSync('node ./scripts/create-brave-package.js --engine=playwright --output=test-dist', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            console.log('✅ Test packages created successfully in test-dist/');
            return true;

        } catch (error) {
            console.error('❌ Package creation test failed:', error.message);
            return false;
        }
    }

    /**
     * Test workflow readiness
     */
    testWorkflowReadiness() {
        console.log('\n🚀 Testing Workflow Readiness...\n');

        const checklist = [];

        // Check if package.json has required scripts
        const requiredScripts = ['patch-both', 'create-brave-packages', 'version-sync'];
        requiredScripts.forEach(script => {
            if (this.packageJson.scripts?.[script]) {
                console.log(`✅ Script '${script}' exists`);
                checklist.push(true);
            } else {
                console.log(`❌ Script '${script}' missing`);
                checklist.push(false);
            }
        });

        // Check workflow file exists
        const workflowPath = resolve(projectRoot, '.github/workflows/publish-packages.yml');
        try {
            readFileSync(workflowPath, 'utf8');
            console.log('✅ GitHub workflow file exists');
            checklist.push(true);
        } catch {
            console.log('❌ GitHub workflow file missing');
            checklist.push(false);
        }

        // Check repository structure
        const requiredDirs = ['scripts', '.github/workflows'];
        requiredDirs.forEach(dir => {
            const dirPath = resolve(projectRoot, dir);
            if (existsSync(dirPath)) {
                console.log(`✅ Directory '${dir}' exists`);
                checklist.push(true);
            } else {
                console.log(`❌ Directory '${dir}' missing`);
                checklist.push(false);
            }
        });

        const allReady = checklist.every(Boolean);
        console.log(`\n${allReady ? '✅' : '❌'} Workflow readiness: ${allReady ? 'READY' : 'NOT READY'}`);
        
        return allReady;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🦁 BRAVE VERSION MANAGEMENT TESTING');
        console.log('=' + '='.repeat(40));

        const results = [];

        // Test 1: Semantic Versioning
        results.push(this.testSemanticVersioning());

        // Test 2: Latest Dependencies
        const latestDeps = await this.testLatestDependencies();
        results.push(latestDeps !== null);

        // Test 3: Package Creation
        const packageTest = await this.testPackageCreation();
        results.push(packageTest);

        // Test 4: Workflow Readiness
        results.push(this.testWorkflowReadiness());

        // Summary
        console.log('\n📊 TEST SUMMARY');
        console.log('=' + '='.repeat(20));
        const passed = results.filter(Boolean).length;
        const total = results.length;
        
        console.log(`✅ Passed: ${passed}/${total}`);
        if (passed === total) {
            console.log('🎉 All tests passed! Workflow is ready to use.');
            console.log('\nNext steps:');
            console.log('1. Commit and push changes to GitHub');
            console.log('2. Go to GitHub Actions tab');
            console.log('3. Run "🦁 Brave NPM Auto-Publish Workflow"');
            console.log('4. Set test_mode: true for initial testing');
        } else {
            console.log('❌ Some tests failed. Please fix issues before using workflow.');
        }

        return passed === total;
    }
}

// Run tests
const tester = new VersionTester();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
});