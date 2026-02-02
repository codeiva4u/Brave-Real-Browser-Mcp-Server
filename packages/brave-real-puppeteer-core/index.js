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
