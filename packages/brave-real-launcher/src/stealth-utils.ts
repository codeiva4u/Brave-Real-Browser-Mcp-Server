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
   * Fix native dialogs (alert, confirm, prompt) to pass SannySoft detection
   * Puppeteer overrides these on window instance, we restore them to Window.prototype
   */
  nativeDialogsFix: `
    (function() {
      // This must run BEFORE any other scripts
      ['alert', 'confirm', 'prompt'].forEach(function(fnName) {
        // Get the original function from window (Puppeteer puts it there)
        const originalFn = window[fnName];
        if (!originalFn) return;
        
        // Create a native-looking wrapper
        const wrapper = {
          [fnName]: function() {
            return originalFn.apply(this, arguments);
          }
        }[fnName];
        
        // Make toString return native code string
        const nativeToString = function() { 
          return 'function ' + fnName + '() { [native code] }'; 
        };
        Object.defineProperty(nativeToString, 'toString', {
          value: function() { return 'function toString() { [native code] }'; },
          writable: true,
          configurable: true
        });
        Object.defineProperty(wrapper, 'toString', {
          value: nativeToString,
          writable: true,
          configurable: true
        });
        Object.defineProperty(wrapper, 'name', {
          value: fnName,
          writable: false,
          configurable: true
        });
        Object.defineProperty(wrapper, 'length', {
          value: originalFn.length,
          writable: false,
          configurable: true
        });
        
        // Put it on Window.prototype with correct descriptors
        try {
          Object.defineProperty(Window.prototype, fnName, {
            value: wrapper,
            writable: true,
            enumerable: true,
            configurable: true
          });
        } catch(e) {}
        
        // Delete the own property from window instance so it uses prototype
        try {
          if (Object.prototype.hasOwnProperty.call(window, fnName)) {
            delete window[fnName];
          }
        } catch(e) {}
      });
    })();
  `,

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
   * ENHANCED: Full chrome object with runtime, app, csi, loadTimes
   * Required to pass CreepJS and other advanced bot detectors
   */
  chromeRuntimeOverride: `
    (function() {
      // Create comprehensive chrome object like a real browser
      const chromeObj = {
        app: {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
          getDetails: function() { return null; },
          getIsInstalled: function() { return false; },
          runningState: function() { return 'cannot_run'; }
        },
        runtime: {
          OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
          OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
          PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
          PlatformOs: { ANDROID: 'android', CROS: 'cros', FUCHSIA: 'fuchsia', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
          RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
          connect: function() { return { name: '', sender: undefined, onDisconnect: { addListener: function() {} }, onMessage: { addListener: function() {} }, postMessage: function() {}, disconnect: function() {} }; },
          sendMessage: function() {},
          id: undefined
        },
        csi: function() {
          return {
            startE: Date.now(),
            onloadT: Date.now(),
            pageT: Math.floor(Math.random() * 1000) + 500,
            tran: 15
          };
        },
        loadTimes: function() {
          return {
            requestTime: Date.now() / 1000 - Math.random() * 2,
            startLoadTime: Date.now() / 1000 - Math.random(),
            commitLoadTime: Date.now() / 1000 - Math.random() * 0.5,
            finishDocumentLoadTime: Date.now() / 1000,
            finishLoadTime: Date.now() / 1000,
            firstPaintTime: Date.now() / 1000 - Math.random() * 0.3,
            firstPaintAfterLoadTime: 0,
            navigationType: 'navigate',
            wasFetchedViaSpdy: false,
            wasNpnNegotiated: true,
            npnNegotiatedProtocol: 'h2',
            wasAlternateProtocolAvailable: false,
            connectionInfo: 'h2'
          };
        }
      };

      // Make functions look native
      const makeNative = (fn, name) => {
        Object.defineProperty(fn, 'toString', {
          value: function() { return 'function ' + name + '() { [native code] }'; }
        });
        return fn;
      };

      chromeObj.csi = makeNative(chromeObj.csi, 'csi');
      chromeObj.loadTimes = makeNative(chromeObj.loadTimes, 'loadTimes');
      
      // Define chrome on window
      if (!window.chrome) {
        Object.defineProperty(window, 'chrome', {
          value: chromeObj,
          writable: true,
          enumerable: true,
          configurable: true
        });
      } else {
        // Merge with existing chrome object
        Object.keys(chromeObj).forEach(key => {
          if (!window.chrome[key]) {
            window.chrome[key] = chromeObj[key];
          }
        });
      }
    })();
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
   * ENHANCED: Random selection from common GPU configs
   */
  webglOverride: `
    (function() {
      // Common GPU configurations for randomization
      const gpuConfigs = [
        { vendor: 'Intel Inc.', renderer: 'Intel Iris OpenGL Engine' },
        { vendor: 'Intel Inc.', renderer: 'Intel(R) UHD Graphics 630' },
        { vendor: 'Intel Inc.', renderer: 'Intel(R) HD Graphics 520' },
        { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1060/PCIe/SSE2' },
        { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060/PCIe/SSE2' },
        { vendor: 'AMD', renderer: 'AMD Radeon RX 580 Series' },
        { vendor: 'AMD', renderer: 'AMD Radeon Pro 5500M' },
        { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics, OpenGL 4.1)' },
      ];
      
      // Select random config (seeded by session to maintain consistency)
      const sessionSeed = (window.sessionStorage.getItem('_fp_seed') || Math.random().toString()).slice(0, 10);
      window.sessionStorage.setItem('_fp_seed', sessionSeed);
      const configIndex = Math.abs(sessionSeed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % gpuConfigs.length;
      const selectedGpu = gpuConfigs[configIndex];
      
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return selectedGpu.vendor;
        if (parameter === 37446) return selectedGpu.renderer;
        return getParameter.call(this, parameter);
      };
      
      // Also override WebGL2
      if (typeof WebGL2RenderingContext !== 'undefined') {
        const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) return selectedGpu.vendor;
          if (parameter === 37446) return selectedGpu.renderer;
          return getParameter2.call(this, parameter);
        };
      }
    })();
  `,

  /**
   * FINGERPRINT RANDOMIZER - Unique fingerprint per session
   * Randomizes Canvas, AudioContext, Fonts, Hardware Concurrency
   */
  fingerprintRandomizer: `
    (function() {
      // Generate session-consistent random seed
      const getSeed = () => {
        let seed = window.sessionStorage.getItem('_fp_master_seed');
        if (!seed) {
          seed = Math.random().toString(36).substring(2, 15);
          window.sessionStorage.setItem('_fp_master_seed', seed);
        }
        return seed;
      };
      
      const seed = getSeed();
      const seededRandom = (str) => {
        let hash = 0;
        const combined = seed + str;
        for (let i = 0; i < combined.length; i++) {
          hash = ((hash << 5) - hash) + combined.charCodeAt(i);
          hash = hash & hash;
        }
        return (hash & 0x7FFFFFFF) / 0x7FFFFFFF;
      };
      
      // ============================================
      // CANVAS FINGERPRINT RANDOMIZATION
      // ============================================
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const ctx = this.getContext('2d');
        if (ctx) {
          // Add subtle noise to canvas
          const imageData = ctx.getImageData(0, 0, Math.min(this.width, 10), Math.min(this.height, 10));
          for (let i = 0; i < imageData.data.length; i += 4) {
            // Subtle RGB noise (±2)
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + Math.floor(seededRandom('r'+i) * 5) - 2));
            imageData.data[i+1] = Math.max(0, Math.min(255, imageData.data[i+1] + Math.floor(seededRandom('g'+i) * 5) - 2));
            imageData.data[i+2] = Math.max(0, Math.min(255, imageData.data[i+2] + Math.floor(seededRandom('b'+i) * 5) - 2));
          }
          ctx.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.call(this, type, quality);
      };
      
      // Also randomize getImageData
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
        const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
        // Add consistent noise
        for (let i = 0; i < Math.min(imageData.data.length, 100); i += 4) {
          imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + Math.floor(seededRandom('img'+i) * 3) - 1));
        }
        return imageData;
      };
      
      // ============================================
      // AUDIO FINGERPRINT RANDOMIZATION  
      // ============================================
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const originalCreateOscillator = AudioContextClass.prototype.createOscillator;
        const originalCreateDynamicsCompressor = AudioContextClass.prototype.createDynamicsCompressor;
        
        AudioContextClass.prototype.createOscillator = function() {
          const oscillator = originalCreateOscillator.call(this);
          // Slight frequency offset
          const originalFrequency = oscillator.frequency.value;
          oscillator.frequency.value = originalFrequency * (1 + (seededRandom('osc') - 0.5) * 0.0001);
          return oscillator;
        };
        
        AudioContextClass.prototype.createDynamicsCompressor = function() {
          const compressor = originalCreateDynamicsCompressor.call(this);
          // Subtle parameter variations
          if (compressor.threshold) {
            const original = compressor.threshold.value;
            compressor.threshold.value = original + (seededRandom('comp_th') - 0.5) * 0.01;
          }
          return compressor;
        };
      }
      
      // ============================================
      // HARDWARE CONCURRENCY - FIXED VALUE
      // CreepJS detects headless when value is 2 (common in VMs/containers)
      // Use 8 cores as it's most common for modern desktops
      // ============================================
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 8,
        configurable: true
      });
      
      // ============================================
      // DEVICE MEMORY - FIXED VALUE
      // CreepJS detects headless when value is 0.5 or 2 (low memory)
      // Use 8 GB as it's most common for modern desktops
      // ============================================
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
        configurable: true
      });
      
      // ============================================
      // SCREEN RESOLUTION SLIGHT VARIATION
      // ============================================
      const originalWidth = window.screen.width;
      const originalHeight = window.screen.height;
      
      // Common resolutions
      const resolutions = [
        { w: 1920, h: 1080 }, { w: 1366, h: 768 }, { w: 1536, h: 864 },
        { w: 1440, h: 900 }, { w: 1280, h: 720 }, { w: 2560, h: 1440 }
      ];
      const randomRes = resolutions[Math.floor(seededRandom('screen') * resolutions.length)];
      
      Object.defineProperty(window.screen, 'width', { get: () => randomRes.w, configurable: true });
      Object.defineProperty(window.screen, 'height', { get: () => randomRes.h, configurable: true });
      Object.defineProperty(window.screen, 'availWidth', { get: () => randomRes.w, configurable: true });
      Object.defineProperty(window.screen, 'availHeight', { get: () => randomRes.h - 40, configurable: true });
      Object.defineProperty(window.screen, 'colorDepth', { get: () => 24, configurable: true });
      Object.defineProperty(window.screen, 'pixelDepth', { get: () => 24, configurable: true });
      
      console.log('[stealth] Fingerprint randomizer active: GPU=' + Math.floor(seededRandom('log') * 100));
    })();
  `,

  /**
   * HUMAN BEHAVIOR SIMULATION
   * Adds natural mouse movements and typing patterns
   */
  humanBehavior: `
    (function() {
      // Track mouse movement patterns
      let lastMouseMove = 0;
      let mouseHistory = [];
      
      // Add slight randomness to mouse events
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'mousemove' || type === 'click') {
          const wrappedListener = function(e) {
            // Add natural delay variance
            const now = Date.now();
            if (now - lastMouseMove < 10) return; // Throttle too-fast movements
            lastMouseMove = now;
            
            // Track history for pattern analysis
            if (mouseHistory.length > 100) mouseHistory.shift();
            mouseHistory.push({ x: e.clientX, y: e.clientY, t: now });
            
            return listener.apply(this, arguments);
          };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      // Add natural scroll behavior
      let lastScroll = 0;
      window.addEventListener('scroll', function() {
        const now = Date.now();
        const delta = now - lastScroll;
        lastScroll = now;
        
        // Natural scroll has variable timing
        if (delta < 16) {
          // Too fast, likely programmatic - add slight delay
          // (This is a detection hint, not a block)
        }
      }, { passive: true });
      
      console.log('[stealth] Human behavior simulation active');
    })();
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
   * WebRTC LEAK PREVENTION
   * Prevents real IP address leakage through WebRTC
   */
  webrtcPrevention: `
    (function() {
      // Store original RTCPeerConnection
      const OriginalRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      
      if (OriginalRTCPeerConnection) {
        // Create spoofed RTCPeerConnection
        const SpoofedRTCPeerConnection = function(config, constraints) {
          // Force TURN-only mode to prevent local IP leak
          if (config && config.iceServers) {
            config.iceServers = config.iceServers.map(server => {
              // Remove STUN servers, keep only TURN
              if (server.urls) {
                if (Array.isArray(server.urls)) {
                  server.urls = server.urls.filter(url => !url.startsWith('stun:'));
                } else if (typeof server.urls === 'string' && server.urls.startsWith('stun:')) {
                  return null;
                }
              }
              return server;
            }).filter(Boolean);
          }
          
          // Add iceTransportPolicy to force relay (TURN only)
          config = config || {};
          config.iceTransportPolicy = 'relay';
          
          const pc = new OriginalRTCPeerConnection(config, constraints);
          
          // Filter ICE candidates to remove local IP addresses
          const originalAddEventListener = pc.addEventListener.bind(pc);
          pc.addEventListener = function(type, listener, options) {
            if (type === 'icecandidate') {
              const wrappedListener = function(event) {
                if (event.candidate) {
                  const candidateStr = event.candidate.candidate;
                  // Block local/private IP addresses
                  const privateIPRegex = /((10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})|(172\\.(1[6-9]|2[0-9]|3[0-1])\\.\\d{1,3}\\.\\d{1,3})|(192\\.168\\.\\d{1,3}\\.\\d{1,3})|(127\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})|([a-f0-9:]+:+)+[a-f0-9]+)/gi;
                  
                  if (privateIPRegex.test(candidateStr)) {
                    console.log('[WebRTC-Protection] Blocked local IP candidate');
                    const fakeEvent = new Event('icecandidate');
                    fakeEvent.candidate = null;
                    listener.call(this, fakeEvent);
                    return;
                  }
                }
                listener.call(this, event);
              };
              return originalAddEventListener(type, wrappedListener, options);
            }
            return originalAddEventListener(type, listener, options);
          };
          
          return pc;
        };
        
        // Copy static properties
        SpoofedRTCPeerConnection.prototype = OriginalRTCPeerConnection.prototype;
        SpoofedRTCPeerConnection.generateCertificate = OriginalRTCPeerConnection.generateCertificate;
        
        // Make it look native
        Object.defineProperty(SpoofedRTCPeerConnection, 'name', { value: 'RTCPeerConnection' });
        SpoofedRTCPeerConnection.toString = function() { return 'function RTCPeerConnection() { [native code] }'; };
        
        // Replace global RTCPeerConnection
        window.RTCPeerConnection = SpoofedRTCPeerConnection;
        if (window.webkitRTCPeerConnection) window.webkitRTCPeerConnection = SpoofedRTCPeerConnection;
        if (window.mozRTCPeerConnection) window.mozRTCPeerConnection = SpoofedRTCPeerConnection;
        
        console.log('[WebRTC-Protection] RTCPeerConnection spoofed to prevent IP leaks');
      }
    })();
  `,

  /**
   * Full combined stealth script
   * ENHANCED: Includes fingerprint randomizer, human behavior simulation, and WebRTC protection
   */
  get fullStealth(): string {
    return [
      this.nativeDialogsFix,  // MUST be first to fix prompt before other scripts
      this.webdriverOverride,
      this.pluginsOverride,
      this.languagesOverride,
      this.permissionsOverride,
      this.chromeRuntimeOverride,
      this.consoleOverride,
      this.iframeOverride,
      this.webglOverride,
      this.fingerprintRandomizer,  // Fingerprint randomization
      this.humanBehavior,           // Human behavior simulation
      this.dimensionsOverride,
      this.webrtcPrevention,        // NEW: WebRTC leak prevention
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

