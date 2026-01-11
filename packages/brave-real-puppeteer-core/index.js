/**
 * brave-real-puppeteer-core
 * Re-exports puppeteer-core with stealth patches applied at install time
 */

// Re-export everything from puppeteer-core
export * from 'puppeteer-core';

// Import and re-export default
import puppeteerCore from 'puppeteer-core';
export default puppeteerCore;
