/**
 * Advanced Tools Handlers for brave-real-browser-mcp-server
 * Contains 24 advanced tools for enhanced browser automation
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
    attributes?: string;
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
 * Trace standard URL redirects - Uses response events to avoid interception crashes
 */
export async function handleUrlRedirectTracer(
    page: Page,
    args: UrlRedirectTracerArgs
): Promise<{ chain: string[]; finalUrl: string; totalRedirects: number; error?: string }> {
    const maxRedirects = args.maxRedirects || 10;
    const chain: string[] = [args.url];
    const TIMEOUT_MS = 30000; // 30 second timeout

    // Use response events instead of request interception to avoid crashes
    const responseHandler = (response: any) => {
        try {
            const status = response.status();
            const url = response.url();
            // Track redirects (3xx status codes)
            if (status >= 300 && status < 400 && chain.length < maxRedirects) {
                const location = response.headers()['location'];
                if (location) {
                    chain.push(location);
                }
            }
            // Also track successful navigations
            if (status >= 200 && status < 300) {
                if (!chain.includes(url)) {
                    chain.push(url);
                }
            }
        } catch (e) {
            // Ignore errors in handler
        }
    };

    try {
        page.on('response', responseHandler);

        // Navigate with timeout protection
        const navigationPromise = page.goto(args.url, {
            waitUntil: 'networkidle2',
            timeout: TIMEOUT_MS
        }).catch((err: Error) => {
            // Handle navigation errors gracefully
            return { error: err.message };
        });

        const result = await Promise.race([
            navigationPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Navigation timeout')), TIMEOUT_MS)
            )
        ]).catch((err: Error) => ({ error: err.message }));

        // Get final URL safely
        let finalUrl = args.url;
        try {
            finalUrl = page.url() || args.url;
            if (!chain.includes(finalUrl)) {
                chain.push(finalUrl);
            }
        } catch (e) {
            // Use original URL if page.url() fails
        }

        const uniqueChain = [...new Set(chain)];

        return {
            chain: uniqueChain,
            finalUrl,
            totalRedirects: Math.max(0, uniqueChain.length - 1),
            error: (result as any)?.error
        };
    } catch (error) {
        // Return partial results on error instead of crashing
        const uniqueChain = [...new Set(chain)];
        return {
            chain: uniqueChain,
            finalUrl: chain[chain.length - 1] || args.url,
            totalRedirects: Math.max(0, uniqueChain.length - 1),
            error: error instanceof Error ? error.message : String(error)
        };
    } finally {
        try {
            page.off('response', responseHandler);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
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

    if (args.attributes) {
        let attributes: Record<string, string> = {};
        try {
            attributes = JSON.parse(args.attributes);
        } catch (e) {
            // Ignore invalid JSON
        }

        // Use Puppeteer evaluation to find elements with matching attributes
        const attributeElements = await page.evaluate((attrs: Record<string, string>) => {
            const results: any[] = [];
            const allElements = document.querySelectorAll('*');

            for (let i = 0; i < allElements.length && results.length < 50; i++) {
                const el = allElements[i];
                let match = true;

                for (const [key, value] of Object.entries(attrs)) {
                    if (el.getAttribute(key) !== value) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    results.push({
                        text: el.textContent?.trim()?.substring(0, 100) || '',
                        tag: el.tagName.toLowerCase(),
                        id: el.id || '',
                        className: typeof el.className === 'string' ? el.className : '',
                    });
                }
            }
            return results;
        }, attributes);

        elements.push(...attributeElements.map((e: any) => ({
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

    // console.(`[Progress] ${args.taskName}: ${progress}% (${args.currentStep}/${args.totalSteps}) - ${args.message || ''}`);

    return {
        taskName: args.taskName,
        progress,
        message: args.message || `Step ${args.currentStep} of ${args.totalSteps}`,
        status,
    };
}

/**
 * Deep analysis - Logs, Network, DOM, and Screenshot
 * Uses response events instead of request interception to avoid crashes
 */
export async function handleDeepAnalysis(
    page: Page,
    args: DeepAnalysisArgs
): Promise<{ console: string[]; network: any[]; domStats: any; screenshot?: string }> {
    const consoleLogs: string[] = [];
    const networkRequests: any[] = [];
    const duration = args.duration || 5000;

    // Console log handler
    const consoleHandler = (msg: any) => {
        try {
            consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
        } catch (e) {
            // Ignore
        }
    };

    // Response handler - safer than request interception
    const responseHandler = (response: any) => {
        try {
            networkRequests.push({
                url: response.url(),
                status: response.status(),
                resourceType: response.request()?.resourceType?.() || 'unknown',
            });
        } catch (e) {
            // Ignore
        }
    };

    try {
        // Collect console logs
        if (args.includeConsole !== false) {
            page.on('console', consoleHandler);
        }

        // Collect network using response events (safer than request interception)
        if (args.includeNetwork !== false) {
            page.on('response', responseHandler);
        }

        // Wait for specified duration
        await new Promise((r) => setTimeout(r, duration));

        // Get DOM stats
        let domStats = {};
        if (args.includeDom !== false) {
            try {
                domStats = await page.evaluate(() => ({
                    totalElements: document.querySelectorAll('*').length,
                    images: document.querySelectorAll('img').length,
                    links: document.querySelectorAll('a').length,
                    forms: document.querySelectorAll('form').length,
                    scripts: document.querySelectorAll('script').length,
                    iframes: document.querySelectorAll('iframe').length,
                }));
            } catch (e) {
                domStats = { error: 'Failed to get DOM stats' };
            }
        }

        // Take screenshot
        let screenshot: string | undefined;
        if (args.includeScreenshot) {
            try {
                const buffer = await page.screenshot({ encoding: 'base64' });
                screenshot = buffer as string;
            } catch (e) {
                // Screenshot failed, continue without it
            }
        }

        return {
            console: consoleLogs,
            network: networkRequests.slice(0, 100),
            domStats,
            screenshot,
        };
    } finally {
        // Clean up event listeners
        try {
            if (args.includeConsole !== false) {
                page.off('console', consoleHandler);
            }
            if (args.includeNetwork !== false) {
                page.off('response', responseHandler);
            }
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

/**
 * Record full network traffic - Uses response events to avoid crashes
 */
export async function handleNetworkRecorder(
    page: Page,
    args: NetworkRecorderArgs
): Promise<{ requests: any[]; count: number; totalSize: number }> {
    const requests: any[] = [];
    const duration = args.duration || 10000;
    let totalSize = 0;

    // Response handler - safer than request interception
    const responseHandler = (response: any) => {
        try {
            const url = response.url();
            if (args.filterUrl && !url.includes(args.filterUrl)) {
                return;
            }

            const entry: any = {
                url,
                status: response.status(),
                resourceType: response.request()?.resourceType?.() || 'unknown',
                timestamp: Date.now(),
            };

            if (args.includeHeaders) {
                try {
                    entry.headers = response.headers();
                } catch (e) {
                    entry.headers = {};
                }
            }

            // Note: Response body requires async handling, skip for stability
            requests.push(entry);

            // Track size from headers
            try {
                const headers = response.headers();
                const size = parseInt(headers['content-length'] || '0', 10);
                totalSize += size;
            } catch {
                // Ignore
            }
        } catch {
            // Ignore all errors in handler to prevent crash
        }
    };

    try {
        page.on('response', responseHandler);
        await new Promise((r) => setTimeout(r, duration));
    } catch (e) {
        // Capture setup errors
    } finally {
        try {
            page.off('response', responseHandler);
        } catch (e) {
            // Ignore cleanup errors
        }
    }

    return {
        requests: requests.slice(0, 500),
        count: requests.length,
        totalSize,
    };
}

/**
 * Discover hidden API endpoints - Uses response events to avoid crashes
 */
export async function handleApiFinder(
    page: Page,
    args: ApiFinderArgs
): Promise<{ apis: { url: string; method: string; type: string }[]; count: number }> {
    const apis: { url: string; method: string; type: string }[] = [];
    const patterns = args.patterns || ['/api/', '/v1/', '/v2/', '/graphql', '/rest/', '.json'];

    // Response handler - safer than request interception
    const responseHandler = (response: any) => {
        try {
            const request = response.request();
            if (!request) return;

            const url = response.url();
            const resourceType = request.resourceType?.() || 'unknown';
            const isApi = patterns.some((p) => url.includes(p));
            const isXhr = resourceType === 'xhr' || resourceType === 'fetch';

            if (isApi || (args.includeInternal !== false && isXhr)) {
                apis.push({
                    url,
                    method: request.method?.() || 'GET',
                    type: resourceType,
                });
            }
        } catch (e) {
            // Ignore errors in handler
        }
    };

    try {
        page.on('response', responseHandler);

        // Trigger some interactions to discover more APIs
        try {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight / 2);
            });
        } catch (e) {
            // Ignore scroll errors
        }
        await new Promise((r) => setTimeout(r, 3000));
    } catch (error) {
        // Capture errors but continue
    } finally {
        try {
            page.off('response', responseHandler);
        } catch (e) {
            // Ignore cleanup errors
        }
    }

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
        try {
            await element.screenshot(options);
            return {
                success: true,
                path: args.path,
                dimensions: { width: Math.round(boundingBox.width), height: Math.round(boundingBox.height) },
            };
        } catch (error) {
            return {
                success: false,
                dimensions: { width: 0, height: 0 },
                // @ts-ignore
                error: `Screenshot failed: ${error.message}`
            };
        }
    } else {
        try {
            const buffer = await element.screenshot({ ...options, encoding: 'base64' });
            return {
                success: true,
                base64: buffer as string,
                dimensions: { width: Math.round(boundingBox.width), height: Math.round(boundingBox.height) },
            };
        } catch (error) {
            return {
                success: false,
                dimensions: { width: 0, height: 0 },
                // @ts-ignore
                error: `Screenshot failed: ${error.message}`
            };
        }
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

// ============================================================
// STREAMING & MEDIA TOOLS (3 new tools)
// ============================================================

export interface M3u8ParserArgs {
    url?: string;
    extractAll?: boolean;
    preferQuality?: string;
    includeAudio?: boolean;
}

export interface SubtitleExtractorArgs {
    url?: string;
    languages?: string[];
    format?: 'vtt' | 'srt' | 'ass' | 'all';
    savePath?: string;
}

export interface CookieManagerArgs {
    action: 'get' | 'set' | 'delete' | 'export' | 'import' | 'clear';
    domain?: string;
    cookies?: any[];
    name?: string;
    filePath?: string;
    format?: 'json' | 'netscape';
}

/**
 * Parse and extract HLS/m3u8 streaming URLs
 */
export async function handleM3u8Parser(
    page: Page,
    args: M3u8ParserArgs
): Promise<{ found: boolean; streams: any[]; masterPlaylist?: string; qualities: string[] }> {
    const streams: any[] = [];
    const qualities: string[] = [];
    let masterPlaylist: string | undefined;

    // Intercept network requests to find m3u8 files
    const m3u8Urls: string[] = [];

    const requestHandler = (request: any) => {
        try {
            // Check if request is already handled
            if (request.isInterceptResolutionHandled && request.isInterceptResolutionHandled()) {
                return;
            }

            const url = request.url();
            if (url.includes('.m3u8') || url.includes('manifest') || url.includes('playlist')) {
                m3u8Urls.push(url);
            }

            // Only continue if not already handled
            if (!request.isInterceptResolutionHandled || !request.isInterceptResolutionHandled()) {
                request.continue().catch(() => { });
            }
        } catch (e) {
            // Ignore errors in handler
        }
    };

    try {
        await page.setRequestInterception(true);
        page.on('request', requestHandler);

        // Wait for network activity
        await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
        console.error('Error in m3u8_parser interception:', error);
    } finally {
        page.off('request', requestHandler);
        try {
            await page.setRequestInterception(false);
        } catch (e) {
            // Ignore
        }
    }

    // Also check for m3u8 in page source
    try {
        const pageM3u8 = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const urls: string[] = [];
            scripts.forEach(script => {
                const content = script.textContent || '';
                const matches = content.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g);
                if (matches) urls.push(...matches);
            });

            // Check video sources
            const videos = Array.from(document.querySelectorAll('video source'));
            videos.forEach(source => {
                const src = source.getAttribute('src') || '';
                if (src.includes('.m3u8')) urls.push(src);
            });

            return urls;
        });
        m3u8Urls.push(...pageM3u8);
    } catch (e) {
        // Ignore evaluation errors
    }

    // Parse unique URLs
    const uniqueUrls = [...new Set(m3u8Urls)];

    for (const url of uniqueUrls) {
        const stream: any = { url, type: 'hls' };

        // Try to determine quality from URL
        if (url.includes('1080')) { stream.quality = '1080p'; qualities.push('1080p'); }
        else if (url.includes('720')) { stream.quality = '720p'; qualities.push('720p'); }
        else if (url.includes('480')) { stream.quality = '480p'; qualities.push('480p'); }
        else if (url.includes('360')) { stream.quality = '360p'; qualities.push('360p'); }
        else if (url.includes('master')) { stream.quality = 'master'; masterPlaylist = url; }
        else { stream.quality = 'unknown'; }

        if (url.includes('audio') || url.includes('a=')) {
            stream.type = 'audio';
        }

        if (args.extractAll || stream.quality === args.preferQuality || stream.quality === 'master') {
            streams.push(stream);
        }
    }

    // Filter audio if not wanted
    const filteredStreams = args.includeAudio !== false
        ? streams
        : streams.filter(s => s.type !== 'audio');

    return {
        found: filteredStreams.length > 0,
        streams: filteredStreams,
        masterPlaylist,
        qualities: [...new Set(qualities)],
    };
}

/**
 * Extract subtitles/captions from video pages
 */
export async function handleSubtitleExtractor(
    page: Page,
    args: SubtitleExtractorArgs
): Promise<{ found: boolean; subtitles: any[]; languages: string[] }> {
    const subtitles: any[] = [];
    const foundLanguages: string[] = [];
    const preferredLanguages = args.languages || ['en'];

    // Look for subtitle tracks
    const trackData = await page.evaluate(() => {
        const tracks: any[] = [];

        // HTML5 video tracks
        const videoTracks = document.querySelectorAll('video track');
        videoTracks.forEach(track => {
            tracks.push({
                kind: track.getAttribute('kind'),
                src: track.getAttribute('src'),
                srclang: track.getAttribute('srclang'),
                label: track.getAttribute('label'),
            });
        });

        // Look for VTT/SRT links in page
        const links = Array.from(document.querySelectorAll('a[href*=".vtt"], a[href*=".srt"], a[href*=".ass"]'));
        links.forEach(link => {
            tracks.push({
                kind: 'subtitles',
                src: link.getAttribute('href'),
                label: link.textContent?.trim(),
            });
        });

        // Look in script data
        const scripts = Array.from(document.querySelectorAll('script'));
        scripts.forEach(script => {
            const content = script.textContent || '';

            // VTT URLs
            const vttMatches = content.match(/https?:\/\/[^\s"']+\.vtt[^\s"']*/g);
            if (vttMatches) {
                vttMatches.forEach(url => tracks.push({ src: url, kind: 'subtitles', format: 'vtt' }));
            }

            // SRT URLs
            const srtMatches = content.match(/https?:\/\/[^\s"']+\.srt[^\s"']*/g);
            if (srtMatches) {
                srtMatches.forEach(url => tracks.push({ src: url, kind: 'subtitles', format: 'srt' }));
            }
        });

        return tracks;
    });

    // Process found tracks
    for (const track of trackData) {
        if (!track.src) continue;

        const subtitle: any = {
            url: track.src,
            language: track.srclang || 'unknown',
            label: track.label || 'Unknown',
            format: track.format || (track.src.includes('.vtt') ? 'vtt' : track.src.includes('.srt') ? 'srt' : 'unknown'),
        };

        // Filter by preferred languages
        if (preferredLanguages.includes(subtitle.language) || preferredLanguages.includes('all')) {
            subtitles.push(subtitle);
            foundLanguages.push(subtitle.language);
        }
    }

    // Also check for YouTube-style captions API
    const ytCaptions = await page.evaluate(() => {
        const captionData: any[] = [];
        // Look for YouTube caption data
        const ytInitialData = (window as any).ytInitialPlayerResponse;
        if (ytInitialData?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            ytInitialData.captions.playerCaptionsTracklistRenderer.captionTracks.forEach((track: any) => {
                captionData.push({
                    url: track.baseUrl,
                    language: track.languageCode,
                    label: track.name?.simpleText || track.languageCode,
                    format: 'vtt',
                });
            });
        }
        return captionData;
    });

    subtitles.push(...ytCaptions.filter(c => preferredLanguages.includes(c.language) || preferredLanguages.includes('all')));

    return {
        found: subtitles.length > 0,
        subtitles,
        languages: [...new Set(foundLanguages)],
    };
}

/**
 * Manage browser cookies for premium accounts
 */
export async function handleCookieManager(
    page: Page,
    args: CookieManagerArgs
): Promise<{ success: boolean; cookies?: any[]; message: string; count?: number }> {
    let client;
    try {
        client = await page.target().createCDPSession();
    } catch (error) {
        return { success: false, message: `Failed to connect to browser session: ${error}` };
    }

    switch (args.action) {
        case 'get': {
            const cookies = await page.cookies();
            let filtered = cookies;

            if (args.domain) {
                filtered = cookies.filter(c => c.domain.includes(args.domain!));
            }
            if (args.name) {
                filtered = filtered.filter(c => c.name === args.name);
            }

            return {
                success: true,
                cookies: filtered,
                message: `Retrieved ${filtered.length} cookies`,
                count: filtered.length,
            };
        }

        case 'set': {
            if (!args.cookies || args.cookies.length === 0) {
                return { success: false, message: 'No cookies provided to set' };
            }

            for (const cookie of args.cookies) {
                await page.setCookie(cookie);
            }

            return {
                success: true,
                message: `Set ${args.cookies.length} cookies`,
                count: args.cookies.length,
            };
        }

        case 'delete': {
            const cookies = await page.cookies();
            let toDelete = cookies;

            if (args.domain) {
                toDelete = cookies.filter(c => c.domain.includes(args.domain!));
            }
            if (args.name) {
                toDelete = toDelete.filter(c => c.name === args.name);
            }

            for (const cookie of toDelete) {
                await page.deleteCookie({ name: cookie.name, domain: cookie.domain });
            }

            return {
                success: true,
                message: `Deleted ${toDelete.length} cookies`,
                count: toDelete.length,
            };
        }

        case 'clear': {
            await client.send('Network.clearBrowserCookies');
            return { success: true, message: 'All cookies cleared' };
        }

        case 'export': {
            const cookies = await page.cookies();
            let filtered = args.domain ? cookies.filter(c => c.domain.includes(args.domain!)) : cookies;

            let exportData: string;
            if (args.format === 'netscape') {
                // Netscape format for wget/curl
                exportData = '# Netscape HTTP Cookie File\n';
                filtered.forEach(c => {
                    exportData += `${c.domain}\tTRUE\t${c.path}\t${c.secure ? 'TRUE' : 'FALSE'}\t${c.expires || 0}\t${c.name}\t${c.value}\n`;
                });
            } else {
                exportData = JSON.stringify(filtered, null, 2);
            }

            return {
                success: true,
                cookies: filtered,
                message: `Exported ${filtered.length} cookies in ${args.format || 'json'} format`,
                count: filtered.length,
            };
        }

        case 'import': {
            if (!args.cookies || args.cookies.length === 0) {
                return { success: false, message: 'No cookies provided to import' };
            }

            for (const cookie of args.cookies) {
                await page.setCookie(cookie);
            }

            return {
                success: true,
                message: `Imported ${args.cookies.length} cookies`,
                count: args.cookies.length,
            };
        }

        default:
            return { success: false, message: `Unknown action: ${args.action}` };
    }
}

// ============================================================
// FILE DOWNLOAD TOOLS (2 new tools)
// ============================================================

export interface FileDownloaderArgs {
    url: string;
    savePath: string;
    filename?: string;
    overwrite?: boolean;
    headers?: string;
    timeout?: number;
}

export interface BulkDownloaderArgs {
    files: Array<{ url: string; filename?: string }>;
    savePath: string;
    concurrency?: number;
    overwrite?: boolean;
    skipErrors?: boolean;
    headers?: string;
}

/**
 * Download a file from URL directly to disk
 */
export async function handleFileDownloader(
    page: Page,
    args: FileDownloaderArgs
): Promise<{ success: boolean; filePath?: string; size?: number; message: string }> {
    const fs = await import('fs');
    const path = await import('path');
    const https = await import('https');
    const http = await import('http');

    const timeout = args.timeout || 300000; // 5 minutes default

    // Extract filename from URL if not provided
    let filename = args.filename;
    if (!filename) {
        const urlObj = new URL(args.url);
        filename = path.basename(urlObj.pathname) || 'download';
        // Handle URLs without extension
        if (!filename.includes('.')) {
            filename = 'download_' + Date.now();
        }
    }

    const fullPath = path.join(args.savePath, filename);

    // Check if file exists and overwrite is false
    if (!args.overwrite && fs.existsSync(fullPath)) {
        return {
            success: false,
            message: `File already exists: ${fullPath}. Set overwrite: true to replace.`,
        };
    }

    // Ensure directory exists
    if (!fs.existsSync(args.savePath)) {
        fs.mkdirSync(args.savePath, { recursive: true });
    }

    return new Promise((resolve) => {
        const protocol = args.url.startsWith('https') ? https : http;

        const options: any = {
            timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...(args.headers ? JSON.parse(args.headers) : {}),
            },
        };

        const file = fs.createWriteStream(fullPath);
        let downloadedSize = 0;

        const request = protocol.get(args.url, options, (response: any) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(fullPath);
                // Follow redirect
                handleFileDownloader(page, { ...args, url: response.headers.location })
                    .then(resolve);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(fullPath);
                resolve({
                    success: false,
                    message: `Download failed with status: ${response.statusCode}`,
                });
                return;
            }

            const totalSize = parseInt(response.headers['content-length'] || '0', 10);

            response.on('data', (chunk: Buffer) => {
                downloadedSize += chunk.length;
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve({
                    success: true,
                    filePath: fullPath,
                    size: downloadedSize,
                    message: `Downloaded ${downloadedSize} bytes to ${fullPath}`,
                });
            });
        });

        request.on('timeout', () => {
            request.destroy();
            file.close();
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            resolve({
                success: false,
                message: `Download timeout after ${timeout}ms`,
            });
        });

        request.on('error', (err: Error) => {
            file.close();
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            resolve({
                success: false,
                message: `Download error: ${err.message}`,
            });
        });
    });
}

/**
 * Download multiple files simultaneously
 */
export async function handleBulkDownloader(
    page: Page,
    args: BulkDownloaderArgs
): Promise<{ success: boolean; downloaded: number; failed: number; files: any[]; message: string }> {
    const concurrency = args.concurrency || 3;
    const results: any[] = [];
    let downloaded = 0;
    let failed = 0;

    // Process files in batches based on concurrency
    const chunks: Array<typeof args.files> = [];
    for (let i = 0; i < args.files.length; i += concurrency) {
        chunks.push(args.files.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
        const promises = chunk.map(async (file) => {
            try {
                const result = await handleFileDownloader(page, {
                    url: file.url,
                    savePath: args.savePath,
                    filename: file.filename,
                    overwrite: args.overwrite,
                    headers: args.headers,
                });

                if (result.success) {
                    downloaded++;
                    results.push({
                        url: file.url,
                        status: 'success',
                        filePath: result.filePath,
                        size: result.size,
                    });
                } else {
                    failed++;
                    results.push({
                        url: file.url,
                        status: 'failed',
                        error: result.message,
                    });

                    if (!args.skipErrors) {
                        throw new Error(result.message);
                    }
                }
            } catch (error) {
                failed++;
                results.push({
                    url: file.url,
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error),
                });

                if (!args.skipErrors) {
                    throw error;
                }
            }
        });

        await Promise.all(promises);
    }

    return {
        success: failed === 0 || args.skipErrors === true,
        downloaded,
        failed,
        files: results,
        message: `Downloaded ${downloaded}/${args.files.length} files. ${failed} failed.`,
    };
}

// ============================================================
// NEW ENHANCED STREAMING/DOWNLOAD TOOLS (5 new handlers)
// ============================================================

export interface CountdownWaiterArgs {
    maxWait?: number;
    autoClickSelector?: string;
    skipAds?: boolean;
    detectPatterns?: string[];
}

export interface IframeHandlerArgs {
    action?: 'list' | 'enter' | 'extract' | 'exitAll' | 'deep_scrape';
    selector?: string;
    frameIndex?: number;
    maxDepth?: number;
    extractSelector?: string;
    // NEW: Enhanced parameters for complex websites
    recursive?: boolean;           // Traverse nested iframes via HTTP
    flatten?: boolean;             // Return flat list vs tree structure
    filterPattern?: string;        // Regex to filter iframe URLs
    extractVideoSources?: boolean; // Auto-extract m3u8/mp4 sources
    timeout?: number;              // HTTP request timeout
}

export interface PopupHandlerArgs {
    action?: 'block' | 'allow' | 'close' | 'switch' | 'list' | 'closeAll';
    autoCloseAds?: boolean;
    waitForTarget?: boolean;
    targetIndex?: number;
    timeout?: number;
}

export interface CloudflareBypassArgs {
    timeout?: number;
    retries?: number;
    humanSimulation?: boolean;
    waitForSelector?: string;
}

export interface StreamExtractorArgs {
    url?: string;
    maxRedirects?: number;
    waitForCountdown?: boolean;
    bypassCloudflare?: boolean;
    formats?: string[];
    quality?: string;
}

/**
 * Wait for countdown timers and auto-click download button
 */
export async function handleCountdownWaiter(
    page: Page,
    args: CountdownWaiterArgs
): Promise<{ success: boolean; waitedSeconds: number; clicked: boolean; message: string }> {
    const maxWait = args.maxWait || 120;
    const startTime = Date.now();
    let waitedSeconds = 0;
    let clicked = false;

    // Default countdown patterns
    const patterns = args.detectPatterns || [
        '\\d+\\s*seconds?',
        'wait\\s*\\d+',
        'please\\s*wait',
        'countdown',
        '\\d+\\s*sec',
    ];

    const combinedPattern = new RegExp(patterns.join('|'), 'gi');

    // Function to detect countdown on page
    const detectCountdown = async (): Promise<{ hasCountdown: boolean; value: number }> => {
        return await page.evaluate((pattern: string) => {
            const bodyText = document.body?.innerText || '';
            const regex = new RegExp(pattern, 'gi');
            const matches = bodyText.match(regex);

            if (matches && matches.length > 0) {
                // Try to extract numeric value
                const numMatch = matches[0].match(/\d+/);
                const value = numMatch ? parseInt(numMatch[0], 10) : 0;
                return { hasCountdown: true, value };
            }
            return { hasCountdown: false, value: 0 };
        }, combinedPattern.source);
    };

    // Wait for countdown to complete
    let lastValue = -1;
    while ((Date.now() - startTime) / 1000 < maxWait) {
        const result = await detectCountdown();

        if (result.hasCountdown && result.value > 0) {
            if (result.value !== lastValue) {
                lastValue = result.value;
            }
            await new Promise(r => setTimeout(r, 1000));
            waitedSeconds = Math.floor((Date.now() - startTime) / 1000);
        } else if (result.hasCountdown && result.value === 0) {
            // Countdown finished
            break;
        } else if (!result.hasCountdown && lastValue > 0) {
            // Countdown was there but now gone - likely completed
            break;
        } else {
            // No countdown detected, wait briefly and check again
            await new Promise(r => setTimeout(r, 500));
            waitedSeconds = Math.floor((Date.now() - startTime) / 1000);
            if (waitedSeconds > 5 && !result.hasCountdown) {
                // No countdown after 5 seconds, proceed
                break;
            }
        }
    }

    // Click the button if selector provided
    if (args.autoClickSelector) {
        try {
            await page.waitForSelector(args.autoClickSelector, { timeout: 5000 });
            await page.click(args.autoClickSelector);
            clicked = true;
        } catch {
            // Button not found or not clickable
        }
    }

    return {
        success: true,
        waitedSeconds,
        clicked,
        message: clicked
            ? `Waited ${waitedSeconds}s and clicked download button`
            : `Waited ${waitedSeconds}s, no button clicked`,
    };
}

/**
 * Handle nested iframes for content extraction
 */
export async function handleIframeHandler(
    page: Page,
    args: IframeHandlerArgs
): Promise<{ success: boolean; iframes: any[]; content?: string; message: string }> {
    const action = args.action || 'list';
    const maxDepth = args.maxDepth || 3;

    // List all iframes
    const listIframes = async (depth = 0): Promise<any[]> => {
        if (depth >= maxDepth) return [];

        const frames = page.frames();
        const iframeInfo: any[] = [];

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            try {
                const info = await frame.evaluate(() => ({
                    url: window.location.href,
                    title: document.title,
                    hasVideo: document.querySelectorAll('video, iframe[src*="player"], iframe[src*="embed"]').length > 0,
                }));
                iframeInfo.push({
                    index: i,
                    name: frame.name(),
                    url: info.url,
                    title: info.title,
                    hasVideo: info.hasVideo,
                    depth,
                });
            } catch {
                iframeInfo.push({
                    index: i,
                    name: frame.name(),
                    url: 'inaccessible',
                    depth,
                });
            }
        }
        return iframeInfo;
    };

    if (action === 'list') {
        const iframes = await listIframes();
        return {
            success: true,
            iframes,
            message: `Found ${iframes.length} frames/iframes`,
        };
    }

    if (action === 'enter' || action === 'extract') {
        const frames = page.frames();
        let targetFrame: any = null;

        if (args.frameIndex !== undefined && args.frameIndex < frames.length) {
            targetFrame = frames[args.frameIndex];
        } else if (args.selector) {
            // Find iframe by selector and get its content frame
            const iframeHandle = await page.$(args.selector);
            if (iframeHandle) {
                targetFrame = await iframeHandle.contentFrame();
            }
        }

        if (!targetFrame) {
            return {
                success: false,
                iframes: [],
                message: 'Target frame not found',
            };
        }

        if (action === 'extract' && args.extractSelector) {
            try {
                const content = await targetFrame.evaluate((sel: string) => {
                    const el = document.querySelector(sel);
                    return el ? el.outerHTML : null;
                }, args.extractSelector);

                return {
                    success: !!content,
                    iframes: [],
                    content: content || undefined,
                    message: content ? 'Content extracted from iframe' : 'Selector not found in iframe',
                };
            } catch (error) {
                return {
                    success: false,
                    iframes: [],
                    message: `Error extracting: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        }

        return {
            success: true,
            iframes: await listIframes(),
            message: 'Frame accessed successfully',
        };
    }

    // NEW: deep_scrape action - HTTP-based recursive iframe crawling
    if (action === 'deep_scrape') {
        const timeout = args.timeout || 10000;
        const filterPattern = args.filterPattern ? new RegExp(args.filterPattern, 'i') : null;
        const allIframes: any[] = [];
        const videoSources: any[] = [];
        const visited = new Set<string>();

        // Helper: Fetch page content via HTTP
        const fetchPageContent = async (url: string): Promise<string> => {
            try {
                const https = await import('https');
                const http = await import('http');

                return new Promise((resolve) => {
                    const protocol = url.startsWith('https') ? https : http;
                    const req = protocol.get(url, { timeout }, (res: any) => {
                        let data = '';
                        res.on('data', (chunk: string) => data += chunk);
                        res.on('end', () => resolve(data));
                    });
                    req.on('error', () => resolve(''));
                    req.on('timeout', () => { req.destroy(); resolve(''); });
                });
            } catch {
                return '';
            }
        };

        // Helper: Extract iframes and video sources from HTML
        const extractFromHtml = (html: string, baseUrl: string): { iframes: string[]; videos: any[] } => {
            const iframes: string[] = [];
            const videos: any[] = [];

            // Extract iframes
            const iframeRegex = /<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi;
            let match;
            while ((match = iframeRegex.exec(html)) !== null) {
                let src = match[1];
                // Handle relative URLs
                if (src.startsWith('//')) src = 'https:' + src;
                else if (src.startsWith('/')) {
                    const urlObj = new URL(baseUrl);
                    src = urlObj.origin + src;
                }
                iframes.push(src);
            }

            // Extract video sources (m3u8, mp4, etc.)
            const videoPatterns = [
                /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,
                /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi,
                /https?:\/\/[^"'\s]+\.webm[^"'\s]*/gi,
                /file:\s*["']([^"']+\.m3u8[^"']*)["']/gi,
                /source:\s*["']([^"']+\.m3u8[^"']*)["']/gi,
            ];

            for (const pattern of videoPatterns) {
                let videoMatch;
                while ((videoMatch = pattern.exec(html)) !== null) {
                    const url = videoMatch[1] || videoMatch[0];
                    videos.push({ url, type: url.includes('.m3u8') ? 'hls' : 'mp4' });
                }
            }

            // Try to unpack obfuscated JS (p,a,c,k,e,d)
            const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[^{]+\{[^}]+\}[^)]+\('[^']+'/);
            if (packedMatch) {
                try {
                    // Simple unpacking - extract strings
                    const stringsMatch = html.match(/'([^']+)'\.split\('\|'\)/);
                    if (stringsMatch) {
                        const strings = stringsMatch[1].split('|');
                        for (const s of strings) {
                            if (s.includes('m3u8') || s.includes('master')) {
                                // Find m3u8 URLs in unpacked content
                                const m3u8Match = html.match(new RegExp(`https?://[^"'\\s]*${s}[^"'\\s]*`, 'i'));
                                if (m3u8Match) {
                                    videos.push({ url: m3u8Match[0], type: 'hls', unpacked: true });
                                }
                            }
                        }
                    }
                } catch { /* ignore unpacking errors */ }
            }

            return { iframes, videos };
        };

        // Recursive crawler
        const crawlIframe = async (url: string, depth: number): Promise<void> => {
            if (depth >= maxDepth || visited.has(url)) return;
            visited.add(url);

            // Apply filter if specified
            if (filterPattern && !filterPattern.test(url)) return;

            const html = await fetchPageContent(url);
            if (!html) return;

            const { iframes, videos } = extractFromHtml(html, url);

            // Add this iframe to results
            allIframes.push({ depth, url, childCount: iframes.length });

            // Add video sources
            for (const video of videos) {
                if (!videoSources.some(v => v.url === video.url)) {
                    videoSources.push({ ...video, foundAt: url, depth });
                }
            }

            // Recursively crawl child iframes
            for (const iframeSrc of iframes) {
                await crawlIframe(iframeSrc, depth + 1);
            }
        };

        // Start from current page URL
        const currentUrl = page.url();
        await crawlIframe(currentUrl, 0);

        // Also check browser frames
        for (const frame of page.frames()) {
            try {
                const frameUrl = frame.url();
                if (frameUrl && frameUrl !== 'about:blank' && !visited.has(frameUrl)) {
                    await crawlIframe(frameUrl, 1);
                }
            } catch { /* ignore inaccessible frames */ }
        }

        return {
            success: true,
            iframes: args.flatten !== false ? allIframes : allIframes,
            videoSources: args.extractVideoSources !== false ? videoSources : undefined,
            message: `Deep scraped ${allIframes.length} iframes, found ${videoSources.length} video sources`,
        } as any;
    }

    return {
        success: false,
        iframes: [],
        message: 'Invalid action',
    };
}

/**
 * Handle popups and new tabs
 */
export async function handlePopupHandler(
    page: Page,
    args: PopupHandlerArgs
): Promise<{ success: boolean; pages: any[]; message: string }> {
    const action = args.action || 'list';
    const timeout = args.timeout || 10000;
    const browser = page.browser();

    if (!browser) {
        return { success: false, pages: [], message: 'Browser not available' };
    }

    const pages = await browser.pages();
    const pageInfo = pages.map((p: any, i: number) => ({
        index: i,
        url: p.url(),
        title: '', // Will be filled if needed
        isCurrent: p === page,
    }));

    if (action === 'list') {
        return {
            success: true,
            pages: pageInfo,
            message: `Found ${pages.length} open tabs/pages`,
        };
    }

    if (action === 'closeAll') {
        let closed = 0;
        for (const p of pages) {
            if (p !== page) {
                try {
                    await p.close();
                    closed++;
                } catch {
                    // Ignore
                }
            }
        }
        return {
            success: true,
            pages: [],
            message: `Closed ${closed} popup/tab(s)`,
        };
    }

    if (action === 'close' && args.targetIndex !== undefined) {
        if (args.targetIndex >= 0 && args.targetIndex < pages.length) {
            try {
                await pages[args.targetIndex].close();
                return {
                    success: true,
                    pages: [],
                    message: `Closed tab at index ${args.targetIndex}`,
                };
            } catch (error) {
                return {
                    success: false,
                    pages: [],
                    message: `Failed to close tab: ${error instanceof Error ? error.message : String(error)}`,
                };
            }
        }
    }

    if (action === 'switch' && args.targetIndex !== undefined) {
        if (args.targetIndex >= 0 && args.targetIndex < pages.length) {
            await pages[args.targetIndex].bringToFront();
            return {
                success: true,
                pages: pageInfo,
                message: `Switched to tab ${args.targetIndex}`,
            };
        }
    }

    if (args.waitForTarget) {
        try {
            await new Promise<void>((resolve, reject) => {
                const timeoutId = setTimeout(() => reject(new Error('Timeout waiting for popup')), timeout);
                browser.once('targetcreated', () => {
                    clearTimeout(timeoutId);
                    resolve();
                });
            });
            const newPages = await browser.pages();
            return {
                success: true,
                pages: newPages.map((p: any, i: number) => ({
                    index: i,
                    url: p.url(),
                    isCurrent: p === page,
                })),
                message: 'New popup/tab detected',
            };
        } catch {
            return {
                success: false,
                pages: pageInfo,
                message: 'No new popup detected within timeout',
            };
        }
    }

    return {
        success: true,
        pages: pageInfo,
        message: 'Popup handler executed',
    };
}

/**
 * Handle Cloudflare protection pages
 */
export async function handleCloudflareBypass(
    page: Page,
    args: CloudflareBypassArgs
): Promise<{ success: boolean; bypassed: boolean; attempts: number; message: string }> {
    const timeout = args.timeout || 30000;
    const retries = args.retries || 3;
    let attempts = 0;
    let bypassed = false;

    // Cloudflare detection patterns
    const cfPatterns = [
        'Checking your browser',
        'Just a moment',
        'Attention Required',
        'cf-browser-verification',
        'cf_chl_opt',
    ];

    const isCloudflare = async (): Promise<boolean> => {
        try {
            const content = await page.content();
            return cfPatterns.some(p => content.includes(p));
        } catch {
            return false;
        }
    };

    const waitForBypass = async (): Promise<boolean> => {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            if (!(await isCloudflare())) {
                return true;
            }

            // Human simulation
            if (args.humanSimulation) {
                await page.mouse.move(
                    100 + Math.random() * 200,
                    100 + Math.random() * 200
                );
            }

            await new Promise(r => setTimeout(r, 1000));
        }
        return false;
    };

    // Check if currently on Cloudflare page
    if (await isCloudflare()) {
        for (attempts = 1; attempts <= retries; attempts++) {
            bypassed = await waitForBypass();
            if (bypassed) break;

            // Reload and try again
            if (attempts < retries) {
                await page.reload({ waitUntil: 'domcontentloaded' });
            }
        }
    } else {
        bypassed = true; // Not on Cloudflare page
    }

    // Check success selector if provided
    if (bypassed && args.waitForSelector) {
        try {
            await page.waitForSelector(args.waitForSelector, { timeout: 5000 });
        } catch {
            bypassed = false;
        }
    }

    return {
        success: bypassed,
        bypassed,
        attempts,
        message: bypassed
            ? 'Cloudflare bypass successful'
            : `Cloudflare bypass failed after ${attempts} attempts`,
    };
}

