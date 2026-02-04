#!/usr/bin/env node
/**
 * Upstream Patcher Script
 * 
 * Downloads latest puppeteer-core or playwright-core from NPM
 * and applies stealth patches to create brave-real-* packages.
 * 
 * Usage:
 *   node scripts/upstream-patcher.js puppeteer [version]
 *   node scripts/upstream-patcher.js playwright [version]
 * 
 * Examples:
 *   node scripts/upstream-patcher.js puppeteer 24.0.0
 *   node scripts/upstream-patcher.js playwright 1.58.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_TYPE = process.argv[2]; // 'puppeteer' or 'playwright'
const TARGET_VERSION = process.argv[3]; // e.g., '24.0.0'

if (!PACKAGE_TYPE || !['puppeteer', 'playwright'].includes(PACKAGE_TYPE)) {
    console.error('❌ Usage: node scripts/upstream-patcher.js <puppeteer|playwright> <version>');
    process.exit(1);
}

if (!TARGET_VERSION) {
    console.error('❌ Version is required');
    process.exit(1);
}

const CONFIG = {
    puppeteer: {
        upstream: 'puppeteer-core',
        local: 'brave-real-puppeteer-core',
        dir: 'packages/brave-real-puppeteer-core',
        patchFiles: [
            'scripts/stealth-injector.js',
            'scripts/patcher.js',
            'index.js',
            'index.d.ts',
            'index.es5.js'
        ]
    },
    playwright: {
        upstream: 'playwright-core',
        local: 'brave-real-playwright-core',
        dir: 'packages/brave-real-playwright-core',
        patchFiles: [
            'stealth-injection.js',
            'advanced-stealth.js',
            'index.js',
            'index.d.ts'
        ]
    }
};

const config = CONFIG[PACKAGE_TYPE];

console.log(`\n🔄 Upstream Patcher: ${config.upstream} → ${config.local}`);
console.log('='.repeat(60));
console.log(`📦 Target version: ${TARGET_VERSION}`);
console.log(`📂 Local directory: ${config.dir}`);
console.log('');

// Step 1: Backup existing patch files
console.log('📦 Step 1: Backing up existing patch files...');
const backupDir = path.join(config.dir, '.patch-backup');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const backedUpFiles = [];
for (const file of config.patchFiles) {
    const srcPath = path.join(config.dir, file);
    if (fs.existsSync(srcPath)) {
        const destPath = path.join(backupDir, path.basename(file));
        fs.copyFileSync(srcPath, destPath);
        backedUpFiles.push(file);
        console.log(`   ✅ Backed up: ${file}`);
    }
}

// Step 2: Download latest upstream package
console.log(`\n📥 Step 2: Downloading ${config.upstream}@${TARGET_VERSION}...`);

const tempDir = path.join(config.dir, '.upstream-temp');
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
}
fs.mkdirSync(tempDir, { recursive: true });

try {
    execSync(`npm pack ${config.upstream}@${TARGET_VERSION}`, {
        cwd: tempDir,
        stdio: 'inherit'
    });
    
    // Extract the package
    const tgzFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.tgz'));
    if (tgzFiles.length === 0) {
        throw new Error('No .tgz file found');
    }
    
    execSync(`tar -xzf ${tgzFiles[0]}`, {
        cwd: tempDir,
        stdio: 'inherit'
    });
    
    console.log(`   ✅ Downloaded and extracted ${config.upstream}@${TARGET_VERSION}`);
} catch (error) {
    console.error(`   ❌ Failed to download: ${error.message}`);
    process.exit(1);
}

// Step 3: Copy upstream files to local package
console.log(`\n📂 Step 3: Updating ${config.local} with upstream files...`);

const upstreamPackageDir = path.join(tempDir, 'package');

// Read upstream package.json
const upstreamPkgJson = JSON.parse(
    fs.readFileSync(path.join(upstreamPackageDir, 'package.json'), 'utf-8')
);

// Copy lib folder (main code)
const upstreamLibDir = path.join(upstreamPackageDir, 'lib');
const localLibDir = path.join(config.dir, 'lib');

if (fs.existsSync(upstreamLibDir)) {
    // Remove old lib
    if (fs.existsSync(localLibDir)) {
        fs.rmSync(localLibDir, { recursive: true });
    }
    
    // Copy new lib
    copyDirRecursive(upstreamLibDir, localLibDir);
    console.log('   ✅ Updated lib/ folder');
}

// Step 4: Restore patch files
console.log('\n🔧 Step 4: Restoring stealth patch files...');

for (const file of backedUpFiles) {
    const srcPath = path.join(backupDir, path.basename(file));
    const destPath = path.join(config.dir, file);
    
    // Ensure directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    fs.copyFileSync(srcPath, destPath);
    console.log(`   ✅ Restored: ${file}`);
}

// Step 5: Update package.json
console.log('\n📝 Step 5: Updating package.json...');

const localPkgPath = path.join(config.dir, 'package.json');
const localPkgJson = JSON.parse(fs.readFileSync(localPkgPath, 'utf-8'));

// Update version based on upstream
const newVersion = `${TARGET_VERSION}-patch.1`;
localPkgJson.version = newVersion;

// Update brave metadata
if (PACKAGE_TYPE === 'puppeteer') {
    // Keep existing structure, just update version references
    if (!localPkgJson.brave) {
        localPkgJson.brave = {};
    }
    localPkgJson.brave.basedOn = {
        'puppeteer-core': TARGET_VERSION,
        patchedVersion: newVersion
    };
} else if (PACKAGE_TYPE === 'playwright') {
    if (!localPkgJson.brave) {
        localPkgJson.brave = {};
    }
    localPkgJson.brave.basedOn = {
        'playwright-core': TARGET_VERSION,
        'patches-version': newVersion,
        'release-info': `Brave Playwright v${newVersion} based on Playwright Core v${TARGET_VERSION}`
    };
    localPkgJson.brave.version = newVersion;
    localPkgJson.brave.versionInfo = {
        braveVersion: newVersion,
        playwrightVersion: TARGET_VERSION,
        fullName: `Brave Playwright Core v${newVersion} (Playwright ${TARGET_VERSION})`
    };
}

// Update dependencies from upstream
if (upstreamPkgJson.dependencies) {
    localPkgJson.dependencies = {
        ...localPkgJson.dependencies,
        ...upstreamPkgJson.dependencies
    };
}

fs.writeFileSync(localPkgPath, JSON.stringify(localPkgJson, null, 2) + '\n');
console.log(`   ✅ Updated version to ${newVersion}`);

// Step 6: Apply stealth patches to lib files
console.log('\n🛡️ Step 6: Applying stealth patches to lib files...');

if (PACKAGE_TYPE === 'puppeteer') {
    applyPuppeteerPatches(localLibDir);
} else {
    applyPlaywrightPatches(localLibDir);
}

// Step 7: Cleanup
console.log('\n🧹 Step 7: Cleaning up...');

fs.rmSync(tempDir, { recursive: true });
fs.rmSync(backupDir, { recursive: true });
console.log('   ✅ Cleanup complete');

console.log('\n' + '='.repeat(60));
console.log(`✅ Successfully patched ${config.local}@${newVersion}`);
console.log(`   Based on: ${config.upstream}@${TARGET_VERSION}`);
console.log('');

// ==================== HELPER FUNCTIONS ====================

function copyDirRecursive(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function applyPuppeteerPatches(libDir) {
    // Patch 1: Hide webdriver in BrowserContext
    const browserContextPath = findFile(libDir, 'BrowserContext.js');
    if (browserContextPath) {
        patchFile(browserContextPath, [
            {
                search: /navigator\.webdriver/g,
                replace: 'false /* patched by brave-real */'
            }
        ]);
        console.log('   ✅ Patched BrowserContext.js');
    }
    
    // Patch 2: Hide automation in FrameManager
    const frameManagerPath = findFile(libDir, 'FrameManager.js');
    if (frameManagerPath) {
        patchFile(frameManagerPath, [
            {
                search: /'pptr:'/g,
                replace: "'__hidden__:'"
            }
        ]);
        console.log('   ✅ Patched FrameManager.js');
    }
    
    // Patch 3: Remove sourceURL leaks
    const executionContextPath = findFile(libDir, 'ExecutionContext.js');
    if (executionContextPath) {
        patchFile(executionContextPath, [
            {
                search: /\/\/# sourceURL=pptr:/g,
                replace: '// '
            },
            {
                search: /sourceURL=__puppeteer/g,
                replace: 'sourceURL=__hidden__'
            }
        ]);
        console.log('   ✅ Patched ExecutionContext.js');
    }
    
    // Patch 4: Hide utility world
    const utilityWorldPath = findFile(libDir, 'IsolatedWorld.js');
    if (utilityWorldPath) {
        patchFile(utilityWorldPath, [
            {
                search: /__puppeteer_utility_world__/g,
                replace: '__main__'
            }
        ]);
        console.log('   ✅ Patched IsolatedWorld.js');
    }
    
    console.log('   ✅ Puppeteer stealth patches applied');
}

