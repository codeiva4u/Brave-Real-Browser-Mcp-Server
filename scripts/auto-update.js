#!/usr/bin/env node

/**
 * Auto-Update Dependencies Script for Brave-Real-Browser-MCP-Server
 * 
 * यह script npm install के दौरान automatically चलता है और
 * सभी dependencies को latest version में update करता है
 * 
 * Environment Variables:
 * - SKIP_AUTO_UPDATE=true    : Auto-update को disable करने के लिए
 * - AUTO_UPDATE=false        : Alternative way to disable
 * - CI=true                  : CI environment में automatically enable
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - सभी dependencies
const CORE_DEPENDENCIES = [
  'brave-real-browser',
  'brave-real-launcher',
  'brave-real-puppeteer-core'
];

const OTHER_DEPENDENCIES = [
  '@modelcontextprotocol/sdk',
  'turndown',
  '@types/turndown'
];

const DEV_DEPENDENCIES = [
  '@types/node',
  'tsx',
  'typescript',
  '@vitest/coverage-v8',
  '@vitest/ui',
  'rimraf',
  'vitest'
];

const ALL_DEPENDENCIES = [
  ...CORE_DEPENDENCIES,
  ...OTHER_DEPENDENCIES,
  ...DEV_DEPENDENCIES
];

// Check if auto-update should be skipped
const shouldSkipUpdate = () => {
  // Skip करें अगर environment variable set है
  if (process.env.SKIP_AUTO_UPDATE === 'true' || process.env.AUTO_UPDATE === 'false') {
    console.log('⏭️  Auto-update skipped (SKIP_AUTO_UPDATE=true)');
    return true;
  }

  // Skip करें अगर यह khud की installation है (avoid recursion)
  if (process.env.npm_lifecycle_event === 'preinstall' && 
      process.env.npm_package_name === 'brave-real-browser-mcp-server') {
    // Check if we're installing from npm registry
    const isRegistryInstall = process.env.npm_config_argv && 
                               process.env.npm_config_argv.includes('install') &&
                               !fs.existsSync(path.join(__dirname, '..', 'package.json'));
    
    if (isRegistryInstall) {
      console.log('📦 Installing from npm registry...');
      return true;
    }
  }

  return false;
};

// Get latest version from npm registry
const getLatestVersion = (packageName) => {
  try {
    const result = execSync(`npm view ${packageName} version`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return result.trim();
  } catch (error) {
    return null;
  }
};

// Get currently installed version
const getCurrentVersion = (packageName) => {
  try {
    const result = execSync(`npm list ${packageName} --depth=0`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const match = result.match(new RegExp(`${packageName}@([\\d\\.\\-a-z]+)`));
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

// Main update function
const updateDependencies = () => {
  try {
    console.log('\n🔄 Brave-Real-Browser-MCP-Server: Checking for dependency updates...\n');

    // Check for outdated packages
    let outdatedPackages = [];
    
    for (const packageName of ALL_DEPENDENCIES) {
      try {
        const current = getCurrentVersion(packageName);
        const latest = getLatestVersion(packageName);
        
        if (!current) {
          console.log(`⚠️  ${packageName}: Not installed`);
          outdatedPackages.push({ name: packageName, current: null, latest });
        } else if (!latest) {
          console.log(`ℹ️  ${packageName}@${current}: Cannot check latest version`);
        } else if (current !== latest) {
          console.log(`📦 ${packageName}: ${current} → ${latest}`);
          outdatedPackages.push({ name: packageName, current, latest });
        } else {
          console.log(`✅ ${packageName}@${current}: Up to date`);
        }
      } catch (error) {
        console.log(`⚠️  ${packageName}: Error checking version`);
      }
    }

    if (outdatedPackages.length === 0) {
      console.log('\n✅ All dependencies are up to date!\n');
      return;
    }

    console.log(`\n📦 Found ${outdatedPackages.length} outdated dependencies`);
    console.log('🔧 Updating to latest versions...\n');

    // Update core dependencies first (with --force)
    const coreUpdates = outdatedPackages.filter(pkg => 
      CORE_DEPENDENCIES.includes(pkg.name)
    );

    if (coreUpdates.length > 0) {
      console.log('🚀 Updating core Brave packages...');
      const corePackages = coreUpdates.map(pkg => `${pkg.name}@latest`).join(' ');
      try {
        execSync(`npm install ${corePackages} --save --force`, {
          stdio: 'inherit',
          encoding: 'utf8'
        });
        console.log('✅ Core packages updated successfully!\n');
      } catch (error) {
        console.error('⚠️  Warning: Some core packages failed to update');
      }
    }

    // Update other dependencies (without --force)
    const otherUpdates = outdatedPackages.filter(pkg => 
      !CORE_DEPENDENCIES.includes(pkg.name) && !DEV_DEPENDENCIES.includes(pkg.name)
    );

    if (otherUpdates.length > 0) {
      console.log('📚 Updating other dependencies...');
      const otherPackages = otherUpdates.map(pkg => `${pkg.name}@latest`).join(' ');
      try {
        execSync(`npm install ${otherPackages} --save`, {
          stdio: 'inherit',
          encoding: 'utf8'
        });
        console.log('✅ Other dependencies updated successfully!\n');
      } catch (error) {
        console.error('⚠️  Warning: Some dependencies failed to update');
      }
    }

    // Update dev dependencies
    const devUpdates = outdatedPackages.filter(pkg => 
      DEV_DEPENDENCIES.includes(pkg.name)
    );

    if (devUpdates.length > 0) {
      console.log('🛠️  Updating dev dependencies...');
      const devPackages = devUpdates.map(pkg => `${pkg.name}@latest`).join(' ');
      try {
        execSync(`npm install ${devPackages} --save-dev`, {
          stdio: 'inherit',
          encoding: 'utf8'
        });
        console.log('✅ Dev dependencies updated successfully!\n');
      } catch (error) {
        console.error('⚠️  Warning: Some dev dependencies failed to update');
      }
    }

    console.log('✅ All updates completed!\n');

    // Show updated versions
    console.log('📋 Current versions:');
    for (const packageName of ALL_DEPENDENCIES) {
      const version = getCurrentVersion(packageName);
      if (version) {
        console.log(`   ${packageName}@${version}`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('\n⚠️  Warning: Could not auto-update dependencies');
    console.error('   You can manually update using: npm run update-brave-packages');
    console.error('   Or: npm run ensure-latest-packages\n');
    // Don't fail the installation
  }
};

// Main execution
if (!shouldSkipUpdate()) {
  updateDependencies();
} else {
  console.log('🔍 Skipping auto-update...\n');
}
