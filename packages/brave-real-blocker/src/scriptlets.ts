import { Page } from 'brave-real-puppeteer-core';

/**
 * AGGRESSIVE AD BLOCKING SCRIPTLETS
 * Blocks: window.open popups, location redirects, overlay ads, click hijacking
 */
export async function injectScriptlets(page: Page) {
    // Use CDP for earliest injection
    const client = await page.target().createCDPSession();
    await client.send('Page.enable');
    
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
(function() {
    'use strict';
    
    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        // Time window after user interaction to allow popups (ms)
        POPUP_GRACE_PERIOD: 500,
        // Minimum time between popups (ms)
        POPUP_COOLDOWN: 1000,
        // Maximum popups per page session
        MAX_POPUPS_PER_SESSION: 3,
        // Block these URL patterns
        BLOCKED_URL_PATTERNS: [
            /ads?\\./i, /pop(up|under)?\\./i, /click\\./i, /track(er|ing)?\\./i,
            /beacon\\./i, /affiliate/i, /partner\\./i, /promo\\./i, /banner/i,
            /about:blank/, /javascript:/i, /\\?utm_/i, /\\/afu\\//i,
            /redirect/i, /go\\.php/i, /out\\.php/i, /link\\.php/i,
            /profitableratecpm/i, /engridfanlike/i, /pubfuture/i,
            /clickadu/i, /propellerads/i, /popads/i, /popcash/i,
            /adcash/i, /exoclick/i, /ExoLoader/i, /PopMagic/i
        ]
    };
    
    // ==========================================
    // STATE TRACKING
    // ==========================================
    let lastUserInteraction = 0;
    let lastPopupTime = 0;
    let popupCount = 0;
    let isUserInteracting = false;
    
    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    function isBlockedUrl(url) {
        if (!url) return true;
        const urlStr = String(url);
        return CONFIG.BLOCKED_URL_PATTERNS.some(pattern => pattern.test(urlStr));
    }
    
    function isUserInitiated() {
        return (Date.now() - lastUserInteraction) < CONFIG.POPUP_GRACE_PERIOD;
    }
    
    function canOpenPopup() {
        const now = Date.now();
        if (now - lastPopupTime < CONFIG.POPUP_COOLDOWN) return false;
        if (popupCount >= CONFIG.MAX_POPUPS_PER_SESSION) return false;
        return true;
    }
    
    function makeNative(fn, name) {
        const nativeToString = function() { return 'function ' + name + '() { [native code] }'; };
        Object.defineProperty(fn, 'toString', { value: nativeToString });
        Object.defineProperty(fn, 'name', { value: name, configurable: true });
        return fn;
    }
    
    // ==========================================
    // USER INTERACTION TRACKING
    // ==========================================
    ['click', 'keydown', 'mousedown', 'touchstart', 'pointerdown'].forEach(event => {
        document.addEventListener(event, function(e) {
            // Only count as interaction if it's a trusted event
            if (e.isTrusted) {
                lastUserInteraction = Date.now();
                isUserInteracting = true;
                setTimeout(() => { isUserInteracting = false; }, CONFIG.POPUP_GRACE_PERIOD);
            }
        }, { capture: true, passive: true });
    });
    
    // ==========================================
    // WINDOW.OPEN BLOCKING
    // ==========================================
    const originalOpen = window.open;
    window.open = makeNative(function(url, target, features) {
        const urlStr = String(url || '');
        
        // Block if URL matches blocked patterns
        if (isBlockedUrl(urlStr)) {
            console.log('[AdBlocker] Blocked popup (bad URL):', urlStr.substring(0, 60));
            return null;
        }
        
        // Block if not user-initiated
        if (!isUserInitiated()) {
            console.log('[AdBlocker] Blocked popup (no user interaction):', urlStr.substring(0, 60));
            return null;
        }
        
        // Block if too many popups
        if (!canOpenPopup()) {
            console.log('[AdBlocker] Blocked popup (rate limit):', urlStr.substring(0, 60));
            return null;
        }
        
        // Block if has popup window features (sized windows = ads)
        if (features && (features.includes('width') || features.includes('height'))) {
            console.log('[AdBlocker] Blocked popup (window features):', urlStr.substring(0, 60));
            return null;
        }
        
        // Allow legitimate popup
        lastPopupTime = Date.now();
        popupCount++;
        return originalOpen.call(this, url, target, features);
    }, 'open');
    
    // ==========================================
    // LOCATION.HREF REDIRECT BLOCKING
    // ==========================================
    const locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    let legitimateUrl = window.location.href;
    
    // Intercept location.assign
    const originalAssign = window.location.assign.bind(window.location);
    window.location.assign = makeNative(function(url) {
        if (isBlockedUrl(url) || !isUserInitiated()) {
            console.log('[AdBlocker] Blocked redirect (assign):', String(url).substring(0, 60));
            return;
        }
        return originalAssign(url);
    }, 'assign');
    
    // Intercept location.replace
    const originalReplace = window.location.replace.bind(window.location);
    window.location.replace = makeNative(function(url) {
        if (isBlockedUrl(url) || !isUserInitiated()) {
            console.log('[AdBlocker] Blocked redirect (replace):', String(url).substring(0, 60));
            return;
        }
        return originalReplace(url);
    }, 'replace');
    
    // ==========================================
    // SETTIMEOUT/SETINTERVAL REDIRECT BLOCKING
    // ==========================================
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = makeNative(function(callback, delay, ...args) {
        // Check if callback contains redirect code
        if (typeof callback === 'string') {
            const code = callback.toLowerCase();
            if (code.includes('location') || code.includes('redirect') || code.includes('window.open')) {
                console.log('[AdBlocker] Blocked setTimeout redirect');
                return 0;
            }
        }
        return originalSetTimeout.call(this, callback, delay, ...args);
    }, 'setTimeout');
    
    const originalSetInterval = window.setInterval;
    window.setInterval = makeNative(function(callback, delay, ...args) {
        if (typeof callback === 'string') {
            const code = callback.toLowerCase();
            if (code.includes('location') || code.includes('redirect') || code.includes('window.open')) {
                console.log('[AdBlocker] Blocked setInterval redirect');
                return 0;
            }
        }
        return originalSetInterval.call(this, callback, delay, ...args);
    }, 'setInterval');
    
    // ==========================================
    // DOCUMENT.WRITE BLOCKING (AD INJECTION)
    // ==========================================
    const originalWrite = document.write.bind(document);
    document.write = makeNative(function(html) {
        const htmlStr = String(html || '').toLowerCase();
        if (htmlStr.includes('location.href') || 
            htmlStr.includes('window.open') || 
            htmlStr.includes('redirect') ||
            htmlStr.includes('popunder') ||
            htmlStr.includes('exoclick') ||
            htmlStr.includes('popads')) {
            console.log('[AdBlocker] Blocked document.write ad injection');
            return;
        }
        return originalWrite(html);
    }, 'write');
    
    // ==========================================
    // ADDEVENTLISTENER CLICK HIJACK BLOCKING
    // ==========================================
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        // Block suspicious click handlers on body/document
        if (type === 'click' && (this === document || this === document.body || this === window)) {
            const listenerStr = listener ? listener.toString().toLowerCase() : '';
            if (listenerStr.includes('window.open') || 
                listenerStr.includes('location') ||
                listenerStr.includes('popup') ||
                listenerStr.includes('redirect')) {
                console.log('[AdBlocker] Blocked click hijack listener');
                return;
            }
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // ==========================================
    // ABORT ON PROPERTY WRITE (POPUNDER SCRIPTS)
    // ==========================================
    const ABORT_PROPERTIES = ['popunder', '__$pb', 'ExoLoader', 'PopMagic', 'Fingerprint2', 'adblock', 'popMagic'];
    
    ABORT_PROPERTIES.forEach(prop => {
        try {
            Object.defineProperty(window, prop, {
                get: function() { return undefined; },
                set: function(val) {
                    console.log('[AdBlocker] Blocked property set:', prop);
                    return true;
                },
                configurable: false
            });
        } catch(e) {}
    });
    
    // ==========================================
    // EVAL BLOCKING FOR AD CODE
    // ==========================================
    const originalEval = window.eval;
    window.eval = makeNative(function(code) {
        if (typeof code === 'string') {
            const codeLower = code.toLowerCase();
            if (codeLower.includes('popup') || 
                codeLower.includes('popunder') ||
                codeLower.includes('redirect') ||
                codeLower.includes('exoclick') ||
                codeLower.includes('popads')) {
                console.log('[AdBlocker] Blocked eval ad code');
                return undefined;
            }
        }
        return originalEval.call(this, code);
    }, 'eval');
    
    console.log('[AdBlocker] Scriptlet injection active');
})();
        `
    });
    
    // Also inject via evaluateOnNewDocument for redundancy
    await page.evaluateOnNewDocument(() => {
        // Mark that blocker is active
        (window as any).__braveBlockerActive = true;
    });
}
