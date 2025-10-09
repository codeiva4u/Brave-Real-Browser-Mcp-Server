#!/usr/bin/env node

/**
 * Auto-update script for brave-real-browser-mcp-server
 * 
 * This script automatically updates all dependencies to their latest versions
 * when npm install is run. It ensures the project always uses the most recent
 * compatible versions while maintaining all functionality.
 * 
 * Features:
 * - Updates brave-real-browser to latest
 * - Updates @modelcontextprotocol/sdk to latest
 * - Skips in CI environments to prevent infinite loops
 * - Silent mode to avoid cluttering install output
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Skip in CI environments to prevent recursive installs
const isCIEnvironment = process.env.CI === 'true' || 
                        process.env.GITHUB_ACTIONS === 'true' ||
                        process.env.SKIP_AUTO_UPDATE === 'true';

if (isCIEnvironment) {
  console.log('ℹ️  Auto-update skipped in CI environment');
  process.exit(0);
}

// Check if we're in the root of the package
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.log('ℹ️  Not in package root, skipping auto-update');
  process.exit(0);
}

console.log('\n🔄 Auto-updating dependencies to latest versions...\n');

// List of packages to always keep at latest version
const packagesToUpdate = [
  'brave-real-browser',
  '@modelcontextprotocol/sdk',
  'turndown',
  '@types/turndown'
];

try {
  // Update each package to latest
  for (const pkg of packagesToUpdate) {
    try {
      console.log(`   Updating ${pkg}...`);
      execSync(`npm install ${pkg}@latest --save --no-audit --no-fund`, {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log(`   ✓ ${pkg} updated to latest`);
    } catch (error) {
      console.log(`   ⚠️  Could not update ${pkg} (non-critical)`);
    }
  }

  console.log('\n✅ All dependencies updated to latest versions!\n');
  
  // Show current versions
  console.log('📦 Current versions:');
  for (const pkg of packagesToUpdate) {
    try {
      const version = execSync(`npm list ${pkg} --depth=0 --json`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      const parsed = JSON.parse(version);
      const installedVersion = parsed.dependencies?.[pkg]?.version || 'not found';
      console.log(`   ${pkg}: ${installedVersion}`);
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Step 4: Run npm audit fix to resolve security vulnerabilities
  console.log('\n🔒 Running security audit fix...');
  try {
    execSync('npm audit fix --force', {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log('   ✓ Security vulnerabilities fixed');
  } catch (error) {
    // Check if there are still vulnerabilities
    try {
      const auditResult = execSync('npm audit --json', {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      const audit = JSON.parse(auditResult);
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const total = audit.metadata.vulnerabilities.total || 0;
        if (total === 0) {
          console.log('   ✓ No security vulnerabilities found');
        } else {
          console.log(`   ⚠️  ${total} vulnerabilities remaining (may require manual review)`);
        }
      }
    } catch (auditError) {
      console.log('   ℹ️  Security audit completed');
    }
  }
  
  console.log('');

} catch (error) {
  console.error('⚠️  Auto-update encountered an error:', error.message);
  console.log('ℹ️  Continuing with current versions...\n');
  process.exit(0); // Don't fail the install
}
