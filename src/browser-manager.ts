import { connect } from 'brave-real-browser';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

// Import Brave launcher for professional Brave detection
let braveLauncher: any = null;

// Import brave-real-puppeteer-core for enhanced stealth features
let braveRealPuppeteerCore: any = null;

// Async function to load brave packages
async function loadBravePackages(): Promise<void> {
  // Load brave-real-launcher (CommonJS module)
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    braveLauncher = require('brave-real-launcher');
    console.log('✅ brave-real-launcher loaded - professional Brave detection enabled');
  } catch (error) {
    console.warn('⚠️  brave-real-launcher not available, using fallback detection:', (error as Error).message);
  }

  // Load brave-real-puppeteer-core (CommonJS module)
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    braveRealPuppeteerCore = require('brave-real-puppeteer-core');
    console.log('✅ brave-real-puppeteer-core loaded - enhanced stealth features available');
  } catch (error) {
    console.warn('⚠️  brave-real-puppeteer-core not available, using standard puppeteer:', (error as Error).message);
  }
}

// Content prioritization configuration
export interface ContentPriorityConfig {
  prioritizeContent: boolean;
  autoSuggestGetContent: boolean;
}


// Circuit breaker and recursion tracking
export interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

// Browser error categorization
export enum BrowserErrorType {
  FRAME_DETACHED = 'FRAME_DETACHED',
  SESSION_CLOSED = 'SESSION_CLOSED',
  TARGET_CLOSED = 'TARGET_CLOSED',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  NAVIGATION_TIMEOUT = 'NAVIGATION_TIMEOUT',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  UNKNOWN = 'UNKNOWN'
}

// Store browser instance
let browserInstance: any = null;
let pageInstance: any = null;

// CRITICAL: Global flag to prevent multiple simultaneous initialization attempts
let browserInitializationInProgress = false;

// CRITICAL: Promise-based lock to queue initialization requests
let browserInitPromise: Promise<any> | null = null;

// Check environment variable for testing override
const disableContentPriority = process.env.DISABLE_CONTENT_PRIORITY === 'true' || process.env.NODE_ENV === 'test';

let contentPriorityConfig: ContentPriorityConfig = {
  prioritizeContent: !disableContentPriority,
  autoSuggestGetContent: !disableContentPriority
};


let browserCircuitBreaker: CircuitBreakerState = {
  failureCount: 0,
  lastFailureTime: 0,
  state: 'closed'
};

let currentRetryDepth = 0;
const MAX_RETRY_DEPTH = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

let browserInitDepth = 0;
const MAX_BROWSER_INIT_DEPTH = 2;

// Reset function for testing and error recovery
export function resetBrowserInitDepth() {
  browserInitDepth = 0;
}

// Test-safe browser initialization that bypasses depth limit
export async function initializeBrowserForTesting(options?: any) {
  // Reset depth counter for testing
  browserInitDepth = 0;
  
  // Force close any existing browser first
  try {
    await closeBrowser();
  } catch (error) {
    // Ignore close errors
  }
  
  // Now initialize normally
  return await initializeBrowser(options);
}

let sessionValidationInProgress = false;

// Error handling functions
export function categorizeError(error: Error): BrowserErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('navigating frame was detached')) {
    return BrowserErrorType.FRAME_DETACHED;
  }
  if (message.includes('session closed')) {
    return BrowserErrorType.SESSION_CLOSED;
  }
  if (message.includes('target closed')) {
    return BrowserErrorType.TARGET_CLOSED;
  }
  if (message.includes('protocol error')) {
    return BrowserErrorType.PROTOCOL_ERROR;
  }
  if (message.includes('navigation timeout') || message.includes('timeout')) {
    return BrowserErrorType.NAVIGATION_TIMEOUT;
  }
  if (message.includes('element not found') || message.includes('no node found')) {
    return BrowserErrorType.ELEMENT_NOT_FOUND;
  }

  return BrowserErrorType.UNKNOWN;
}

// Timeout wrapper for operations that may hang
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  context: string = 'unknown'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let isResolved = false;
    
    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error(`Operation timed out after ${timeoutMs}ms in context: ${context}`));
      }
    }, timeoutMs);

    operation()
      .then((result) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timer);
          reject(error);
        }
      });
  });
}

