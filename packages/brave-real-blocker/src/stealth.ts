
import { Page } from 'brave-real-puppeteer-core';

export async function injectStealth(page: Page) {
    // Get CDP session for more control
    const client = await page.target().createCDPSession();

    // Enable Page domain first
    await client.send('Page.enable');

    // Use CDP to inject script before page load - this runs in MAIN world
    // Using Page.addScriptToEvaluateOnNewDocument which runs before any page scripts
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
            (function() {
                'use strict';
                
                // Store original native functions BEFORE any scripts can modify them
                const originalPrompt = window.prompt;
                const originalAlert = window.alert;
                const originalConfirm = window.confirm;
                
                // Helper: Create a function that looks exactly like native
                const createNativeWrapper = (originalFn, fnName) => {
                    // Use eval to create a function with the correct name
                    const wrapper = {
                        [fnName]: function() {
                            return originalFn.apply(this, arguments);
                        }
                    }[fnName];

                    // Override toString to return native code string
                    const nativeToString = function() { 
                        return 'function ' + fnName + '() { [native code] }'; 
                    };
                    
                    // Make toString look native too
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

                    // Ensure name property is correct
                    Object.defineProperty(wrapper, 'name', {
                        value: fnName,
                        writable: false,
                        configurable: true
                    });
                    
                    // Ensure length property matches original
                    Object.defineProperty(wrapper, 'length', {
                        value: originalFn.length,
                        writable: false,
                        configurable: true
                    });

                    return wrapper;
                };
                
                // Re-define native dialogs on Window.prototype with correct descriptors
                // This ensures they look exactly like native functions
                const patchPrototype = (fnName, originalFn) => {
                    const wrapper = createNativeWrapper(originalFn, fnName);
                    
                    try {
                        Object.defineProperty(Window.prototype, fnName, {
                            value: wrapper,
                            writable: true,
                            enumerable: true,
                            configurable: true
                        });
                    } catch(e) {}
                    
                    // Also ensure window instance uses prototype (delete any own property)
                    try {
                        if (Object.prototype.hasOwnProperty.call(window, fnName)) {
                            delete window[fnName];
                        }
                    } catch(e) {}
                };
                
                // Apply patches - these preserve original functionality but look native
                if (originalPrompt) patchPrototype('prompt', originalPrompt);
                if (originalAlert) patchPrototype('alert', originalAlert);
                if (originalConfirm) patchPrototype('confirm', originalConfirm);
                
                // Canvas fingerprinting protection
                const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                HTMLCanvasElement.prototype.toDataURL = createNativeWrapper(originalToDataURL, 'toDataURL');
                
                // History pushState URL cleaning
                const originalPushState = history.pushState;
                const cleanPushState = function(state, unused, url) {
                    if (typeof url === 'string') {
                        try {
                            const u = new URL(url, window.location.origin);
                            ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(p => u.searchParams.delete(p));
                            arguments[2] = u.toString();
                        } catch(e) {}
                    }
                    return originalPushState.apply(this, arguments);
                };
                history.pushState = createNativeWrapper(cleanPushState, 'pushState');
                
            })();
        `,
        worldName: undefined, // MAIN world
        includeCommandLineAPI: false,
        runImmediately: true
    });

    // Also use the standard page.evaluateOnNewDocument as a fallback
    await page.evaluateOnNewDocument(() => {
        // Expose helper for scriptlets (hidden from enumeration)
        Object.defineProperty(window, '__braveMapNative', {
            value: (fn: any, name: string) => {
                Object.defineProperty(fn, 'name', { value: name });
                Object.defineProperty(fn, 'toString', {
                    value: () => `function ${name}() { [native code] }`
                });
                return fn;
            },
            configurable: false,
            writable: false,
            enumerable: false
        });
    });
}

