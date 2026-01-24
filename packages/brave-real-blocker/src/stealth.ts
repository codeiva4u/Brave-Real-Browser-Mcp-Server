
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
                
                // ==========================================
                // CANVAS FINGERPRINTING PROTECTION
                // ==========================================
                const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
                HTMLCanvasElement.prototype.toDataURL = createNativeWrapper(function() {
                    const ctx = this.getContext('2d');
                    if (ctx) {
                        // Add subtle noise to canvas
                        const imageData = ctx.getImageData(0, 0, 1, 1);
                        imageData.data[0] = (imageData.data[0] + Math.floor(Math.random() * 3)) % 256;
                        ctx.putImageData(imageData, 0, 0);
                    }
                    return originalToDataURL.apply(this, arguments);
                }, 'toDataURL');
                
                const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
                CanvasRenderingContext2D.prototype.getImageData = createNativeWrapper(function() {
                    const imageData = originalGetImageData.apply(this, arguments);
                    // Add subtle noise to a few pixels
                    for (let i = 0; i < Math.min(4, imageData.data.length); i += 4) {
                        imageData.data[i] = (imageData.data[i] + Math.floor(Math.random() * 2)) % 256;
                    }
                    return imageData;
                }, 'getImageData');
                
                // ==========================================
                // WEBGL FINGERPRINTING PROTECTION
                // ==========================================
                const getParameterProxyHandler = {
                    apply: function(target, thisArg, args) {
                        const param = args[0];
                        const result = target.apply(thisArg, args);
                        
                        // Add noise to certain WebGL parameters
                        if (param === 37445) { // UNMASKED_VENDOR_WEBGL
                            return 'Google Inc. (NVIDIA)';
                        }
                        if (param === 37446) { // UNMASKED_RENDERER_WEBGL
                            return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)';
                        }
                        return result;
                    }
                };
                
                try {
                    const webglContexts = ['webgl', 'experimental-webgl', 'webgl2'];
                    webglContexts.forEach(ctxName => {
                        const originalGetContext = HTMLCanvasElement.prototype.getContext;
                        // Proxy WebGL getParameter
                        if (typeof WebGLRenderingContext !== 'undefined') {
                            WebGLRenderingContext.prototype.getParameter = new Proxy(
                                WebGLRenderingContext.prototype.getParameter,
                                getParameterProxyHandler
                            );
                        }
                        if (typeof WebGL2RenderingContext !== 'undefined') {
                            WebGL2RenderingContext.prototype.getParameter = new Proxy(
                                WebGL2RenderingContext.prototype.getParameter,
                                getParameterProxyHandler
                            );
                        }
                    });
                } catch(e) {}
                
                // ==========================================
                // AUDIOCONTEXT FINGERPRINTING PROTECTION
                // ==========================================
                try {
                    const originalAudioContext = window.AudioContext || window.webkitAudioContext;
                    if (originalAudioContext) {
                        const originalCreateOscillator = originalAudioContext.prototype.createOscillator;
                        originalAudioContext.prototype.createOscillator = createNativeWrapper(function() {
                            const oscillator = originalCreateOscillator.apply(this, arguments);
                            // Add very subtle frequency deviation
                            const originalFrequency = oscillator.frequency.value;
                            oscillator.frequency.value = originalFrequency + (Math.random() * 0.0001);
                            return oscillator;
                        }, 'createOscillator');
                        
                        const originalCreateAnalyser = originalAudioContext.prototype.createAnalyser;
                        originalAudioContext.prototype.createAnalyser = createNativeWrapper(function() {
                            const analyser = originalCreateAnalyser.apply(this, arguments);
                            const originalGetFloatFrequencyData = analyser.getFloatFrequencyData.bind(analyser);
                            analyser.getFloatFrequencyData = function(array) {
                                originalGetFloatFrequencyData(array);
                                // Add subtle noise
                                for (let i = 0; i < array.length; i++) {
                                    array[i] += (Math.random() - 0.5) * 0.0001;
                                }
                            };
                            return analyser;
                        }, 'createAnalyser');
                    }
                } catch(e) {}
                
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

