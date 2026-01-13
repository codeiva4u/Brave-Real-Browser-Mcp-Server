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

    // === AGGRESSIVE POPUP + REDIRECT BLOCKER SCRIPT ===
    await page.evaluateOnNewDocument(() => {
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

    const cursor = createCursor(page);
    page.realCursor = cursor
    page.realClick = cursor.click
    return page
}