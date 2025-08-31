#!/usr/bin/env node

/**
 * Browser Initialization Helper
 * Automatically configures browser on every launch
 * No manual intervention needed - ever!
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for browser path to avoid repeated file system checks
let cachedBrowserPath = null;
let lastCheckTime = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

/**
 * Quick browser detection without console output
 */
function quickDetectBrowser() {
  const platform = process.platform;
  
  // Check cache first
  if (cachedBrowserPath && (Date.now() - lastCheckTime) < CACHE_DURATION) {
    return cachedBrowserPath;
  }
  
  let bravePaths = [];
  let chromePaths = [];
  
  switch (platform) {
    case 'win32':
      bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env.PROGRAMFILES || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe')
      ];
      chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
      ];
      break;
      
    case 'darwin':
      bravePaths = [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta'
      ];
      chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
      ];
      break;
      
    case 'linux':
      bravePaths = [
        '/usr/bin/brave-browser',
        '/usr/bin/brave',
        '/snap/bin/brave',
        '/opt/brave.com/brave/brave',
        '/usr/local/bin/brave'
      ];
      chromePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
      ];
      break;
  }
  
  // Check Brave first (priority)
  for (const bravePath of bravePaths) {
    if (bravePath && fs.existsSync(bravePath)) {
      cachedBrowserPath = bravePath;
      lastCheckTime = Date.now();
      return bravePath;
    }
  }
  
  // Check Chrome as fallback
  for (const chromePath of chromePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      cachedBrowserPath = chromePath;
      lastCheckTime = Date.now();
      return chromePath;
    }
  }
  
  return null;
}

/**
 * Silent environment setup - no console output unless error
 */
function silentSetupEnvironment(browserPath) {
  if (!browserPath) return false;
  
  // Set all relevant environment variables
  process.env.BRAVE_PATH = browserPath;
  process.env.CHROME_PATH = browserPath;
  process.env.PUPPETEER_EXECUTABLE_PATH = browserPath;
  process.env.BROWSER_TYPE = browserPath.toLowerCase().includes('brave') ? 'brave' : 'chrome';
  
  return true;
}

/**
 * Auto-initialize browser configuration
 * This runs automatically when module is imported
 */
export async function autoInitBrowser() {
  try {
    // Step 1: Quick check if already configured
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
      return true; // Already configured and valid
    }
    
    // Step 2: Try to load from config file
    const configPath = path.join(path.dirname(__dirname), 'browser-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.browserPath && fs.existsSync(config.browserPath)) {
          silentSetupEnvironment(config.browserPath);
          return true;
        }
      } catch {
        // Config file invalid, continue to auto-detect
      }
    }
    
    // Step 3: Auto-detect browser
    const browserPath = quickDetectBrowser();
    if (browserPath) {
      silentSetupEnvironment(browserPath);
      
      // Save configuration for next time
      const config = {
        browserPath: browserPath,
        browserType: browserPath.toLowerCase().includes('brave') ? 'brave' : 'chrome',
        timestamp: new Date().toISOString(),
        platform: process.platform
      };
      
      try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      } catch {
        // Silently ignore write errors
      }
      
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Get browser executable path with auto-configuration
 */
export function getBrowserExecutable() {
  // Auto-configure if needed
  if (!process.env.CHROME_PATH || !fs.existsSync(process.env.CHROME_PATH)) {
    autoInitBrowser();
  }
  
  // Return the configured path
  return process.env.CHROME_PATH || process.env.BRAVE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
}

/**
 * Middleware for puppeteer-real-browser connect
 * Ensures browser is configured before connection
 */
export async function ensureBrowserConfigured() {
  const browserPath = getBrowserExecutable();
  
  if (!browserPath || !fs.existsSync(browserPath)) {
    // Try one more time with full auto-config
    const { autoConfigureBrowser } = await import('./auto-config.js');
    await autoConfigureBrowser();
    
    const newPath = getBrowserExecutable();
    if (!newPath || !fs.existsSync(newPath)) {
      throw new Error('No browser found. Please install Brave or Chrome.');
    }
  }
  
  return browserPath;
}

// Auto-initialize on module load
autoInitBrowser();

// Export for use in other modules
export default {
  autoInitBrowser,
  getBrowserExecutable,
  ensureBrowserConfigured
};
