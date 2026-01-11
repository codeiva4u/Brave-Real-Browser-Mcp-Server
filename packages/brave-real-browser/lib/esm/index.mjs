import { launch, BraveLauncher, DEFAULT_FLAGS } from "brave-real-launcher";
import * as puppeteer from "brave-real-puppeteer-core";
import { pageController } from "./module/pageController.mjs";

// process.env.REBROWSER_PATCHES_DEBUG=1
export async function connect({
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
    brave,
    killProcess: true,
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
