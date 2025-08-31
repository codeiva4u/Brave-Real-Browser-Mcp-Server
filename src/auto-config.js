#!/usr/bin/env node

/**
 * Automatic Browser Configuration Script
 * यह script automatically Brave/Chrome को detect करता है और
 * सभी necessary environment variables को set करता है
 * ताकि puppeteer-real-browser बिना किसी manual configuration के काम करे
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Detect Brave browser on all platforms
 */
function detectBrave() {
  const platform = process.platform;
  log('🔍 Detecting Brave Browser...', colors.blue);
  
  let bravePaths = [];
  
  switch (platform) {
    case 'win32':
      bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env.PROGRAMFILES || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe')
      ];
      break;
      
    case 'darwin':
      bravePaths = [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta',
        path.join(process.env.HOME || '', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
      ];
      break;
      
    case 'linux':
      bravePaths = [
        '/usr/bin/brave-browser',
        '/usr/bin/brave',
        '/snap/bin/brave',
        '/opt/brave.com/brave/brave',
        '/opt/brave-browser/brave',
        '/usr/local/bin/brave',
        path.join(process.env.HOME || '', '.local/share/brave/brave')
      ];
      break;
  }
  
  // Check each path
  for (const bravePath of bravePaths) {
    if (bravePath && fs.existsSync(bravePath)) {
      log(`✅ Found Brave at: ${bravePath}`, colors.green);
      return bravePath;
    }
  }
  
  return null;
}

/**
 * Detect Chrome browser on all platforms (fallback)
 */
function detectChrome() {
  const platform = process.platform;
  log('🔍 Detecting Chrome Browser (fallback)...', colors.blue);
  
  let chromePaths = [];
  
  switch (platform) {
    case 'win32':
      chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe')
      ];
      break;
      
    case 'darwin':
      chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        path.join(process.env.HOME || '', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ];
      break;
      
    case 'linux':
      chromePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        '/usr/local/bin/google-chrome'
      ];
      break;
  }
  
  // Check each path
  for (const chromePath of chromePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      log(`✅ Found Chrome at: ${chromePath}`, colors.green);
      return chromePath;
    }
  }
  
  return null;
}

/**
 * Create or update .env file with browser paths
 */
function updateEnvFile(browserPath, browserType) {
  const envPath = path.join(path.dirname(__dirname), '.env');
  
  let envContent = '';
  
  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update or add BRAVE_PATH and CHROME_PATH
  const lines = envContent.split('\n');
  let braveLine = -1;
  let chromeLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('BRAVE_PATH=')) {
      braveLine = i;
    }
    if (lines[i].startsWith('CHROME_PATH=')) {
      chromeLine = i;
    }
  }
  
  // Update or add BRAVE_PATH
  const braveValue = `BRAVE_PATH="${browserPath}"`;
  if (braveLine >= 0) {
    lines[braveLine] = braveValue;
  } else {
    lines.push(braveValue);
  }
  
  // IMPORTANT: Always set CHROME_PATH to the same value for puppeteer-real-browser compatibility
  const chromeValue = `CHROME_PATH="${browserPath}"`;
  if (chromeLine >= 0) {
    lines[chromeLine] = chromeValue;
  } else {
    lines.push(chromeValue);
  }
  
  // Add browser type indicator
  const typeLine = lines.findIndex(line => line.startsWith('BROWSER_TYPE='));
  const typeValue = `BROWSER_TYPE="${browserType}"`;
  if (typeLine >= 0) {
    lines[typeLine] = typeValue;
  } else {
    lines.push(typeValue);
  }
  
  // Write back to .env file
  const finalContent = lines.filter(line => line.trim() !== '').join('\n');
  fs.writeFileSync(envPath, finalContent + '\n');
  
  log(`📝 Updated .env file with browser paths`, colors.green);
  log(`   BRAVE_PATH="${browserPath}"`, colors.blue);
  log(`   CHROME_PATH="${browserPath}" (for compatibility)`, colors.blue);
  log(`   BROWSER_TYPE="${browserType}"`, colors.blue);
}

/**
 * Set environment variables for current session
 */
function setEnvironmentVariables(browserPath, browserType) {
  process.env.BRAVE_PATH = browserPath;
  process.env.CHROME_PATH = browserPath; // IMPORTANT: Set both for compatibility
  process.env.BROWSER_TYPE = browserType;
  process.env.PUPPETEER_EXECUTABLE_PATH = browserPath; // For Puppeteer compatibility
  
  log(`🌍 Set environment variables for current session`, colors.green);
}

/**
 * Create a config file for the project
 */
function createConfigFile(browserPath, browserType) {
  const configPath = path.join(path.dirname(__dirname), 'browser-config.json');
  
  const config = {
    browserType: browserType,
    browserPath: browserPath,
    primaryBrowser: 'brave',
    fallbackBrowser: 'chrome',
    autoDetected: true,
    timestamp: new Date().toISOString(),
    platform: process.platform,
    nodeVersion: process.version,
    configVersion: '1.0.0',
    paths: {
      brave: browserPath,
      chrome: browserPath // Set both to same for compatibility
    },
    environment: {
      BRAVE_PATH: browserPath,
      CHROME_PATH: browserPath,
      PUPPETEER_EXECUTABLE_PATH: browserPath
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  log(`📋 Created browser-config.json file`, colors.green);
}

/**
 * Main auto-configuration function
 */
export async function autoConfigureBrowser() {
  log('\n🚀 Auto-Configuration Starting...', colors.bright);
  log('==================================\n', colors.bright);
  
  // Step 1: Try to detect Brave first (primary browser)
  let browserPath = detectBrave();
  let browserType = 'brave';
  
  if (!browserPath) {
    log('⚠️ Brave not found, checking for Chrome...', colors.yellow);
    // Step 2: Fall back to Chrome if Brave not found
    browserPath = detectChrome();
    browserType = 'chrome';
  }
  
  if (!browserPath) {
    log('\n❌ No supported browser found!', colors.red);
    log('Please install Brave Browser from: https://brave.com/download/', colors.yellow);
    log('Or Chrome from: https://www.google.com/chrome/', colors.yellow);
    return false;
  }
  
  // Step 3: Configure everything automatically
  log(`\n🔧 Configuring for ${browserType}...`, colors.magenta);
  
  // Update .env file
  updateEnvFile(browserPath, browserType);
  
  // Set environment variables
  setEnvironmentVariables(browserPath, browserType);
  
  // Create config file
  createConfigFile(browserPath, browserType);
  
  // Success message
  log('\n✨ Auto-Configuration Complete!', colors.green);
  log('================================', colors.green);
  log(`Browser: ${browserType.toUpperCase()}`, colors.blue);
  log(`Path: ${browserPath}`, colors.blue);
  log('\n✅ The project is now ready to use!', colors.green);
  log('No manual configuration needed.', colors.green);
  
  return true;
}

/**
 * Check if browser is properly configured
 */
export function isBrowserConfigured() {
  // Check multiple sources for browser configuration
  const sources = [
    process.env.BRAVE_PATH,
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH
  ];
  
  for (const source of sources) {
    if (source && fs.existsSync(source)) {
      return true;
    }
  }
  
  // Check config file
  const configPath = path.join(path.dirname(__dirname), 'browser-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.browserPath && fs.existsSync(config.browserPath)) {
        // Restore environment variables from config
        setEnvironmentVariables(config.browserPath, config.browserType);
        return true;
      }
    } catch (error) {
      // Config file is invalid
    }
  }
  
  return false;
}

// Run auto-configuration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoConfigureBrowser().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default { autoConfigureBrowser, isBrowserConfigured };
