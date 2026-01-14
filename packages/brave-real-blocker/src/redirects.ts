import { Page } from 'brave-real-puppeteer-core';
import { Logger } from './logger';

const log = new Logger();

/**
 * Injects redirect and popup blocking logic
 */
export async function injectRedirectBlocking(page: Page): Promise<void> {

    // 1. Prevent forced new tabs (Popups)
    // We already have some logic in stealth.ts, but this is a reinforced listener
    page.on('popup', async (popup) => {
        try {
            // Check if loop/spam
            const url = popup.url();
            if (url === 'about:blank') {
                // Often used for ad-loading chains
                await popup.close();
                log.info('Redirect', 'Blocked empty popup');
                return;
            }

            // Heuristic: If popup opened immediately after another without user interaction
            // This is hard to detect perfectly in Puppeteer without tracking events
            // but we can close known ad/spam domains
        } catch (e) { }
    });

    // 2. Navigation Locking (Prevent unwanted top-frame redirects)
    // This is injected into the page context
    await page.evaluateOnNewDocument(() => {

        let lastUserInteraction = 0;

        // Track user interaction (clicks, keys)
        ['click', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
            window.addEventListener(event, () => {
                lastUserInteraction = Date.now();
            }, { capture: true, passive: true });
        });

        // Wrap window.open (reinforcement)
        const originalOpen = window.open;
        window.open = function (url, target, features) {
            const timeSinceInteraction = Date.now() - lastUserInteraction;

            // If no user interaction in last 500ms, likely automated/forced
            // Allow explicit null/undefined target (often acts as _blank)

            if (timeSinceInteraction > 2000) {
                console.log('Brave-Blocker: Blocked automated window.open call');
                return null;
            }

            return originalOpen.apply(this, arguments as any);
        };

        // Block forced location changes via standard JS
        // We can't easily proxy window.location, but we can try to use onbeforeunload or navigation api
        // Simple heuristic for "redirect loops" can be handled by browser itself usually
    });

    await cleanUrlParameters(page);
}

/**
 * Removes tracking parameters from navigation
 */
export async function cleanUrlParameters(page: Page) {
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        if (request.isInterceptResolutionHandled()) return;

        const url = new URL(request.url());
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'dclid', 'msclkid', 'mc_eid'
        ];

        let changed = false;
        trackingParams.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                changed = true;
            }
        });

        // Also block ping/beacon requests often used for tracking
        const resourceType = request.resourceType();
        if (resourceType === 'ping' || resourceType === 'beacon' || resourceType === 'csp_report') {
            request.abort('blockedbyclient');
            return;
        }

        if (changed) {
            request.continue({ url: url.toString() });
        } else {
            request.continue();
        }
    });
}
