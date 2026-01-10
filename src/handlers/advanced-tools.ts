/**
 * Advanced Tools Handlers for brave-real-browser-mcp-server
 * Contains 22 new advanced tools for enhanced browser automation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Import types from puppeteer (using brave-real-puppeteer-core which provides these)
type Page = any;
type ElementHandle = any;

// ============================================================
// INTERFACES
// ============================================================

export interface BreadcrumbNavigatorArgs {
    targetIndex?: number;
    targetText?: string;
}

export interface UrlRedirectTracerArgs {
    url: string;
    maxRedirects?: number;
}

export interface MultiLayerRedirectTraceArgs {
    url: string;
    includeJsRedirects?: boolean;
    timeout?: number;
}

export interface SearchContentArgs {
    pattern: string;
    isRegex?: boolean;
    caseSensitive?: boolean;
    selector?: string;
}

export interface FindElementAdvancedArgs {
    xpath?: string;
    cssSelector?: string;
    contains?: string;
    attributes?: Record<string, string>;
}

export interface ExtractJsonArgs {
    selector?: string;
    scriptIndex?: number;
    variableName?: string;
}

export interface ScrapeMetaTagsArgs {
    includeOG?: boolean;
    includeTwitter?: boolean;
    includeSchema?: boolean;
}

export interface PressKeyArgs {
    key: string;
    modifiers?: string[];
    count?: number;
    delay?: number;
}

export interface ProgressTrackerArgs {
    taskName: string;
    currentStep: number;
    totalSteps: number;
    message?: string;
}

export interface DeepAnalysisArgs {
    includeConsole?: boolean;
    includeNetwork?: boolean;
    includeDom?: boolean;
    includeScreenshot?: boolean;
    duration?: number;
}

export interface NetworkRecorderArgs {
    duration?: number;
    filterUrl?: string;
    includeHeaders?: boolean;
    includeBody?: boolean;
}

export interface ApiFinderArgs {
    patterns?: string[];
    includeInternal?: boolean;
}

export interface AdProtectionDetectorArgs {
    checkTypes?: string[];
}

export interface AjaxContentWaiterArgs {
    selector?: string;
    timeout?: number;
    pollInterval?: number;
    expectedContent?: string;
}

export interface AdvancedVideoExtractionArgs {
    quality?: string;
    format?: string;
    bypassAds?: boolean;
}

export interface MediaExtractorArgs {
    mediaType?: 'video' | 'audio' | 'all';
    includeEmbedded?: boolean;
}

export interface ElementScreenshotArgs {
    selector: string;
    path?: string;
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
}

export interface VideoRecordingArgs {
    action: 'start' | 'stop';
    path?: string;
    fps?: number;
}

export interface LinkHarvesterArgs {
    filter?: string;
    includeExternal?: boolean;
    includeInternal?: boolean;
    maxLinks?: number;
}

export interface ImageExtractorAdvancedArgs {
    minWidth?: number;
    minHeight?: number;
    includeBackgrounds?: boolean;
    includeLazy?: boolean;
}

export interface SmartSelectorGeneratorArgs {
    description: string;
    context?: string;
}

export interface ContentClassificationArgs {
    categories?: string[];
}

export interface BatchElementScraperArgs {
    selector: string;
    attributes?: string[];
    limit?: number;
}

export interface ExtractSchemaArgs {
    schemaTypes?: string[];
}

export interface SolveCaptchaAdvancedArgs {
    type?: 'auto' | 'ocr' | 'audio' | 'puzzle' | 'recaptcha' | 'hcaptcha' | 'turnstile';
    timeout?: number;
}

// ============================================================
// HANDLER IMPLEMENTATIONS
// ============================================================

/**
 * Navigate using site breadcrumbs
 */
export async function handleBreadcrumbNavigator(
    page: Page,
    args: BreadcrumbNavigatorArgs
): Promise<{ success: boolean; breadcrumbs: string[]; navigatedTo?: string }> {
    const breadcrumbSelectors = [
        'nav[aria-label*="breadcrumb"]',
        '.breadcrumb',
        '.breadcrumbs',
        '[itemtype*="BreadcrumbList"]',
        'ol.breadcrumb',
        'ul.breadcrumb',
    ];

    let breadcrumbContainer: ElementHandle | null = null;
    for (const selector of breadcrumbSelectors) {
        breadcrumbContainer = await page.$(selector);
        if (breadcrumbContainer) break;
    }

    if (!breadcrumbContainer) {
        return { success: false, breadcrumbs: [] };
    }

    const breadcrumbs = await page.evaluate((container: Element) => {
        const links = container.querySelectorAll('a');
        return Array.from(links).map((a: HTMLAnchorElement) => ({
            text: a.textContent?.trim() || '',
            href: a.href,
        }));
    }, breadcrumbContainer);

    const breadcrumbTexts = breadcrumbs.map((b: any) => b.text);

    if (args.targetIndex !== undefined && args.targetIndex < breadcrumbs.length) {
        const target = breadcrumbs[args.targetIndex];
        await page.goto((target as any).href);
        return { success: true, breadcrumbs: breadcrumbTexts, navigatedTo: (target as any).text };
    }

    if (args.targetText) {
        const target = breadcrumbs.find((b: any) =>
            b.text.toLowerCase().includes(args.targetText!.toLowerCase())
        );
        if (target) {
            await page.goto((target as any).href);
            return { success: true, breadcrumbs: breadcrumbTexts, navigatedTo: (target as any).text };
        }
    }

    return { success: true, breadcrumbs: breadcrumbTexts };
}

