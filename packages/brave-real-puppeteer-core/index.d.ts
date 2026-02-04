// Re-export everything from puppeteer-core
export * from 'puppeteer-core';
import { PuppeteerNode, Page as PuppeteerPage } from 'puppeteer-core';
declare const puppeteer: PuppeteerNode;
export default puppeteer;

// Stealth Options
export interface StealthOptions {
  /** Enable CDP-level bypasses (Runtime.Enable, sourceURL, etc.) Default: true */
  cdpBypasses?: boolean;
  /** Enable comprehensive JS-level stealth. Default: true */
  comprehensiveStealth?: boolean;
  /** Custom user agent string. Default: auto-generated */
  userAgent?: string | null;
  /** Enable mobile simulation. Default: false */
  mobile?: boolean;
}

// Easy Integration APIs

/**
 * Apply stealth to a Puppeteer page - One-liner API
 * @param page - Puppeteer page instance
 * @param options - Stealth options
 * @returns Promise resolving to true on success
 * 
 * @example
 * import { applyStealthToPuppeteer } from 'brave-real-puppeteer-core';
 * const browser = await puppeteer.launch();
 * const page = await browser.newPage();
 * await applyStealthToPuppeteer(page);
 */
export function applyStealthToPuppeteer(page: PuppeteerPage, options?: StealthOptions): Promise<boolean>;

/**
 * Apply stealth to a Playwright page - One-liner API
 * @param page - Playwright page instance
 * @param options - Stealth options
 * @returns Promise resolving to true on success
 * 
 * @example
 * import { applyStealthToPlaywright } from 'brave-real-puppeteer-core';
 * const browser = await chromium.launch();
 * const page = await browser.newPage();
 * await applyStealthToPlaywright(page);
 */
export function applyStealthToPlaywright(page: any, options?: StealthOptions): Promise<boolean>;

/**
 * Apply stealth to a Playwright browser context - For all pages
 * @param context - Playwright browser context
 * @param options - Stealth options
 */
export function applyStealthToPlaywrightContext(context: any, options?: StealthOptions): Promise<boolean>;

// Stealth Script Generators

/** Get comprehensive stealth script */
export function getComprehensiveStealthScript(): string;

/** Get Puppeteer-optimized stealth script */
export function getPuppeteerOptimizedScript(options?: StealthOptions): string;

/** Get Playwright-optimized stealth script */
export function getPlaywrightOptimizedScript(options?: StealthOptions): string;

/** Get all CDP bypass scripts combined */
export function getCDPBypassScripts(): string;

// Individual CDP Bypass Functions

/** Runtime.Enable bypass - Prevents CDP Runtime.Enable detection */
export function injectRuntimeEnableBypass(): string;

/** Source URL masking - Hides pptr:/playwright: sourceURL comments */
export function injectSourceURLMasking(): string;

/** Console.enable bypass - Masks Console.enable CDP command detection */
export function injectConsoleEnableBypass(): string;

/** ExposeFunction masking - Hides page.exposeFunction bindings */
export function injectExposeFunctionMasking(): string;

/** Utility World Name masking - Hides __puppeteer_utility_world__ */
export function injectUtilityWorldMasking(): string;

// Dynamic Chrome Version

/** Get current Chrome version (auto-synced with Google APIs) */
export function getCurrentChromeVersion(): string;

/** Generate dynamic User-Agent string */
export function getDynamicUserAgent(mobile?: boolean): string;

/** Generate dynamic User-Agent metadata for Client Hints */
export function getDynamicUserAgentMetadata(mobile?: boolean): {
  brands: Array<{ brand: string; version: string }>;
  fullVersionList: Array<{ brand: string; version: string }>;
  platform: string;
  platformVersion: string;
  architecture: string;
  model: string;
  mobile: boolean;
  bitness: string;
  wow64: boolean;
};

// Blocker Integration (from brave-real-launcher)
export function initBlocker(): Promise<any>;
export function getBlocker(): any;
export function createBlockerFactory(): any;
export function autoEnableOnPage(page: any): Promise<void>;
export function createEcosystemChain(browser: any): any;
export const BraveBlocker: any;
export function launch(options?: any): Promise<any>;
export const DEFAULT_FLAGS: string[];
export const BraveLauncher: any;
export function getStealthFlags(): string[];
export function getDynamicUserAgents(): any;

// Connect with Blocker
export function connectWithBlocker(options?: any, launchedBrave?: any): Promise<{
  browser: any;
  blocker: any | null;
}>;
