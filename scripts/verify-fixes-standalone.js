
import { chromium } from 'playwright';

// --- MOCK / INLINED HANDLERS ---

// 1. Link Harvester (Fixed)
async function handleLinkHarvester(page, args) {
    const selector = args.selector || 'a[href]';
    const classifyLinks = args.classifyLinks !== false;
    const includeAnchors = args.includeAnchors || false;

    const linkData = await page.evaluate(
        ({ selector, classifyLinks, includeAnchors }) => {
            const links = document.querySelectorAll(selector);
            const currentDomain = window.location.hostname;
            const results = [];

            links.forEach((link, index) => {
                const href = link.href;

                // Fixed: Check for href
                if (!href) return;

                // Skip anchors if not included
                if (!includeAnchors && href.startsWith('#')) {
                    return;
                }

                const linkInfo = {
                    index,
                    href,
                    text: link.textContent?.trim() || '',
                    title: link.title || '',
                };

                if (classifyLinks) {
                    try {
                        const url = new URL(href, window.location.href);
                        const isInternal = url.hostname === currentDomain;
                        const isAnchor = href.startsWith('#');
                        const isMailto = href.startsWith('mailto:');
                        const isTel = href.startsWith('tel:');

                        linkInfo.type = isAnchor
                            ? 'anchor'
                            : isMailto
                                ? 'email'
                                : isTel
                                    ? 'phone'
                                    : isInternal
                                        ? 'internal'
                                        : 'external';

                        linkInfo.domain = url.hostname;
                        linkInfo.protocol = url.protocol;
                    } catch (e) {
                        linkInfo.type = 'invalid';
                        linkInfo.domain = 'unknown';
                    }
                }
                results.push(linkInfo);
            });
            return results;
        },
        { selector, classifyLinks, includeAnchors }
    );
    return linkData;
}

// 2. Extract JSON (Fixed)
async function handleExtractJSON(page, args) {
    const source = args.source || 'all';
    const selector = args.selector;
    const filter = args.filter;

    const jsonData = await page.evaluate(
        ({ source, selector, filter }) => {
            const results = [];

            // Extract JSON from script tags
            if (source === 'script' || source === 'all') {
                const defaultSelector = selector || 'script[type="application/json"], script[type="application/ld+json"], script';
                const scripts = document.querySelectorAll(defaultSelector);

                scripts.forEach((script, index) => {
                    const content = script.textContent || '';
                    try {
                        // 1. Try direct parsing first
                        const data = JSON.parse(content);
                        if (filter) {
                            const filterLower = filter.toLowerCase();
                            const dataStr = JSON.stringify(data).toLowerCase();
                            if (!dataStr.includes(filterLower)) return;
                        }
                        results.push({ data, source: 'script', path: `script[${index}]` });
                    } catch (e) {
                        // 2. Fallback: Try to find JSON objects using regex
                        const jsonRegex = /({[\s\S]*?}|\[[\s\S]*?\])/g;
                        let match;
                        while ((match = jsonRegex.exec(content)) !== null) {
                            const potentialJson = match[0];
                            if (potentialJson.length < 20) continue;
                            try {
                                const data = JSON.parse(potentialJson);
                                if (filter) {
                                    const filterLower = filter.toLowerCase();
                                    const dataStr = JSON.stringify(data).toLowerCase();
                                    if (!dataStr.includes(filterLower)) continue;
                                }
                                if ((Array.isArray(data) && data.length > 0) || (typeof data === 'object' && data !== null && Object.keys(data).length > 0)) {
                                    results.push({ data, source: 'script', path: `script[${index}]_regex_match` });
                                }
                            } catch (e2) { }
                        }
                    }
                });
            }
            return results;
        },
        { source, selector, filter }
    );
    return jsonData;
}

// 3. API Finder
async function handleApiFinder(page, args) {
    const captureDuration = typeof args.duration === 'number' ? args.duration : 1000;

    // From inline scripts
    const scriptApis = await page.evaluate(() => {
        const results = [];
        const scripts = Array.from(document.querySelectorAll('script'));

        const apiPatterns = [
            /https?:\/\/[^"'\s]+\/api\/[^"'\s]*/gi,
            /https?:\/\/api\.[^"'\s]+/gi,
        ];

        scripts.forEach(script => {
            const content = script.textContent || '';
            apiPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    matches.forEach(match => results.push({ url: match, source: 'script' }));
                }
            });
        });
        return results;
    });
    return scriptApis;
}

// 4. Fetch XHR (Fixed)
async function handleFetchXHR(page, args) {
    const duration = args.duration || 2000;
    const forceReload = args.forceReload !== false;

    const xhrData = [];
    const responseHandler = async (response) => {
        const request = response.request();
        const resourceType = request.resourceType();

        if (resourceType === 'xhr' || resourceType === 'fetch') {
            try {
                const body = await response.text();
                xhrData.push({
                    url: response.url(),
                    body: body.substring(0, 1000),
                });
            } catch (e) { }
        }
    };

    page.on('response', responseHandler);

    if (forceReload) {
        try {
            await page.reload({ waitUntil: 'networkidle' });
        } catch (e) { }
    }

    // Wait a bit
    await new Promise(r => setTimeout(r, duration));
    page.off('response', responseHandler);
    return xhrData;
}


async function verify() {
    console.log('🚀 Starting Verification...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Test Link Harvester
        console.log('\n🧪 Testing Link Harvester...');
        await page.setContent(`
        <html><body>
            <a href="https://example.com">Example</a>
            <button>Click me</button>
            <a href="#anchor">Anchor</a>
        </body></html>
      `);
        const links = await handleLinkHarvester(page, { selector: 'button, a', classifyLinks: true });
        console.log('✅ Link Harvester Result (should have 2 links):', links.length);
        console.log(links);

        // 2. Test Extract JSON
        console.log('\n🧪 Testing Extract JSON...');
        await page.setContent(`
        <html>
            <script>
                const config = { "siteId": 123, "name": "Test Site" };
            </script>
        </html>
      `);
        const json = await handleExtractJSON(page, { source: 'all' });
        const found = json.find(j => j.data.siteId === 123);
        console.log('✅ Extract JSON Result:', found ? 'Found embedded JSON' : 'FAILED to find embedded JSON');
        console.log(json);

        // 3. Test API Finder
        console.log('\n🧪 Testing API Finder...');
        await page.setContent(`<html><script>const apiUrl = "https://api.example.com/v1/users";</script></html>`);
        const apis = await handleApiFinder(page, {});
        console.log('✅ API Finder Result:', apis.length > 0 ? 'Found API' : 'FAILED');
        console.log(apis);

        // 4. Test Fetch XHR
        console.log('\n🧪 Testing Fetch XHR...');
        await page.goto('https://example.com');
        const xhr = await handleFetchXHR(page, { duration: 1000, forceReload: true });
        console.log('✅ Fetch XHR executed without error. Captured:', xhr.length);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

verify();