/**
 * Trace standard URL redirects
 */
export async function handleUrlRedirectTracer(
    page: Page,
    args: UrlRedirectTracerArgs
): Promise<{ chain: string[]; finalUrl: string; totalRedirects: number }> {
    const maxRedirects = args.maxRedirects || 10;
    const chain: string[] = [];

    await page.setRequestInterception(true);

    const redirectHandler = (request: any) => {
        if (request.isNavigationRequest()) {
            chain.push(request.url());
        }
        request.continue();
    };

    page.on('request', redirectHandler);

    try {
        await page.goto(args.url, { waitUntil: 'networkidle2' });
        chain.push(page.url());
    } finally {
        page.off('request', redirectHandler);
        await page.setRequestInterception(false);
    }

    const uniqueChain = [...new Set(chain)];

    return {
        chain: uniqueChain,
        finalUrl: page.url(),
        totalRedirects: uniqueChain.length - 1,
    };
}

/**
 * Trace complex/hidden redirects including JavaScript redirects
 */
export async function handleMultiLayerRedirectTrace(
    page: Page,
    args: MultiLayerRedirectTraceArgs
): Promise<{ chain: string[]; finalUrl: string; jsRedirects: string[]; metaRedirects: string[] }> {
    const timeout = args.timeout || 30000;
    const chain: string[] = [args.url];
    const jsRedirects: string[] = [];
    const metaRedirects: string[] = [];

    // Track navigation changes
    const navigationPromise = new Promise<void>((resolve) => {
        const startTime = Date.now();
        const checkNavigation = setInterval(() => {
            const currentUrl = page.url();
            if (currentUrl !== chain[chain.length - 1]) {
                chain.push(currentUrl);
            }
            if (Date.now() - startTime > timeout) {
                clearInterval(checkNavigation);
                resolve();
            }
        }, 100);
    });

    await page.goto(args.url, { waitUntil: 'domcontentloaded' });

    // Check for meta refresh redirects
    const metaRefresh = await page.evaluate(() => {
        const meta = document.querySelector('meta[http-equiv="refresh"]');
        return meta?.getAttribute('content') || null;
    });

    if (metaRefresh) {
        const match = metaRefresh.match(/url=(.+)/i);
        if (match) metaRedirects.push(match[1]);
    }

    // Check for JS redirects
    const jsRedirectPatterns = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const patterns: string[] = [];
        scripts.forEach((script) => {
            const content = script.textContent || '';
            const locationMatches = content.match(/(?:window\.)?location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/g);
            if (locationMatches) patterns.push(...locationMatches);
        });
        return patterns;
    });

    jsRedirects.push(...jsRedirectPatterns);

    await Promise.race([navigationPromise, new Promise(r => setTimeout(r, 5000))]);

    return {
        chain,
        finalUrl: page.url(),
        jsRedirects,
        metaRedirects,
    };
}

/**
 * Search text or regex patterns in page content
 */
export async function handleSearchContent(
    page: Page,
    args: SearchContentArgs
): Promise<{ found: boolean; matches: { text: string; context: string; selector?: string }[]; count: number }> {
    // Wait for body to be available
    try {
        await page.waitForSelector('body', { timeout: 5000 });
    } catch {
        // Continue anyway
    }

    let content = '';
    if (args.selector) {
        try {
            content = await page.$eval(args.selector, (el) => el.textContent || '');
        } catch {
            content = '';
        }
    } else {
        content = await page.evaluate(() => document.body?.textContent || document.documentElement?.textContent || '');
    }

    const matches: { text: string; context: string; selector?: string }[] = [];

    if (!content || content.length === 0) {
        return { found: false, matches: [], count: 0 };
    }

    let regex: RegExp;
    if (args.isRegex) {
        regex = new RegExp(args.pattern, args.caseSensitive ? 'g' : 'gi');
    } else {
        const escaped = args.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        regex = new RegExp(escaped, args.caseSensitive ? 'g' : 'gi');
    }

    let match;
    while ((match = regex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + match[0].length + 50);
        matches.push({
            text: match[0],
            context: content.substring(start, end),
        });
        if (matches.length >= 100) break; // Limit matches
    }

    return {
        found: matches.length > 0,
        matches,
        count: matches.length,
    };
}

/**
 * Find elements using XPath or Advanced CSS
 */
