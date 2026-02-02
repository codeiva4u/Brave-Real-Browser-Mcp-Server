#!/usr/bin/env node

/**
 * Patch Validator for Brave Real Puppeteer/Playwright Core
 * Validates patches before and after application
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
    BACKUP_DIR: path.join(__dirname, '..', '.patch-backups'),
    CHECKSUM_FILE: path.join(__dirname, '..', '.patch-checksums.json'),
    MAX_BACKUPS: 5
};

/**
 * Calculate file checksum
 */
function calculateChecksum(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
        return null;
    }
}

/**
 * Validate package exists and is accessible
 */
export function validatePackageExists(packagePath, packageName) {
    console.log(`🔍 Validating package: ${packageName}`);
    
    if (!fs.existsSync(packagePath)) {
        throw new Error(`Package not found: ${packagePath}`);
    }
    
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found in ${packagePath}`);
    }
    
    try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.name !== packageName) {
            throw new Error(`Package name mismatch: expected ${packageName}, found ${pkg.name}`);
        }
        console.log(`✅ Package validated: ${pkg.name}@${pkg.version}`);
        return pkg;
    } catch (error) {
        throw new Error(`Invalid package.json: ${error.message}`);
    }
}

/**
 * Create backup of package before patching
 */
export function createBackup(packagePath, packageName) {
    console.log(`💾 Creating backup for ${packageName}...`);
    
    // Ensure backup directory exists
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
        fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${packageName}-${timestamp}`;
    const backupPath = path.join(CONFIG.BACKUP_DIR, backupName);
    
    try {
        // Copy package directory
        fs.cpSync(packagePath, backupPath, { recursive: true });
        
        // Clean old backups
        cleanOldBackups(packageName);
        
        console.log(`✅ Backup created: ${backupName}`);
        return backupPath;
    } catch (error) {
        console.error(`❌ Backup failed: ${error.message}`);
        return null;
    }
}

/**
 * Clean old backups, keep only MAX_BACKUPS
 */
function cleanOldBackups(packageName) {
    try {
        const backups = fs.readdirSync(CONFIG.BACKUP_DIR)
            .filter(dir => dir.startsWith(packageName))
            .map(dir => ({
                name: dir,
                path: path.join(CONFIG.BACKUP_DIR, dir),
                time: fs.statSync(path.join(CONFIG.BACKUP_DIR, dir)).mtime
            }))
            .sort((a, b) => b.time - a.time);
        
        // Remove old backups
        if (backups.length > CONFIG.MAX_BACKUPS) {
            const toRemove = backups.slice(CONFIG.MAX_BACKUPS);
            toRemove.forEach(backup => {
                fs.rmSync(backup.path, { recursive: true, force: true });
                console.log(`🗑️  Removed old backup: ${backup.name}`);
            });
        }
    } catch (error) {
        console.warn(`⚠️  Backup cleanup failed: ${error.message}`);
    }
}

/**
 * Validate patch files exist
 */
export function validatePatchFiles(patchDir, packageName) {
    console.log(`🔍 Validating patch files for ${packageName}...`);
    
    if (!fs.existsSync(patchDir)) {
        throw new Error(`Patch directory not found: ${patchDir}`);
    }
    
    const patchFiles = fs.readdirSync(patchDir)
        .filter(file => file.endsWith('.patch'));
    
    if (patchFiles.length === 0) {
        throw new Error(`No patch files found in ${patchDir}`);
    }
    
    console.log(`✅ Found ${patchFiles.length} patch file(s)`);
    return patchFiles;
}

/**
 * Calculate checksums for important files
 */
export function calculatePackageChecksums(packagePath, files = []) {
    console.log(`🔐 Calculating checksums...`);
    
    const checksums = {};
    const filesToCheck = files.length > 0 ? files : [
        'package.json',
        'lib/Browser.js',
        'lib/Page.js',
        'lib/Frame.js'
    ];
    
    filesToCheck.forEach(file => {
        const filePath = path.join(packagePath, file);
        if (fs.existsSync(filePath)) {
            checksums[file] = calculateChecksum(filePath);
        }
    });
    
    return checksums;
}

/**
 * Save checksums to file
 */
