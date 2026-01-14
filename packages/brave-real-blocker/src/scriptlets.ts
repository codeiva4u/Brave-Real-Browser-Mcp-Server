
import { Page } from 'brave-real-puppeteer-core';

export async function injectScriptlets(page: Page) {
    await page.evaluateOnNewDocument(() => {
        // Block forced window.open
        const originalOpen = window.open;
        let lastOpenTime = 0;
        window.open = function (...args) {
            const now = Date.now();
            if (now - lastOpenTime < 100) {
                console.warn('Blocked rapid window.open');
                return null;
            }
            lastOpenTime = now;
            return originalOpen.apply(this, args as any);
        };

        // Attempt to mask if helper is available (injected by stealth.ts)
        const makeNative = (window as any).__braveMapNative;
        if (makeNative) {
            window.open = makeNative(window.open, 'open');
        }

        // Block forced redirects via location.href setter
        // This is complex, but we can try to intercept trivial cases
        // Object.defineProperty(window, 'location', { ... }) // Risky
    });
}
