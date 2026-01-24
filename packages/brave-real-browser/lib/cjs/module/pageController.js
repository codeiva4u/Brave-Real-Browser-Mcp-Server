const { createCursor } = require('ghost-cursor');
const { checkTurnstile } = require('./turnstile.js');
const kill = require('tree-kill');

async function pageController({ browser, page, proxy, turnstile, xvfbsession, pid, plugins, killProcess = false, brave }) {

    let solveStatus = turnstile

    page.on('close', () => {
        solveStatus = false
    });


    browser.on('disconnected', async () => {
        solveStatus = false
        if (killProcess === true) {
            if (xvfbsession) try { xvfbsession.stopSync() } catch (err) { }
            if (brave) try { brave.kill() } catch (err) { console.error(err); }
            if (pid) try { kill(pid, 'SIGKILL', () => { }) } catch (err) { }
        }
    });

    async function turnstileSolver() {
        while (solveStatus) {
            await checkTurnstile({ page }).catch(() => { });
            await new Promise(r => setTimeout(r, 1000));
        }
        return
    }

    turnstileSolver()

    if (proxy.username && proxy.password) await page.authenticate({ username: proxy.username, password: proxy.password });

    if (plugins.length > 0) {
        for (const plugin of plugins) {
            plugin.onPageCreated(page)
        }
    }

    // === POPUP AD BLOCKING ===
    // Block click-triggered popups by intercepting new page creation
    browser.on('targetcreated', async (target) => {
        try {
            if (target.type() === 'page') {
                const newPage = await target.page();
                if (newPage) {
                    const opener = await newPage.opener();
                    // If this page was opened by another page (popup), close it
                    if (opener) {
                        const url = newPage.url();
                        // Check if it's likely an ad popup
                        const isAdPopup = url === 'about:blank' ||
                            url.includes('ad') ||
                            url.includes('pop') ||
                            url.includes('click') ||
                            url.includes('redirect') ||
                            url.includes('track');
                        if (isAdPopup) {
                            await newPage.close().catch(() => { });
                            console.log('[popup-blocker] Blocked popup ad:', url.substring(0, 50));
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore errors during popup blocking
        }
    });

    // === AGGRESSIVE STEALTH + POPUP BLOCKER ===
    // Use CDP for earliest possible injection
    const client = await page.target().createCDPSession();
    await client.send('Page.enable');

    // Inject ALL critical stealth fixes via CDP - runs BEFORE Brave Shields
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
            (function() {
                // ========== PERMANENT FINGERPRINT FIX ==========
                // Brave Shields aggressively overrides values, so we need persistent fix
                const NavigatorProto = Object.getPrototypeOf(navigator);
                const FIXED_VALUES = { hardwareConcurrency: 8, deviceMemory: 8 };
                
                // Create permanent getter that cannot be easily overridden
                const createPermanentGetter = (proto, prop, value) => {
                    try {
                        Object.defineProperty(proto, prop, {
                            get: function() { return value; },
                            set: function() { return value; },
                            enumerable: true,
                            configurable: true
                        });
                    } catch(e) {}
                };
                
                function applyFingerprintFixes() {
                    createPermanentGetter(NavigatorProto, 'hardwareConcurrency', FIXED_VALUES.hardwareConcurrency);
                    createPermanentGetter(NavigatorProto, 'deviceMemory', FIXED_VALUES.deviceMemory);
                }
                
                // Apply immediately and with multiple timings
                applyFingerprintFixes();
                [0, 1, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].forEach(ms => setTimeout(applyFingerprintFixes, ms));
                
                // Continuous watchdog - reapply every 100ms for first 5 seconds
                let watchdogCount = 0;
                const watchdog = setInterval(() => {
                    applyFingerprintFixes();
                    watchdogCount++;
                    if (watchdogCount > 50) clearInterval(watchdog); // Stop after 5 seconds
                }, 100);
                
                // Also apply on DOM events
                document.addEventListener('DOMContentLoaded', applyFingerprintFixes);
                window.addEventListener('load', applyFingerprintFixes);
                
                // ========== CHROME RUNTIME FIX (CRITICAL for CreepJS) ==========
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
                    csi: function() { return { startE: Date.now(), onloadT: Date.now(), pageT: 500 + Math.floor(Math.random() * 500), tran: 15 }; },
                    loadTimes: function() { return { requestTime: Date.now()/1000-1, startLoadTime: Date.now()/1000-0.5, commitLoadTime: Date.now()/1000-0.3, finishDocumentLoadTime: Date.now()/1000, finishLoadTime: Date.now()/1000, firstPaintTime: Date.now()/1000-0.2, firstPaintAfterLoadTime: 0, navigationType: 'navigate', wasFetchedViaSpdy: false, wasNpnNegotiated: true, npnNegotiatedProtocol: 'h2', wasAlternateProtocolAvailable: false, connectionInfo: 'h2' }; }
                };
                const makeNative = (fn, name) => { Object.defineProperty(fn, 'toString', { value: function() { return 'function ' + name + '() { [native code] }'; } }); return fn; };
                chromeObj.csi = makeNative(chromeObj.csi, 'csi');
                chromeObj.loadTimes = makeNative(chromeObj.loadTimes, 'loadTimes');
                
                // Chrome fix function for watchdog
                function applyChromeFixes() {
                    try {
                        if (!window.chrome) {
                            Object.defineProperty(window, 'chrome', { value: chromeObj, writable: true, enumerable: true, configurable: true });
                        } else {
                            // Force merge - especially runtime which may be undefined or empty object
                            Object.keys(chromeObj).forEach(key => { 
                                const currentVal = window.chrome[key];
                                const needsFix = currentVal === undefined || 
                                                 currentVal === null || 
                                                 (typeof currentVal === 'object' && currentVal !== null && Object.keys(currentVal).length === 0);
                                if (needsFix) {
                                    try { window.chrome[key] = chromeObj[key]; } catch(e) {}
                                }
                            });
                        }
                    } catch(e) {}
                }
                
                // Apply chrome fixes with watchdog timing
                applyChromeFixes();
                setTimeout(applyChromeFixes, 0);
                setTimeout(applyChromeFixes, 10);
                setTimeout(applyChromeFixes, 50);
                setTimeout(applyChromeFixes, 100);
                setTimeout(applyChromeFixes, 500);
                document.addEventListener('DOMContentLoaded', applyChromeFixes);
                window.addEventListener('load', applyChromeFixes);
                
                // ========== CONNECTION API FIX ==========
                if (!navigator.connection) {
                    Object.defineProperty(navigator, 'connection', {
                        get: () => ({
                            rtt: 50 + Math.floor(Math.random() * 100),
                            downlink: 1.5 + Math.random() * 8,
                            effectiveType: '4g',
                            saveData: false,
                            type: 'wifi',
                            addEventListener: function() {},
                            removeEventListener: function() {},
                            dispatchEvent: function() { return true; }
                        }),
                        configurable: false
                    });
                }
                
                // ========== DOCUMENT FOCUS FIX ==========
                document.hasFocus = function() { return true; };
                
                // ========== WEBDRIVER FIX (SannySoft Bot Detection) ==========
                // Must DELETE the property, not just return undefined
                // lodash _.has() checks property existence, not value
                try {
                    delete Object.getPrototypeOf(navigator).webdriver;
                } catch(e) {}
                try {
                    delete navigator.webdriver;
                } catch(e) {}
                // Fallback: redefine as non-existent getter that also removes from enumeration
                Object.defineProperty(navigator, 'webdriver', { 
                    get: () => undefined, 
                    configurable: true,
                    enumerable: false 
                });
                // Override hasOwnProperty check for webdriver
                const origHasOwn = Object.prototype.hasOwnProperty;
                Object.prototype.hasOwnProperty = function(prop) {
                    if (this === navigator && prop === 'webdriver') return false;
                    return origHasOwn.call(this, prop);
                };
                
                // ========== NOTIFICATION PERMISSION FIX (SannySoft Bot Detection) ==========
                // Spoof Notification.permission to 'default' (matches fresh browser)
                // SannySoft checks: if (Notification.permission === 'denied' && permissionStatus.state === 'prompt') -> FAIL
                // If Notification doesn't exist, create a fake one to prevent ReferenceError
                try {
                    if (typeof Notification === 'undefined') {
                        // Create a fake Notification class
                        window.Notification = function() {};
                        window.Notification.permission = 'default';
                        window.Notification.requestPermission = function() {
                            return Promise.resolve('default');
                        };
                    } else {
                        // Spoof existing Notification.permission
                        Object.defineProperty(Notification, 'permission', {
                            get: function() { return 'default'; },
                            configurable: true,
                            enumerable: true
                        });
                    }
                } catch(e) {}
                
                // ========== PERMISSIONS API FIX (SannySoft Bot Detection) ==========
                // Real browsers return 'prompt' for notifications, not 'granted'
                try {
                    const originalQuery = navigator.permissions.query.bind(navigator.permissions);
                    const makeNativeQuery = (fn) => {
                        Object.defineProperty(fn, 'toString', {
                            value: function() { return 'function query() { [native code] }'; }
                        });
                        Object.defineProperty(fn, 'name', { value: 'query' });
                        return fn;
                    };
                    
                    navigator.permissions.query = makeNativeQuery(function(permissionDesc) {
                        return originalQuery(permissionDesc).then(function(status) {
                            // For notifications, return 'prompt' instead of 'granted' (matches real browser)
                            if (permissionDesc && permissionDesc.name === 'notifications') {
                                return Object.create(status, {
                                    state: {
                                        get: function() { return 'prompt'; },
                                        enumerable: true,
                                        configurable: true
                                    },
                                    onchange: {
                                        get: function() { return null; },
                                        set: function() {},
                                        enumerable: true,
                                        configurable: true
                                    }
                                });
                            }
                            return status;
                        });
                    });
                } catch(e) {}
                
                // ========== NATIVE DIALOGS FIX ==========
                ['alert', 'confirm', 'prompt'].forEach(function(fnName) {
                    const originalFn = window[fnName];
                    if (!originalFn) return;
                    
                    const wrapper = {
                        [fnName]: function() {
                            return originalFn.apply(this, arguments);
                        }
                    }[fnName];
                    
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
                    
                    try {
                        Object.defineProperty(Window.prototype, fnName, {
                            value: wrapper,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });
                    } catch(e) {}
                    
                    try {
                        if (Object.prototype.hasOwnProperty.call(window, fnName)) {
                            delete window[fnName];
                        }
                    } catch(e) {}
                });
            })();
        `
    });

    await page.evaluateOnNewDocument(() => {
        // ========== HARDWARE CONCURRENCY & DEVICE MEMORY FIX ==========
        // Must be even number (4, 8, 12, 16)
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 8,
            configurable: true
        });
        
        // Device memory should be 4, 8, or 16 GB
        if ('deviceMemory' in navigator) {
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => 8,
                configurable: true
            });
        }
        
        // ========== NOTIFICATION PERMISSION FIX ==========
        if (typeof Notification !== 'undefined') {
            Object.defineProperty(Notification, 'permission', {
                get: () => 'default',
                configurable: true
            });
        }
        
        // ========== DOCUMENT FOCUS FIX ==========
        const originalHasFocus = document.hasFocus.bind(document);
        document.hasFocus = function() { return true; };
        
        // ========== CONNECTION API FIX ==========
        if (!navigator.connection) {
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    rtt: 50 + Math.floor(Math.random() * 100),
                    downlink: 1.5 + Math.random() * 8,
                    effectiveType: '4g',
                    saveData: false,
                    type: 'wifi',
                    addEventListener: function() {},
                    removeEventListener: function() {},
                    dispatchEvent: function() { return true; }
                }),
                configurable: true
            });
        }
        
        // ========== PERFORMANCE MEMORY FIX ==========
        if (window.performance && !performance.memory) {
            Object.defineProperty(performance, 'memory', {
                get: () => ({
                    jsHeapSizeLimit: 2172649472,
                    totalJSHeapSize: 19321856 + Math.floor(Math.random() * 1000000),
                    usedJSHeapSize: 16781820 + Math.floor(Math.random() * 500000)
                }),
                configurable: true
            });
        }
        
        // ========== CHROME RUNTIME FIX (Critical for CreepJS) ==========
        (function() {
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
                    return { startE: Date.now(), onloadT: Date.now(), pageT: Math.floor(Math.random() * 1000) + 500, tran: 15 };
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
            
            const makeNative = (fn, name) => {
                Object.defineProperty(fn, 'toString', { value: function() { return 'function ' + name + '() { [native code] }'; } });
                return fn;
            };
            chromeObj.csi = makeNative(chromeObj.csi, 'csi');
            chromeObj.loadTimes = makeNative(chromeObj.loadTimes, 'loadTimes');
            
            if (!window.chrome) {
                Object.defineProperty(window, 'chrome', { value: chromeObj, writable: true, enumerable: true, configurable: true });
            } else {
                Object.keys(chromeObj).forEach(key => { if (!window.chrome[key]) window.chrome[key] = chromeObj[key]; });
            }
        })();
        
        // ========== NATIVE DIALOGS FIX (MUST BE FIRST) ==========
        // Fix alert, confirm, prompt to pass SannySoft detection
        (function () {
            ['alert', 'confirm', 'prompt'].forEach(function (fnName) {
                const originalFn = window[fnName];
                if (!originalFn) return;

                // Create a native-looking wrapper
                const wrapper = {
                    [fnName]: function () {
                        return originalFn.apply(this, arguments);
                    }
                }[fnName];

                // Make toString return native code string
                const nativeToString = function () {
                    return 'function ' + fnName + '() { [native code] }';
                };
                Object.defineProperty(nativeToString, 'toString', {
                    value: function () { return 'function toString() { [native code] }'; },
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
                } catch (e) { }

                // Delete the own property from window instance
                try {
                    if (Object.prototype.hasOwnProperty.call(window, fnName)) {
                        delete window[fnName];
                    }
                } catch (e) { }
            });
        })();

        // MouseEvent fixes for bot detection
        Object.defineProperty(MouseEvent.prototype, 'screenX', {
            get: function () { return this.clientX + window.screenX; }
        });
        Object.defineProperty(MouseEvent.prototype, 'screenY', {
            get: function () { return this.clientY + window.screenY; }
        });

        // ========== POPUP BLOCKER ==========
        (function () {
            const originalOpen = window.open.bind(window);
            let lastUserClick = 0;
            let isUserInteracting = false;

            // Block patterns
            const blockedPatterns = [
                /ad[sx]?\./, /pop/, /click/, /track/, /beacon/,
                /affiliate/, /partner/, /promo/, /banner/,
                /about:blank/, /javascript:/, /\?utm_/, /\/afu\//,
                /redirect/, /go\.php/, /out\.php/, /link\.php/
            ];

            function isBlockedUrl(url) {
                const urlStr = String(url || '');
                return blockedPatterns.some(p => p.test(urlStr));
            }

            function isUserInitiated() {
                return (Date.now() - lastUserClick) < 500;
            }

            // Track user clicks
            document.addEventListener('click', function (e) {
                lastUserClick = Date.now();
                isUserInteracting = true;
                setTimeout(() => { isUserInteracting = false; }, 500);
            }, true);

            // Override window.open
            window.open = function (url, name, specs) {
                const urlStr = String(url || '');
                if (isBlockedUrl(urlStr) || !isUserInitiated() || (specs && specs.includes('width'))) {
                    console.log('[popup-blocker] Blocked popup:', urlStr.substring(0, 60));
                    return null;
                }
                return originalOpen(url, name, specs);
            };

            // Override location.assign
            const originalAssign = window.location.assign.bind(window.location);
            window.location.assign = function (url) {
                if (isBlockedUrl(url) || !isUserInitiated()) {
                    console.log('[popup-blocker] Blocked redirect (assign):', String(url).substring(0, 60));
                    return;
                }
                return originalAssign(url);
            };

            // Override location.replace
            const originalReplace = window.location.replace.bind(window.location);
            window.location.replace = function (url) {
                if (isBlockedUrl(url) || !isUserInitiated()) {
                    console.log('[popup-blocker] Blocked redirect (replace):', String(url).substring(0, 60));
                    return;
                }
                return originalReplace(url);
            };

            // Block onclick handlers with popups
            const originalSetAttribute = Element.prototype.setAttribute;
            Element.prototype.setAttribute = function (name, value) {
                if (name.toLowerCase() === 'onclick' && /open\(|popup|window\.open/i.test(String(value))) {
                    console.log('[popup-blocker] Blocked onclick handler');
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };

            // Block document.write with redirects
            const originalWrite = document.write.bind(document);
            document.write = function (html) {
                const htmlStr = String(html || '');
                if (/location\.href|window\.open|redirect/i.test(htmlStr)) {
                    console.log('[popup-blocker] Blocked document.write with redirect');
                    return;
                }
                return originalWrite(html);
            };

            console.log('[popup-blocker] Aggressive popup + redirect blocking enabled');
        })();
    });

    // === IMMEDIATE FIX FOR CURRENT PAGE ===
    // evaluateOnNewDocument only works for NEXT navigations
    // We need to also fix the current page immediately
    await page.evaluate(() => {
        // Native Dialogs Fix for current page
        ['alert', 'confirm', 'prompt'].forEach(function (fnName) {
            const originalFn = window[fnName];
            if (!originalFn) return;

            const wrapper = {
                [fnName]: function () {
                    return originalFn.apply(this, arguments);
                }
            }[fnName];

            const nativeToString = function () {
                return 'function ' + fnName + '() { [native code] }';
            };
            Object.defineProperty(nativeToString, 'toString', {
                value: function () { return 'function toString() { [native code] }'; },
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

            try {
                Object.defineProperty(Window.prototype, fnName, {
                    value: wrapper,
                    writable: true,
                    enumerable: true,
                    configurable: true
                });
            } catch (e) { }

            try {
                if (Object.prototype.hasOwnProperty.call(window, fnName)) {
                    delete window[fnName];
                }
            } catch (e) { }
        });
    }).catch(() => { }); // Ignore errors on about:blank pages

    const cursor = createCursor(page);
    page.realCursor = cursor
    page.realClick = cursor.click

    return page
}

module.exports = { pageController }