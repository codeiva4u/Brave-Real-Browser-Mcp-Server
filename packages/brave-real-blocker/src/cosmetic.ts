import { Page } from 'brave-real-puppeteer-core';

/**
 * Injects cosmetic filters and visual blockers
 */
export async function injectCosmeticFiltering(page: Page): Promise<void> {

    // 1. Generic CSS Filter (Basic Cleanup)
    // Hides common container names used for ads that might escape network blocking
    await page.addStyleTag({
        content: `
            iframe[src*="googleads"],
            iframe[src*="doubleclick"],
            div[id*="google_ads"],
            div[class*="adsbygoogle"],
            a[href*="doubleclick.net"],
            .adsbox, .ad-banner, .top-ad, .bottom-ad,
            [aria-label="Advertisement"],
            [aria-label="Sponsored"]
            { display: none !important; visibility: hidden !important; height: 0 !important; }
        `
    });

    // 2. Visual Blocker (Text-based cleanup)
    // Uses MutationObserver to hide elements containing specific "Bad Words"
    // We must be careful not to hide legitimate content
    await page.evaluateOnNewDocument(() => {
        const BAD_TEXTS = ['Sponsored', 'Advertisement', 'Promoted'];

        function cleanNode(node: Node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                // Only check small headers or labels, checking big divs is risky
                if (['SPAN', 'DIV', 'P', 'STRONG', 'B', 'LI'].includes(el.tagName) && el.innerText.length < 20) {
                    if (BAD_TEXTS.some(t => el.innerText.trim() === t)) {
                        // Hide the parent usually, or the element itself
                        // Safe mode: hide self
                        el.style.display = 'none';
                        // Aggressive mode: hide parent if it looks like a container
                        if (el.parentElement && el.parentElement.innerText.length < 100) {
                            el.parentElement.style.display = 'none';
                        }
                    }
                }
            }
        }

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                m.addedNodes.forEach(cleanNode);
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Initial sweep
        document.querySelectorAll('span, div, p').forEach(cleanNode);
    });
}
