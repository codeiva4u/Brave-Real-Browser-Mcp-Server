#!/usr/bin/env node

/**
 * Brave Browser Auto-Installer
 * Automatically downloads and installs Brave Browser if not found
 * Supports Windows, macOS, and Linux
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

console.log('\n🦁 Brave Browser Auto-Installer\n');

/**
 * Check if Brave is already installed
 */
function isBraveInstalled() {
  const platform = process.platform;
  
  const paths = {
    win32: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ],
    darwin: [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ],
    linux: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave-browser-stable',
      '/usr/bin/brave',
    ]
  };

  const pathsToCheck = paths[platform] || [];
  
  for (const bravePath of pathsToCheck) {
    if (fs.existsSync(bravePath)) {
      console.log(`✅ Brave Browser already installed at: ${bravePath}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Download Brave installer
 */
async function downloadBrave() {
  const platform = process.platform;
  
  console.log(`\n📥 Brave Browser not found on ${platform}`);
  console.log('   This project works best with Brave Browser');
  console.log('\n💡 Installation Options:');
  console.log('   1. Manual Install (Recommended):');
  console.log('      🔗 Visit: https://brave.com/download/');
  console.log('      📦 Download and install for your platform');
  console.log('      🔄 Then run: npm install');
  
  if (platform === 'win32') {
    console.log('\n   2. Windows Package Managers:');
    console.log('      • Winget:    winget install BraveSoftware.BraveBrowser');
    console.log('      • Chocolatey: choco install brave');
    console.log('      • Scoop:     scoop install brave');
  } else if (platform === 'darwin') {
    console.log('\n   2. macOS Package Managers:');
    console.log('      • Homebrew:  brew install --cask brave-browser');
  } else if (platform === 'linux') {
    console.log('\n   2. Linux Package Managers:');
    console.log('      • Ubuntu/Debian:');
    console.log('        sudo apt install brave-browser');
    console.log('      • Fedora:');
    console.log('        sudo dnf install brave-browser');
    console.log('      • Snap:');
    console.log('        sudo snap install brave');
  }
  
  console.log('\n   3. Environment Variable (Temporary):');
  console.log('      Set CHROME_PATH to use Chrome instead');
  console.log('      Example: CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"');
  
  console.log('\n⚠️  Note: Automatic installation requires admin privileges');
  console.log('   and is not recommended for security reasons.');
  console.log('\n📦 The system will use Chrome as fallback if available.\n');
}

/**
 * Main function
 */
async function main() {
  try {
    if (isBraveInstalled()) {
      console.log('✅ Brave Browser is ready to use!');
      console.log('🚀 You can now run: npm test\n');
      return 0;
    }
    
    await downloadBrave();
    return 0;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('⚠️  Continuing without Brave...\n');
    return 0;
  }
}

// Run installer
main().then(process.exit);
