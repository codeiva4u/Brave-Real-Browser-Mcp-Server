#!/usr/bin/env node

/**
 * Auto-update script for Brave Real Browser MCP Server
 * Automatically installs latest versions of brave-real-* dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Auto-updating Brave Real Browser dependencies...');

const BRAVE_PACKAGES = [
  'brave-real-browser',
  'brave-real-launcher', 
  'brave-real-puppeteer-core',
  'brave-real-playwright-core'
];

const OTHER_CRITICAL_PACKAGES = [
  '@modelcontextprotocol/sdk',
  'puppeteer-screen-recorder',
  'tesseract.js'
];

async function getLatestVersion(packageName) {
  try {
    const result = execSync(`npm view ${packageName} version`, { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return result.trim();
  } catch (error) {
    console.warn(`⚠️  Could not get latest version for ${packageName}`);
    return null;
  }
}

async function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found!');
    process.exit(1);
  }

  console.log('📦 Reading package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let updated = false;

  // Update brave-real packages
  console.log('🔄 Checking Brave Real packages...');
  for (const pkg of BRAVE_PACKAGES) {
    const latestVersion = await getLatestVersion(pkg);
    if (latestVersion) {
      const currentVersion = packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg];
      const newVersion = `^${latestVersion}`;
      
      if (packageJson.dependencies?.[pkg]) {
        if (packageJson.dependencies[pkg] !== newVersion) {
          console.log(`📌 ${pkg}: ${packageJson.dependencies[pkg]} → ${newVersion}`);
          packageJson.dependencies[pkg] = newVersion;
          updated = true;
        }
      } else if (!packageJson.dependencies?.[pkg]) {
        console.log(`✅ Adding ${pkg}: ${newVersion}`);
        packageJson.dependencies[pkg] = newVersion;
        updated = true;
      }
    }
  }

  // Update other critical packages
  console.log('🔄 Checking other critical packages...');
  for (const pkg of OTHER_CRITICAL_PACKAGES) {
    const latestVersion = await getLatestVersion(pkg);
    if (latestVersion && packageJson.dependencies?.[pkg]) {
      const newVersion = `^${latestVersion}`;
      if (packageJson.dependencies[pkg] !== newVersion) {
        console.log(`📌 ${pkg}: ${packageJson.dependencies[pkg]} → ${newVersion}`);
        packageJson.dependencies[pkg] = newVersion;
        updated = true;
      }
    }
  }

  if (updated) {
    console.log('💾 Saving updated package.json...');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('📥 Installing updated dependencies...');
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Dependencies updated successfully!');
  } else {
    console.log('✅ All dependencies are already up to date!');
  }
}

async function installMissingPackages() {
  console.log('🔍 Checking for missing brave-real packages...');
  
  const missingPackages = [];
  
  for (const pkg of BRAVE_PACKAGES) {
    try {
      require.resolve(pkg);
      console.log(`✅ ${pkg} is installed`);
    } catch (error) {
      console.log(`❌ ${pkg} is missing`);
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.log(`📥 Installing missing packages: ${missingPackages.join(', ')}`);
    
    for (const pkg of missingPackages) {
      const latestVersion = await getLatestVersion(pkg);
      if (latestVersion) {
        execSync(`npm install ${pkg}@^${latestVersion}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      }
    }
  }
}

async function validateInstallation() {
  console.log('🔍 Validating installation...');
  
  let allValid = true;
  
  for (const pkg of BRAVE_PACKAGES) {
    try {
      require.resolve(pkg);
      console.log(`✅ ${pkg} validated`);
    } catch (error) {
      console.error(`❌ ${pkg} validation failed:`, error.message);
      allValid = false;
    }
  }
  
  if (allValid) {
    console.log('🎉 All Brave Real packages are properly installed!');
    console.log('');
    console.log('📋 Available packages:');
    console.log('   - brave-real-browser: Core browser automation');
    console.log('   - brave-real-launcher: Browser launching utilities');
    console.log('   - brave-real-puppeteer-core: Optimized Puppeteer with stealth');
    console.log('   - brave-real-playwright-core: Optimized Playwright (optional)');
  } else {
    console.error('❌ Some packages failed validation. Please run npm install manually.');
    process.exit(1);
  }
}

async function main() {
  try {
    await updatePackageJson();
    await installMissingPackages();
    await validateInstallation();
    
    console.log('');
    console.log('🚀 Ready to use! No more warnings expected.');
    console.log('');
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  updatePackageJson,
  installMissingPackages,
  validateInstallation
};