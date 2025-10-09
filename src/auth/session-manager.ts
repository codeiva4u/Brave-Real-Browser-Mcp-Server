// Authentication & Session Management
import { Page, Protocol } from 'puppeteer-core';

export interface LoginCredentials {
  username: string;
  password: string;
  usernameSelector?: string;
  passwordSelector?: string;
  submitSelector?: string;
}

export interface SessionData {
  cookies: Protocol.Network.Cookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: number;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();

  async login(page: Page, credentials: LoginCredentials): Promise<boolean> {
    try {
      const { username, password, usernameSelector = 'input[type="email"], input[type="text"]', passwordSelector = 'input[type="password"]', submitSelector = 'button[type="submit"]' } = credentials;
      await page.waitForSelector(usernameSelector, { timeout: 10000 });
      await page.type(usernameSelector, username);
      await page.type(passwordSelector, password);
      await page.click(submitSelector);
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      return true;
    } catch { return false; }
  }

  async saveSession(page: Page, sessionName: string): Promise<void> {
    const cookies = await page.cookies();
    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    this.sessions.set(sessionName, { cookies, localStorage: JSON.parse(localStorage), sessionStorage: JSON.parse(sessionStorage), timestamp: Date.now() });
  }

  async loadSession(page: Page, sessionName: string): Promise<boolean> {
    const session = this.sessions.get(sessionName);
    if (!session) return false;
    await page.setCookie(...session.cookies);
    await page.evaluate((data) => {
      Object.entries(data.localStorage).forEach(([key, value]) => window.localStorage.setItem(key, value));
      Object.entries(data.sessionStorage).forEach(([key, value]) => window.sessionStorage.setItem(key, value));
    }, session);
    return true;
  }

  async manageCookies(page: Page): Promise<Protocol.Network.Cookie[]> {
    return await page.cookies();
  }

  async setCookies(page: Page, cookies: Protocol.Network.Cookie[]): Promise<void> {
    await page.setCookie(...cookies);
  }

  async clearSession(page: Page): Promise<void> {
    await page.deleteCookie(...(await page.cookies()));
    await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  }

  async autoFillForm(page: Page, formData: Record<string, string>): Promise<void> {
    for (const [selector, value] of Object.entries(formData)) {
      await page.waitForSelector(selector, { timeout: 5000 }).catch(() => {});
      await page.type(selector, value);
    }
  }
}
