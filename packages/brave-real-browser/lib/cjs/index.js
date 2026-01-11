let puppeteer = require("brave-real-puppeteer-core");
const { pageController } = require("./module/pageController.js");


async function connect({
  args = [],
  headless = false,
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
    ...customConfig,
  });

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

// Re-export brave-real-puppeteer-core
const puppeteerCore = require("brave-real-puppeteer-core");
module.exports.puppeteerCore = puppeteerCore;
