#!/usr/bin/env node

/**
 * Script to ensure latest versions of brave packages are always installed
 * This script checks npm registry for latest versions and updates if needed
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BRAVE_PACKAGES = [
  'brave-real-browser',
  'brave-real-launcher', 
  'brave-real-puppeteer-core'
];

console.log('🔍 Checking for latest versions of Brave packages...');

async function getLatestVersion(packageName) {
  try {
    const result = execSync(`npm view ${packageName} version`, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    console.error(`❌ Failed to get latest version for ${packageName}:`, error.message);
    return null;
  }
}

async function getCurrentVersion(packageName) {
  try {
    const result = execSync(`npm list ${packageName} --depth=0`, { encoding: 'utf8' });
    const match = result.match(new RegExp(`${packageName}@([\\d\\.]+)`));
    return match ? match[1] : null;
  } catch (error) {
    console.log(`⚠️  ${packageName} not currently installed`);
    return null;
  }
}

async function installLatestVersion(packageName, latestVersion) {
  try {
    console.log(`📦 Installing ${packageName}@${latestVersion}...`);
    execSync(`npm install ${packageName}@${latestVersion} --save --force`, { 
      stdio: 'inherit',
      encoding: 'utf8' 
    });
    console.log(`✅ Successfully installed ${packageName}@${latestVersion}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install ${packageName}@${latestVersion}:`, error.message);
    return false;
  }
}

async function main() {
  let updatedCount = 0;
  
  for (const packageName of BRAVE_PACKAGES) {
    console.log(`\n🔄 Processing ${packageName}...`);
    
    const latestVersion = await getLatestVersion(packageName);
    if (!latestVersion) {
      console.error(`❌ Could not determine latest version for ${packageName}`);
      continue;
    }
    
    const currentVersion = await getCurrentVersion(packageName);
    
    console.log(`   Current: ${currentVersion || 'Not installed'}`);
    console.log(`   Latest:  ${latestVersion}`);
    
    if (!currentVersion || currentVersion !== latestVersion) {
      console.log(`   📥 Update required: ${currentVersion || 'none'} → ${latestVersion}`);
      const success = await installLatestVersion(packageName, latestVersion);
      if (success) updatedCount++;
    } else {
      console.log(`   ✅ Already at latest version`);
    }
  }
  
  console.log(`\n🎉 Process completed! Updated ${updatedCount}/${BRAVE_PACKAGES.length} packages`);
  
  // Verify final versions
  console.log('\n📋 Final installed versions:');
  for (const packageName of BRAVE_PACKAGES) {
    const version = await getCurrentVersion(packageName);
    console.log(`   ${packageName}: ${version || 'NOT INSTALLED'}`);
  }
}

main().catch(console.error);