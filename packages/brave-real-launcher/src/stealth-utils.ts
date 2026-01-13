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
  // NOTE: We intentionally DO NOT use --disable-popup-blocking
  // This allows the browser's built-in popup blocker to work

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
   * AGGRESSIVE POPUP & REDIRECT BLOCKER for Brave Browser
   * Blocks window.open, click-triggered popups, and redirect hijacking
   */
  popupBlocker: `
    (function() {
      // Store originals
      const originalOpen = window.open.bind(window);
      
      // Track user clicks (only allow popups from genuine user clicks)
      let lastUserClick = 0;
      let clickTarget = null;
      let isUserInteracting = false;
      
      // Block patterns - known ad/popup/redirect domains
      const blockedPatterns = [
        /ad[sx]?\\./, /pop/, /click/, /track/, /beacon/, 
        /affiliate/, /partner/, /promo/, /banner/,
        /about:blank/, /javascript:/, /\\?utm_/, /\\/afu\\//,
        /redirect/, /go\\.php/, /out\\.php/, /link\\.php/
      ];
      
      function isBlockedUrl(url) {
        const urlStr = String(url || '');
        return blockedPatterns.some(p => p.test(urlStr));
      }
      
      function isUserInitiated() {
        return (Date.now() - lastUserClick) < 500;
      }
      
      // Listen for genuine user clicks
      document.addEventListener('click', function(e) {
        lastUserClick = Date.now();
        clickTarget = e.target;
        isUserInteracting = true;
        setTimeout(() => { isUserInteracting = false; }, 500);
      }, true);
      
      // Override window.open to block unwanted popups
      window.open = function(url, name, specs) {
        const urlStr = String(url || '');
        
        // Block if URL matches blocked patterns OR not user-initiated
        if (isBlockedUrl(urlStr) || !isUserInitiated() || (specs && specs.includes('width'))) {
          console.log('[popup-blocker] Blocked popup:', urlStr.substring(0, 60));
          return null;
        }
        return originalOpen(url, name, specs);
      };
      
      // Block onClick handlers that try to open popups
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        if (name.toLowerCase() === 'onclick' && /open\\(|popup|window\\.open/i.test(String(value))) {
          console.log('[popup-blocker] Blocked onclick handler');
          return;
        }
        return originalSetAttribute.call(this, name, value);
      };
      
      // Prevent adding event listeners that open popups
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click' && listener) {
          const wrapped = function(e) {
            // Execute original listener
            const result = listener.apply(this, arguments);
            return result;
          };
          return originalAddEventListener.call(this, type, wrapped, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      // ========== REDIRECT BLOCKING ==========
      
      // Store the current location to detect hijacks
      let legitimateUrl = window.location.href;
      
      // Override location.assign
      const originalAssign = window.location.assign.bind(window.location);
      window.location.assign = function(url) {
        if (isBlockedUrl(url) || !isUserInitiated()) {
          console.log('[popup-blocker] Blocked redirect (assign):', String(url).substring(0, 60));
          return;
        }
        legitimateUrl = url;
        return originalAssign(url);
      };
      
      // Override location.replace
      const originalReplace = window.location.replace.bind(window.location);
      window.location.replace = function(url) {
        if (isBlockedUrl(url) || !isUserInitiated()) {
          console.log('[popup-blocker] Blocked redirect (replace):', String(url).substring(0, 60));
          return;
        }
        legitimateUrl = url;
        return originalReplace(url);
      };
      
      // Intercept location.href setter
      const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location') || {};
      try {
        Object.defineProperty(window, '__location_href_proxy', {
          get: function() { return window.location.href; },
          set: function(url) {
            if (isBlockedUrl(url) || !isUserInitiated()) {
              console.log('[popup-blocker] Blocked redirect (href):', String(url).substring(0, 60));
              return;
            }
            legitimateUrl = url;
            window.location.href = url;
          }
        });
      } catch(e) {}
      
      // Block document.write that creates redirect scripts
      const originalWrite = document.write.bind(document);
      document.write = function(html) {
        const htmlStr = String(html || '');
        if (/location\\.href|window\\.open|redirect/i.test(htmlStr)) {
          console.log('[popup-blocker] Blocked document.write with redirect');
          return;
        }
        return originalWrite(html);
      };
      
      // Block createElement for script injection
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = function(tag) {
        const element = originalCreateElement(tag);
        if (tag.toLowerCase() === 'script') {
          const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
          if (originalSetSrc) {
            Object.defineProperty(element, 'src', {
              set: function(url) {
                if (isBlockedUrl(url)) {
                  console.log('[popup-blocker] Blocked script:', String(url).substring(0, 60));
                  return;
                }
                return originalSetSrc.call(this, url);
              },
              get: function() { return this.getAttribute('src'); }
            });
          }
        }
        return element;
      };
      
      console.log('[popup-blocker] Aggressive popup + redirect blocking enabled');
    })();
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
      this.dimensionsOverride,
      this.popupBlocker  // Include popup blocker in stealth scripts
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
    console.error(`[stealth-utils] Dynamic User-Agents loaded with Chrome ${chromeVersion}`);
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

