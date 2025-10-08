// Advanced Scraping Features Module
// Dynamic Content Handling, Authentication, Rate Limiting, Session Management

type Page = any;

/**
 * Wait for Dynamic Content to Load
 * AJAX/dynamic content के लिए intelligent waiting
 */
export async function waitForDynamicContent(
  page: Page,
  options?: {
    timeout?: number;
    networkIdleTime?: number;
    selector?: string;
  }
): Promise<{ success: boolean; waitTime: number; method: string }> {
  const startTime = Date.now();
  const timeout = options?.timeout || 30000;
  const networkIdleTime = options?.networkIdleTime || 500;
  
  try {
    if (options?.selector) {
      // Wait for specific selector
      await page.waitForSelector(options.selector, { timeout });
      return {
        success: true,
        waitTime: Date.now() - startTime,
        method: 'selector'
      };
    }
    
    // Wait for network idle
    await page.waitForNetworkIdle({ timeout, idleTime: networkIdleTime });
    return {
      success: true,
      waitTime: Date.now() - startTime,
      method: 'networkIdle'
    };
  } catch (error: any) {
    return {
      success: false,
      waitTime: Date.now() - startTime,
      method: 'timeout'
    };
  }
}

/**
 * Handle Shadow DOM Content
 * Shadow DOM elements को access करना
 */
export async function extractFromShadowDOM(
  page: Page,
  hostSelector: string,
  innerSelector: string
): Promise<any> {
  return await page.evaluate((host: any, inner: any) => {
    const hostElement: any = document.querySelector(host);
    if (!hostElement || !hostElement.shadowRoot) {
      return null;
    }
    
    const innerElement = hostElement.shadowRoot.querySelector(inner);
    return innerElement ? innerElement.textContent?.trim() : null;
  }, hostSelector, innerSelector);
}

/**
 * Handle iFrame Content
 * iFrames के अंदर का content extract करना
 */
