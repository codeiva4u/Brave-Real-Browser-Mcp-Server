// Authentication & Session Management Utilities
import { Page, Protocol } from 'puppeteer-core';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Cookie Manager - Save and restore cookies
 */
export class CookieManager {
  private cookieFile: string;
  
  constructor(cookieFilePath?: string) {
    this.cookieFile = cookieFilePath || path.join(process.cwd(), 'cookies.json');
  }
  
  async saveCookies(page: Page): Promise<void> {
    const cookies = await page.cookies();
    await fs.writeFile(this.cookieFile, JSON.stringify(cookies, null, 2));
  }
  
  async loadCookies(page: Page): Promise<boolean> {
    try {
      const cookiesString = await fs.readFile(this.cookieFile, 'utf-8');
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async clearCookies(): Promise<void> {
    try {
      await fs.unlink(this.cookieFile);
    } catch (error) {
      // File doesn't exist
    }
  }
  
  async getCookiesByDomain(page: Page, domain: string): Promise<any[]> {
    const allCookies = await page.cookies();
    return allCookies.filter(cookie => cookie.domain.includes(domain));
  }
}

/**
 * Session Manager - Manage login sessions
 */
export class SessionManager {
  private sessions: Map<string, { cookies: any[]; timestamp: number }> = new Map();
  private sessionTimeout: number = 3600000; // 1 hour
  
  async saveSession(page: Page, sessionId: string): Promise<void> {
    const cookies = await page.cookies();
    this.sessions.set(sessionId, {
      cookies,
      timestamp: Date.now()
    });
  }
  
  async restoreSession(page: Page, sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Check if session expired
    if (Date.now() - session.timestamp > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    await page.setCookie(...(session.cookies as any));
    return true;
  }
  
  isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    return Date.now() - session.timestamp <= this.sessionTimeout;
  }
  
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  clearAllSessions(): void {
    this.sessions.clear();
  }
}

/**
 * Auto-fill form helper
 */
export async function autoFillForm(
  page: Page,
  formData: Record<string, string>,
  options?: {
    submitSelector?: string;
    waitAfterFill?: number;
  }
): Promise<{ success: boolean; filledFields: string[] }> {
  const opts = {
    submitSelector: 'button[type="submit"], input[type="submit"]',
    waitAfterFill: 500,
    ...options
  };
  
  const filledFields: string[] = [];
  
  for (const [fieldName, value] of Object.entries(formData)) {
    // Try multiple selectors for each field
    const selectors = [
      `input[name="${fieldName}"]`,
      `input[id="${fieldName}"]`,
      `textarea[name="${fieldName}"]`,
      `select[name="${fieldName}"]`,
      `[name="${fieldName}"]`
    ];
    
    let filled = false;
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.type(value, { delay: 50 });
          filledFields.push(fieldName);
          filled = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, opts.waitAfterFill));
  
  return {
    success: filledFields.length > 0,
    filledFields
  };
}

/**
 * Login helper with common patterns
 */
export async function autoLogin(
  page: Page,
  credentials: {
    username: string;
    password: string;
    usernameSelector?: string;
    passwordSelector?: string;
    submitSelector?: string;
    url?: string;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // Navigate to login page if URL provided
    if (credentials.url) {
      await page.goto(credentials.url, { waitUntil: 'networkidle2' });
    }
    
    // Default selectors
    const usernameSelectors = credentials.usernameSelector ? [credentials.usernameSelector] : [
      'input[name="username"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[id="username"]',
      'input[id="email"]',
      '#user',
      '#login'
    ];
    
    const passwordSelectors = credentials.passwordSelector ? [credentials.passwordSelector] : [
      'input[name="password"]',
      'input[type="password"]',
      'input[id="password"]',
      '#pass'
    ];
    
    const submitSelectors = credentials.submitSelector ? [credentials.submitSelector] : [
      'button[type="submit"]',
      'input[type="submit"]',
      'button[name="submit"]',
      '.login-button',
      '#login-button'
    ];
    
    // Fill username
    let usernameFilled = false;
    for (const selector of usernameSelectors) {
      const element = await page.$(selector);
      if (element) {
        await element.type(credentials.username, { delay: 50 });
        usernameFilled = true;
        break;
      }
    }
    
    if (!usernameFilled) {
      return { success: false, message: 'Could not find username field' };
    }
    
    // Fill password
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      const element = await page.$(selector);
      if (element) {
        await element.type(credentials.password, { delay: 50 });
        passwordFilled = true;
        break;
      }
    }
    
    if (!passwordFilled) {
      return { success: false, message: 'Could not find password field' };
    }
    
    // Submit form
    let submitted = false;
    for (const selector of submitSelectors) {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        submitted = true;
        break;
      }
    }
    
    if (!submitted) {
      // Try pressing Enter
      await page.keyboard.press('Enter');
    }
    
    // Wait for navigation or error
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
    } catch (error) {
      // Navigation might not happen if login fails
    }
    
    return { success: true, message: 'Login attempted successfully' };
  } catch (error) {
    return { success: false, message: `Login failed: ${error}` };
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page, indicators: {
  loggedInSelectors?: string[];
  loggedOutSelectors?: string[];
  urlPattern?: RegExp;
}): Promise<boolean> {
  // Check URL pattern
  if (indicators.urlPattern && indicators.urlPattern.test(page.url())) {
    return true;
  }
  
  // Check for logged-in indicators
  if (indicators.loggedInSelectors) {
    for (const selector of indicators.loggedInSelectors) {
      const element = await page.$(selector);
      if (element) return true;
    }
  }
  
  // Check for logged-out indicators (inverse)
  if (indicators.loggedOutSelectors) {
    for (const selector of indicators.loggedOutSelectors) {
      const element = await page.$(selector);
      if (element) return false;
    }
    // If no logged-out indicators found, assume logged in
    return true;
  }
  
  return false;
}

/**
 * Logout helper
 */
export async function autoLogout(page: Page, logoutSelector?: string): Promise<boolean> {
  const selectors = logoutSelector ? [logoutSelector] : [
    'a[href*="logout"]',
    'button[class*="logout"]',
    '[aria-label*="logout" i]',
    '[aria-label*="sign out" i]',
    'a:contains("Logout")',
    'a:contains("Sign Out")'
  ];
  
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    } catch (error) {
      continue;
    }
  }
  
  return false;
}

/**
 * Session persistence helper
 */
export async function saveSessionToFile(
  page: Page,
  filePath: string
): Promise<void> {
  const session = {
    cookies: await page.cookies(),
    localStorage: await page.evaluate(() => JSON.stringify(localStorage)),
    sessionStorage: await page.evaluate(() => JSON.stringify(sessionStorage)),
    url: page.url()
  };
  
  await fs.writeFile(filePath, JSON.stringify(session, null, 2));
}

export async function restoreSessionFromFile(
  page: Page,
  filePath: string
): Promise<boolean> {
  try {
    const sessionData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    // Restore cookies
    await page.setCookie(...sessionData.cookies);
    
    // Navigate to saved URL
    await page.goto(sessionData.url);
    
    // Restore localStorage
    await page.evaluate((storage) => {
      const data = JSON.parse(storage);
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value as string);
      }
    }, sessionData.localStorage);
    
    // Restore sessionStorage
    await page.evaluate((storage) => {
      const data = JSON.parse(storage);
      for (const [key, value] of Object.entries(data)) {
        sessionStorage.setItem(key, value as string);
      }
    }, sessionData.sessionStorage);
    
    return true;
  } catch (error) {
    return false;
  }
}
