#!/usr/bin/env node

/**
 * Patch script for puppeteer-screen-recorder
 * 
 * This script patches the peerDependencies in puppeteer-screen-recorder's package.json
 * to use brave-real-puppeteer-core instead of the old puppeteer@19.0.0
 * 
 * Runs automatically after npm install via postinstall hook
 */

const fs = require('fs');
const path = require('path');

// Path to puppeteer-screen-recorder's package.json
const packagePath = path.join(
  process.cwd(),
  'node_modules',
  'puppeteer-screen-recorder',
  'package.json'
);

// Skip if package doesn't exist
if (!fs.existsSync(packagePath)) {
  console.log('ℹ️  puppeteer-screen-recorder not found, skipping patch');
  process.exit(0);
}

try {
  console.log('🔧 Patching puppeteer-screen-recorder peerDependencies...');
  
  // Read the package.json
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check if patch is needed
  if (packageJson.peerDependencies && packageJson.peerDependencies.puppeteer) {
    const currentValue = packageJson.peerDependencies.puppeteer;
    
    // Only patch if it's the old version
    if (currentValue === '19.0.0' || !currentValue.includes('brave-real-puppeteer-core')) {
      // Update to brave-real-puppeteer-core
      packageJson.peerDependencies.puppeteer = 'npm:brave-real-puppeteer-core@>=24.0.0';
      
      // Write back to file
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
      
      console.log('   ✓ puppeteer-screen-recorder patched successfully');
      console.log('   ✓ peerDependencies.puppeteer: npm:brave-real-puppeteer-core@>=24.0.0');
    } else {
      console.log('   ✓ puppeteer-screen-recorder already patched');
    }
  } else {
    console.log('   ⚠️  No puppeteer peerDependency found');
  }
  
} catch (error) {
  console.error('⚠️  Failed to patch puppeteer-screen-recorder:', error.message);
  console.log('ℹ️  Continuing anyway...');
  process.exit(0); // Don't fail the install
}
