import { Page } from 'brave-real-puppeteer-core';
import { Logger } from './logger';

const log = new Logger();

/**
 * AGGRESSIVE REDIRECT AND POPUP BLOCKING
 * Works at Puppeteer level to catch what scriptlets miss
 */
export async function injectRedirectBlocking(page: Page): Promise<void> {

    // ==========================================
    // 1. BLOCK POPUPS AT BROWSER LEVEL
    // ==========================================
    const blockedDomains = [
        'ads', 'pop', 'click', 'track', 'beacon', 'affiliate',
        'profitableratecpm', 'engridfanlike', 'pubfuture', 'clickadu',
        'propellerads', 'popads', 'popcash', 'adcash', 'exoclick',
        'doubleclick', 'googlesyndication', 'googleadservices'
    ];

    page.on('popup', async (popup) => {
        try {
            const url = popup.url();
            
            // Always block about:blank popups
            if (url === 'about:blank' || url === '') {
                await popup.close().catch(() => {});
                log.info('Redirect', 'Blocked empty popup');
                return;
            }
            
            // Check if URL contains blocked domain patterns
            const urlLower = url.toLowerCase();
            const isAdPopup = blockedDomains.some(domain => urlLower.includes(domain));
            
            if (isAdPopup) {
                await popup.close().catch(() => {});
                log.info('Redirect', 'Blocked ad popup: ' + url.substring(0, 50));
                return;
            }
            
            // Block popups that open immediately after page load
            // (legitimate popups usually require user interaction)
            log.info('Redirect', 'Allowed popup: ' + url.substring(0, 50));
        } catch (e) {
            // Popup might already be closed
        }
    });

    // ==========================================
    // 2. BLOCK NEW TAB/WINDOW TARGETS
    // ==========================================
    const browser = page.browser();
    if (browser) {
        browser.on('targetcreated', async (target) => {
            try {
                if (target.type() === 'page') {
                    const newPage = await target.page();
                    if (newPage) {
                        const opener = await newPage.opener();
                        if (opener) {
                            const url = newPage.url();
                            const urlLower = url.toLowerCase();
                            
                            // Check for ad URLs
                            const isAd = blockedDomains.some(d => urlLower.includes(d)) ||
                                        url === 'about:blank' ||
                                        url.startsWith('javascript:');
                            
                            if (isAd) {
                                await newPage.close().catch(() => {});
                                log.info('Redirect', 'Closed ad tab: ' + url.substring(0, 50));
                            }
                        }
                    }
                }
            } catch (e) {
                // Target might be closed
            }
        });
    }

    // ==========================================
    // 3. NAVIGATION BLOCKING VIA CDP
    // ==========================================
    const client = await page.target().createCDPSession();
    
    // Listen for navigation requests
    await client.send('Page.enable');
    await client.send('Network.enable');
    
    // Block navigation to ad domains
    client.on('Page.frameRequestedNavigation', async (params: any) => {
        const url = params.url || '';
        const urlLower = url.toLowerCase();
        
        if (blockedDomains.some(d => urlLower.includes(d))) {
            log.info('Redirect', 'Blocked navigation: ' + url.substring(0, 50));
            // Note: We can't directly cancel here, but scriptlets should handle it
        }
    });

    // ==========================================
    // 4. INJECT PAGE-LEVEL PROTECTION
    // ==========================================
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
(function() {
    'use strict';
    
    // Block meta refresh redirects
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeName === 'META') {
                    const meta = node;
                    const httpEquiv = meta.getAttribute('http-equiv');
                    if (httpEquiv && httpEquiv.toLowerCase() === 'refresh') {
                        const content = meta.getAttribute('content') || '';
                        if (content.includes('url=')) {
                            console.log('[AdBlocker] Blocked meta refresh redirect');
                            meta.remove();
                        }
                    }
                }
            });
        });
    });
    
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // Check existing meta tags
    document.querySelectorAll('meta[http-equiv="refresh"]').forEach(function(meta) {
        const content = meta.getAttribute('content') || '';
        if (content.includes('url=')) {
            console.log('[AdBlocker] Removed existing meta refresh');
            meta.remove();
        }
    });
    
    // Block form submissions to ad URLs
    const originalSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
        const action = this.action || '';
        const blockedPatterns = [/ads?\\./i, /pop/i, /click/i, /track/i, /redirect/i];
        
        if (blockedPatterns.some(p => p.test(action))) {
            console.log('[AdBlocker] Blocked form submit to:', action.substring(0, 50));
            return;
        }
        return originalSubmit.call(this);
    };
    
    console.log('[AdBlocker] Redirect blocking active');
})();
        `
    });

    // ==========================================
    // 5. URL PARAMETER CLEANING
    // ==========================================
    await cleanUrlParameters(page);
}

/**
 * Removes tracking parameters from requests
 */
export async function cleanUrlParameters(page: Page) {
    // Check if request interception is already enabled
    try {
        await page.setRequestInterception(true);
    } catch (e) {
        // Already enabled, continue
    }

    const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'dclid', 'msclkid', 'mc_eid', '_ga', 'ref', 'source'
    ];

    const blockedResourceTypes = ['ping', 'beacon', 'csp_report'];
    
    const blockedUrlPatterns = [
        /google-analytics\.com/i,
        /googletagmanager\.com/i,
        /facebook\.com\/tr/i,
        /connect\.facebook\.net/i,
        /analytics/i,
        /tracking/i,
        /pixel/i
    ];

    page.on('request', (request) => {
        if (request.isInterceptResolutionHandled()) return;

        const url = request.url();
        const resourceType = request.resourceType();

        // Block tracking resource types
        if (blockedResourceTypes.includes(resourceType)) {
            request.abort('blockedbyclient');
            log.info('Redirect', 'Blocked tracking request: ' + resourceType);
            return;
        }

        // Block known tracking URLs
        if (blockedUrlPatterns.some(pattern => pattern.test(url))) {
            request.abort('blockedbyclient');
            log.info('Redirect', 'Blocked tracking URL: ' + url.substring(0, 50));
            return;
        }

        // Clean tracking parameters from URL
        try {
            const urlObj = new URL(url);
            let changed = false;
            
            trackingParams.forEach(param => {
                if (urlObj.searchParams.has(param)) {
                    urlObj.searchParams.delete(param);
                    changed = true;
                }
            });

            if (changed) {
                request.continue({ url: urlObj.toString() });
            } else {
                request.continue();
            }
        } catch (e) {
            request.continue();
        }
    });
}