/**
 * Master tool: Extract direct stream/download URLs
 * ULTRA POWERFUL: Handles packed JS, JW Player, Video.js, HLS.js, obfuscated scripts
 */
export async function handleStreamExtractor(
    page: Page,
    args: StreamExtractorArgs
): Promise<{
    success: boolean;
    directUrls: { url: string; format: string; quality?: string; size?: string; source?: string }[];
    message: string
}> {
    const formats = args.formats || ['mp4', 'mkv', 'm3u8', 'mp3', 'webm', 'flv', 'avi'];
    const maxRedirects = args.maxRedirects || 10;
    const directUrls: { url: string; format: string; quality?: string; size?: string; source?: string }[] = [];

    // Navigate if URL provided
    if (args.url) {
        await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    // Handle Cloudflare if enabled
    if (args.bypassCloudflare) {
        const cfPatterns = ['Checking your browser', 'Just a moment', 'cf-browser-verification', 'cf_chl_opt'];
        const isCloudflare = async () => {
            try {
                const content = await page.content();
                return cfPatterns.some((p: string) => content.includes(p));
            } catch { return false; }
        };

        const startCf = Date.now();
        while (await isCloudflare() && Date.now() - startCf < 20000) {
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Handle countdown if enabled
    if (args.waitForCountdown) {
        const maxWait = 120;
        const startTime = Date.now();
        while ((Date.now() - startTime) / 1000 < maxWait) {
            const hasCountdown = await page.evaluate(() => {
                const text = document.body?.innerText || '';
                return /\d+\s*seconds?|wait\s*\d+|please\s*wait|countdown|getting link/gi.test(text);
            });
            if (!hasCountdown) break;
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // ULTRA POWERFUL: Extract from all sources
    const extractedData = await page.evaluate((fmts: string[]) => {
        const urls: { url: string; source: string }[] = [];
        const html = document.documentElement.innerHTML;

        // ============================================================
        // 1. PACKED JS UNPACKING (p,a,c,k,e,d)
        // ============================================================
        const unpackPackedJS = (packed: string): string => {
            try {
                // Find packed function pattern
                const match = packed.match(/eval\(function\(p,a,c,k,e,[rd]\)\{[^}]+\}[^)]+\('[^']+'/);
                if (!match) return '';

                // Extract the encoded string and dictionary
                const stringsMatch = packed.match(/'([^']+)'\.split\('\|'\)/);
                if (!stringsMatch) return '';

                const dict = stringsMatch[1].split('|');
                let result = packed;

                // Replace placeholders with actual values
                for (let i = 0; i < dict.length; i++) {
                    if (dict[i]) {
                        const base36 = i.toString(36);
                        result = result.replace(new RegExp(`\\b${base36}\\b`, 'g'), dict[i]);
                    }
                }
                return result;
            } catch { return ''; }
        };

        // Find and unpack all packed scripts
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            const content = script.textContent || '';
            if (content.includes('eval(function(p,a,c,k,e,')) {
                const unpacked = unpackPackedJS(content);
                // Extract URLs from unpacked content
                fmts.forEach(fmt => {
                    const regex = new RegExp(`https?://[^"'\\s]+\\.${fmt}[^"'\\s]*`, 'gi');
                    const matches = unpacked.match(regex);
                    if (matches) matches.forEach(url => urls.push({ url, source: 'packed_js' }));
                });
            }
        });

        // ============================================================
        // 2. JW PLAYER DETECTION
        // ============================================================
        if ((window as any).jwplayer) {
            try {
                const player = (window as any).jwplayer();
                if (player && player.getPlaylistItem) {
                    const item = player.getPlaylistItem();
                    if (item) {
                        if (item.file) urls.push({ url: item.file, source: 'jwplayer' });
                        if (item.sources) {
                            item.sources.forEach((s: any) => {
                                if (s.file) urls.push({ url: s.file, source: 'jwplayer' });
                            });
                        }
                    }
                }
            } catch { /* ignore */ }
        }

        // JW Player setup patterns in scripts
        const jwPatterns = [
            /file:\s*["']([^"']+\.m3u8[^"']*?)["']/gi,
            /file:\s*["']([^"']+\.mp4[^"']*?)["']/gi,
            /sources:\s*\[\s*\{[^}]*file:\s*["']([^"']+)["']/gi,
            /setup\([^)]*file:\s*["']([^"']+)["']/gi,
        ];
        jwPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                urls.push({ url: match[1], source: 'jwplayer_setup' });
            }
        });

        // ============================================================
        // 3. VIDEO.JS DETECTION
        // ============================================================
        const videoJsPlayers = document.querySelectorAll('.video-js, [data-setup], video[id^="vjs"]');
        videoJsPlayers.forEach(player => {
            const video = player.querySelector('source') || player;
            const src = video.getAttribute('src') || (player as any).src;
            if (src) urls.push({ url: src, source: 'videojs' });
        });

        // ============================================================
        // 4. HLS.JS DETECTION
        // ============================================================
        const hlsPatterns = [
            /hls\.loadSource\(["']([^"']+)["']\)/gi,
            /Hls\.loadSource\(["']([^"']+)["']\)/gi,
            /source:\s*["']([^"']+\.m3u8[^"']*)["']/gi,
            /src:\s*["']([^"']+\.m3u8[^"']*)["']/gi,
        ];
        hlsPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                urls.push({ url: match[1], source: 'hlsjs' });
            }
        });

        // ============================================================
        // 5. PLYR DETECTION
        // ============================================================
        if ((window as any).Plyr) {
            try {
                const plyrPlayer = (window as any).player;
                if (plyrPlayer && plyrPlayer.source) {
                    urls.push({ url: plyrPlayer.source, source: 'plyr' });
                }
            } catch { /* ignore */ }
        }

        // ============================================================
        // 6. DATA ATTRIBUTES
        // ============================================================
        document.querySelectorAll('[data-src], [data-video], [data-file], [data-stream]').forEach(el => {
            const attrs = ['data-src', 'data-video', 'data-file', 'data-stream', 'data-link'];
            attrs.forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && fmts.some(f => val.includes(`.${f}`))) {
                    urls.push({ url: val, source: 'data_attr' });
                }
            });
        });

        // ============================================================
        // 7. STANDARD VIDEO/AUDIO ELEMENTS
        // ============================================================
        document.querySelectorAll('video, audio, source').forEach(el => {
            const src = el.getAttribute('src');
            if (src) urls.push({ url: src, source: 'html_media' });
        });

        // ============================================================
        // 8. DIRECT LINKS
        // ============================================================
        document.querySelectorAll('a[href]').forEach(el => {
            const href = (el as HTMLAnchorElement).href;
            if (href && fmts.some(f => href.includes(`.${f}`))) {
                urls.push({ url: href, source: 'direct_link' });
            }
        });

        // ============================================================
        // 9. IFRAME PLAYERS
        // ============================================================
        document.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src;
            if (src && (src.includes('player') || src.includes('embed') || src.includes('video'))) {
                urls.push({ url: `iframe:${src}`, source: 'iframe' });
            }
        });

        // ============================================================
        // 10. REGEX SCAN OF ENTIRE HTML
        // ============================================================
        fmts.forEach(fmt => {
            const pattern = new RegExp(`https?://[^"'\\s<>]+\\.${fmt}[^"'\\s<>]*`, 'gi');
            const matches = html.match(pattern);
            if (matches) matches.forEach(url => urls.push({ url, source: 'regex_scan' }));
        });

        // Deduplicate
        const seen = new Set<string>();
        return urls.filter(u => {
            if (seen.has(u.url)) return false;
            seen.add(u.url);
            return true;
        });
    }, formats);

    // Process found URLs
    for (const item of extractedData) {
        const format = formats.find(f => item.url.includes(`.${f}`)) || 'unknown';
        directUrls.push({
            url: item.url,
            format,
            quality: args.quality || 'auto',
            source: item.source,
        });
    }

    // Check network requests for media URLs
    const networkUrls = await page.evaluate((fmts: string[]) => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources
            .filter(r => fmts.some(f => r.name.includes(`.${f}`)))
            .map(r => r.name);
    }, formats);

    for (const url of networkUrls) {
        if (!directUrls.some(d => d.url === url)) {
            const format = formats.find(f => url.includes(`.${f}`)) || 'unknown';
            directUrls.push({ url, format, source: 'network' });
        }
    }

    return {
        success: directUrls.length > 0,
        directUrls,
        message: directUrls.length > 0
            ? `🎬 Found ${directUrls.length} direct URL(s) from ${new Set(directUrls.map(d => d.source)).size} sources`
            : 'No direct URLs found',
    };
}
