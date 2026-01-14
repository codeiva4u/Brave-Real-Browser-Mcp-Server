import { createCursor } from 'ghost-cursor';
import { checkTurnstile } from './turnstile.mjs';
import kill from 'tree-kill';

export async function pageController({ browser, page, proxy, turnstile, xvfbsession, pid, plugins, killProcess = false, brave }) {

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

    // Inject native dialogs fix via CDP - runs before page scripts
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
            (function() {
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

        // ========== PERMISSIONS FIX (for SannySoft "prompt" detection) ==========
        // Override navigator.permissions.query to return 'granted' instead of 'prompt'
        const originalQuery = navigator.permissions.query.bind(navigator.permissions);
        Object.defineProperty(navigator.permissions, 'query', {
            value: function (permissionDesc) {
                return originalQuery(permissionDesc).then(function (result) {
                    // Create a mock result that looks like granted
                    if (result.state === 'prompt') {
                        return {
                            state: 'granted',
                            onchange: null,
                            addEventListener: function () { },
                            removeEventListener: function () { },
                            dispatchEvent: function () { return true; }
                        };
                    }
                    return result;
                });
            },
            writable: true,
            configurable: true
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