export function saveChecksums(packageName, checksums) {
    try {
        let allChecksums = {};
        if (fs.existsSync(CONFIG.CHECKSUM_FILE)) {
            allChecksums = JSON.parse(fs.readFileSync(CONFIG.CHECKSUM_FILE, 'utf8'));
        }
        
        allChecksums[packageName] = {
            timestamp: new Date().toISOString(),
            checksums
        };
        
        fs.writeFileSync(
            CONFIG.CHECKSUM_FILE,
            JSON.stringify(allChecksums, null, 2)
        );
        
        console.log(`✅ Checksums saved`);
    } catch (error) {
        console.warn(`⚠️  Failed to save checksums: ${error.message}`);
    }
}

/**
 * Verify patch was applied successfully
 */
export function verifyPatchApplied(packagePath, packageName, beforeChecksums) {
    console.log(`🔍 Verifying patch application...`);
    
    const afterChecksums = calculatePackageChecksums(packagePath, Object.keys(beforeChecksums));
    
    let changedFiles = 0;
    let unchangedFiles = 0;
    
    for (const [file, beforeSum] of Object.entries(beforeChecksums)) {
        const afterSum = afterChecksums[file];
        if (beforeSum !== afterSum) {
            console.log(`  ✅ ${file} - Modified`);
            changedFiles++;
        } else {
            unchangedFiles++;
        }
    }
    
    if (changedFiles === 0) {
        console.warn(`⚠️  Warning: No files were modified by patch`);
        return false;
    }
    
    console.log(`✅ Patch verified: ${changedFiles} file(s) modified`);
    saveChecksums(packageName, afterChecksums);
    return true;
}

/**
 * Restore from backup
 */
export function restoreFromBackup(packagePath, backupPath) {
    console.log(`🔄 Restoring from backup...`);
    
    try {
        // Remove current package
        fs.rmSync(packagePath, { recursive: true, force: true });
        
        // Restore from backup
        fs.cpSync(backupPath, packagePath, { recursive: true });
        
        console.log(`✅ Restored from backup`);
        return true;
    } catch (error) {
        console.error(`❌ Restore failed: ${error.message}`);
        return false;
    }
}

/**
 * Main validation workflow
 */
export async function validateAndPatch(packagePath, packageName, patchFunction) {
    console.log(`\n🚀 Starting patch validation for ${packageName}\n`);
    
    try {
        // Step 1: Validate package
        const pkg = validatePackageExists(packagePath, packageName);
        
        // Step 2: Calculate checksums before
        const beforeChecksums = calculatePackageChecksums(packagePath);
        
        // Step 3: Create backup
        const backupPath = createBackup(packagePath, packageName);
        
        if (!backupPath) {
            throw new Error('Failed to create backup');
        }
        
        // Step 4: Apply patch
        console.log(`\n🔧 Applying patches...\n`);
        const patchResult = await patchFunction();
        
        // Step 5: Verify patch
        const verified = verifyPatchApplied(packagePath, packageName, beforeChecksums);
        
        if (!verified) {
            console.warn(`⚠️  Patch verification failed, but continuing...`);
        }
        
        console.log(`\n✅ Patch validation completed successfully!\n`);
        return {
            success: true,
            backupPath,
            verified,
            package: pkg
        };
        
    } catch (error) {
        console.error(`\n❌ Patch validation failed: ${error.message}\n`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * List available backups
 */
export function listBackups(packageName = null) {
    console.log(`\n📦 Available Backups:\n`);
    
    if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
        console.log('No backups found');
        return [];
    }
    
    const backups = fs.readdirSync(CONFIG.BACKUP_DIR)
        .filter(dir => !packageName || dir.startsWith(packageName))
        .map(dir => {
            const stats = fs.statSync(path.join(CONFIG.BACKUP_DIR, dir));
            return {
                name: dir,
                path: path.join(CONFIG.BACKUP_DIR, dir),
                created: stats.mtime.toISOString(),
                size: stats.size
            };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    backups.forEach((backup, i) => {
        console.log(`${i + 1}. ${backup.name}`);
        console.log(`   Created: ${backup.created}`);
    });
    
    if (backups.length === 0) {
        console.log('No backups found');
    }
    
    return backups;
}

export default {
    validatePackageExists,
    createBackup,
    validatePatchFiles,
    calculatePackageChecksums,
    verifyPatchApplied,
    restoreFromBackup,
    validateAndPatch,
    listBackups
};