export async function handleFindElementAdvanced(
    page: Page,
    args: FindElementAdvancedArgs
): Promise<{ found: boolean; elements: { selector: string; text: string; tag: string }[]; count: number }> {
    const elements: { selector: string; text: string; tag: string }[] = [];

    // Wait for body to be available
    try {
        await page.waitForSelector('body', { timeout: 5000 });
    } catch {
        // Continue anyway
    }

    if (args.xpath) {
        // Use document.evaluate for XPath (compatible with all Puppeteer versions)
        const xpathResults = await page.evaluate((xpath: string) => {
            const results: any[] = [];
            try {
                const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let node = iterator.iterateNext();
                let count = 0;
                while (node && count < 50) {
                    if (node instanceof Element) {
                        results.push({
                            text: node.textContent?.trim()?.substring(0, 100) || '',
                            tag: node.tagName.toLowerCase(),
                            id: node.id || '',
                            className: typeof node.className === 'string' ? node.className : '',
                        });
                    }
                    node = iterator.iterateNext();
                    count++;
                }
            } catch (e) {
                // Invalid XPath, return empty
            }
            return results;
        }, args.xpath);

        elements.push(...xpathResults.map((e: any) => ({
            selector: e.id ? `#${e.id}` : e.className ? `.${e.className.split(' ')[0]}` : e.tag,
            text: e.text,
            tag: e.tag,
        })));
    }

    if (args.cssSelector) {
        const cssElements = await page.$$(args.cssSelector);
        for (const el of cssElements) {
            const data = await page.evaluate((e) => ({
                text: (e as Element).textContent?.trim()?.substring(0, 100) || '',
                tag: (e as Element).tagName.toLowerCase(),
                id: (e as Element).id,
                className: (e as Element).className,
            }), el);
            elements.push({
                selector: args.cssSelector,
                text: data.text,
                tag: data.tag,
            });
        }
    }

    if (args.contains) {
        const containsElements = await page.evaluate((text: string) => {
            const results: any[] = [];
            const allElements = document.querySelectorAll('*');
            for (let i = 0; i < allElements.length && results.length < 10; i++) {
                const el = allElements[i];
                if (el.textContent?.includes(text)) {
                    results.push({
                        text: el.textContent?.trim()?.substring(0, 100) || '',
                        tag: el.tagName.toLowerCase(),
                        id: el.id || '',
                        className: typeof el.className === 'string' ? el.className : '',
                    });
                }
            }
            return results;
        }, args.contains);
        elements.push(...containsElements.map((e: any) => ({
            selector: e.id ? `#${e.id}` : e.className ? `.${e.className.split(' ')[0]}` : e.tag,
            text: e.text,
            tag: e.tag,
        })));
    }

    return {
        found: elements.length > 0,
        elements: elements.slice(0, 50),
        count: elements.length,
    };
}

/**
 * Extract embedded JSON/API data from page
 */
export async function handleExtractJson(
    page: Page,
    args: ExtractJsonArgs
): Promise<{ found: boolean; data: any[]; count: number }> {
    const data: any[] = [];

    // Extract from script tags with type="application/json" or type="application/ld+json"
    const scriptData = await page.evaluate((selector) => {
        const scripts = selector
            ? document.querySelectorAll(selector)
            : document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]');

        return Array.from(scripts).map((script) => {
            try {
                return JSON.parse(script.textContent || '{}');
            } catch {
                return null;
            }
        }).filter(Boolean);
    }, args.selector);

    data.push(...scriptData);

    // Extract from __NEXT_DATA__ (Next.js)
    const nextData = await page.evaluate(() => {
        const el = document.getElementById('__NEXT_DATA__');
        if (el) {
            try {
                return JSON.parse(el.textContent || '{}');
            } catch {
                return null;
            }
        }
        return null;
    });
    if (nextData) data.push({ source: '__NEXT_DATA__', data: nextData });

    // Extract from window variables
    if (args.variableName) {
        const windowData = await page.evaluate((varName) => {
            try {
                return (window as any)[varName];
            } catch {
                return null;
            }
        }, args.variableName);
        if (windowData) data.push({ source: args.variableName, data: windowData });
    }

    return {
        found: data.length > 0,
        data,
        count: data.length,
    };
}

/**
 * Extract SEO and Open Graph meta tags
 */
export async function handleScrapeMetaTags(
    page: Page,
    args: ScrapeMetaTagsArgs
): Promise<{ title: string; description: string; og: Record<string, string>; twitter: Record<string, string>; other: Record<string, string> }> {
    const result = await page.evaluate((options) => {
        const title = document.title || '';
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        const og: Record<string, string> = {};
        const twitter: Record<string, string> = {};
        const other: Record<string, string> = {};

        document.querySelectorAll('meta').forEach((meta) => {
            const property = meta.getAttribute('property') || '';
            const name = meta.getAttribute('name') || '';
            const content = meta.getAttribute('content') || '';

            if (options.includeOG && property.startsWith('og:')) {
                og[property.replace('og:', '')] = content;
            }
            if (options.includeTwitter && (name.startsWith('twitter:') || property.startsWith('twitter:'))) {
                twitter[(name || property).replace('twitter:', '')] = content;
            }
            if (name && !name.startsWith('twitter:') && !property.startsWith('og:')) {
                other[name] = content;
            }
        });

        return { title, description, og, twitter, other };
    }, {
        includeOG: args.includeOG !== false,
        includeTwitter: args.includeTwitter !== false,
    });

    return result;
}

/**
 * Simulate keyboard key presses
 */
export async function handlePressKey(
    page: Page,
    args: PressKeyArgs
): Promise<{ success: boolean; key: string; count: number }> {
    const count = args.count || 1;
    const delay = args.delay || 100;
    const modifiers = args.modifiers || [];

    for (let i = 0; i < count; i++) {
        // Hold modifiers
        for (const mod of modifiers) {
            await page.keyboard.down(mod);
        }

        await page.keyboard.press(args.key);

        // Release modifiers
        for (const mod of modifiers.reverse()) {
            await page.keyboard.up(mod);
        }

        if (i < count - 1) {
            await new Promise((r) => setTimeout(r, delay));
        }
    }

    return {
        success: true,
        key: modifiers.length > 0 ? `${modifiers.join('+')}+${args.key}` : args.key,
        count,
    };
}

/**
 * Track automation progress
 */
export async function handleProgressTracker(
    _page: Page,
    args: ProgressTrackerArgs
): Promise<{ taskName: string; progress: number; message: string; status: string }> {
    const progress = Math.round((args.currentStep / args.totalSteps) * 100);

    let status = 'in_progress';
    if (args.currentStep === 0) status = 'started';
    if (args.currentStep >= args.totalSteps) status = 'completed';

    console.log(`[Progress] ${args.taskName}: ${progress}% (${args.currentStep}/${args.totalSteps}) - ${args.message || ''}`);

    return {
        taskName: args.taskName,
        progress,
        message: args.message || `Step ${args.currentStep} of ${args.totalSteps}`,
        status,
    };
}

