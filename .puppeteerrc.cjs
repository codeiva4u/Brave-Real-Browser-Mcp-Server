/**
 * Puppeteer Configuration for Brave Browser Support
 * This configuration prioritizes Brave browser while maintaining Chrome as fallback
 */

const { join } = require('path');
const { existsSync } = require('fs');

/**
 * Detect Brave browser path based on platform
 */
function detectBravePath() {
  const platform = process.platform;
  
  // Check environment variables first
  const envBravePath = process.env.BRAVE_PATH || process.env.BRAVE_EXECUTABLE_PATH;
  if (envBravePath && existsSync(envBravePath)) {
    console.log(`Found Brave via environment variable: ${envBravePath}`);
    return envBravePath;
  }
  
  let possiblePaths = [];
  
  switch (platform) {
    case 'win32':
      possiblePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        join(process.env.USERPROFILE || '', 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
      ];
      break;
      
    case 'darwin':
      possiblePaths = [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta',
        '/Applications/Brave Browser Nightly.app/Contents/MacOS/Brave Browser Nightly',
      ];
      break;
      
    case 'linux':
      possiblePaths = [
        '/usr/bin/brave-browser',
        '/usr/bin/brave',
        '/snap/bin/brave',
        '/opt/brave.com/brave/brave',
        '/opt/brave-browser/brave',
        '/usr/local/bin/brave',
        '/usr/lib/brave-browser/brave',
        '/usr/lib/brave/brave',
      ];
      break;
  }
  
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log(`Found Brave at: ${path}`);
      return path;
    }
  }
  
  return null;
}

/**
 * Configuration
 */
const configuration = {
  // Skip downloading Chrome if Brave is available
  skipDownload: false,
  
  // Use system-installed Brave if available
  executablePath: detectBravePath(),
  
  // Cache directory for downloaded browsers
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

// If Brave is found, skip Chrome download
if (configuration.executablePath) {
  configuration.skipDownload = true;
  console.log('Brave browser detected. Skipping Chrome download.');
} else {
  console.log('Brave not found. Puppeteer will download Chrome as fallback.');
}

module.exports = configuration;
