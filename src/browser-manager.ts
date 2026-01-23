import { connect } from 'brave-real-browser';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (manually, completely silent)
function loadEnvFile(): void {
  const envPaths = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env')
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && !process.env[key]) {
              process.env[key] = value;
            }
          }
        });
        break;
      }
    } catch (error) {
      // Silently ignore .env loading errors
    }
  }
}

loadEnvFile();

// ============================================================
// PROXY ROTATION SYSTEM
// ============================================================
export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: 'http' | 'https' | 'socks5';
}

export interface ProxyRotationConfig {
  enabled: boolean;
  proxies: ProxyConfig[];
  rotationStrategy: 'round-robin' | 'random' | 'least-used' | 'on-error';
  rotateAfterRequests?: number;  // Rotate after N requests
  rotateOnBlock?: boolean;       // Rotate when blocked/detected
  currentIndex: number;
  requestCount: number;
  proxyStats: Map<string, { uses: number; failures: number; lastUsed: number }>;
}

// Global proxy rotation state
let proxyRotation: ProxyRotationConfig = {
  enabled: false,
  proxies: [],
  rotationStrategy: 'round-robin',
  rotateAfterRequests: 50,
  rotateOnBlock: true,
  currentIndex: 0,
  requestCount: 0,
  proxyStats: new Map()
};

// Initialize proxy rotation
export function initProxyRotation(proxies: (string | ProxyConfig)[], strategy: ProxyRotationConfig['rotationStrategy'] = 'round-robin') {
  const parsedProxies: ProxyConfig[] = proxies.map(p => {
    if (typeof p === 'string') {
      // Parse string format: protocol://user:pass@host:port or host:port
      const match = p.match(/^(?:(https?|socks5):\/\/)?(?:([^:]+):([^@]+)@)?([^:]+):(\d+)$/);
      if (match) {
        return {
          protocol: (match[1] as ProxyConfig['protocol']) || 'http',
          username: match[2],
          password: match[3],
          host: match[4],
          port: parseInt(match[5], 10)
        };
      }
      // Simple host:port
      const [host, port] = p.split(':');
      return { host, port: parseInt(port, 10), protocol: 'http' as const };
    }
    return p;
  });

  proxyRotation = {
    enabled: true,
    proxies: parsedProxies,
    rotationStrategy: strategy,
    rotateAfterRequests: 50,
    rotateOnBlock: true,
    currentIndex: 0,
    requestCount: 0,
    proxyStats: new Map()
  };

  // Initialize stats for each proxy
  parsedProxies.forEach(p => {
    const key = `${p.host}:${p.port}`;
    proxyRotation.proxyStats.set(key, { uses: 0, failures: 0, lastUsed: 0 });
  });

  console.log(`[ProxyRotation] Initialized with ${parsedProxies.length} proxies, strategy: ${strategy}`);
}

// Get current proxy
export function getCurrentProxy(): ProxyConfig | null {
  if (!proxyRotation.enabled || proxyRotation.proxies.length === 0) {
    return null;
  }
  return proxyRotation.proxies[proxyRotation.currentIndex];
}

// Get proxy as URL string
export function getCurrentProxyUrl(): string | null {
  const proxy = getCurrentProxy();
  if (!proxy) return null;
  
  let url = `${proxy.protocol || 'http'}://`;
  if (proxy.username && proxy.password) {
    url += `${proxy.username}:${proxy.password}@`;
  }
  url += `${proxy.host}:${proxy.port}`;
  return url;
}

