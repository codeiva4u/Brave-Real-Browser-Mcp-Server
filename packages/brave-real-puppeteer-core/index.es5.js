/**
 * brave-real-puppeteer-core (ES5 Compatible)
 * Re-exports puppeteer-core with stealth patches applied at install time
 * Compatible with older Node.js environments and bundlers
 * 
 * Ecosystem Chain:
 *   brave-real-browser-mcp-server (top level)
 *       --> brave-real-puppeteer-core (you are here)
 *           --> brave-real-launcher
 *               --> brave-real-blocker (singleton)
 */

'use strict';

// Re-export everything from puppeteer-core
var puppeteerCore = require('puppeteer-core');

// Re-export blocker integration from brave-real-launcher for ecosystem chain
var braveLauncher = require('brave-real-launcher');

/**
 * Connect to browser with auto-enabled blocker on all pages
 * @param {Object} options - Connection options
 * @param {Object} launchedBrave - LaunchedBrave instance from brave-real-launcher
 * @returns {Promise<{browser: Browser, blocker: BlockerInstance}>}
 */
function connectWithBlocker(options, launchedBrave) {
  options = options || {};
  launchedBrave = launchedBrave || null;
  
  return puppeteerCore.connect(options).then(function(browser) {
    // If launchedBrave has blocker, setup ecosystem chain
    if (launchedBrave && launchedBrave.blocker) {
      if (typeof launchedBrave.setupEcosystemChain === 'function') {
        launchedBrave.setupEcosystemChain(browser);
      }
      
      // Enable blocker on existing pages
      return browser.pages().then(function(pages) {
        var enablePromises = pages.map(function(page) {
          if (typeof launchedBrave.enableBlockerOnPage === 'function') {
            return launchedBrave.enableBlockerOnPage(page);
          }
          return Promise.resolve();
        });
        
        return Promise.all(enablePromises).then(function() {
          return {
            browser: browser,
            blocker: launchedBrave.blocker
          };
        });
      });
    }
    
    return {
      browser: browser,
      blocker: null
    };
  });
}

/**
 * Launch browser using brave-real-launcher (ES5 compatible wrapper)
 * @param {Object} options - Launch options
 * @returns {Promise<LaunchedBrave>}
 */
function launch(options) {
  options = options || {};
  return braveLauncher.launch(options);
}

// Export all functions from puppeteer-core
var exports = Object.keys(puppeteerCore).reduce(function(acc, key) {
  acc[key] = puppeteerCore[key];
  return acc;
}, {});

// Add ecosystem chain exports
exports.initBlocker = braveLauncher.initBlocker;
exports.getBlocker = braveLauncher.getBlocker;
exports.createBlockerFactory = braveLauncher.createBlockerFactory;
exports.autoEnableOnPage = braveLauncher.autoEnableOnPage;
exports.createEcosystemChain = braveLauncher.createEcosystemChain;
exports.BraveBlocker = braveLauncher.BraveBlocker;
exports.launch = launch;
exports.DEFAULT_FLAGS = braveLauncher.DEFAULT_FLAGS;
exports.BraveLauncher = braveLauncher.BraveLauncher;
exports.getStealthFlags = braveLauncher.getStealthFlags;
exports.getDynamicUserAgents = braveLauncher.getDynamicUserAgents;
exports.connectWithBlocker = connectWithBlocker;

// Default export for ES5
exports.default = puppeteerCore;

module.exports = exports;