// Port availability and connection utilities for enhanced resilience
export async function isPortAvailable(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const server = net.createServer();
      
      server.listen(port, host, () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    } catch (error) {
      resolve(false);
    }
  });
}

// Test localhost resolution and connectivity
export async function testHostConnectivity(): Promise<{ localhost: boolean; ipv4: boolean; recommendedHost: string }> {
  const testPort = 19222;
  
  try {
    const localhostAvailable = await isPortAvailable(testPort, 'localhost');
    const ipv4Available = await isPortAvailable(testPort, '127.0.0.1');
    
    return {
      localhost: localhostAvailable,
      ipv4: ipv4Available,
      recommendedHost: ipv4Available ? '127.0.0.1' : 'localhost'
    };
  } catch (error) {
    console.error('Host connectivity test failed:', error);
    return {
      localhost: false,
      ipv4: true,
      recommendedHost: '127.0.0.1'
    };
  }
}

// Get available port in range
export async function findAvailablePort(startPort: number = 9222, endPort: number = 9322): Promise<number | null> {
  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

// Circuit breaker functions
export function updateCircuitBreakerOnFailure(): void {
  browserCircuitBreaker.failureCount++;
  browserCircuitBreaker.lastFailureTime = Date.now();
  
  if (browserCircuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
    browserCircuitBreaker.state = 'open';
    console.error(`Circuit breaker opened after ${browserCircuitBreaker.failureCount} failures`);
  }
}

export function updateCircuitBreakerOnSuccess(): void {
  browserCircuitBreaker.failureCount = 0;
  browserCircuitBreaker.state = 'closed';
}

export function isCircuitBreakerOpen(): boolean {
  if (browserCircuitBreaker.state === 'closed') {
    return false;
  }
  
  if (browserCircuitBreaker.state === 'open') {
    const timeSinceLastFailure = Date.now() - browserCircuitBreaker.lastFailureTime;
    if (timeSinceLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
      browserCircuitBreaker.state = 'half-open';
      console.error('Circuit breaker entering half-open state');
      return false;
    }
    return true;
  }
  
  return false;
}

// Windows Registry Brave detection (PRIORITY)
function getWindowsBraveFromRegistry(): string | null {
  if (process.platform !== 'win32') return null;
  
  try {
    const { execSync } = require('child_process');
    
    // Brave registry paths
    const braveRegistryQueries = [
      'reg query "HKEY_CURRENT_USER\\Software\\BraveSoftware\\Brave-Browser\\BLBeacon" /v version 2>nul',
      'reg query "HKEY_LOCAL_MACHINE\\Software\\BraveSoftware\\Brave-Browser\\BLBeacon" /v version 2>nul',
      'reg query "HKEY_LOCAL_MACHINE\\Software\\WOW6432Node\\BraveSoftware\\Brave-Browser\\BLBeacon" /v version 2>nul',
    ];
    
    for (const query of braveRegistryQueries) {
      try {
        const result = execSync(query, { encoding: 'utf8', timeout: 5000 });
        if (result) {
          const bravePaths = [
            'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
            'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
          ];
          
          for (const bravePath of bravePaths) {
            if (fs.existsSync(bravePath)) {
              console.log(`✅ Found Brave via Registry detection: ${bravePath}`);
              return bravePath;
            }
          }
        }
      } catch (error) {
        // Continue to next registry query
      }
    }
    
    // Try Brave App Paths registry
    try {
      const installDirQuery = 'reg query "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\brave.exe" /ve 2>nul';
      const result = execSync(installDirQuery, { encoding: 'utf8', timeout: 5000 });
      const match = result.match(/REG_SZ\s+(.+\.exe)/);
      if (match && match[1] && fs.existsSync(match[1])) {
        console.log(`✅ Found Brave via App Paths registry: ${match[1]}`);
        return match[1];
      }
    } catch (error) {
      // Brave registry detection failed
    }
    
  } catch (error) {
    console.error('Windows Registry Brave detection failed:', error instanceof Error ? error.message : String(error));
  }
  
  return null;
}


// Brave Browser path detection (cross-platform support)
// Pure Brave-only detection - This project is designed specifically for Brave Browser
export function detectBravePath(): string | null {
  const platform = process.platform;

  // PRIORITY -1: Use brave-real-launcher's professional detection (BEST METHOD)
  if (braveLauncher && braveLauncher.getBravePath) {
    try {
      const bravePath = braveLauncher.getBravePath();
      if (bravePath && fs.existsSync(bravePath)) {
        console.log(`✅ Found Brave via brave-real-launcher (professional detection): ${bravePath}`);
        return bravePath;
      }
    } catch (error) {
      console.error('⚠️  brave-real-launcher detection failed, trying other methods...');
    }
  }

  // PRIORITY 0: Check .brave-config.json (auto-detected during npm install)
  try {
    const configPath = path.join(process.cwd(), '.brave-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.bravePath && fs.existsSync(config.bravePath)) {
        console.log(`✅ Found Brave via .brave-config.json (auto-detected): ${config.bravePath}`);
        return config.bravePath;
      }
    }
  } catch (error) {
    // Config file not found or invalid, continue with other methods
  }

  // PRIORITY 1: Check environment variables first (BRAVE_PATH only)
  const envBravePath = process.env.BRAVE_PATH;
  if (envBravePath && fs.existsSync(envBravePath)) {
    console.log(`✅ Found Brave via BRAVE_PATH environment variable: ${envBravePath}`);
    return envBravePath;
  }

  // PRIORITY 2: Brave paths detection (Brave-only project!)
  let bravePaths: string[] = [];

  switch (platform) {
    case 'win32':
      // BRAVE PATHS (PRIORITY - Try these first!)
      bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env.PROGRAMFILES || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
      ];

      // Try Brave registry detection
      try {
        const braveRegistryPath = getWindowsBraveFromRegistry();
        if (braveRegistryPath) {
          bravePaths.unshift(braveRegistryPath);
        }
      } catch (error) {
        console.error('Brave registry detection failed, continuing with file system search...');
      }
      break;
      
    case 'darwin':
      // BRAVE PATHS (PRIORITY)
      bravePaths = [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Brave Browser Nightly.app/Contents/MacOS/Brave Browser Nightly',
        '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta',
        '/Applications/Brave Browser Dev.app/Contents/MacOS/Brave Browser Dev',
      ];
      break;
      
    case 'linux':
      // BRAVE PATHS (PRIORITY)
      bravePaths = [
        '/usr/bin/brave-browser',
        '/usr/bin/brave-browser-stable',
        '/usr/bin/brave',
        '/snap/bin/brave',
        '/opt/brave.com/brave/brave-browser',
        '/opt/brave/brave-browser',
        '/usr/local/bin/brave-browser',
      ];
      break;
      
    default:
      console.error(`Platform ${platform} not explicitly supported for browser path detection`);
      return null;
  }

  // BRAVE-ONLY SEARCH: This project is designed for Brave Browser only
  console.error('🦁 Searching for Brave Browser (Brave-Real-Browser Project)...');
  for (const bravePath of bravePaths) {
    try {
      console.error(`   Checking: ${bravePath}`);
      if (fs.existsSync(bravePath)) {
        console.log(`✅ Found Brave Browser at: ${bravePath}`);
        console.log('   🎯 Perfect! Using Brave Browser (optimized for this project)');
        return bravePath;
      }
    } catch (error) {
      console.error(`   Error checking path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.error('⚠️  Brave Browser not found in standard paths, trying ultimate fallback...');
  
  // ULTIMATE FALLBACK: Hardcoded Brave path that we know exists on this system
  if (platform === 'win32') {
    const ultimateBravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
    console.error(`   Trying ultimate fallback path: ${ultimateBravePath}`);
    try {
      if (fs.existsSync(ultimateBravePath)) {
        console.error(`✅ Found Brave Browser at ultimate fallback path: ${ultimateBravePath}`);
        console.error('   🎯 Using Brave Browser (perfect for this project)');
        return ultimateBravePath;
      }
    } catch (error) {
      console.error(`   Ultimate fallback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (platform === 'win32') {
    console.error(`❌ Brave Browser not found at any expected Windows paths:`);
    console.error(`   Searched ${bravePaths.length} Brave Browser locations:`);
    console.error(`\n   🦁 Brave paths checked:`);
    bravePaths.slice(0, 6).forEach(p => console.error(`   - ${p}`));
    if (bravePaths.length > 6) {
      console.error(`   ... and ${bravePaths.length - 6} more Brave locations`);
    }
    console.error(`\n   🔧 Windows Troubleshooting Solutions:`);
    console.error(`   1. Install Brave Browser (RECOMMENDED for this project):`);
    console.error(`      - Download Brave: https://brave.com/download/`);
    console.error(`      - Brave is automatically detected after installation`);
    console.error(`      - Set BRAVE_PATH environment variable if needed`);
    console.error(`\n   2. Environment Variables:`);
    console.error(`      - Set BRAVE_PATH for Brave: set BRAVE_PATH="C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"`);
    console.error(`      - For Cursor IDE: Add BRAVE_PATH env var to MCP configuration`);
    console.error(`\n   3. Permissions & Security:`);
    console.error(`      - Run IDE/terminal as Administrator`);
    console.error(`      - Add Brave browser to Windows Defender exclusions`);
    console.error(`\n   4. Custom Configuration:`);
    console.error(`      - Use customConfig.chromePath parameter in browser_init (with Brave path)`);
    console.error(`      - This project is optimized specifically for Brave Browser`);
  } else {
    console.error(`❌ Brave Browser not found at any expected paths for platform: ${platform}`);
    console.error(`\n   🦁 Brave paths checked:`);
    bravePaths.forEach(p => console.error(`   - ${p}`));
    console.error(`\n   💡 Install Brave Browser: https://brave.com/download/`);
    console.error(`   💡 This project is specifically designed for Brave Browser`);
  }
  
  return null;
}

// Session validation utility
export async function validateSession(): Promise<boolean> {
  if (sessionValidationInProgress) {
    console.warn('Session validation already in progress, skipping duplicate validation');
    return false;
  }

  if (!browserInstance || !pageInstance) {
    return false;
  }

  sessionValidationInProgress = true;

  try {
    await withTimeout(async () => {
      await browserInstance.version();
      await pageInstance.evaluate(() => true);
    }, 5000, 'session-validation');

    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  } finally {
    sessionValidationInProgress = false;
  }
}


// Helper function to quickly find authentication elements
export async function findAuthElements(pageInstance: any): Promise<string[]> {
  return await pageInstance.evaluate(() => {
    const authSelectors: string[] = [];
    
    const authPatterns = [
      /^(log\s*in|sign\s*in|log\s*on|sign\s*on)$/i,
      /^(login|signin|authenticate|enter)$/i,
      /continue with (google|github|facebook|twitter|microsoft)/i,
      /sign in with/i
    ];
    
    const clickableElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]');
    
    clickableElements.forEach(el => {
      const text = (el.textContent || '').trim();
      const ariaLabel = el.getAttribute('aria-label') || '';
      const href = (el as HTMLAnchorElement).href || '';
      
      const matchesPattern = authPatterns.some(pattern => 
        pattern.test(text) || pattern.test(ariaLabel)
      );
      
      const hasAuthRoute = href.includes('login') || href.includes('signin') || 
                          href.includes('auth') || href.includes('oauth');
      
      if (matchesPattern || hasAuthRoute) {
        if (el.id) {
          authSelectors.push(`#${CSS.escape(el.id)}`);
        } else if (el.className && typeof el.className === 'string') {
          const classes = el.className.trim().split(/\s+/).filter(c => c);
          if (classes.length > 0) {
            authSelectors.push(el.tagName.toLowerCase() + '.' + classes.map(c => CSS.escape(c)).join('.'));
          }
        } else {
          authSelectors.push(`${el.tagName.toLowerCase()}:contains("${text}")`);
        }
      }
    });
    
    return [...new Set(authSelectors)];
  });
}

// Main browser initialization function
export async function initializeBrowser(options?: any) {
  // CRITICAL FIX 1: If initialization is already in progress, wait for it instead of creating duplicate
  if (browserInitializationInProgress && browserInitPromise) {
    console.error('⏳ Browser initialization already in progress, waiting for it to complete...');
    try {
      const result = await browserInitPromise;
      // After waiting, return the result from the existing initialization
      if (browserInstance && pageInstance) {
        console.error('✅ Browser initialization completed by concurrent call - reusing instance');
        return result;
      }
    } catch (error) {
      console.error('⚠️ Concurrent initialization failed:', error);
      // Reset flags and continue with new initialization
      browserInitializationInProgress = false;
      browserInitPromise = null;
    }
  }

  // CRITICAL FIX 2: Check if browser is already initialized BEFORE any depth checks
  // This prevents multiple calls to browser_init when browser is already running
  if (browserInstance && pageInstance) {
    try {
      const isValid = await validateSession();
      if (isValid) {
        console.error('✅ Browser already initialized and validated - reusing existing instance');
        // Return existing instance instead of throwing error for tests
        return { browser: browserInstance, page: pageInstance };
      } else {
        // Session is invalid, clean up before continuing
        console.error('⚠️  Existing browser session is invalid, cleaning up...');
        await closeBrowser();
        // Reset flags
        browserInitializationInProgress = false;
        browserInitPromise = null;
        browserInitDepth = 0;
        // Continue with initialization below
      }
    } catch (error) {
      // For any errors, clean up and continue
      console.error('⚠️  Session validation failed, cleaning up...', error);
      await closeBrowser();
      browserInitializationInProgress = false;
      browserInitPromise = null;
      browserInitDepth = 0;
    }
  }

  if (browserInitDepth >= MAX_BROWSER_INIT_DEPTH) {
    throw new Error(`Maximum browser initialization depth (${MAX_BROWSER_INIT_DEPTH}) exceeded. This prevents infinite initialization loops.`);
  }

  if (isCircuitBreakerOpen()) {
    throw new Error(`Circuit breaker is open. Browser initialization is temporarily disabled. Wait ${CIRCUIT_BREAKER_TIMEOUT}ms before retrying.`);
  }

  // Set initialization in progress flag and create promise lock
  browserInitializationInProgress = true;
  browserInitDepth++;
  
  // Create a promise that will be resolved when initialization completes
  let resolveInit: (value: any) => void;
  let rejectInit: (error: any) => void;
  browserInitPromise = new Promise((resolve, reject) => {
    resolveInit = resolve;
    rejectInit = reject;
  });
  
  try {
    // Load brave packages first
    await loadBravePackages();

    const detectedBravePath = detectBravePath();
    const customConfig = options?.customConfig ?? {};
    const platform = process.platform;


    const getOptimalChromeFlags = (isWindows: boolean, isRetry: boolean = false): string[] => {
      // 2025 best practices: Minimal, secure, performance-focused flags
      const baseFlags = [
        '--no-first-run',
        '--no-default-browser-check', 
        '--disable-default-apps',
        '--disable-blink-features=AutomationControlled', // Essential for stealth
        '--start-maximized', // UI convenience, minimal performance impact
      ];

      // Add platform-specific flags only when absolutely necessary
      const platformFlags: string[] = [];
      
      if (isWindows) {
        // Only add Windows-specific flags if there are compatibility issues
        // Note: --no-sandbox removed for security (not needed for desktop automation)
        // Note: --disable-gpu removed unless headless mode has issues
      }

      // Emergency fallback flags for retry attempts only
      if (isRetry) {
        platformFlags.push(
          '--disable-extensions',
          '--disable-plugins',
          '--remote-debugging-port=0',
        );
      }

      return [...baseFlags, ...platformFlags];
    };

    const isRetryAttempt = options?._isRetryAttempt ?? false;
    // CRITICAL: Default must be false to allow brave-real-browser's flag modification logic
    // When ignoreAllFlags=true, brave-real-browser skips DEFAULT_FLAGS modification
    // which causes the analytics popup issue
    const useIgnoreAllFlags = options?.ignoreAllFlags ?? false;

    // Don't pass chromeFlags in customConfig - let brave-real-browser handle it via ignoreAllFlags=false
    const chromeConfig = {
      ...customConfig
    };

    if (detectedBravePath && !chromeConfig.chromePath) {
      chromeConfig.chromePath = detectedBravePath;
    }

    const connectOptions: any = {
      headless: options?.headless ?? false,
      customConfig: chromeConfig,
      turnstile: true,
      disableXvfb: options?.disableXvfb ?? true,
      // CRITICAL: Must be false by default to allow brave-real-browser to modify flags
      ignoreAllFlags: options?.ignoreAllFlags ?? false,
      args: [],
      connectOption: {
        defaultViewport: null,
        timeout: platform === 'win32' ? 60000 : 30000,
        ...(options?.connectOption ?? {}),
      },
    };

    if (options?.proxy) {
      connectOptions.customConfig.chromeFlags.push(`--proxy-server=${options.proxy}`);
    }

    if (options?.plugins && Array.isArray(options.plugins)) {
      connectOptions.plugins = options.plugins;
    }

    console.log('🔍 Testing network connectivity...');
    const hostTest = await testHostConnectivity();
    console.log(`   localhost available: ${hostTest.localhost}`);
    console.log(`   127.0.0.1 available: ${hostTest.ipv4}`);
    console.log(`   recommended host: ${hostTest.recommendedHost}`);

    const availablePort = await findAvailablePort();
    if (availablePort) {
      console.log(`🔍 Found available debugging port: ${availablePort}`);
    } else {
      console.error('⚠️  No available ports found in range 9222-9322, using system-assigned port');
    }

    const createConnectionStrategy = (strategyName: string, modifications: any = {}) => {
      const strategy = {
        ...connectOptions,
        ...modifications,
        customConfig: {
          ...chromeConfig,
          ...modifications.customConfig,
          chromeFlags: [
            ...(modifications.customConfig?.chromeFlags || chromeConfig.chromeFlags),
            ...(availablePort ? [`--remote-debugging-port=${availablePort}`] : ['--remote-debugging-port=0'])
          ]
        }
      };
      
      return { strategyName, strategy };
    };

    // Primary strategy: User-defined configuration with modified flags
    const primaryStrategy = {
      strategyName: 'User-Defined Configuration',
      strategy: {
        executablePath: detectedBravePath,
        headless: options?.headless ?? false,
        turnstile: true,
        args: [
          "--start-maximized"
        ],
        disableXvfb: true,
        // CRITICAL: Must be false to allow brave-real-browser to process DEFAULT_FLAGS
        ignoreAllFlags: false,
        customConfig: chromeConfig,
        connectOption: {
          defaultViewport: null,
        },
      }
    };

    const connectionStrategies = [
      primaryStrategy,
      
      // Fallback strategies only if primary fails
      createConnectionStrategy('Minimal Configuration', {
        customConfig: {
          ignoreDefaultFlags: false,
          chromeFlags: [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--start-maximized',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      }),
      
      createConnectionStrategy('Optimal Configuration', {
        customConfig: {
          ignoreDefaultFlags: false,
          chromeFlags: [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--start-maximized',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      }),
      
      createConnectionStrategy('Network Fallback', {
        customConfig: {
          ignoreDefaultFlags: false,
          chromeFlags: [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--start-maximized',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            ...(hostTest.recommendedHost === '127.0.0.1' ? ['--remote-debugging-address=127.0.0.1'] : [])
          ]
        }
      })
    ];

    let lastError: Error | null = null;

    for (let strategyIndex = 0; strategyIndex < connectionStrategies.length; strategyIndex++) {
      const { strategyName, strategy } = connectionStrategies[strategyIndex];
      
      try {
        console.log(`🔄 Attempting browser connection using ${strategyName}...`);
        
        const result = await withTimeout(async () => {
          try {
            console.log(`   Strategy config: ${JSON.stringify({
              headless: strategy.headless,
              ignoreAllFlags: strategy.ignoreAllFlags,
              chromeFlags: strategy.customConfig?.chromeFlags || 'none',
              chromePath: strategy.customConfig?.chromePath || 'default'
            })}`);
            
            const connectResult = await connect(strategy);
            console.log(`   ✅ Connection successful with ${strategyName}`);
            return connectResult;
          } catch (connectionError) {
            console.error(`   ❌ Connection failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`);
            
            const errorMsg = connectionError instanceof Error ? connectionError.message : String(connectionError);
            
            if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('localhost') || errorMsg.includes('127.0.0.1')) {
              console.error(`   Connection error detected, trying host fallback...`);
              
              const fallbackHost = hostTest.recommendedHost === '127.0.0.1' ? 'localhost' : '127.0.0.1';
              const fallbackStrategy = {
                ...strategy,
                customConfig: {
                  ...strategy.customConfig,
                  chromeFlags: [
                    ...strategy.customConfig.chromeFlags.filter((flag: string) => !flag.includes('remote-debugging-address')),
                    `--remote-debugging-address=${fallbackHost}`
                  ]
                }
              };
              
              console.error(`   Trying fallback with --remote-debugging-address=${fallbackHost}...`);
              return await connect(fallbackStrategy);
            }
            
            throw connectionError;
          }
        }, platform === 'win32' ? 30000 : 25000, `browser-connection-${strategyName.toLowerCase().replace(/\s+/g, '-')}`);
        
        const { browser, page } = result;

        browserInstance = browser;
        pageInstance = page;


        console.log(`✅ Browser initialized successfully using ${strategyName}`);
        updateCircuitBreakerOnSuccess();
        
        // Resolve the init promise to unblock waiting calls
        if (resolveInit!) {
          resolveInit({ browser, page });
        }
        
        return { browser, page };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ ${strategyName} failed:`, lastError.message);
        
        if (lastError.message.includes('ECONNREFUSED')) {
          console.error(`   🔍 ECONNREFUSED detected - likely Chrome connection/port issue`);
        } else if (lastError.message.includes('ENOENT') || lastError.message.includes('spawn')) {
          console.error(`   🔍 Chrome executable issue detected`);
        } else if (lastError.message.includes('timeout')) {
          console.error(`   🔍 Connection timeout - Chrome may be slow to start`);
        }
        
        if (strategyIndex < connectionStrategies.length - 1) {
          const delayMs = 2000 + (strategyIndex * 1000);
          console.error(`⏳ Waiting ${delayMs/1000} seconds before trying next strategy...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    updateCircuitBreakerOnFailure();
    
    const errorMessage = lastError ? lastError.message : 'Unknown connection error';
    
    if (errorMessage.includes('ENOENT') || errorMessage.includes('spawn') || errorMessage.includes('chrome') || errorMessage.includes('ECONNREFUSED')) {
      if (platform === 'win32') {
        console.error(`❌ All browser connection strategies failed on Windows:`);
        console.error(`   Final Error: ${errorMessage}`);
        console.error(`\n   🔧 Enhanced Windows Troubleshooting Solutions:`);
        
        if (errorMessage.includes('ECONNREFUSED')) {
          console.error(`\n   🚨 ECONNREFUSED Error Specific Solutions:`);
          console.error(`   1. Port/Connection Issues:`);
          console.error(`      - Chrome DevTools Protocol port is being blocked`);
          console.error(`      - Add Chrome to Windows Firewall exceptions`);
          console.error(`      - Check if localhost resolves to 127.0.0.1 (run: ping localhost)`);
          console.error(`      - Try different Chrome flags: --remote-debugging-port=0`);
          console.error(`\n   2. Network Configuration:`);
          console.error(`      - Disable VPN/proxy temporarily`);
          console.error(`      - Check Windows hosts file (C:\\Windows\\System32\\drivers\\etc\\hosts)`);
          console.error(`      - Ensure localhost points to 127.0.0.1`);
          console.error(`\n   3. Chrome Process Management:`);
          console.error(`      - Kill all chrome.exe processes in Task Manager`);
          console.error(`      - Clear Chrome user data: %LOCALAPPDATA%\\Google\\Chrome\\User Data`);
          console.error(`      - Try running Chrome manually to test: chrome.exe --remote-debugging-port=9222`);
        }
        
        console.error(`\n   🔧 General Solutions:`);
        console.error(`   1. Environment Variables (Recommended):`);
        console.error(`      - Set CHROME_PATH environment variable`);
        console.error(`      - Example: set CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`);
        console.error(`\n   2. Chrome Installation:`);
        console.error(`      - Download/reinstall Chrome: https://www.google.com/chrome/`);
        console.error(`      - Try Chrome Canary: https://www.google.com/chrome/canary/`);
        console.error(`\n   3. Permissions & Security:`);
        console.error(`      - Run as Administrator`);
        console.error(`      - Add Chrome to Windows Defender exclusions`);
        console.error(`      - Temporarily disable antivirus software`);
        console.error(`\n   4. Advanced Configuration:`);
        console.error(`      - Use customConfig.chromePath in browser_init`);
        console.error(`      - Try headless mode: {"headless": true}`);
        console.error(`      - Use environment variable: PUPPETEER_EXECUTABLE_PATH`);
      } else {
        console.error(`❌ Browser launch failed on ${platform}:`);
        console.error(`   Error: ${errorMessage}`);
      }
      
      throw new Error(`Browser initialization failed after trying all strategies: ${errorMessage}. See console for platform-specific troubleshooting steps.`);
    }
    
    const finalError = lastError || new Error('Unknown browser initialization error');
    
    // Reject the init promise to unblock waiting calls
    if (rejectInit!) {
      rejectInit(finalError);
    }
    
    throw finalError;
  } finally {
    browserInitDepth--;
    // CRITICAL: Always clear the initialization flag, even on error
    browserInitializationInProgress = false;
    // Clear the promise lock
    browserInitPromise = null;
  }
}

// Close browser function
export async function closeBrowser() {
  if (browserInstance) {
    try {
      const pages = await browserInstance.pages();
      for (const page of pages) {
        try {
          await page.close();
        } catch (error) {
          console.error('Error closing page:', error);
        }
      }
      
      await browserInstance.close();
      
      if (browserInstance.process() != null) {
        try {
          browserInstance.process().kill('SIGTERM');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (browserInstance.process() != null && !browserInstance.process().killed) {
            browserInstance.process().kill('SIGKILL');
          }
        } catch (error) {
          console.error('Error force-killing browser process:', error);
        }
      }
    } catch (error) {
      console.error('Error closing browser:', error);
      
      if (browserInstance && browserInstance.process() != null) {
        try {
          browserInstance.process().kill('SIGKILL');
        } catch (killError) {
          console.error('Error force-killing browser process with SIGKILL:', killError);
        }
      }
    } finally {
      browserInstance = null;
      pageInstance = null;
      // CRITICAL FIX: Reset browser init depth counter when browser is closed
      // This prevents "Maximum browser initialization depth exceeded" errors
      browserInitDepth = 0;
      browserInitializationInProgress = false; // Also reset initialization flag
      browserInitPromise = null; // Clear promise lock
      console.log('🔄 Browser closed, browserInitDepth and initialization flag reset');
    }
  }
}

// Force kill all Brave browser processes system-wide
export async function forceKillBraveProcesses() {
  try {
    const { spawn } = await import('child_process');
    
    if (process.platform !== 'win32') {
      // Kill Brave processes on Unix-like systems
      spawn('pkill', ['-f', 'Brave Browser'], { stdio: 'ignore' });
      spawn('pkill', ['-f', 'brave'], { stdio: 'ignore' });
    } else {
      // Windows: Kill Brave processes
      spawn('taskkill', ['/F', '/IM', 'brave.exe'], { stdio: 'ignore' });
    }
  } catch (error) {
    console.error('Error force-killing Brave browser processes:', error);
  }
}

// Aliases for backward compatibility (now all point to Brave-only function)
export const forceKillChromeProcesses = forceKillBraveProcesses;
export const forceKillAllChromeProcesses = forceKillBraveProcesses;

// Getters for browser instances
export function getBrowserInstance() {
  return browserInstance;
}

export function getPageInstance() {
  return pageInstance;
}

// Alias for getPageInstance for compatibility
export function getCurrentPage() {
  if (!pageInstance) {
    throw new Error('No page instance available. Please initialize browser first.');
  }
  return pageInstance;
}

export function getContentPriorityConfig() {
  return contentPriorityConfig;
}

export function updateContentPriorityConfig(config: Partial<ContentPriorityConfig>) {
  contentPriorityConfig = { ...contentPriorityConfig, ...config };
}

// Additional convenience exports for video extraction modules
export function getBrowser() {
  return browserInstance;
}

export function getPage() {
  return pageInstance;
}

