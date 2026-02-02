import { exec as execNative } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { existsSync } from 'node:fs'

const promisifiedExec = promisify(execNative)

export const validPackagesNames = ['puppeteer-core', 'playwright-core']

export const exec = async (...args) => {
  if (isDebug()) {
    log('[debug][exec]', args)
  }

  const execRes = await promisifiedExec(...args)

  if (isDebug()) {
    log('[debug][execRes]', execRes)
  }

  return execRes
}
export const log = console.log

export const getPatcherPackagePath = () => {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../..')
}

export const fatalError = (...args) => {
  console.error('❌ FATAL ERROR:', ...args)
  process.exit(1)
}

export const getPatchBaseCmd = (patchFilePath) => {
  // Properly escape path for Windows compatibility (handle spaces and special chars)
  const escapedPath = process.platform === 'win32'
    ? `"${patchFilePath.replace(/"/g, '\"')}"`
    : patchFilePath;

  let patchBin = 'patch';

  // on Windows, try to find patch.exe in Git installation if not in PATH
  if (process.platform === 'win32') {
    const commonPaths = [
      'C:\\Program Files\\Git\\usr\\bin\\patch.exe',
      'C:\\Program Files\\Git\\bin\\patch.exe',
      'C:\\Program Files (x86)\\Git\\usr\\bin\\patch.exe'
    ];

    for (const p of commonPaths) {
      if (existsSync(p)) {
        patchBin = `"${p}"`;
        break;
      }
    }
  }

  return `${patchBin} --batch -p1 --input=${escapedPath} --verbose --no-backup-if-mismatch --reject-file=- --forward --silent`
}

export const isDebug = () => {
  return !!process.env.REBROWSER_PATCHES_DEBUG
}

/**
 * 🦁 Cross-Platform Browser Auto-Detection
 * Automatically detects the best available browser with preference for Brave
 * Supports Windows, macOS, and Linux (x64/arm64)
 */
export const findBestBrowser = () => {
  const platform = process.platform;

  // Brave browser paths for different platforms
  const bravePaths = {
    win32: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe' : null
    ].filter(Boolean),
    darwin: [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    ],
    linux: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave',
      '/snap/bin/brave'
    ]
  };

  // Chrome browser paths as fallback
  const chromePaths = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe' : null
    ].filter(Boolean),
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
    ]
  };

  // Check Brave first (preferred for maximum stealth)
  const bravePathsForPlatform = bravePaths[platform] || [];
  for (const path of bravePathsForPlatform) {
    if (existsSync(path)) {
      return {
        path,
        browser: 'brave',
        name: 'Brave Browser',
        priority: 1
      };
    }
  }

  // Fallback to Chrome if Brave not found
  const chromePathsForPlatform = chromePaths[platform] || [];
  for (const path of chromePathsForPlatform) {
    if (existsSync(path)) {
      return {
        path,
        browser: 'chrome',
        name: 'Google Chrome',
        priority: 2
      };
    }
  }

  // No browser found - will use Puppeteer/Playwright default
  return {
    path: null,
    browser: 'default',
    name: 'Default (Puppeteer/Playwright bundled)',
    priority: 3
  };
};

/**
 * 🔧 Get Browser Launch Options with Auto-Detection
 * Returns optimized launch options with auto-detected browser
 */
export const getBrowserLaunchOptions = (customOptions = {}) => {
  const browserInfo = findBestBrowser();

  const baseOptions = {
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--metrics-recording-only',
      '--safebrowsing-disable-auto-update',
      '--enable-automation=false',
      '--password-store=basic',
      '--use-mock-keychain',
      // CRITICAL: Remove webdriver detection
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions-except',
      '--disable-plugins-discovery',
      '--no-service-autorun',
      '--no-default-browser-check',
      '--disable-component-extensions-with-background-pages'
    ]
  };

  // Add browser-specific optimizations
  if (browserInfo.browser === 'brave') {
    baseOptions.args.push(
      '--disable-brave-update',
      '--disable-brave-wayback-machine',
      '--disable-brave-google-url-tracking',
      '--disable-brave-federated-learning'
    );
  }

  // Set executable path if auto-detected
  if (browserInfo.path) {
    baseOptions.executablePath = browserInfo.path;
  }

  // Merge with custom options
  return {
    ...baseOptions,
    ...customOptions,
    // Merge args arrays
    args: [...(baseOptions.args || []), ...(customOptions.args || [])]
  };
};

/**
 * 📊 Log Browser Detection Info
 */
export const logBrowserInfo = (browserInfo = null) => {
  if (!browserInfo) {
    browserInfo = findBestBrowser();
  }

  const icons = {
    brave: '🦁',
    chrome: '🔵',
    default: '⚙️'
  };

  const icon = icons[browserInfo.browser] || '❓';

  if (browserInfo.path) {
    log(`${icon} Auto-detected browser: ${browserInfo.name}`);
    log(`📍 Path: ${browserInfo.path}`);
    log(`⭐ Priority: ${browserInfo.priority} (1=Best, 3=Fallback)`);
  } else {
    log(`${icon} Using ${browserInfo.name}`);
    log(`ℹ️  Install Brave Browser for maximum stealth capabilities`);
  }
};
