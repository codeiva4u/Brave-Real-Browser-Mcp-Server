// brave-real-puppeteer-core patches puppeteer-core at install time
// So we require the patched puppeteer-core directly
let puppeteer = require("puppeteer-core");
const { BraveBlocker } = require("brave-real-blocker");
const { pageController } = require("./module/pageController.js");
const fs = require('fs');
const path = require('path');

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
  const envHeadless = (process.env.HEADLESS || '').toLowerCase();
  return envHeadless === 'true';
}

async function connect({
  args = [],
  headless = getDefaultHeadless(), // Now respects .env HEADLESS variable
  customConfig = {},
  proxy = {},
  turnstile = false,
  connectOption = {},
  disableXvfb = false,
  plugins = [],
  ignoreAllFlags = false,
} = {}) {
  const { launch, BraveLauncher, DEFAULT_FLAGS } = await import("brave-real-launcher");



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
  const brave = await launch({
    ignoreDefaultFlags: true,
    braveFlags,
    braveFlags,
    ...customConfig,
  });

  const braveBlocker = new BraveBlocker({
    enableStealth: true,
    enableScriptlets: true
  });
  await braveBlocker.init();

  if (plugins.length > 0) {
    const { addExtra } = await import("puppeteer-extra");

    puppeteer = addExtra(puppeteer);

    for (const item of plugins) {
      puppeteer.use(item);
    }
  }

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${brave.port}`,
    defaultViewport: null, // Full window content - no viewport restriction
    ...connectOption,
  });

  let [page] = await browser.pages();
  if (page) await braveBlocker.enable(page);

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
    killProcess: true,
    brave,
  });

  browser.on("targetcreated", async (target) => {
    if (target.type() === "page") {
      let newPage = await target.page();
      if (newPage) await braveBlocker.enable(newPage);
      pageControllerConfig.page = newPage;
      newPage = await pageController(pageControllerConfig);
    }
  });

  return {
    browser,
    page,
  };
}

module.exports = { connect };

// ============================================
// 🦁 Feature Re-Exports for Monorepo
// ============================================
// Re-export from dependencies for convenience

// Re-export brave-real-launcher
const launcher = require("brave-real-launcher");
module.exports.launcher = launcher;
module.exports.launch = launcher.launch;
module.exports.killAll = launcher.killAll;
module.exports.getBravePath = launcher.getBravePath;
module.exports.DEFAULT_FLAGS = launcher.DEFAULT_FLAGS;

// Note: brave-real-puppeteer-core is a CLI patcher tool, not a library
// It patches puppeteer-core at npm install time, not at runtime

