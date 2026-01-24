import { Page } from 'brave-real-puppeteer-core';

/**
 * AGGRESSIVE COSMETIC FILTERING
 * Hides: Ad containers, overlays, modals, cookie banners, anti-adblock
 */
export async function injectCosmeticFiltering(page: Page): Promise<void> {

    // ==========================================
    // 1. COMPREHENSIVE CSS AD HIDING
    // ==========================================
    await page.addStyleTag({
        content: `
            /* Google Ads */
            iframe[src*="googleads"], iframe[src*="googlesyndication"],
            iframe[src*="doubleclick"], iframe[id*="google_ads"],
            div[id*="google_ads"], div[class*="adsbygoogle"],
            ins.adsbygoogle, div[id*="div-gpt-ad"],
            
            /* Generic Ads */
            .adsbox, .ad-banner, .ad-container, .ad-wrapper,
            .top-ad, .bottom-ad, .side-ad, .sidebar-ad,
            [aria-label="Advertisement"], [aria-label="Sponsored"],
            [data-ad], [data-ad-slot], [data-adunit],
            
            /* Popup/Overlay Ads */
            div[class*="popup"], div[id*="popup"],
            div[class*="overlay"]:not(.video-overlay):not(.player-overlay),
            div[class*="modal"]:not(.video-modal):not(.player-modal),
            div[class*="interstitial"], div[id*="interstitial"],
            div[class*="lightbox"]:not(.image-lightbox),
            
            /* Sticky/Fixed Ads */
            div[class*="sticky-ad"], div[class*="fixed-ad"],
            div[style*="position: fixed"][style*="z-index"]:not(nav):not(header):not(.player-controls),
            
            /* Social/Native Ads */
            div[id*="taboola"], div[id*="outbrain"],
            div[class*="taboola"], div[class*="outbrain"],
            div[class*="native-ad"], div[class*="sponsored"],
            
            /* Cookie/Consent Banners */
            div[class*="cookie"], div[id*="cookie"],
            div[class*="consent"], div[id*="consent"],
            div[class*="gdpr"], div[id*="gdpr"],
            div[class*="privacy-notice"], div[class*="cookie-banner"],
            
            /* Anti-Adblock Modals */
            div[class*="adblock"], div[id*="adblock"],
            div[class*="disable-adblock"], div[class*="adb-"],
            
            /* Link Ads */
            a[href*="doubleclick.net"], a[href*="googleadservices"],
            a[href*="clickadu"], a[href*="propellerads"],
            a[href*="popads"], a[href*="exoclick"],
            
            /* Script-injected ads */
            div[id^="ScriptRoot"], div[class^="__"],
            
            /* Hide but don't break layout */
            iframe[src*="ads"] {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `
    });

    // ==========================================
    // 2. CDP INJECTION FOR EARLY BLOCKING
    // ==========================================
    const client = await page.target().createCDPSession();
    await client.send('Page.enable');
    
    await client.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `
(function() {
    'use strict';
    
    // ==========================================
    // OVERLAY/MODAL KILLER
    // ==========================================
    const OVERLAY_SELECTORS = [
        '[class*="overlay"]:not(.video-overlay):not(.player)',
        '[class*="modal"]:not(.video-modal):not(.player)',
        '[class*="popup"]:not(.menu-popup)',
        '[class*="interstitial"]',
        '[class*="lightbox"]:not(.image)',
        '[class*="cookie"]',
        '[class*="consent"]',
        '[class*="adblock"]',
        '[class*="subscribe-modal"]',
        '[class*="newsletter-popup"]',
        '[id*="overlay"]',
        '[id*="modal"]',
        '[id*="popup"]'
    ];
    
    const AD_TEXT_PATTERNS = [
        'sponsored', 'advertisement', 'promoted', 'ad by',
        'disable adblock', 'turn off adblock', 'adblock detected',
        'subscribe to', 'sign up for', 'newsletter'
    ];
    
    function isAdElement(el) {
        if (!el || !el.innerText) return false;
        const text = el.innerText.toLowerCase();
        const textLength = text.length;
        
        // Small text elements with ad keywords
        if (textLength < 30) {
            return AD_TEXT_PATTERNS.some(p => text === p || text.includes(p));
        }
        
        // Check for specific ad attributes
        const className = (el.className || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        
        return /ads?[-_]?|sponsor|promo|banner|popup|overlay/i.test(className + id);
    }
    
    function isOverlay(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const position = style.position;
        const zIndex = parseInt(style.zIndex) || 0;
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        
        // Fixed/absolute positioned with high z-index covering screen
        if ((position === 'fixed' || position === 'absolute') && zIndex > 100) {
            if (width > window.innerWidth * 0.5 && height > window.innerHeight * 0.3) {
                return true;
            }
        }
        
        return false;
    }
    
    function hideElement(el) {
        if (!el) return;
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
    }
    
    function removeOverlays() {
        // Remove by selector
        OVERLAY_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    if (isOverlay(el) || isAdElement(el)) {
                        hideElement(el);
                        console.log('[AdBlocker] Hid overlay:', el.className || el.id);
                    }
                });
            } catch(e) {}
        });
        
        // Remove high z-index fixed elements that look like overlays
        document.querySelectorAll('div, section, aside').forEach(el => {
            if (isOverlay(el)) {
                const text = (el.innerText || '').toLowerCase();
                // Don't hide video players or navigation
                if (!text.includes('play') && !el.querySelector('video') && !el.querySelector('nav')) {
                    if (AD_TEXT_PATTERNS.some(p => text.includes(p))) {
                        hideElement(el);
                        console.log('[AdBlocker] Hid suspicious overlay');
                    }
                }
            }
        });
    }
    
    // ==========================================
    // MUTATION OBSERVER FOR DYNAMIC CONTENT
    // ==========================================
    const observer = new MutationObserver(function(mutations) {
        let shouldClean = false;
        
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node;
                    
                    // Check if it's an overlay or ad
                    if (isOverlay(el) || isAdElement(el)) {
                        hideElement(el);
                        shouldClean = false; // Already handled
                    } else {
                        shouldClean = true;
                    }
                }
            });
        });
        
        if (shouldClean) {
            // Debounced cleanup
            clearTimeout(window.__adCleanupTimeout);
            window.__adCleanupTimeout = setTimeout(removeOverlays, 100);
        }
    });
    
    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            observer.observe(document.body, { childList: true, subtree: true });
            removeOverlays();
        });
    }
    
    // ==========================================
    // SCROLL LOCK REMOVAL
    // ==========================================
    // Some overlays lock scrolling
    function unlockScroll() {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
    }
    
    // Periodically check for scroll lock
    setInterval(unlockScroll, 2000);
    
    // ==========================================
    // INITIAL CLEANUP
    // ==========================================
    setTimeout(removeOverlays, 500);
    setTimeout(removeOverlays, 1000);
    setTimeout(removeOverlays, 2000);
    
    console.log('[AdBlocker] Cosmetic filtering active');
})();
        `
    });

    // ==========================================
    // 3. LEGACY SUPPORT VIA evaluateOnNewDocument
    // ==========================================
    await page.evaluateOnNewDocument(() => {
        // Simple text-based cleanup for "Sponsored" labels
        const BAD_TEXTS = ['Sponsored', 'Advertisement', 'Promoted', 'Ad'];

        function cleanNode(node: Node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (['SPAN', 'DIV', 'P', 'STRONG', 'B', 'LI', 'LABEL'].includes(el.tagName)) {
                    const text = el.innerText?.trim();
                    if (text && text.length < 20 && BAD_TEXTS.includes(text)) {
                        el.style.display = 'none';
                        // Also hide parent container if small
                        const parent = el.parentElement;
                        if (parent && (parent.innerText?.length || 0) < 100) {
                            parent.style.display = 'none';
                        }
                    }
                }
            }
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(m => m.addedNodes.forEach(cleanNode));
        });

        if (document.documentElement) {
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }

        // Initial cleanup
        document.querySelectorAll('span, div, p, strong').forEach(cleanNode);
    });
}