// Rotate to next proxy
export function rotateProxy(reason: 'scheduled' | 'error' | 'blocked' = 'scheduled'): ProxyConfig | null {
  if (!proxyRotation.enabled || proxyRotation.proxies.length === 0) {
    return null;
  }

  const prevProxy = getCurrentProxy();
  const prevKey = prevProxy ? `${prevProxy.host}:${prevProxy.port}` : '';

  switch (proxyRotation.rotationStrategy) {
    case 'round-robin':
      proxyRotation.currentIndex = (proxyRotation.currentIndex + 1) % proxyRotation.proxies.length;
      break;
    
    case 'random':
      proxyRotation.currentIndex = Math.floor(Math.random() * proxyRotation.proxies.length);
      break;
    
    case 'least-used':
      let minUses = Infinity;
      let minIndex = 0;
      proxyRotation.proxies.forEach((p, i) => {
        const key = `${p.host}:${p.port}`;
        const stats = proxyRotation.proxyStats.get(key);
        if (stats && stats.uses < minUses) {
          minUses = stats.uses;
          minIndex = i;
        }
      });
      proxyRotation.currentIndex = minIndex;
      break;
    
    case 'on-error':
      // Only rotate on error/blocked, otherwise keep current
      if (reason === 'error' || reason === 'blocked') {
        proxyRotation.currentIndex = (proxyRotation.currentIndex + 1) % proxyRotation.proxies.length;
      }
      break;
  }

  proxyRotation.requestCount = 0;
  
  const newProxy = getCurrentProxy();
  const newKey = newProxy ? `${newProxy.host}:${newProxy.port}` : '';
  
  // Update stats
  if (newKey && proxyRotation.proxyStats.has(newKey)) {
    const stats = proxyRotation.proxyStats.get(newKey)!;
    stats.uses++;
    stats.lastUsed = Date.now();
    if (reason === 'error' || reason === 'blocked') {
      const prevStats = proxyRotation.proxyStats.get(prevKey);
      if (prevStats) prevStats.failures++;
    }
  }

  console.log(`[ProxyRotation] Rotated proxy (${reason}): ${prevKey} -> ${newKey}`);
  return newProxy;
}

// Check if proxy should be rotated
export function shouldRotateProxy(): boolean {
  if (!proxyRotation.enabled) return false;
  
  proxyRotation.requestCount++;
  
  if (proxyRotation.rotateAfterRequests && 
      proxyRotation.requestCount >= proxyRotation.rotateAfterRequests) {
    return true;
  }
  
  return false;
}

// Mark current proxy as blocked/failed
export function markProxyFailed(blocked: boolean = false) {
  if (!proxyRotation.enabled) return;
  
  const proxy = getCurrentProxy();
  if (proxy) {
    const key = `${proxy.host}:${proxy.port}`;
    const stats = proxyRotation.proxyStats.get(key);
    if (stats) {
      stats.failures++;
    }
  }
  
  if (proxyRotation.rotateOnBlock && blocked) {
    rotateProxy('blocked');
  }
}

// Get proxy stats
export function getProxyStats() {
  return {
    enabled: proxyRotation.enabled,
    currentProxy: getCurrentProxyUrl(),
    totalProxies: proxyRotation.proxies.length,
    currentIndex: proxyRotation.currentIndex,
    requestCount: proxyRotation.requestCount,
    strategy: proxyRotation.rotationStrategy,
    stats: Object.fromEntries(proxyRotation.proxyStats)
  };
}

// ============================================================
// RATE LIMITER SYSTEM
// ============================================================
export interface RateLimiterConfig {
  enabled: boolean;
  requestsPerSecond: number;       // Max requests per second
  requestsPerMinute: number;       // Max requests per minute
  burstLimit: number;              // Max burst requests
  domainLimits: Map<string, { requestsPerSecond: number; requestsPerMinute: number }>;
  globalCooldown: number;          // Minimum delay between any requests (ms)
  retryAfter: number;              // Default retry delay on rate limit (ms)
}

interface RateLimiterState {
  lastRequestTime: number;
  requestsInSecond: number;
  requestsInMinute: number;
  secondWindowStart: number;
  minuteWindowStart: number;
  domainRequestTimes: Map<string, number[]>;
  isThrottled: boolean;
  throttleUntil: number;
}

// Global rate limiter configuration
let rateLimiterConfig: RateLimiterConfig = {
  enabled: false,
  requestsPerSecond: 5,
  requestsPerMinute: 100,
  burstLimit: 10,
  domainLimits: new Map(),
  globalCooldown: 100,
  retryAfter: 5000
};

// Global rate limiter state
let rateLimiterState: RateLimiterState = {
  lastRequestTime: 0,
  requestsInSecond: 0,
  requestsInMinute: 0,
  secondWindowStart: Date.now(),
  minuteWindowStart: Date.now(),
  domainRequestTimes: new Map(),
  isThrottled: false,
  throttleUntil: 0
};

/**
 * Initialize rate limiter with custom configuration
 */
