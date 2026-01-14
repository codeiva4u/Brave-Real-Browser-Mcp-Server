/**
 * Session Sync Handler - Browser State Auto-sync functionality
 * Provides automatic synchronization of browser state across sessions
 */

import type { Page } from 'puppeteer-core';
import { getSessionManager, type BrowserSessionState } from '../transport/session-manager.js';
import { getProgressNotifier } from '../transport/progress-notifier.js';

/**
 * Capture current browser state for persistence
 */
export async function captureBrowserState(page: Page): Promise<BrowserSessionState> {
  const progressNotifier = getProgressNotifier();
  const progressToken = `sync-capture-${Date.now()}`;
  
  progressNotifier.startOperation(progressToken, 'Capturing browser state...');

  try {
    // Get current URL
    const currentUrl = page.url();
    progressNotifier.updateProgress(progressToken, 20, { message: 'Got current URL' });

    // Get cookies
    const cookies = await page.cookies();
    progressNotifier.updateProgress(progressToken, 40, { message: 'Got cookies' });

    // Get viewport
    const viewport = page.viewport();
    progressNotifier.updateProgress(progressToken, 50, { message: 'Got viewport' });

    // Get user agent
    const userAgent = await page.evaluate(() => navigator.userAgent);
    progressNotifier.updateProgress(progressToken, 60, { message: 'Got user agent' });

    // Get localStorage
    const localStorage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          data[key] = window.localStorage.getItem(key) || '';
        }
      }
      return data;
    }).catch(() => ({}));
    progressNotifier.updateProgress(progressToken, 80, { message: 'Got localStorage' });

    // Get sessionStorage
    const sessionStorage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          data[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      return data;
    }).catch(() => ({}));
    progressNotifier.updateProgress(progressToken, 90, { message: 'Got sessionStorage' });

    const state: BrowserSessionState = {
      isInitialized: true,
      currentUrl,
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
      })),
      localStorage,
      sessionStorage,
      viewportSize: viewport ? { width: viewport.width, height: viewport.height } : null,
      userAgent,
    };

    progressNotifier.completeOperation(progressToken, 'Browser state captured');
    return state;

  } catch (error) {
    progressNotifier.failOperation(progressToken, error instanceof Error ? error.message : 'Failed to capture state');
    throw error;
  }
}

/**
 * Restore browser state from a saved session
 */
export async function restoreBrowserState(page: Page, state: BrowserSessionState): Promise<void> {
  const progressNotifier = getProgressNotifier();
  const progressToken = `sync-restore-${Date.now()}`;
  
  progressNotifier.startOperation(progressToken, 'Restoring browser state...');

  try {
    // Restore cookies
    if (state.cookies && state.cookies.length > 0) {
      await page.setCookie(...state.cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
      })));
      progressNotifier.updateProgress(progressToken, 30, { message: 'Restored cookies' });
    }

    // Navigate to last URL if available
    if (state.currentUrl && state.currentUrl !== 'about:blank') {
      await page.goto(state.currentUrl, { waitUntil: 'domcontentloaded' });
      progressNotifier.updateProgress(progressToken, 60, { message: 'Navigated to last URL' });
    }

    // Restore localStorage
    if (state.localStorage && Object.keys(state.localStorage).length > 0) {
      await page.evaluate((data: Record<string, string>) => {
        for (const [key, value] of Object.entries(data)) {
          window.localStorage.setItem(key, value);
        }
      }, state.localStorage);
      progressNotifier.updateProgress(progressToken, 80, { message: 'Restored localStorage' });
    }

    // Restore sessionStorage
    if (state.sessionStorage && Object.keys(state.sessionStorage).length > 0) {
      await page.evaluate((data: Record<string, string>) => {
        for (const [key, value] of Object.entries(data)) {
          window.sessionStorage.setItem(key, value);
        }
      }, state.sessionStorage);
      progressNotifier.updateProgress(progressToken, 90, { message: 'Restored sessionStorage' });
    }

    progressNotifier.completeOperation(progressToken, 'Browser state restored');

  } catch (error) {
    progressNotifier.failOperation(progressToken, error instanceof Error ? error.message : 'Failed to restore state');
    throw error;
  }
}

/**
 * Sync browser state to session
 */
export async function syncToSession(sessionId: string, page: Page): Promise<boolean> {
  const sessionManager = getSessionManager();
  
  try {
    const state = await captureBrowserState(page);
    return sessionManager.syncState(sessionId, state);
  } catch (error) {
    console.error('Failed to sync browser state:', error);
    return false;
  }
}

/**
 * Restore session to browser
 */
export async function restoreFromSession(sessionId: string, page: Page): Promise<boolean> {
  const sessionManager = getSessionManager();
  const session = sessionManager.getSession(sessionId);
  
  if (!session || !session.browserState) {
    return false;
  }

  try {
    await restoreBrowserState(page, session.browserState);
    return true;
  } catch (error) {
    console.error('Failed to restore browser state:', error);
    return false;
  }
}

/**
 * Setup automatic state sync on navigation events
 */
export function setupAutoSync(sessionId: string, page: Page, intervalMs: number = 30000): () => void {
  const progressNotifier = getProgressNotifier();
  
  // Sync on navigation
  const navigationHandler = async () => {
    await syncToSession(sessionId, page);
  };

  page.on('load', navigationHandler);
  page.on('domcontentloaded', navigationHandler);

  // Periodic sync
  const syncInterval = setInterval(async () => {
    try {
      await syncToSession(sessionId, page);
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    page.off('load', navigationHandler);
    page.off('domcontentloaded', navigationHandler);
    clearInterval(syncInterval);
  };
}

/**
 * Export session state for external storage
 */
export async function exportSessionState(sessionId: string): Promise<string | null> {
  const sessionManager = getSessionManager();
  return sessionManager.exportSession(sessionId);
}

/**
 * Import session state from external storage
 */
export function importSessionState(exportedState: string): string | null {
  const sessionManager = getSessionManager();
  const session = sessionManager.importSession(exportedState);
  return session ? session.sessionId : null;
}