export async function extractFromIframe(
  page: Page,
  iframeSelector: string,
  contentSelector?: string
): Promise<any> {
  const frames = page.frames();
  
  for (const frame of frames) {
    try {
      const frameElement = await frame.$(iframeSelector);
      if (frameElement) {
        if (contentSelector) {
          return await frame.$eval(contentSelector, (el: any) => el.textContent?.trim());
        } else {
          return await frame.content();
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

/**
 * Cookie Manager
 * Cookies को save और reuse करना
 */
export class CookieManager {
  private cookies: any[] = [];
  
  async saveCookies(page: Page): Promise<void> {
    this.cookies = await page.cookies();
  }
  
  async loadCookies(page: Page): Promise<void> {
    if (this.cookies.length > 0) {
      await page.setCookie(...this.cookies);
    }
  }
  
  getCookies(): any[] {
    return this.cookies;
  }
  
  clearCookies(): void {
    this.cookies = [];
  }
  
  async exportCookies(): Promise<string> {
    return JSON.stringify(this.cookies, null, 2);
  }
  
  async importCookies(cookiesJson: string): Promise<void> {
    this.cookies = JSON.parse(cookiesJson);
  }
}

/**
 * Session Manager
 * Multiple requests में session maintain करना
 */
export class SessionManager {
  private sessionData: Map<string, any> = new Map();
  private cookieManager: CookieManager = new CookieManager();
  
  async saveSession(page: Page, sessionId: string): Promise<void> {
    await this.cookieManager.saveCookies(page);
    
    const localStorage = await page.evaluate(() => {
      return JSON.stringify(localStorage);
    });
    
    const sessionStorage = await page.evaluate(() => {
      return JSON.stringify(sessionStorage);
    });
    
    this.sessionData.set(sessionId, {
      cookies: this.cookieManager.getCookies(),
      localStorage,
      sessionStorage,
      timestamp: Date.now()
    });
  }
  
  async restoreSession(page: Page, sessionId: string): Promise<boolean> {
    const session = this.sessionData.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Restore cookies
    await this.cookieManager.loadCookies(page);
    
    // Restore localStorage
    if (session.localStorage) {
      await page.evaluate((data: any) => {
        const parsed = JSON.parse(data);
        for (const key in parsed) {
          localStorage.setItem(key, parsed[key]);
        }
      }, session.localStorage);
    }
    
    // Restore sessionStorage
    if (session.sessionStorage) {
      await page.evaluate((data: any) => {
        const parsed = JSON.parse(data);
        for (const key in parsed) {
          sessionStorage.setItem(key, parsed[key]);
        }
      }, session.sessionStorage);
    }
    
    return true;
  }
  
  deleteSession(sessionId: string): void {
    this.sessionData.delete(sessionId);
  }
  
  listSessions(): string[] {
    return Array.from(this.sessionData.keys());
  }
}

/**
 * Rate Limiter
 * Requests के बीच delays और throttling
 */
export class RateLimiter {
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private windowStart: number = Date.now();
  
  constructor(
    private minDelay: number = 1000,
    private maxRequestsPerWindow: number = 10,
    private windowDuration: number = 60000
  ) {}
  
  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart > this.windowDuration) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // Check rate limit
    if (this.requestCount >= this.maxRequestsPerWindow) {
      const waitTime = this.windowDuration - (now - this.windowStart);
      await this.sleep(waitTime);
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
    
    // Enforce minimum delay
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      await this.sleep(this.minDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  getStats(): { requestCount: number; windowRemaining: number } {
    return {
      requestCount: this.requestCount,
      windowRemaining: this.maxRequestsPerWindow - this.requestCount
    };
  }
}

/**
 * Random Delay Generator
 * Human-like delays के लिए
 */
export function getRandomDelay(min: number = 500, max: number = 2000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * User Agent Rotator
 * Different user agents use करना
 */
export class UserAgentRotator {
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  
  private currentIndex: number = 0;
  
  getNext(): string {
    const ua = this.userAgents[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
    return ua;
  }
  
  getRandom(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  addUserAgent(ua: string): void {
    this.userAgents.push(ua);
  }
}

/**
 * Auto Login Handler
 * Automatic login form filling
 */
export async function autoLogin(
  page: Page,
  credentials: {
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
    username: string;
    password: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // Wait for form
    await page.waitForSelector(credentials.usernameSelector, { timeout: 10000 });
    
    // Fill username
    await page.type(credentials.usernameSelector, credentials.username, { delay: 100 });
    
    // Fill password
    await page.type(credentials.passwordSelector, credentials.password, { delay: 100 });
    
    // Random delay before submit
    await page.waitForTimeout(getRandomDelay(500, 1500));
    
    // Click submit
    await page.click(credentials.submitSelector);
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    
    return {
      success: true,
      message: 'Login successful'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Login failed: ${error.message}`
    };
  }
}

/**
 * Robots.txt Checker
 * Website की scraping permissions check करना
 */
export async function checkRobotsTxt(
  page: Page,
  baseUrl: string,
  userAgent: string = '*'
): Promise<{ allowed: boolean; rules: string[] }> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    await page.goto(robotsUrl, { waitUntil: 'networkidle0' });
    
    const content = await page.content();
    const rules: string[] = [];
    let allowed = true;
    
    const lines = content.split('\n');
    let currentUserAgent = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('User-agent:')) {
        currentUserAgent = trimmed.split(':')[1].trim();
      } else if (trimmed.startsWith('Disallow:') && 
                (currentUserAgent === userAgent || currentUserAgent === '*')) {
        const disallowedPath = trimmed.split(':')[1].trim();
        rules.push(disallowedPath);
        if (disallowedPath === '/') {
          allowed = false;
        }
      }
    }
    
    return { allowed, rules };
  } catch (error) {
    // If robots.txt doesn't exist, assume allowed
    return { allowed: true, rules: [] };
  }
}
