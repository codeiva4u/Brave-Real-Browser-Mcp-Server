/**
 * brave-real-puppeteer-core
 * Re-exports puppeteer-core with stealth patches applied at install time
 * 
 * Ecosystem Chain:
 *   brave-real-browser-mcp-server (top level)
 *       └── brave-real-puppeteer-core (you are here)
 *           └── brave-real-launcher
 *               └── brave-real-blocker (singleton)
 */

// Re-export everything from puppeteer-core
export * from 'puppeteer-core';

// Import and re-export default
import puppeteerCore from 'puppeteer-core';
export default puppeteerCore;

// Re-export blocker integration from brave-real-launcher for ecosystem chain
export {
  initBlocker,
  getBlocker,
  createBlockerFactory,
  autoEnableOnPage,
  createEcosystemChain,
  BraveBlocker,
  launch,
  DEFAULT_FLAGS,
  BraveLauncher,
  getStealthFlags,
  getDynamicUserAgents
} from 'brave-real-launcher';

// Import stealth functions for easy integration
import {
  getComprehensiveStealthScript,
  getPuppeteerOptimizedScript,
  getPlaywrightOptimizedScript,
  getCDPBypassScripts,
  injectRuntimeEnableBypass,
  injectSourceURLMasking,
  injectConsoleEnableBypass,
  injectExposeFunctionMasking,
  injectUtilityWorldMasking,
  getCurrentChromeVersion,
  getDynamicUserAgent,
  getDynamicUserAgentMetadata
} from './scripts/stealth-injector.js';

// Re-export stealth functions
export {
  getComprehensiveStealthScript,
  getPuppeteerOptimizedScript,
  getPlaywrightOptimizedScript,
  getCDPBypassScripts,
  injectRuntimeEnableBypass,
  injectSourceURLMasking,
  injectConsoleEnableBypass,
  injectExposeFunctionMasking,
  injectUtilityWorldMasking,
  getCurrentChromeVersion,
  getDynamicUserAgent,
  getDynamicUserAgentMetadata
};

/**
 * Apply stealth to a Puppeteer page - One-liner API
 * @param {Page} page - Puppeteer page instance
 * @param {Object} options - Stealth options
 * @returns {Promise<void>}
 * 
 * @example
 * import { applyStealthToPuppeteer } from 'brave-real-puppeteer-core';
 * const browser = await puppeteer.launch();
 * const page = await browser.newPage();
 * await applyStealthToPuppeteer(page);
 */
export async function applyStealthToPuppeteer(page, options = {}) {
  const {
    cdpBypasses = true,
    comprehensiveStealth = true,
    userAgent = null
  } = options;

  try {
    // Get CDP session
    const client = await page.target().createCDPSession();

    // Apply CDP bypasses first (before any other scripts)
    if (cdpBypasses) {
      const cdpScript = getCDPBypassScripts();
      await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: cdpScript,
        runImmediately: true
      });
    }

    // Apply comprehensive stealth
    if (comprehensiveStealth) {
      const stealthScript = getPuppeteerOptimizedScript(options);
      await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: stealthScript,
        runImmediately: true
      });
    }

    // Set user agent if provided or use dynamic
    const ua = userAgent || getDynamicUserAgent(false);
    const uaMetadata = getDynamicUserAgentMetadata(false);

    await client.send('Emulation.setUserAgentOverride', {
      userAgent: ua,
      userAgentMetadata: {
        brands: uaMetadata.brands,
        fullVersionList: uaMetadata.fullVersionList,
        platform: uaMetadata.platform,
        platformVersion: uaMetadata.platformVersion,
        architecture: uaMetadata.architecture,
        model: uaMetadata.model,
        mobile: uaMetadata.mobile,
        bitness: uaMetadata.bitness,
        wow64: uaMetadata.wow64
      }
    });

    console.error('[brave-real-puppeteer-core] Stealth applied to Puppeteer page');
    return true;
  } catch (error) {
    console.error('[brave-real-puppeteer-core] Failed to apply stealth:', error.message);
    return false;
  }
}

/**
 * Apply stealth to a Playwright page - One-liner API
 * @param {Page} page - Playwright page instance
 * @param {Object} options - Stealth options
 * @returns {Promise<void>}
 * 
 * @example
 * import { applyStealthToPlaywright } from 'brave-real-puppeteer-core';
 * const browser = await chromium.launch();
 * const page = await browser.newPage();
 * await applyStealthToPlaywright(page);
 */
export async function applyStealthToPlaywright(page, options = {}) {
  const {
    cdpBypasses = true,
    comprehensiveStealth = true,
    userAgent = null
  } = options;

  try {
    // For Playwright, use addInitScript
    if (cdpBypasses) {
      const cdpScript = getCDPBypassScripts();
      await page.addInitScript(cdpScript);
    }

    if (comprehensiveStealth) {
      const stealthScript = getPlaywrightOptimizedScript(options);
      await page.addInitScript(stealthScript);
    }

    console.error('[brave-real-puppeteer-core] Stealth applied to Playwright page');
    return true;
  } catch (error) {
    console.error('[brave-real-puppeteer-core] Failed to apply stealth:', error.message);
    return false;
  }
}

/**
 * Apply stealth to a Playwright context - For all pages in context
 * @param {BrowserContext} context - Playwright browser context
 * @param {Object} options - Stealth options
 * @returns {Promise<void>}
 */
export async function applyStealthToPlaywrightContext(context, options = {}) {
  const {
    cdpBypasses = true,
    comprehensiveStealth = true
  } = options;

  try {
    if (cdpBypasses) {
      const cdpScript = getCDPBypassScripts();
      await context.addInitScript(cdpScript);
    }

    if (comprehensiveStealth) {
      const stealthScript = getPlaywrightOptimizedScript(options);
      await context.addInitScript(stealthScript);
    }

    console.error('[brave-real-puppeteer-core] Stealth applied to Playwright context');
    return true;
  } catch (error) {
    console.error('[brave-real-puppeteer-core] Failed to apply stealth:', error.message);
    return false;
  }
}

/**
 * Connect to browser with auto-enabled blocker on all pages
 * @param {Object} options - Connection options
 * @param {Object} launchedBrave - LaunchedBrave instance from brave-real-launcher
 * @returns {Promise<{browser: Browser, blocker: BlockerInstance}>}
 */
export async function connectWithBlocker(options = {}, launchedBrave = null) {
  const browser = await puppeteerCore.connect(options);

  // If launchedBrave has blocker, setup ecosystem chain
  if (launchedBrave?.blocker) {
    launchedBrave.setupEcosystemChain?.(browser);

    // Enable blocker on existing pages
    const pages = await browser.pages();
    for (const page of pages) {
      await launchedBrave.enableBlockerOnPage?.(page);
    }
  }

  return {
    browser,
    blocker: launchedBrave?.blocker || null
  };
}