function applyPlaywrightPatches(libDir) {
    // Patch 1: Hide sourceURL in injected scripts
    const injectedScriptPath = findFile(libDir, 'injectedScriptSource.js');
    if (injectedScriptPath) {
        patchFile(injectedScriptPath, [
            {
                search: /sourceURL=playwright/g,
                replace: 'sourceURL=__hidden__'
            }
        ]);
        console.log('   ✅ Patched injectedScriptSource.js');
    }
    
    // Patch 2: Hide utility script markers
    const utilityScriptPath = findFile(libDir, 'utilityScriptSource.js');
    if (utilityScriptPath) {
        patchFile(utilityScriptPath, [
            {
                search: /__playwright/g,
                replace: '__hidden__'
            }
        ]);
        console.log('   ✅ Patched utilityScriptSource.js');
    }
    
    // Patch 3: Error stack sanitization
    const errorPath = findFile(libDir, 'errors.js');
    if (errorPath) {
        patchFile(errorPath, [
            {
                search: /playwright/gi,
                replace: 'browser'
            }
        ]);
        console.log('   ✅ Patched errors.js');
    }
    
    console.log('   ✅ Playwright stealth patches applied');
}

function findFile(dir, filename) {
    if (!fs.existsSync(dir)) return null;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            const found = findFile(fullPath, filename);
            if (found) return found;
        } else if (entry.name === filename) {
            return fullPath;
        }
    }
    
    return null;
}

function patchFile(filePath, patches) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    for (const patch of patches) {
        content = content.replace(patch.search, patch.replace);
    }
    
    fs.writeFileSync(filePath, content);
}
