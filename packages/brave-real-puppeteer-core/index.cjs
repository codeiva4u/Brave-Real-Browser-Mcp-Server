/**
 * brave-real-puppeteer-core (CommonJS)
 * Re-exports puppeteer-core with stealth patches applied at install time
 * 
 * Ecosystem Chain:
 *   brave-real-launcher (browser launch + blocker init)
 *       └── brave-real-puppeteer-core (uses launcher + auto-enable blocker)
 *           └── brave-real-browser (top level)
 */

// Re-export everything from puppeteer-core
const puppeteerCore = require('puppeteer-core');

// Re-export blocker integration from brave-real-launcher for ecosystem chain
const braveLauncher = require('brave-real-launcher');

/**
 * Connect to browser with auto-enabled blocker on all pages
 * @param {Object} options - Connection options
 * @param {Object} launchedBrave - LaunchedBrave instance from brave-real-launcher
 * @returns {Promise<{browser: Browser, blocker: BlockerInstance}>}
 */
async function connectWithBlocker(options = {}, launchedBrave = null) {
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

module.exports = {
  ...puppeteerCore,
  // Ecosystem chain exports
  initBlocker: braveLauncher.initBlocker,
  getBlocker: braveLauncher.getBlocker,
  createBlockerFactory: braveLauncher.createBlockerFactory,
  autoEnableOnPage: braveLauncher.autoEnableOnPage,
  createEcosystemChain: braveLauncher.createEcosystemChain,
  BraveBlocker: braveLauncher.BraveBlocker,
  launch: braveLauncher.launch,
  DEFAULT_FLAGS: braveLauncher.DEFAULT_FLAGS,
  BraveLauncher: braveLauncher.BraveLauncher,
  getStealthFlags: braveLauncher.getStealthFlags,
  getDynamicUserAgents: braveLauncher.getDynamicUserAgents,
  connectWithBlocker
};
