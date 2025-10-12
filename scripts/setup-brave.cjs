#!/usr/bin/env node

/**
 * Brave Browser Auto-Detection and Setup Script
 * Automatically detects and configures Brave Browser on all platforms
 * Runs during npm install (postinstall hook)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🦁 Brave Browser Auto-Detection Starting...\n');

/**
 * Detect Brave on Windows
 */
function detectBraveWindows() {
  const bravePaths = [
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    path.join(process.env.PROGRAMFILES || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
  ];

  // Try registry detection first
  try {
    const registryQueries = [
      'reg query "HKEY_CURRENT_USER\\Software\\BraveSoftware\\Brave-Browser\\BLBeacon" /v version 2>nul',
      'reg query "HKEY_LOCAL_MACHINE\\Software\\BraveSoftware\\Brave-Browser\\BLBeacon" /v version 2>nul',
      'reg query "HKEY_LOCAL_MACHINE\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser\\BLBeacon" /v version 2>nul',
    ];

    for (const query of registryQueries) {
      try {
        const result = execSync(query, { encoding: 'utf8', timeout: 5000 });
        if (result) {
          // Registry found, check standard paths
          for (const bravePath of bravePaths) {
            if (fs.existsSync(bravePath)) {
              return bravePath;
            }
          }
        }
      } catch (error) {
        // Continue to next query
      }
    }
  } catch (error) {
    // Registry detection failed, try file system
  }

  // Fallback to file system check
  for (const bravePath of bravePaths) {
    try {
      if (fs.existsSync(bravePath)) {
        return bravePath;
      }
    } catch (error) {
      // Continue
    }
  }

  return null;
}

/**
 * Detect Brave on macOS
 */
function detectBraveMacOS() {
  const bravePaths = [
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Brave Browser Nightly.app/Contents/MacOS/Brave Browser Nightly',
    '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta',
    '/Applications/Brave Browser Dev.app/Contents/MacOS/Brave Browser Dev',
  ];

  for (const bravePath of bravePaths) {
    try {
      if (fs.existsSync(bravePath)) {
        return bravePath;
      }
    } catch (error) {
      // Continue
    }
  }

  return null;
}

/**
 * Detect Brave on Linux
 */
function detectBraveLinux() {
  const bravePaths = [
    '/usr/bin/brave-browser',
    '/usr/bin/brave-browser-stable',
    '/usr/bin/brave',
    '/snap/bin/brave',
    '/opt/brave.com/brave/brave-browser',
    '/opt/brave/brave-browser',
    '/usr/local/bin/brave-browser',
  ];

  for (const bravePath of bravePaths) {
    try {
      if (fs.existsSync(bravePath)) {
        return bravePath;
      }
    } catch (error) {
      // Continue
    }
  }

  return null;
}

/**
 * Main detection function
 */
function detectBrave() {
  const platform = process.platform;

  console.log(`🔍 Detecting Brave Browser on ${platform}...`);

  let bravePath = null;

  switch (platform) {
    case 'win32':
      bravePath = detectBraveWindows();
      break;
    case 'darwin':
      bravePath = detectBraveMacOS();
      break;
    case 'linux':
      bravePath = detectBraveLinux();
      break;
    default:
      console.log(`⚠️  Platform ${platform} is not supported for auto-detection`);
      return null;
  }

  if (bravePath) {
    console.log(`✅ Brave Browser detected at: ${bravePath}`);
    return bravePath;
  } else {
    console.log('⚠️  Brave Browser not found on this system');
    console.log('\n📥 To install Brave Browser:');
    console.log('   🔗 Visit: https://brave.com/download/');
    console.log('\n💡 After installing Brave, run: npm install');
    return null;
  }
}

/**
 * Save Brave configuration
 */
function saveBraveConfig(bravePath) {
  const configDir = path.join(__dirname, '..');
  const configFile = path.join(configDir, '.brave-config.json');

  const config = {
    bravePath: bravePath,
    detectedAt: new Date().toISOString(),
    platform: process.platform,
    autoDetected: true
  };

  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log(`\n💾 Brave configuration saved to: .brave-config.json`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to save configuration: ${error.message}`);
    return false;
  }
}

/**
 * Create .env file if needed
 */
function createEnvFile(bravePath) {
  const envFile = path.join(__dirname, '..', '.env');
  
  try {
    // Check if .env already exists
    let envContent = '';
    if (fs.existsSync(envFile)) {
      envContent = fs.readFileSync(envFile, 'utf8');
      
      // Check if BRAVE_PATH already set
      if (envContent.includes('BRAVE_PATH=')) {
        console.log('ℹ️  BRAVE_PATH already configured in .env file');
        return;
      }
    }

    // Add BRAVE_PATH to .env
    const bravePathLine = `\n# Auto-detected Brave Browser path\nBRAVE_PATH="${bravePath}"\n`;
    fs.appendFileSync(envFile, bravePathLine);
    console.log('✅ BRAVE_PATH added to .env file');
  } catch (error) {
    console.log(`ℹ️  Could not update .env file: ${error.message}`);
  }
}

/**
 * Main execution
 */
function main() {
  try {
    const bravePath = detectBrave();

    if (bravePath) {
      // Save configuration
      saveBraveConfig(bravePath);
      
      // Optionally create/update .env
      createEnvFile(bravePath);

      console.log('\n✅ Brave Browser setup completed successfully!');
      console.log('🚀 You can now run: npm test');
      console.log('');
      return 0;
    } else {
      console.log('\n⚠️  Brave Browser not detected');
      console.log('📦 The system will fall back to Chrome if available');
      console.log('');
      return 0; // Don't fail installation
    }
  } catch (error) {
    console.error(`\n❌ Setup error: ${error.message}`);
    console.log('⚠️  Continuing installation without Brave auto-detection');
    return 0; // Don't fail installation
  }
}

// Run setup
process.exit(main());