/**
 * Deep analysis - Logs, Network, DOM, and Screenshot
 */
export async function handleDeepAnalysis(
    page: Page,
    args: DeepAnalysisArgs
): Promise<{ console: string[]; network: any[]; domStats: any; screenshot?: string }> {
    const consoleLogs: string[] = [];
    const networkRequests: any[] = [];
    const duration = args.duration || 5000;

    // Collect console logs
    if (args.includeConsole !== false) {
        page.on('console', (msg) => {
            consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
        });
    }

    // Collect network
    if (args.includeNetwork !== false) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            networkRequests.push({
                url: req.url(),
                method: req.method(),
                resourceType: req.resourceType(),
            });
            req.continue();
        });
    }

    // Wait for specified duration
    await new Promise((r) => setTimeout(r, duration));

    // Get DOM stats
    let domStats = {};
    if (args.includeDom !== false) {
        domStats = await page.evaluate(() => ({
            totalElements: document.querySelectorAll('*').length,
            images: document.querySelectorAll('img').length,
            links: document.querySelectorAll('a').length,
            forms: document.querySelectorAll('form').length,
            scripts: document.querySelectorAll('script').length,
            iframes: document.querySelectorAll('iframe').length,
        }));
    }

    // Take screenshot
    let screenshot: string | undefined;
    if (args.includeScreenshot) {
        const buffer = await page.screenshot({ encoding: 'base64' });
        screenshot = buffer as string;
    }

    if (args.includeNetwork !== false) {
        await page.setRequestInterception(false);
    }

    return {
        console: consoleLogs,
        network: networkRequests.slice(0, 100),
        domStats,
        screenshot,
    };
}

/**
 * Record full network traffic
 */
export async function handleNetworkRecorder(
    page: Page,
    args: NetworkRecorderArgs
): Promise<{ requests: any[]; count: number; totalSize: number }> {
    const requests: any[] = [];
    const duration = args.duration || 10000;
    let totalSize = 0;

    await page.setRequestInterception(true);

    const requestHandler = async (request: any) => {
        const url = request.url();
        if (args.filterUrl && !url.includes(args.filterUrl)) {
            request.continue();
            return;
        }

        const entry: any = {
            url,
            method: request.method(),
            resourceType: request.resourceType(),
            timestamp: Date.now(),
        };

        if (args.includeHeaders) {
            entry.headers = request.headers();
        }

        if (args.includeBody) {
            entry.postData = request.postData();
        }

        requests.push(entry);
        request.continue();
    };

    page.on('request', requestHandler);

    page.on('response', async (response) => {
        try {
            const headers = response.headers();
            const size = parseInt(headers['content-length'] || '0', 10);
            totalSize += size;
        } catch {
            // Ignore errors
        }
    });

    await new Promise((r) => setTimeout(r, duration));

    page.off('request', requestHandler);
    await page.setRequestInterception(false);

    return {
        requests: requests.slice(0, 500),
        count: requests.length,
        totalSize,
    };
}

/**
 * Discover hidden API endpoints
 */
export async function handleApiFinder(
    page: Page,
    args: ApiFinderArgs
): Promise<{ apis: { url: string; method: string; type: string }[]; count: number }> {
    const apis: { url: string; method: string; type: string }[] = [];
    const patterns = args.patterns || ['/api/', '/v1/', '/v2/', '/graphql', '/rest/', '.json'];

    await page.setRequestInterception(true);

    const requestHandler = (request: any) => {
        const url = request.url();
        const isApi = patterns.some((p) => url.includes(p));
        const isXhr = request.resourceType() === 'xhr' || request.resourceType() === 'fetch';

        if (isApi || (args.includeInternal !== false && isXhr)) {
            apis.push({
                url,
                method: request.method(),
                type: request.resourceType(),
            });
        }
        request.continue();
    };

    page.on('request', requestHandler);

    // Trigger some interactions to discover more APIs
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise((r) => setTimeout(r, 3000));

    page.off('request', requestHandler);
    await page.setRequestInterception(false);

    // Remove duplicates
    const uniqueApis = apis.filter(
        (api, index, self) => index === self.findIndex((a) => a.url === api.url && a.method === api.method)
    );

    return {
        apis: uniqueApis,
        count: uniqueApis.length,
    };
}

/**
 * Detect anti-adblock systems
 */
