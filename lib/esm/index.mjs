/**
 * brave-real-browser
 * 
 * Ecosystem Chain (Auto-enabled on all pages):
 *   brave-real-launcher (browser launch + blocker init)
 *       └── brave-real-puppeteer-core (uses launcher)
 *           └── brave-real-browser (top level - you are here)
 * 
 * Blocker is auto-enabled via ecosystem chain from brave-real-launcher
 */

import { launch, DEFAULT_FLAGS } from "brave-real-launcher";
import * as puppeteer from "brave-real-puppeteer-core";
import { pageController } from "./module/pageController.mjs";
import * as fs from 'fs';
import * as path from 'path';

// Load .env file for HEADLESS and other environment variables
function loadEnvFile() {
  const envPaths = [
    path.join(process.cwd(), '.env'),
  ];

  // Try to find project root by looking for .env files up the directory tree
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath) && !envPaths.includes(envPath)) {
      envPaths.push(envPath);
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && !process.env[key]) {
              process.env[key] = value;
            }
          }
        });
        break;
      }
    } catch (error) {
      // Silently ignore .env loading errors
    }
  }
}

// Load .env FIRST before anything else
loadEnvFile();

// Determine headless mode from environment (HEADLESS=true means headless, anything else means GUI)
function getDefaultHeadless() {
  const envHeadless = process.env.HEADLESS?.toLowerCase();
  return envHeadless === 'true';
}

// process.env.REBROWSER_PATCHES_DEBUG=1
export async function connect({
  args = [],
  headless = getDefaultHeadless(), // Now respects .env HEADLESS variable
  customConfig = {},
  proxy = {},
  turnstile = false,
  connectOption = {},
  disableXvfb = false,
  plugins = [],
  ignoreAllFlags = false,
  // New: Blocker options (auto-enabled by default via ecosystem chain)
  enableBlocker = true,
  blockerOptions = {},
} = {}) {


  let braveFlags;
  if (ignoreAllFlags === true) {
    braveFlags = [
      ...args,
      ...(headless !== false ? [`--headless=${headless}`] : []),
      ...(proxy && proxy.host && proxy.port
        ? [`--proxy-server=${proxy.host}:${proxy.port}`]
        : []),
    ];
  } else {
    // Use DEFAULT_FLAGS from brave-real-launcher
    const flags = [...DEFAULT_FLAGS];
    // Add AutomationControlled to "disable-features" flag to improve ReCaptcha V3 score
    const indexDisableFeatures = flags.findIndex((flag) => flag.startsWith('--disable-features'));
    if (indexDisableFeatures !== -1) {
      flags[indexDisableFeatures] = `${flags[indexDisableFeatures]},AutomationControlled`;
    }
    braveFlags = [
      ...flags,
      ...args,
      ...(headless !== false ? [`--headless=${headless}`] : []),
      ...(proxy && proxy.host && proxy.port
        ? [`--proxy-server=${proxy.host}:${proxy.port}`]
        : []),
    ];
  }
  
  /**
   * ECOSYSTEM CHAIN:
   * brave-real-launcher automatically initializes blocker
   * when browser is launched (enableBlocker: true by default)
   * 
   * brave.blocker - Blocker instance from launcher
   * brave.enableBlockerOnPage(page) - Enable blocker on a page
   * brave.setupEcosystemChain(browser) - Setup auto-enable on all new pages
   */
  const brave = await launch({
    ignoreDefaultFlags: true,
    braveFlags,
    // Blocker is auto-enabled via ecosystem chain
    enableBlocker,
    blockerOptions: {
      enableStealth: true,
      enableScriptlets: true,
      ...blockerOptions
    },
    ...customConfig,
  });

  let pextra = null;
  if (plugins.length > 0) {
    const { addExtra } = await import("puppeteer-extra");

    pextra = addExtra(puppeteer);

    for (const item of plugins) {
      pextra.use(item);
    }
  }

  const browser = await (pextra ? pextra : puppeteer).connect({
    browserURL: `http://127.0.0.1:${brave.port}`,
    defaultViewport: null, // Full window content - no viewport restriction
    ...connectOption,
  });

  // Setup ecosystem chain - auto-enable blocker on all new pages
  if (brave.setupEcosystemChain) {
    brave.setupEcosystemChain(browser);
  }

  let [page] = await browser.pages();
  
  // Enable blocker on first page via ecosystem chain
  if (page && brave.enableBlockerOnPage) {
    await brave.enableBlockerOnPage(page);
  }

  let xvfbsession = null;
  let pageControllerConfig = {
    browser,
    page,
    proxy,
    turnstile,
    xvfbsession,
    pid: brave.pid,
    plugins,
  };

  page = await pageController({
    ...pageControllerConfig,
    brave,
    killProcess: true,
  });

  // New pages are auto-enabled via ecosystem chain (setupEcosystemChain above)
  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      let newPage = await target.page();
      // Blocker is already enabled via ecosystem chain
      pageControllerConfig.page = newPage;
      newPage = await pageController(pageControllerConfig);
    }
  });

  return {
    browser,
    page,
    // Expose blocker instance for advanced usage
    blocker: brave.blocker,
  };
}
