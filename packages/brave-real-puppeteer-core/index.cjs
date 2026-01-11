/**
 * brave-real-puppeteer-core (CommonJS)
 * Re-exports puppeteer-core with stealth patches applied at install time
 */

// Re-export everything from puppeteer-core
const puppeteerCore = require('puppeteer-core');
module.exports = puppeteerCore;