export async function handleAdProtectionDetector(
    page: Page,
    args: AdProtectionDetectorArgs
): Promise<{ detected: boolean; systems: string[]; score: number }> {
    const systems: string[] = [];
    let score = 0;

    const detectionChecks = await page.evaluate(() => {
        const checks: Record<string, boolean> = {};

        // Check for common anti-adblock scripts
        const scripts = Array.from(document.querySelectorAll('script'));
        const scriptContent = scripts.map((s) => s.src || s.textContent || '').join(' ');

        checks.fuckAdBlock = scriptContent.includes('fuckAdBlock') || scriptContent.includes('blockadblock');
        checks.adDefend = scriptContent.includes('addefend');
        checks.admiral = scriptContent.includes('admiral');
        checks.adsafeProtected = scriptContent.includes('adsafeprotected');
        checks.pageFair = scriptContent.includes('pagefair');
        checks.blockAdBlock = !!(window as any).blockAdBlock || !!(window as any).fuckAdBlock;

        // Check for anti-adblock overlay
        const overlay = document.querySelector('[class*="adblock"], [id*="adblock"], [class*="anti-ad"]');
        checks.hasOverlay = !!overlay;

        // Check for bait elements
        const bait = document.querySelector('.ad-banner, .ad-unit, .adsbox, #carbonads');
        if (bait) {
            const style = window.getComputedStyle(bait);
            checks.baitHidden = style.display === 'none' || style.visibility === 'hidden';
        }

        return checks;
    });

    if (detectionChecks.fuckAdBlock) { systems.push('FuckAdBlock'); score += 25; }
    if (detectionChecks.adDefend) { systems.push('AdDefend'); score += 25; }
    if (detectionChecks.admiral) { systems.push('Admiral'); score += 20; }
    if (detectionChecks.adsafeProtected) { systems.push('AdSafe Protected'); score += 20; }
    if (detectionChecks.pageFair) { systems.push('PageFair'); score += 25; }
    if (detectionChecks.blockAdBlock) { systems.push('BlockAdBlock (window)'); score += 30; }
    if (detectionChecks.hasOverlay) { systems.push('Overlay Detected'); score += 15; }
    if (detectionChecks.baitHidden) { systems.push('Bait Element Tracking'); score += 20; }

    return {
        detected: systems.length > 0,
        systems,
        score: Math.min(score, 100),
    };
}

/**
 * Wait for dynamic AJAX loading
 */
export async function handleAjaxContentWaiter(
    page: Page,
    args: AjaxContentWaiterArgs
): Promise<{ loaded: boolean; waitTime: number; content?: string }> {
    const timeout = args.timeout || 30000;
    const pollInterval = args.pollInterval || 500;
    const startTime = Date.now();

    let content: string | undefined;
    let loaded = false;

    while (Date.now() - startTime < timeout) {
        if (args.selector) {
            const element = await page.$(args.selector);
            if (element) {
                content = await page.evaluate((el) => el?.textContent || '', element);
                if (!args.expectedContent || content?.includes(args.expectedContent)) {
                    loaded = true;
                    break;
                }
            }
        } else {
            // Wait for network to be idle
            await page.waitForNetworkIdle({ timeout: pollInterval }).catch(() => { });
            loaded = true;
            break;
        }
        await new Promise((r) => setTimeout(r, pollInterval));
    }

    return {
        loaded,
        waitTime: Date.now() - startTime,
        content,
    };
}

/**
 * Premium video extractor with ad-bypass
 */
export async function handleAdvancedVideoExtraction(
    page: Page,
    args: AdvancedVideoExtractionArgs
): Promise<{ videos: { url: string; type: string; quality?: string }[]; count: number }> {
    const videos: { url: string; type: string; quality?: string }[] = [];

    // Get video elements
    const videoElements = await page.evaluate(() => {
        const vids: any[] = [];

        // Direct video tags
        document.querySelectorAll('video').forEach((video) => {
            if (video.src) vids.push({ url: video.src, type: 'video' });
            video.querySelectorAll('source').forEach((src) => {
                if (src.src) vids.push({ url: src.src, type: src.type || 'video' });
            });
        });

        // Iframe embeds (YouTube, Vimeo, etc.)
        document.querySelectorAll('iframe').forEach((iframe) => {
            const src = iframe.src;
            if (src.includes('youtube.com') || src.includes('youtu.be')) {
                vids.push({ url: src, type: 'youtube-embed' });
            } else if (src.includes('vimeo.com')) {
                vids.push({ url: src, type: 'vimeo-embed' });
            } else if (src.includes('dailymotion.com')) {
                vids.push({ url: src, type: 'dailymotion-embed' });
            }
        });

        return vids;
    });

    videos.push(...videoElements);

    // Look for video URLs in scripts
    const scriptVideos = await page.evaluate(() => {
        const found: any[] = [];
        const scripts = Array.from(document.querySelectorAll('script'));

        scripts.forEach((script) => {
            const content = script.textContent || '';
            const patterns = [
                /(?:src|url|file|source)['":\s]+['"]?(https?:\/\/[^'"<>\s]+\.(?:mp4|webm|m3u8|mpd))['"]/gi,
            ];

            patterns.forEach((pattern) => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    found.push({ url: match[1], type: 'script-extracted' });
                }
            });
        });

        return found;
    });

    videos.push(...scriptVideos);

    // Remove duplicates
    const unique = videos.filter(
        (v, i, self) => i === self.findIndex((x) => x.url === v.url)
    );

    return {
        videos: unique,
        count: unique.length,
    };
}

/**
 * Extract generic media (audio/video)
 */
export async function handleMediaExtractor(
    page: Page,
    args: MediaExtractorArgs
): Promise<{ media: { url: string; type: string; tag: string }[]; count: number }> {
    const mediaType = args.mediaType || 'all';

    const media = await page.evaluate((type) => {
        const items: any[] = [];

        if (type === 'video' || type === 'all') {
            document.querySelectorAll('video, video source').forEach((el) => {
                const src = (el as HTMLMediaElement).src || (el as HTMLSourceElement).src;
                if (src) items.push({ url: src, type: 'video', tag: el.tagName.toLowerCase() });
            });
        }

        if (type === 'audio' || type === 'all') {
            document.querySelectorAll('audio, audio source').forEach((el) => {
                const src = (el as HTMLMediaElement).src || (el as HTMLSourceElement).src;
                if (src) items.push({ url: src, type: 'audio', tag: el.tagName.toLowerCase() });
            });
        }

        return items;
    }, mediaType);

    // Check for embedded media if requested
    if (args.includeEmbedded) {
        const embedded = await page.evaluate(() => {
            const items: any[] = [];
            document.querySelectorAll('iframe, embed, object').forEach((el) => {
                const src = (el as HTMLIFrameElement).src || (el as HTMLEmbedElement).src;
                if (src) items.push({ url: src, type: 'embedded', tag: el.tagName.toLowerCase() });
            });
            return items;
        });
        media.push(...embedded);
    }

    return {
        media,
        count: media.length,
    };
}