export function initRateLimiter(config: Partial<RateLimiterConfig> = {}) {
  rateLimiterConfig = {
    ...rateLimiterConfig,
    enabled: true,
    ...config
  };
  
  // Reset state
  rateLimiterState = {
    lastRequestTime: 0,
    requestsInSecond: 0,
    requestsInMinute: 0,
    secondWindowStart: Date.now(),
    minuteWindowStart: Date.now(),
    domainRequestTimes: new Map(),
    isThrottled: false,
    throttleUntil: 0
  };

  console.log(`[RateLimiter] Initialized: ${rateLimiterConfig.requestsPerSecond}/sec, ${rateLimiterConfig.requestsPerMinute}/min`);
}

/**
 * Set rate limit for a specific domain
 */
export function setDomainRateLimit(domain: string, requestsPerSecond: number, requestsPerMinute?: number) {
  rateLimiterConfig.domainLimits.set(domain, {
    requestsPerSecond,
    requestsPerMinute: requestsPerMinute || requestsPerSecond * 60
  });
  console.log(`[RateLimiter] Domain limit set for ${domain}: ${requestsPerSecond}/sec`);
}

/**
 * Get the delay needed before making a request
 * Returns 0 if request can be made immediately
 */
export function getRateLimitDelay(url?: string): number {
  if (!rateLimiterConfig.enabled) return 0;

  const now = Date.now();
  
  // Check if we're in a throttle period
  if (rateLimiterState.isThrottled && now < rateLimiterState.throttleUntil) {
    return rateLimiterState.throttleUntil - now;
  } else if (rateLimiterState.isThrottled) {
    rateLimiterState.isThrottled = false;
  }

  // Update sliding windows
  if (now - rateLimiterState.secondWindowStart >= 1000) {
    rateLimiterState.requestsInSecond = 0;
    rateLimiterState.secondWindowStart = now;
  }
  if (now - rateLimiterState.minuteWindowStart >= 60000) {
    rateLimiterState.requestsInMinute = 0;
    rateLimiterState.minuteWindowStart = now;
  }

  // Check global limits
  if (rateLimiterState.requestsInSecond >= rateLimiterConfig.requestsPerSecond) {
    return 1000 - (now - rateLimiterState.secondWindowStart);
  }
  if (rateLimiterState.requestsInMinute >= rateLimiterConfig.requestsPerMinute) {
    return 60000 - (now - rateLimiterState.minuteWindowStart);
  }

  // Check global cooldown
  const timeSinceLastRequest = now - rateLimiterState.lastRequestTime;
  if (timeSinceLastRequest < rateLimiterConfig.globalCooldown) {
    return rateLimiterConfig.globalCooldown - timeSinceLastRequest;
  }

  // Check domain-specific limits
  if (url) {
    try {
      const domain = new URL(url).hostname;
      const domainLimit = rateLimiterConfig.domainLimits.get(domain);
      
      if (domainLimit) {
        const domainTimes = rateLimiterState.domainRequestTimes.get(domain) || [];
        
        // Clean up old timestamps
        const recentTimes = domainTimes.filter(t => now - t < 60000);
        rateLimiterState.domainRequestTimes.set(domain, recentTimes);
        
        // Check domain limits
        const lastSecondRequests = recentTimes.filter(t => now - t < 1000).length;
        if (lastSecondRequests >= domainLimit.requestsPerSecond) {
          const oldestInSecond = recentTimes.filter(t => now - t < 1000)[0];
          return oldestInSecond ? 1000 - (now - oldestInSecond) : 1000;
        }
        
        const lastMinuteRequests = recentTimes.length;
        if (lastMinuteRequests >= domainLimit.requestsPerMinute) {
          const oldestInMinute = recentTimes[0];
          return oldestInMinute ? 60000 - (now - oldestInMinute) : 60000;
        }
      }
    } catch {
      // Invalid URL, ignore domain limits
    }
  }

  return 0;
}

/**
 * Wait for rate limit if needed, then record the request
 */
