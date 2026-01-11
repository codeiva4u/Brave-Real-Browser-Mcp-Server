/**
 * @license Copyright 2024 Brave Real Launcher Contributors.
 * Licensed under the Apache License, Version 2.0
 * 
 * Stealth Utilities for Brave Real Launcher
 * Provides anti-bot-detection capabilities
 */
'use strict';

/**
 * Stealth flags to add to browser launch
 * These help bypass basic bot detection
 */
export const STEALTH_FLAGS: ReadonlyArray<string> = [

  // Disable popup blocking
  '--disable-popup-blocking',

  // Disable password save prompt
  '--disable-save-password-bubble',

  // Disable first run welcome
  '--no-first-run',

  // Disable default browser check
  '--no-default-browser-check',

  // Notifications disable
  '--disable-notifications',
];

/**
 * JavaScript code to inject for stealth mode
 * Overrides various navigator properties that are commonly checked by bot detectors
 */
export const STEALTH_SCRIPTS = {
  /**
   * Override navigator.webdriver to return undefined
   */
  webdriverOverride: `
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
      configurable: true
    });
  `,

  /**
   * Override navigator.plugins to return realistic plugins
   */
  pluginsOverride: `
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const plugins = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' }
        ];
        plugins.length = 3;
        return plugins;
      },
      configurable: true
    });
  `,

  /**
   * Override navigator.languages
   */
  languagesOverride: `
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
      configurable: true
    });
  `,

  /**
   * Override permissions query for notifications
   */
  permissionsOverride: `
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  `,

  /**
   * Override chrome.runtime to appear as a regular browser
   */
  chromeRuntimeOverride: `
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  `,

  /**
   * Override console.debug to prevent detection
   */
  consoleOverride: `
    const originalDebug = console.debug;
    console.debug = function(...args) {
      if (args[0] && args[0].includes && args[0].includes('puppeteer')) {
        return;
      }
      return originalDebug.apply(console, args);
    };
  `,

  /**
   * Fix iframe contentWindow access
   */
  iframeOverride: `
    const originalContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: function() {
        const window = originalContentWindow.get.call(this);
        try {
          if (window && window.navigator) {
            Object.defineProperty(window.navigator, 'webdriver', {
              get: () => undefined
            });
          }
        } catch (e) {}
        return window;
      }
    });
  `,

  /**
   * Override WebGL vendor and renderer
   */
  webglOverride: `
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.call(this, parameter);
    };
  `,

  /**
   * Override outerWidth and outerHeight
   */
  dimensionsOverride: `
    Object.defineProperty(window, 'outerWidth', {
      get: () => window.innerWidth
    });
    Object.defineProperty(window, 'outerHeight', {
      get: () => window.innerHeight + 85
    });
  `,

  /**
   * Full combined stealth script
   */
  get fullStealth(): string {
    return [
      this.webdriverOverride,
      this.pluginsOverride,
      this.languagesOverride,
      this.permissionsOverride,
      this.chromeRuntimeOverride,
      this.consoleOverride,
      this.iframeOverride,
      this.webglOverride,
      this.dimensionsOverride
    ].join('\n');
  }
};

import {
  getLatestChromeVersion,
  generateUserAgent,
  generateUserAgentMac,
  generateUserAgentLinux,
  getUserAgentForPlatform,
  FALLBACK_VERSION
} from './chrome-version.js';

// Re-export chrome-version functions for convenience
export {
  getLatestChromeVersion,
  generateUserAgent,
  generateUserAgentMac,
  generateUserAgentLinux,
  getUserAgentForPlatform,
  FALLBACK_VERSION
};

/**
 * User agent strings for different platforms
 * Uses dynamic Chrome version with fallback
 */
export const USER_AGENTS = {
  get windows(): string {
    return generateUserAgent(FALLBACK_VERSION, false);
  },
  get macos(): string {
    return generateUserAgentMac(FALLBACK_VERSION);
  },
  get linux(): string {
    return generateUserAgentLinux(FALLBACK_VERSION);
  },

  /**
   * Get user agent for current platform (sync version with fallback)
   */
  get current(): string {
    return getUserAgentForPlatform(FALLBACK_VERSION);
  }
};

// Cached dynamic user agents
let cachedDynamicUserAgents: { windows: string; macos: string; linux: string; current: string } | null = null;

/**
 * Get user agents with dynamic Chrome version (async)
 * Fetches latest Chrome version from Google APIs
 */
export async function getDynamicUserAgents(): Promise<{ windows: string; macos: string; linux: string; current: string }> {
  if (!cachedDynamicUserAgents) {
    const chromeVersion = await getLatestChromeVersion();
    cachedDynamicUserAgents = {
      windows: generateUserAgent(chromeVersion, false),
      macos: generateUserAgentMac(chromeVersion),
      linux: generateUserAgentLinux(chromeVersion),
      current: getUserAgentForPlatform(chromeVersion)
    };
    console.log(`[stealth-utils] Dynamic User-Agents loaded with Chrome ${chromeVersion}`);
  }
  return cachedDynamicUserAgents;
}

/**
 * Get stealth flags with optional custom user agent
 */
export function getStealthFlags(userAgent?: string): string[] {
  const flags = [...STEALTH_FLAGS];

  if (userAgent) {
    flags.push(`--user-agent=${userAgent}`);
  } else {
    flags.push(`--user-agent=${USER_AGENTS.current}`);
  }

  return flags;
}

/**
 * Get stealth flags with dynamic Chrome version (async)
 * Fetches latest Chrome version from Google APIs
 */
export async function getDynamicStealthFlags(userAgent?: string): Promise<string[]> {
  const flags = [...STEALTH_FLAGS];

  if (userAgent) {
    flags.push(`--user-agent=${userAgent}`);
  } else {
    const dynamicAgents = await getDynamicUserAgents();
    flags.push(`--user-agent=${dynamicAgents.current}`);
  }

  return flags;
}

/**
 * Get the full stealth injection script
 */
export function getStealthScript(): string {
  return STEALTH_SCRIPTS.fullStealth;
}

export default {
  STEALTH_FLAGS,
  STEALTH_SCRIPTS,
  USER_AGENTS,
  getStealthFlags,
  getDynamicStealthFlags,
  getDynamicUserAgents,
  getStealthScript,
  getLatestChromeVersion,
  generateUserAgent,
  FALLBACK_VERSION
};

