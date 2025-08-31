import { connect } from 'puppeteer-real-browser';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import * as os from 'os';

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

// Brave browser paths by platform and architecture
export const BRAVE_PATHS = {
  win32: {
    x64: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(os.homedir(), 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
      path.join(os.homedir(), 'AppData\\Roaming\\BraveSoftware\\Brave-Browser\\Application\\brave.exe')
    ],
    arm64: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(os.homedir(), 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe')
    ]
  },
  darwin: {
    x64: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
    arm64: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']
  },
  linux: {
    x64: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave-browser-stable',
      '/snap/bin/brave',
      '/var/lib/flatpak/exports/bin/com.brave.Browser',
      path.join(os.homedir(), '/.local/bin/brave-browser')
    ],
    arm64: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave-browser-stable',
      '/snap/bin/brave',
      '/var/lib/flatpak/exports/bin/com.brave.Browser',
      path.join(os.homedir(), '/.local/bin/brave-browser')
    ]
  }
};

// Store browser instance
let browserInstance: any = null;
let pageInstance: any = null;

// Environment and configuration
const platform = os.platform();
const arch = os.arch();
const isCI = process.env.CI === 'true';
const isHeadless = process.env.HEADLESS === 'true' || isCI;

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

// Auto-detect Brave browser path
export function findBravePath(): string | null {
  console.error('🔍 [DEBUG] Auto-detecting Brave browser path...');
  
  // Check environment variable first
  const envPath = process.env.BRAVE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    console.error(`🔍 [DEBUG] Found Brave via environment variable: ${envPath}`);
    return envPath;
  }
  
  // Check .env file
  try {
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const match = envContent.match(/BRAVE_PATH="([^"]+)"/);
      if (match && match[1] && fs.existsSync(match[1])) {
        console.error(`🔍 [DEBUG] Found Brave via .env file: ${match[1]}`);
        return match[1];
      }
    }
  } catch (error) {
    // Continue with detection
  }
  
  // Auto-detect based on platform and architecture
  const paths = BRAVE_PATHS[platform as keyof typeof BRAVE_PATHS]?.[arch as keyof typeof BRAVE_PATHS['win32']] || [];
  
  console.error(`🔍 [DEBUG] Checking ${paths.length} potential Brave paths for ${platform} ${arch}`);
  
  for (const bravePath of paths) {
    try {
      if (fs.existsSync(bravePath)) {
        console.error(`🔍 [DEBUG] Found Brave at: ${bravePath}`);
        
        // Save to environment
        process.env.BRAVE_PATH = bravePath;
        
        // Save to .env file
        try {
          let envContent = '';
          if (fs.existsSync('.env')) {
            envContent = fs.readFileSync('.env', 'utf8');
          }
          
          if (!envContent.includes('BRAVE_PATH')) {
            envContent += `\nBRAVE_PATH="${bravePath}"\n`;
            fs.writeFileSync('.env', envContent);
            console.error(`🔍 [DEBUG] Saved Brave path to .env file`);
          }
        } catch (error) {
          console.error(`⚠️ [DEBUG] Failed to save Brave path to .env:`, error);
        }
        
        return bravePath;
      }
    } catch (error) {
      // Continue searching
    }
  }
  
  console.error(`❌ [DEBUG] Brave not found in any of the expected locations`);
  console.error(`💡 [DEBUG] Please install Brave from: https://brave.com/download/`);
  console.error(`💡 [DEBUG] Or set BRAVE_PATH environment variable to your Brave installation`);
  
  return null;
}

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
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms in context: ${context}`));
    }, timeoutMs);

    operation()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// Port availability and connection utilities for enhanced resilience
export async function isPortAvailable(port: number, host: string = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
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
    const timeSinceFailure = Date.now() - browserCircuitBreaker.lastFailureTime;
    if (timeSinceFailure >= CIRCUIT_BREAKER_TIMEOUT) {
      browserCircuitBreaker.state = 'half-open';
      return false;
    }
    return true;
  }
  
  // half-open state
  return false;
}

// Initialize Brave browser with enhanced detection and configuration
export async function initializeBrowser(options: any = {}): Promise<{ browser: any; page: any }> {
  console.error('🔍 [DEBUG] Initializing Brave browser...');
  
  // Check circuit breaker
  if (isCircuitBreakerOpen()) {
    throw new Error('Circuit breaker is open - too many recent failures');
  }
  
  // Prevent infinite recursion
  if (browserInitDepth >= MAX_BROWSER_INIT_DEPTH) {
    throw new Error('Maximum browser initialization depth reached');
  }
  
  browserInitDepth++;
  
  try {
    // Close any existing browser
    if (browserInstance) {
      console.error('🔍 [DEBUG] Closing existing browser instance...');
      await closeBrowser();
    }
    
    // Auto-detect Brave path
    const bravePath = findBravePath();
    if (!bravePath) {
      throw new Error('Brave browser not found. Please install Brave or set BRAVE_PATH environment variable.');
    }
    
    console.error(`🔍 [DEBUG] Using Brave at: ${bravePath}`);
    
    // Prepare browser options
    const browserOptions = {
      headless: options.headless ?? isHeadless,
      executablePath: bravePath, // Use Brave instead of Chrome
      ignoreAllFlags: options.ignoreAllFlags ?? false,
      disableXvfb: options.disableXvfb ?? false,
      plugins: options.plugins ?? [],
      proxy: options.proxy ?? null,
      connectOption: {
        timeout: 120000, // 2 minutes timeout
        slowMo: 0,
        devtools: false,
        ...options.connectOption
      },
      // Brave-specific launch arguments
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-extensions-except',
        '--disable-plugins-discovery',
        '--disable-preconnect',
        '--disable-print-preview',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-certificate-errors-sp-list',
        '--allow-cross-origin-auth-prompt',
        '--disable-blink-features=AutomationControlled'
      ]
    };
    
    // Add platform-specific arguments
    if (platform === 'linux') {
      browserOptions.args.push(
        '--single-process',
        '--no-zygote'
      );
      
      // Setup Xvfb if in headless environment
      if (isHeadless && process.env.XVFB_AVAILABLE === 'true') {
        process.env.DISPLAY = ':99';
        console.error('🔍 [DEBUG] Using Xvfb display :99 for headless operation');
      }
    }
    
    console.error(`🔍 [DEBUG] Browser options: ${JSON.stringify(browserOptions, null, 2)}`);
    
    // Connect to Brave browser
    console.error('🔍 [DEBUG] Connecting to Brave browser...');
    const response = await withTimeout(
      () => connect(browserOptions),
      browserOptions.connectOption.timeout,
      'browser connection'
    );
    
    if (!response || !response.browser || !response.page) {
      throw new Error('Failed to initialize Brave browser - invalid response');
    }
    
    browserInstance = response.browser;
    pageInstance = response.page;
    
    // Configure page settings
    console.error('🔍 [DEBUG] Configuring page settings...');
    await pageInstance.setViewport({ width: 1920, height: 1080 });
    await pageInstance.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    console.error('🔍 [DEBUG] Brave browser initialized successfully');
    updateCircuitBreakerOnSuccess();
    browserInitDepth = 0;
    
    return { browser: browserInstance, page: pageInstance };
    
  } catch (error) {
    console.error('❌ [DEBUG] Failed to initialize Brave browser:', error);
    browserInitDepth = 0;
    updateCircuitBreakerOnFailure();
    
    // Clean up on failure
    try {
      await closeBrowser();
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error;
  }
}

// Get current browser and page instances
export function getBrowserInstances(): { browser: any; page: any } {
  if (!browserInstance || !pageInstance) {
    throw new Error('Browser not initialized. Call initializeBrowser() first.');
  }
  
  return { browser: browserInstance, page: pageInstance };
}

// Close browser instance
export async function closeBrowser(): Promise<void> {
  console.error('🔍 [DEBUG] Closing Brave browser...');
  
  try {
    if (pageInstance) {
      await pageInstance.close();
      pageInstance = null;
      console.error('🔍 [DEBUG] Page closed');
    }
    
    if (browserInstance) {
      await browserInstance.close();
      browserInstance = null;
      console.error('🔍 [DEBUG] Browser closed');
    }
    
    // Force kill any remaining Brave processes
    await forceKillAllBraveProcesses();
    
  } catch (error) {
    console.error('⚠️ [DEBUG] Error during browser cleanup:', error);
    
    // Force cleanup
    browserInstance = null;
    pageInstance = null;
    
    // Force kill processes as last resort
    await forceKillAllBraveProcesses();
  }
}

// Force kill all Brave processes
export async function forceKillAllBraveProcesses(): Promise<void> {
  console.error('🔍 [DEBUG] Force killing all Brave processes...');
  
  try {
    if (platform === 'win32') {
      const { execSync } = require('child_process');
      execSync('taskkill /f /im brave.exe', { stdio: 'ignore' });
      execSync('taskkill /f /im "Brave Browser"', { stdio: 'ignore' });
    } else if (platform === 'linux' || platform === 'darwin') {
      const { execSync } = require('child_process');
      execSync('pkill -f brave', { stdio: 'ignore' });
      execSync('pkill -f "Brave Browser"', { stdio: 'ignore' });
    }
    
    console.error('🔍 [DEBUG] Brave processes killed');
  } catch (error) {
    // Ignore errors - processes might not exist
  }
}

// Validate browser session
export async function validateBrowserSession(): Promise<boolean> {
  if (sessionValidationInProgress) {
    return true; // Assume valid if validation is already in progress
  }
  
  if (!browserInstance || !pageInstance) {
    return false;
  }
  
  try {
    sessionValidationInProgress = true;
    
    // Quick validation - try to get page title
    await withTimeout(
      () => pageInstance.title(),
      5000,
      'session validation'
    );
    
    return true;
  } catch (error) {
    console.error('Browser session validation failed:', error);
    return false;
  } finally {
    sessionValidationInProgress = false;
  }
}

// Export getter functions for content priority config
export function getContentPriorityConfig(): ContentPriorityConfig {
  return contentPriorityConfig;
}

export function setContentPriorityConfig(config: Partial<ContentPriorityConfig>): void {
  contentPriorityConfig = { ...contentPriorityConfig, ...config };
}