export async function waitForRateLimit(url?: string): Promise<void> {
  const delay = getRateLimitDelay(url);
  
  if (delay > 0) {
    console.log(`[RateLimiter] Waiting ${delay}ms before request${url ? ` to ${new URL(url).hostname}` : ''}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // Record the request
  recordRequest(url);
}

/**
 * Record a request for rate limiting tracking
 */
export function recordRequest(url?: string) {
  if (!rateLimiterConfig.enabled) return;

  const now = Date.now();
  rateLimiterState.lastRequestTime = now;
  rateLimiterState.requestsInSecond++;
  rateLimiterState.requestsInMinute++;

  // Record domain-specific request
  if (url) {
    try {
      const domain = new URL(url).hostname;
      const domainTimes = rateLimiterState.domainRequestTimes.get(domain) || [];
      domainTimes.push(now);
      rateLimiterState.domainRequestTimes.set(domain, domainTimes);
    } catch {
      // Invalid URL
    }
  }
}

/**
 * Signal that a rate limit response (429) was received
 */
export function onRateLimitHit(retryAfterMs?: number) {
  const delay = retryAfterMs || rateLimiterConfig.retryAfter;
  rateLimiterState.isThrottled = true;
  rateLimiterState.throttleUntil = Date.now() + delay;
  console.log(`[RateLimiter] Rate limit hit! Throttling for ${delay}ms`);
}

/**
 * Get current rate limiter stats
 */
export function getRateLimiterStats() {
  const now = Date.now();
  return {
    enabled: rateLimiterConfig.enabled,
    requestsInSecond: rateLimiterState.requestsInSecond,
    requestsInMinute: rateLimiterState.requestsInMinute,
    limitsPerSecond: rateLimiterConfig.requestsPerSecond,
    limitsPerMinute: rateLimiterConfig.requestsPerMinute,
    isThrottled: rateLimiterState.isThrottled,
    throttleRemaining: rateLimiterState.isThrottled ? Math.max(0, rateLimiterState.throttleUntil - now) : 0,
    domainLimits: Object.fromEntries(rateLimiterConfig.domainLimits),
    cooldown: rateLimiterConfig.globalCooldown
  };
}

/**
 * Disable rate limiter
 */
export function disableRateLimiter() {
  rateLimiterConfig.enabled = false;
  console.log('[RateLimiter] Disabled');
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
    // console.('Host connectivity test failed:', error);
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
    // console.(`Circuit breaker opened after ${browserCircuitBreaker.failureCount} failures`);
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
      // console.('Circuit breaker entering half-open state');
      return false;
    }
    return true;
  }

  return false;
}

// Note: Brave path detection is handled automatically by brave-real-launcher
// No manual path detection needed - the library auto-detects and auto-installs Brave

// Session validation utility
export async function validateSession(): Promise<boolean> {
  if (sessionValidationInProgress) {
    // console.('Session validation already in progress, skipping duplicate validation');
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
    // console.('Session validation failed:', error);
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

// Main browser initialization function - Simplified for Brave Browser
export async function initializeBrowser(options?: any) {
  if (browserInitDepth >= MAX_BROWSER_INIT_DEPTH) {
    throw new Error(`Maximum browser initialization depth (${MAX_BROWSER_INIT_DEPTH}) exceeded. This prevents infinite initialization loops.`);
  }

  if (isCircuitBreakerOpen()) {
    throw new Error(`Circuit breaker is open. Browser initialization is temporarily disabled. Wait ${CIRCUIT_BREAKER_TIMEOUT}ms before retrying.`);
  }

  browserInitDepth++;

  try {
    // Check if existing instances are still valid
    if (browserInstance && pageInstance) {
      const isValid = await validateSession();
      if (isValid) {
        return { browser: browserInstance, page: pageInstance };
      } else {
        // console.('Existing session is invalid, reinitializing browser...');
        await closeBrowser();
      }
    }

    // console.('🦁 Launching Brave Browser...');
    // console.('   brave-real-browser handles auto-detection, uBlock Origin, and Stealth mode');

    // Determine headless mode from:
    // 1. Tool argument (highest priority)
    // 2. Environment variable HEADLESS
    // 3. Default: false (GUI mode)
    const envHeadless = process.env.HEADLESS?.toLowerCase() === 'true';
    const headlessMode = options?.headless ?? envHeadless;

    if (headlessMode) {
      // console.('   Mode: HEADLESS (from ' + (options?.headless !== undefined ? 'tool argument' : 'environment variable') + ')');
    } else {
      // console.('   Mode: GUI (visible browser)');
    }

    // Note: brave-real-blocker is automatically loaded by brave-real-browser
    // It provides: AdBlocking, Stealth, RedirectBlocking, Scriptlets, CosmeticFiltering
    // No need for additional puppeteer-extra-plugin-adblocker

    const connectOptions: any = {
      headless: headlessMode,
      turnstile: true,
      connectOption: {
        defaultViewport: null // Full window content, no viewport restriction
      },
      plugins: [],  // brave-real-blocker handles ad blocking internally
      customConfig: {
        autoLoadUBlock: true,  // Enable uBlock Origin in brave-real-launcher
      },
      ...options, // Pass-through all user options
    };


    // Ensure headless is set correctly (overriding any conflicting option)
    connectOptions.headless = headlessMode;

    try {
      const result = await withTimeout(
        async () => connect(connectOptions),
        120000, // 2 minute timeout
        'brave-browser-connection'
      );

      const { browser, page } = result;

      browserInstance = browser;
      pageInstance = page;

      // console.('✅ Brave Browser initialized successfully');
      // console.('   Features: uBlock Origin (built-in), Stealth Mode, Auto-Detection');
      updateCircuitBreakerOnSuccess();
      return { browser, page };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // console.(`❌ Brave Browser launch failed: ${errorMessage}`);
      // console.('');
      // console.('🔧 Troubleshooting:');
      // console.('   1. Ensure Brave Browser is installed');
      // console.('   2. Set BRAVE_PATH environment variable if auto-detection fails');
      // console.('   3. Check if another Brave instance is running');

      updateCircuitBreakerOnFailure();
      throw error;
    }

  } finally {
    browserInitDepth--;
  }
}

// Close browser function - Enhanced with timeout protection
export async function closeBrowser() {
  if (!browserInstance) {
    // Already closed or never initialized
    browserInstance = null;
    pageInstance = null;
    return;
  }

  const browser = browserInstance;
  // Clear references immediately to prevent double-close attempts
  browserInstance = null;
  pageInstance = null;

  try {
    // Try to get pages with timeout
    let pages: any[] = [];
    try {
      pages = await withTimeout(
        async () => browser.pages?.() || [],
        5000,
        'browser-pages-list'
      );
    } catch (error) {
      // Could not get pages, continue with close
    }

    // Close each page with individual timeout
    for (const page of pages) {
      try {
        await withTimeout(
          async () => page.close?.(),
          2000,
          'page-close'
        );
      } catch (error) {
        // Ignore individual page close errors
      }
    }

    // Try graceful browser close with timeout
    try {
      await withTimeout(
        async () => browser.close?.(),
        10000,
        'browser-close'
      );
    } catch (error) {
      // Graceful close failed, will force kill
    }

    // Force kill process if still running
    try {
      const process = browser.process?.();
      if (process && !process.killed) {
        process.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const processAfterTerm = browser.process?.();
        if (processAfterTerm && !processAfterTerm.killed) {
          processAfterTerm.kill('SIGKILL');
        }
      }
    } catch (error) {
      // Ignore force kill errors - process may already be gone
    }

  } catch (error) {
    // Final cleanup - try force kill
    try {
      const process = browser.process?.();
      if (process) {
        process.kill('SIGKILL');
      }
    } catch (killError) {
      // Ignore - nothing more we can do
    }
  }
}


// Force kill all Brave Browser processes system-wide
export async function forceKillAllBraveProcesses() {
  try {
    const { spawn } = await import('child_process');

    if (process.platform !== 'win32') {
      spawn('pkill', ['-f', 'Brave'], { stdio: 'ignore' });
      spawn('pkill', ['-f', 'brave'], { stdio: 'ignore' });
    } else {
      spawn('taskkill', ['/F', '/IM', 'brave.exe'], { stdio: 'ignore' });
    }
  } catch (error) {
    // console.('Error force-killing Brave processes:', error);
  }
}

// Legacy function name for compatibility
export const forceKillAllChromeProcesses = forceKillAllBraveProcesses;

// Getters for browser instances
export function getBrowserInstance() {
  return browserInstance;
}

export function getPageInstance() {
  return pageInstance;
}

export function getContentPriorityConfig() {
  return contentPriorityConfig;
}

export function updateContentPriorityConfig(config: Partial<ContentPriorityConfig>) {
  contentPriorityConfig = { ...contentPriorityConfig, ...config };
}