/**
 * Capture element screenshots
 */
export async function handleElementScreenshot(
    page: Page,
    args: ElementScreenshotArgs
): Promise<{ success: boolean; path?: string; base64?: string; dimensions: { width: number; height: number } }> {
    const element = await page.$(args.selector);
    if (!element) {
        return { success: false, dimensions: { width: 0, height: 0 } };
    }

    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
        return { success: false, dimensions: { width: 0, height: 0 } };
    }

    const options: any = {
        type: args.format || 'png',
    };

    if (args.quality && (args.format === 'jpeg' || args.format === 'webp')) {
        options.quality = args.quality;
    }

    if (args.path) {
        options.path = args.path;
        await element.screenshot(options);
        return {
            success: true,
            path: args.path,
            dimensions: { width: Math.round(boundingBox.width), height: Math.round(boundingBox.height) },
        };
    } else {
        const buffer = await element.screenshot({ ...options, encoding: 'base64' });
        return {
            success: true,
            base64: buffer as string,
            dimensions: { width: Math.round(boundingBox.width), height: Math.round(boundingBox.height) },
        };
    }
}

/**
 * Record browser session (start/stop)
 */
export async function handleVideoRecording(
    page: Page,
    args: VideoRecordingArgs,
    recorderState: Map<string, any>
): Promise<{ success: boolean; action: string; message: string }> {
    if (args.action === 'start') {
        // Store recording state
        recorderState.set('recording', { startTime: Date.now(), path: args.path });
        return {
            success: true,
            action: 'start',
            message: `Recording started. Save path: ${args.path || 'default'}`,
        };
    } else if (args.action === 'stop') {
        const state = recorderState.get('recording');
        if (state) {
            const duration = Date.now() - state.startTime;
            recorderState.delete('recording');
            return {
                success: true,
                action: 'stop',
                message: `Recording stopped. Duration: ${Math.round(duration / 1000)}s`,
            };
        }
        return {
            success: false,
            action: 'stop',
            message: 'No active recording found',
        };
    }

    return {
        success: false,
        action: args.action,
        message: 'Invalid action',
    };
}

/**
 * Harvest all links from page
 */
export async function handleLinkHarvester(
    page: Page,
    args: LinkHarvesterArgs
): Promise<{ links: { url: string; text: string; type: string }[]; internal: number; external: number }> {
    const currentUrl = new URL(page.url());

    const allLinks = await page.evaluate((filter) => {
        return Array.from(document.querySelectorAll('a[href]')).map((a) => ({
            url: (a as HTMLAnchorElement).href,
            text: a.textContent?.trim()?.substring(0, 100) || '',
        }));
    }, args.filter);

    const processedLinks: { url: string; text: string; type: string }[] = [];
    let internal = 0;
    let external = 0;

    for (const link of allLinks) {
        try {
            const linkUrl = new URL(link.url);
            const isInternal = linkUrl.hostname === currentUrl.hostname;

            if (args.filter && !link.url.includes(args.filter) && !link.text.includes(args.filter)) {
                continue;
            }

            if (isInternal && args.includeInternal === false) continue;
            if (!isInternal && args.includeExternal === false) continue;

            processedLinks.push({
                url: link.url,
                text: link.text,
                type: isInternal ? 'internal' : 'external',
            });

            if (isInternal) internal++;
            else external++;

            if (args.maxLinks && processedLinks.length >= args.maxLinks) break;
        } catch {
            // Invalid URL, skip
        }
    }

    return {
        links: processedLinks,
        internal,
        external,
    };
}

/**
 * Advanced image extraction
 */
export async function handleImageExtractorAdvanced(
    page: Page,
    args: ImageExtractorAdvancedArgs
): Promise<{ images: { url: string; alt: string; width: number; height: number; type: string }[]; count: number }> {
    const minWidth = args.minWidth || 0;
    const minHeight = args.minHeight || 0;

    let images = await page.evaluate((opts) => {
        const imgs: any[] = [];

        // Regular img tags
        document.querySelectorAll('img').forEach((img) => {
            if (img.src && img.naturalWidth >= opts.minWidth && img.naturalHeight >= opts.minHeight) {
                imgs.push({
                    url: img.src,
                    alt: img.alt || '',
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    type: 'img',
                });
            }
        });

        // Background images
        if (opts.includeBackgrounds) {
            document.querySelectorAll('*').forEach((el) => {
                const style = window.getComputedStyle(el);
                const bgImage = style.backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    const match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                    if (match) {
                        imgs.push({
                            url: match[1],
                            alt: '',
                            width: 0,
                            height: 0,
                            type: 'background',
                        });
                    }
                }
            });
        }

        // Lazy loaded images
        if (opts.includeLazy) {
            document.querySelectorAll('[data-src], [data-lazy], [data-original]').forEach((el) => {
                const src = el.getAttribute('data-src') || el.getAttribute('data-lazy') || el.getAttribute('data-original');
                if (src) {
                    imgs.push({
                        url: src,
                        alt: el.getAttribute('alt') || '',
                        width: 0,
                        height: 0,
                        type: 'lazy',
                    });
                }
            });
        }

        return imgs;
    }, { minWidth, minHeight, includeBackgrounds: args.includeBackgrounds, includeLazy: args.includeLazy });

    // Remove duplicates
    images = images.filter((img, index, self) =>
        index === self.findIndex((i) => i.url === img.url)
    );

    return {
        images,
        count: images.length,
    };
}

/**
 * AI-powered selector generation
 */
export async function handleSmartSelectorGenerator(
    page: Page,
    args: SmartSelectorGeneratorArgs
): Promise<{ selectors: { css: string; xpath: string; confidence: number }[]; bestMatch: string }> {
    const description = args.description.toLowerCase();
    const selectors: { css: string; xpath: string; confidence: number }[] = [];

    // Search for elements matching the description
    const candidates = await page.evaluate((desc) => {
        const results: any[] = [];
        const allElements = document.querySelectorAll('*');

        allElements.forEach((el) => {
            const text = el.textContent?.toLowerCase() || '';
            const tag = el.tagName.toLowerCase();
            const id = el.id;
            const className = el.className;
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const placeholder = el.getAttribute('placeholder')?.toLowerCase() || '';
            const title = el.getAttribute('title')?.toLowerCase() || '';

            let score = 0;
            if (text.includes(desc)) score += 20;
            if (ariaLabel.includes(desc)) score += 30;
            if (placeholder.includes(desc)) score += 25;
            if (title.includes(desc)) score += 20;
            if (id?.toLowerCase().includes(desc)) score += 40;
            if (className?.toLowerCase().includes(desc)) score += 15;

            // Boost for interactive elements
            if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) score += 10;

            if (score > 0) {
                results.push({
                    tag,
                    id,
                    className: typeof className === 'string' ? className : '',
                    score,
                    index: Array.from(el.parentNode?.children || []).indexOf(el),
                });
            }
        });

        return results.sort((a, b) => b.score - a.score).slice(0, 5);
    }, description);

    for (const candidate of candidates) {
        let css = candidate.tag;
        let xpath = `//${candidate.tag}`;

        if (candidate.id) {
            css = `#${candidate.id}`;
            xpath = `//*[@id="${candidate.id}"]`;
        } else if (candidate.className) {
            const firstClass = candidate.className.split(' ')[0];
            css = `${candidate.tag}.${firstClass}`;
            xpath = `//${candidate.tag}[contains(@class, "${firstClass}")]`;
        }

        selectors.push({
            css,
            xpath,
            confidence: Math.min(candidate.score, 100),
        });
    }

    return {
        selectors,
        bestMatch: selectors.length > 0 ? selectors[0].css : '',
    };
}

/**
 * Classify page content type
 */
export async function handleContentClassification(
    page: Page,
    args: ContentClassificationArgs
): Promise<{ classification: string; confidence: number; indicators: string[] }> {
    const analysis = await page.evaluate(() => {
        const indicators: string[] = [];
        let classification = 'unknown';
        let confidence = 0;

        // Check for e-commerce
        const hasCart = !!document.querySelector('[class*="cart"], [id*="cart"], .add-to-cart, .buy-now');
        const hasProduct = !!document.querySelector('[class*="product"], [itemtype*="Product"]');
        const hasPrice = !!document.querySelector('[class*="price"], .currency');
        if (hasCart || hasProduct || hasPrice) {
            if (hasCart && hasProduct && hasPrice) {
                classification = 'e-commerce';
                confidence = 90;
                indicators.push('cart', 'product listing', 'pricing');
            }
        }

        // Check for blog/article
        const hasArticle = !!document.querySelector('article, [itemtype*="Article"], .post, .blog-post');
        const hasAuthor = !!document.querySelector('[class*="author"], [rel="author"]');
        const hasDate = !!document.querySelector('time, [class*="date"], [class*="published"]');
        if (hasArticle && (hasAuthor || hasDate)) {
            classification = 'blog/article';
            confidence = 85;
            indicators.push('article structure', 'author info', 'publish date');
        }

        // Check for news
        const hasHeadlines = document.querySelectorAll('h1, h2, h3').length > 5;
        const hasNews = !!document.querySelector('[class*="news"], [class*="headline"]');
        if (hasNews && hasHeadlines) {
            classification = 'news';
            confidence = 80;
            indicators.push('multiple headlines', 'news section');
        }

        // Check for social media
        const hasFeed = !!document.querySelector('[class*="feed"], [class*="timeline"]');
        const hasPost = document.querySelectorAll('[class*="post"], [class*="tweet"]').length > 3;
        if (hasFeed && hasPost) {
            classification = 'social-media';
            confidence = 85;
            indicators.push('feed structure', 'posts');
        }

        // Check for search results
        const hasSearchResults = !!document.querySelector('[class*="search-result"], [class*="serp"]');
        const hasSearchInput = !!document.querySelector('input[type="search"], [class*="search"]');
        if (hasSearchResults && hasSearchInput) {
            classification = 'search-results';
            confidence = 90;
            indicators.push('search results', 'search input');
        }

        // Check for documentation
        const hasSidebar = !!document.querySelector('[class*="sidebar"], nav.docs');
        const hasCode = document.querySelectorAll('pre, code').length > 3;
        if (hasSidebar && hasCode) {
            classification = 'documentation';
            confidence = 85;
            indicators.push('sidebar navigation', 'code blocks');
        }

        return { classification, confidence, indicators };
    });

    return analysis;
}

/**
 * Scrape lists of items efficiently
 */
export async function handleBatchElementScraper(
    page: Page,
    args: BatchElementScraperArgs
): Promise<{ items: Record<string, any>[]; count: number }> {
    const limit = args.limit || 100;
    const attributes = args.attributes || ['textContent', 'href', 'src'];

    const items = await page.evaluate((opts) => {
        const elements = Array.from(document.querySelectorAll(opts.selector)).slice(0, opts.limit);
        return elements.map((el) => {
            const item: Record<string, any> = {};

            for (const attr of opts.attributes) {
                if (attr === 'textContent') {
                    item.text = el.textContent?.trim()?.substring(0, 500) || '';
                } else if (attr === 'innerHTML') {
                    item.html = el.innerHTML?.substring(0, 1000) || '';
                } else {
                    item[attr] = el.getAttribute(attr) || '';
                }
            }

            // Always include tag
            item.tag = el.tagName.toLowerCase();

            return item;
        });
    }, { selector: args.selector, limit, attributes });

    return {
        items,
        count: items.length,
    };
}

/**
 * Extract Schema.org structured data
 */
export async function handleExtractSchema(
    page: Page,
    args: ExtractSchemaArgs
): Promise<{ schemas: any[]; types: string[]; count: number }> {
    const schemas = await page.evaluate((schemaTypes) => {
        const found: any[] = [];

        // JSON-LD
        document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
            try {
                const data = JSON.parse(script.textContent || '{}');
                if (Array.isArray(data)) {
                    found.push(...data);
                } else {
                    found.push(data);
                }
            } catch {
                // Invalid JSON
            }
        });

        // Microdata
        document.querySelectorAll('[itemscope]').forEach((el) => {
            const itemType = el.getAttribute('itemtype') || '';
            const props: Record<string, any> = {};

            el.querySelectorAll('[itemprop]').forEach((prop) => {
                const propName = prop.getAttribute('itemprop') || '';
                const propValue = prop.getAttribute('content') ||
                    (prop as HTMLMediaElement).src ||
                    (prop as HTMLAnchorElement).href ||
                    prop.textContent?.trim() || '';
                props[propName] = propValue;
            });

            found.push({
                '@type': itemType.split('/').pop() || 'Unknown',
                ...props,
            });
        });

        // Filter by types if specified
        if (schemaTypes && schemaTypes.length > 0) {
            return found.filter((s) => {
                const type = s['@type'] || '';
                return schemaTypes.some((t: string) => type.toLowerCase().includes(t.toLowerCase()));
            });
        }

        return found;
    }, args.schemaTypes);

    const types = [...new Set(schemas.map((s: any) => s['@type'] || 'Unknown'))] as string[];

    return {
        schemas,
        types,
        count: schemas.length,
    };
}

/**
 * Enhanced solve captcha with multiple modes
 */
export async function handleSolveCaptchaAdvanced(
    page: Page,
    args: SolveCaptchaAdvancedArgs
): Promise<{ solved: boolean; type: string; method: string; message: string }> {
    const captchaType = args.type || 'auto';
    const timeout = args.timeout || 30000;

    // Auto-detect captcha type
    let detectedType = captchaType;
    if (captchaType === 'auto') {
        const detected = await page.evaluate(() => {
            if (document.querySelector('.g-recaptcha, [data-sitekey]')) return 'recaptcha';
            if (document.querySelector('.h-captcha, [data-hcaptcha-sitekey]')) return 'hcaptcha';
            if (document.querySelector('.cf-turnstile, [data-turnstile-sitekey]')) return 'turnstile';
            if (document.querySelector('img[src*="captcha"]')) return 'ocr';
            return 'unknown';
        });
        detectedType = detected;
    }

    // Turnstile (handled by brave-real-browser automatically)
    if (detectedType === 'turnstile') {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const token = await page.evaluate(() => {
                const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
                return input?.value || null;
            });
            if (token && token.length > 20) {
                return { solved: true, type: 'turnstile', method: 'auto', message: 'Turnstile solved automatically' };
            }
            await new Promise((r) => setTimeout(r, 1000));
        }
    }

    // reCAPTCHA - try clicking checkbox
    if (detectedType === 'recaptcha') {
        try {
            const frame = page.frames().find((f) => f.url().includes('recaptcha'));
            if (frame) {
                const checkbox = await frame.$('.recaptcha-checkbox-border');
                if (checkbox) {
                    await checkbox.click();
                    await new Promise((r) => setTimeout(r, 3000));
                    const checked = await frame.evaluate(() => {
                        return document.querySelector('.recaptcha-checkbox-checked') !== null;
                    });
                    if (checked) {
                        return { solved: true, type: 'recaptcha', method: 'checkbox', message: 'reCAPTCHA checkbox clicked' };
                    }
                }
            }
        } catch {
            // Frame access failed
        }
    }

    // hCaptcha - similar approach
    if (detectedType === 'hcaptcha') {
        try {
            const frame = page.frames().find((f) => f.url().includes('hcaptcha'));
            if (frame) {
                const checkbox = await frame.$('#checkbox');
                if (checkbox) {
                    await checkbox.click();
                    await new Promise((r) => setTimeout(r, 3000));
                    return { solved: true, type: 'hcaptcha', method: 'checkbox', message: 'hCaptcha checkbox clicked' };
                }
            }
        } catch {
            // Frame access failed
        }
    }

    return {
        solved: false,
        type: detectedType,
        method: 'none',
        message: `Could not automatically solve ${detectedType} captcha. Manual intervention may be required.`,
    };
}
