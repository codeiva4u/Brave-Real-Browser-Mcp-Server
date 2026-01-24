/**
 * Advanced Tools Handlers for brave-real-browser-mcp-server
 * Contains 24 advanced tools for enhanced browser automation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Import types from puppeteer (using brave-real-puppeteer-core which provides these)
type Page = any;
type ElementHandle = any;

// Import progress notifier for real-time progress updates
import { getProgressNotifier } from '../transport/progress-notifier.js';

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

// ============================================================
// SEARCH REGEX ARGS (regex101.com-like + Simple Search Mode)
// ============================================================
export interface SearchRegexArgs {
    pattern: string;
    testString?: string;
    flags?: {
        global?: boolean;
        ignoreCase?: boolean;
        multiline?: boolean;
        dotAll?: boolean;
        unicode?: boolean;
        sticky?: boolean;
    };
    replaceWith?: string;
    maxMatches?: number;
    contextChars?: number;
    sourceType?: 'text' | 'html' | 'scripts' | 'styles' | 'attributes' | 'all';
    selector?: string;
    extractGroups?: boolean;
    highlightMatches?: boolean;
    showMatchInfo?: boolean;
    timeout?: number;
    // NEW: Simple Search Mode - treat pattern as literal text, not regex
    simpleSearch?: boolean;
    // NEW: Pattern Explanation - explain each regex component
    showExplanation?: boolean;
    // NEW: Hierarchical Group Tree - show nested groups structure
    showGroupTree?: boolean;
}

// ============================================================
// WEB SEARCH ARGS (intelligent content search)
// ============================================================
export interface WebSearchArgs {
    query: string;
    searchIn?: 'text' | 'html' | 'links' | 'images' | 'videos' | 'scripts' | 'json' | 'schema' | 'meta' | 'all';
    selector?: string;
    includeIframes?: boolean;
    matchMode?: {
        fuzzy?: boolean;
        fuzzyThreshold?: number;
        semantic?: boolean;
        wholeWord?: boolean;
        caseSensitive?: boolean;
    };
    operators?: {
        must?: string[];
        should?: string[];
        mustNot?: string[];
        phrase?: string;
        proximity?: {
            words?: string[];
            distance?: number;
        };
    };
    filters?: {
        minLength?: number;
        maxLength?: number;
        containsPattern?: string;
        excludePattern?: string;
    };
    maxResults?: number;
    snippetLength?: number;
    highlightTag?: string;
    sortBy?: 'relevance' | 'position' | 'frequency';
    groupBy?: 'none' | 'element' | 'section';
}

export interface FindElementAdvancedArgs {
    // Find mode
    xpath?: string;
    cssSelector?: string;
    contains?: string;
    attributes?: string;
    text?: string;
    selector?: string;
    description?: string;
    elementType?: string;
    exact?: boolean;
    context?: string;
    shadowDOM?: boolean;
    searchFrames?: boolean;

    // Batch scrape mode (merged from batch_element_scraper)
    batchMode?: boolean;
    extractAttributes?: string[];
    limit?: number;
    includeInnerHTML?: boolean;
    includePosition?: boolean;

    // Advanced filters
    filter?: {
        visible?: boolean;
        enabled?: boolean;
        minWidth?: number;
        minHeight?: number;
        hasChildren?: boolean;
        containsClass?: string;
        matchPattern?: string;
    };

    // Output options
    returnType?: 'elements' | 'selectors' | 'data';
}

export interface ExtractJsonArgs {
    selector?: string;
    scriptIndex?: number;
    variableName?: string;

    // Advanced Decode capabilities for complex websites
    decodeBase64?: string;           // Direct base64 string to decode
    decodeFromUrl?: string;          // URL to extract and decode ?id= or similar param
    decodeUrlParam?: string;         // Specific URL parameter name to decode (default: 'id')
    decodePattern?: string;          // Regex pattern to find and decode base64 strings in page

    // NEW: Packed JavaScript decoder - auto-detects and unpacks eval(function(p,a,c,k,e,d)) patterns
    decodePackedJs?: boolean;        // Auto-detect and decode packed JavaScript in page scripts

    advancedDecode?: {               // Multi-layer decode for complex obfuscation
        input?: string;              // Input string (if not using page content)
        layers: ('base64' | 'url' | 'hex' | 'rot13' | 'reverse' | 'unpackJs' | 'xor' | 'rc4')[];
        extractFromPage?: boolean;   // Extract input from current page
        pageSelector?: string;       // CSS selector to extract from (for extractFromPage)
    };

    // AES-CBC decryption for encrypted streaming responses
    decryptAES?: {
        input?: string;              // Hex-encoded encrypted string
        fetchUrl?: string;           // API URL to fetch encrypted data from
        key?: string;                // AES key (16 chars for 128-bit, 32 chars for 256-bit)
        ivList?: string[];           // List of IVs to try
        autoIV?: boolean;            // Auto-detect IV from first 16 bytes of encrypted data (hubstream style)
        mode?: 'cbc' | 'gcm';        // AES mode (default: cbc)
        keySize?: 128 | 256;         // Key size in bits (default: 128)
    };

    // ============================================================
    // ULTRA ADVANCED DECODE - NEW FEATURES
    // ============================================================
    ultraDecode?: {
        input?: string;              // Input string to decode
        autoDetect?: boolean;        // Auto-detect encryption type and decode
        recursive?: boolean;         // Keep decoding until URL found
        maxDepth?: number;           // Max recursion depth (default: 10)
        tryCommonKeys?: boolean;     // Try common streaming site keys
        extractUrls?: boolean;       // Auto-extract URLs from decoded content
        extractFromPage?: boolean;   // Get input from page content
        pageSelector?: string;       // CSS selector for page extraction
    };

    // XOR Cipher decryption
    decryptXOR?: {
        input: string;               // Input string (hex or base64)
        key: string | number;        // XOR key (string or single byte)
        inputFormat?: 'hex' | 'base64' | 'text';  // Input format
    };

    // RC4 Stream Cipher decryption
    decryptRC4?: {
        input: string;               // Hex-encoded encrypted data
        key: string;                 // RC4 key
    };

    // JSFuck/Obfuscated JS decoder
    decodeObfuscatedJs?: {
        extractFromPage?: boolean;   // Find obfuscated JS in page
        selector?: string;           // Specific script selector
        evalIntercept?: boolean;     // Intercept eval() calls
    };

    // Schema.org structured data extraction
    extractSchema?: {
        enabled?: boolean;
        schemaTypes?: string[];      // Filter by schema type (e.g., 'Product', 'Article')
    };

    // Custom Cipher Function - provide your own decode logic
    customCipher?: {
        input: string;               // Input string to decode
        decodeFunction: string;      // JavaScript function as string, e.g., "input => input.split('').reverse().join('')"
        inputFormat?: 'text' | 'hex' | 'base64';  // Input format
    };
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
    // API Interceptor options
    interceptMode?: 'record' | 'intercept' | 'mock';  // Mode of operation
    blockPatterns?: string[];                          // URL patterns to block
    mockResponses?: { urlPattern: string; response: any; statusCode?: number }[];  // Mock responses
    modifyHeaders?: { urlPattern: string; headers: Record<string, string> }[];     // Modify request headers
    capturePayloads?: boolean;                         // Capture POST/PUT request bodies
    replayRequests?: boolean;                          // Enable replaying captured requests
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
    // Pagination options
    followPagination?: boolean;          // Auto-follow pagination links (default: false)
    maxPages?: number;                   // Maximum pages to scrape (default: 5)
    paginationSelector?: string;         // Custom pagination selector (e.g., 'a.next-page')
    delayBetweenPages?: number;          // Delay between page navigations in ms (default: 1000)
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

/**
 * Arguments for JS Scrape tool - Single-call JS-rendered content extraction
 */
export interface JsScrapeArgs {
    url?: string;                        // Single URL (for backward compatibility)
    urls?: string[];                     // Multiple URLs for parallel scraping
    waitForSelector?: string;
    waitForTimeout?: number;
    extractSelector?: string;
    extractAttributes?: string[];
    returnType?: 'html' | 'text' | 'elements';
    scrollToLoad?: boolean;
    closeBrowserAfter?: boolean;
    // Parallel scraping options
    concurrency?: number;                // Max concurrent scrapes (default: 3)
    continueOnError?: boolean;           // Continue scraping even if some URLs fail (default: true)
    delayBetween?: number;               // Delay between starting each scrape in ms (default: 500)
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
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`breadcrumb-${Date.now()}`);
    tracker.start(100, '🍞 Finding breadcrumbs...');

    const breadcrumbSelectors = [
        'nav[aria-label*="breadcrumb"]',
        '.breadcrumb',
        '.breadcrumbs',
        '[itemtype*="BreadcrumbList"]',
        'ol.breadcrumb',
        'ul.breadcrumb',
    ];

    tracker.setProgress(20, '🔍 Searching for breadcrumb container...');

    let breadcrumbContainer: ElementHandle | null = null;
    for (const selector of breadcrumbSelectors) {
        breadcrumbContainer = await page.$(selector);
        if (breadcrumbContainer) {
            tracker.setProgress(40, `✅ Found breadcrumb: ${selector}`);
            break;
        }
    }

    if (!breadcrumbContainer) {
        tracker.fail('No breadcrumbs found');
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
 * 🔥 ULTRA-POWERFUL Regex Engine (like regex101.com) + Simple Search Mode
 * Features: Named capture groups, all regex flags, match highlighting,
 * detailed match info, replace mode, timeout protection,
 * NEW: Simple search mode, Pattern explanation, Hierarchical group tree
 */

// Helper: Escape regex special characters for simple search mode
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: Generate pattern explanation
function explainPattern(pattern: string): Array<{ part: string; meaning: string; position: number }> {
    const explanations: Array<{ part: string; meaning: string; position: number }> = [];
    const regexTokens: Array<{ regex: RegExp; meaning: (match: string) => string }> = [
        { regex: /^\^/, meaning: () => 'Start of string/line' },
        { regex: /^\$/, meaning: () => 'End of string/line' },
        { regex: /^\\d/, meaning: () => 'Any digit (0-9)' },
        { regex: /^\\D/, meaning: () => 'Any non-digit character' },
        { regex: /^\\w/, meaning: () => 'Word character (a-z, A-Z, 0-9, _)' },
        { regex: /^\\W/, meaning: () => 'Non-word character' },
        { regex: /^\\s/, meaning: () => 'Whitespace character (space, tab, newline)' },
        { regex: /^\\S/, meaning: () => 'Non-whitespace character' },
        { regex: /^\\b/, meaning: () => 'Word boundary' },
        { regex: /^\\B/, meaning: () => 'Non-word boundary' },
        { regex: /^\\n/, meaning: () => 'Newline character' },
        { regex: /^\\r/, meaning: () => 'Carriage return' },
        { regex: /^\\t/, meaning: () => 'Tab character' },
        { regex: /^\./, meaning: () => 'Any character (except newline unless s flag)' },
        { regex: /^\*/, meaning: () => 'Zero or more of the preceding' },
        { regex: /^\+/, meaning: () => 'One or more of the preceding' },
        { regex: /^\?/, meaning: () => 'Zero or one of the preceding (optional)' },
        { regex: /^\*\?/, meaning: () => 'Zero or more (lazy/non-greedy)' },
        { regex: /^\+\?/, meaning: () => 'One or more (lazy/non-greedy)' },
        { regex: /^\?\?/, meaning: () => 'Zero or one (lazy/non-greedy)' },
        { regex: /^\|/, meaning: () => 'OR - matches either side' },
        { regex: /^\(\?:([^)]*)\)/, meaning: (m) => `Non-capturing group: ${m}` },
        { regex: /^\(\?=([^)]*)\)/, meaning: (m) => `Positive lookahead: must be followed by "${m}"` },
        { regex: /^\(\?!([^)]*)\)/, meaning: (m) => `Negative lookahead: must NOT be followed by "${m}"` },
        { regex: /^\(\?<=([^)]*)\)/, meaning: (m) => `Positive lookbehind: must be preceded by "${m}"` },
        { regex: /^\(\?<!([^)]*)\)/, meaning: (m) => `Negative lookbehind: must NOT be preceded by "${m}"` },
        { regex: /^\(\?<(\w+)>/, meaning: (m) => `Named capture group: "${m}"` },
        { regex: /^\(/, meaning: () => 'Capture group start' },
        { regex: /^\)/, meaning: () => 'Capture group end' },
        { regex: /^\[(\^)?([^\]]+)\]/, meaning: (m) => m.startsWith('^') ? `Any character NOT in: ${m.slice(1)}` : `Any character in: ${m}` },
        { regex: /^\{(\d+)\}/, meaning: (m) => `Exactly ${m} occurrences` },
        { regex: /^\{(\d+),\}/, meaning: (m) => `${m} or more occurrences` },
        { regex: /^\{(\d+),(\d+)\}/, meaning: (m) => `Between ${m.split(',')[0]} and ${m.split(',')[1]} occurrences` },
        { regex: /^\\([0-9])/, meaning: (m) => `Backreference to group ${m}` },
        { regex: /^\\k<(\w+)>/, meaning: (m) => `Backreference to named group "${m}"` },
        { regex: /^https?:\/\//, meaning: () => 'HTTP or HTTPS protocol' },
        { regex: /^[a-zA-Z0-9]+/, meaning: (m) => `Literal text: "${m}"` },
        { regex: /^\\(.)/, meaning: (m) => `Escaped character: "${m}"` },
    ];

    let remaining = pattern;
    let position = 0;

    while (remaining.length > 0) {
        let matched = false;

        for (const token of regexTokens) {
            const match = remaining.match(token.regex);
            if (match) {
                const part = match[0];
                const captured = match[1] || match[0];
                explanations.push({
                    part,
                    meaning: token.meaning(captured),
                    position,
                });
                remaining = remaining.slice(part.length);
                position += part.length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            // Single character literal
            const char = remaining[0];
            explanations.push({
                part: char,
                meaning: `Literal character: "${char}"`,
                position,
            });
            remaining = remaining.slice(1);
            position += 1;
        }
    }

    return explanations;
}

// Helper: Build hierarchical group tree
function buildGroupTree(pattern: string, match: RegExpExecArray): {
    fullMatch: string;
    groups: Array<{
        index: number;
        name?: string;
        value: string;
        start: number;
        end: number;
        nested?: boolean;
    }>;
} {
    const groups: Array<{
        index: number;
        name?: string;
        value: string;
        start: number;
        end: number;
        nested?: boolean;
    }> = [];

    // Extract named groups from pattern
    const namedGroupPattern = /\(\?<(\w+)>/g;
    const namedGroups: string[] = [];
    let namedMatch;
    while ((namedMatch = namedGroupPattern.exec(pattern)) !== null) {
        namedGroups.push(namedMatch[1]);
    }

    // Build group entries
    for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
            const value = match[i];
            const fullMatchText = match[0];
            const valueIndex = fullMatchText.indexOf(value);

            groups.push({
                index: i,
                name: match.groups && Object.keys(match.groups)[i - 1] ? Object.keys(match.groups).find(k => match.groups![k] === value) : undefined,
                value,
                start: valueIndex >= 0 ? match.index + valueIndex : match.index,
                end: valueIndex >= 0 ? match.index + valueIndex + value.length : match.index + value.length,
                nested: i > 1 && match[i - 1]?.includes(value),
            });
        }
    }

    return {
        fullMatch: match[0],
        groups,
    };
}

export async function handleSearchRegex(
    page: Page,
    args: SearchRegexArgs
): Promise<{
    found: boolean;
    matches: Array<{
        text: string;
        context: string;
        index: number;
        length: number;
        groups?: Record<string, string>;
        numberedGroups?: string[];
        groupTree?: {
            fullMatch: string;
            groups: Array<{
                index: number;
                name?: string;
                value: string;
                start: number;
                end: number;
                nested?: boolean;
            }>;
        };
    }>;
    count: number;
    replaced?: string;
    patternInfo?: {
        flags: string;
        isValid: boolean;
        isSimpleSearch?: boolean;
        originalPattern?: string;
        errorMessage?: string;
    };
    patternExplanation?: Array<{ part: string; meaning: string; position: number }>;
}> {
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`search-regex-${Date.now()}`);

    // Determine search mode
    const isSimpleSearch = args.simpleSearch === true;
    const searchMode = isSimpleSearch ? '🔤 Simple Search' : '🔎 Regex Search';
    tracker.start(100, `${searchMode}: "${args.pattern}"`);

    // Build regex flags
    const flags = args.flags || {};
    let flagString = '';
    if (flags.global !== false) flagString += 'g';
    if (flags.ignoreCase || isSimpleSearch) flagString += 'i'; // Simple search defaults to case-insensitive
    if (flags.multiline) flagString += 'm';
    if (flags.dotAll) flagString += 's';
    if (flags.unicode) flagString += 'u';
    if (flags.sticky) flagString += 'y';

    // Process pattern based on mode
    let processedPattern = args.pattern;
    const originalPattern = args.pattern;

    if (isSimpleSearch) {
        // Escape all regex special characters for literal search
        processedPattern = escapeRegex(args.pattern);
        tracker.setProgress(10, '🔤 Simple search mode - treating as literal text');
    }

    // Validate regex
    let regex: RegExp;
    let patternInfo: {
        flags: string;
        isValid: boolean;
        isSimpleSearch?: boolean;
        originalPattern?: string;
        errorMessage?: string;
    } = {
        flags: flagString,
        isValid: true,
        isSimpleSearch,
        originalPattern: isSimpleSearch ? originalPattern : undefined,
    };

    try {
        regex = new RegExp(processedPattern, flagString);
    } catch (e: any) {
        tracker.fail(`Invalid regex: ${e.message}`);
        return {
            found: false,
            matches: [],
            count: 0,
            patternInfo: { ...patternInfo, isValid: false, errorMessage: e.message },
        };
    }

    // Generate pattern explanation if requested
    let patternExplanation: Array<{ part: string; meaning: string; position: number }> | undefined;
    if (args.showExplanation && !isSimpleSearch) {
        tracker.setProgress(15, '📖 Generating pattern explanation...');
        patternExplanation = explainPattern(args.pattern);
    }

    tracker.setProgress(20, '📄 Extracting content...');

    // Get content based on sourceType
    let content = '';
    if (args.testString) {
        content = args.testString;
    } else {
        const sourceType = args.sourceType || 'text';
        try {
            await page.waitForSelector('body', { timeout: 5000 });
        } catch { /* continue */ }

        if (args.selector) {
            try {
                content = await page.$eval(args.selector, (el, type) => {
                    if (type === 'html') return el.innerHTML;
                    if (type === 'text') return el.textContent || '';
                    return el.outerHTML;
                }, sourceType);
            } catch {
                content = '';
            }
        } else {
            content = await page.evaluate((type) => {
                if (type === 'html') return document.documentElement.innerHTML;
                if (type === 'scripts') {
                    return Array.from(document.scripts).map(s => s.textContent).join('\n');
                }
                if (type === 'styles') {
                    return Array.from(document.styleSheets).map(s => {
                        try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); }
                        catch { return ''; }
                    }).join('\n');
                }
                if (type === 'attributes') {
                    return Array.from(document.querySelectorAll('*')).map(el =>
                        Array.from(el.attributes).map(a => `${a.name}="${a.value}"`).join(' ')
                    ).join('\n');
                }
                if (type === 'all') {
                    return document.documentElement.outerHTML;
                }
                return document.body?.textContent || '';
            }, sourceType);
        }
    }

    if (!content) {
        tracker.fail('No content to search');
        return { found: false, matches: [], count: 0, patternInfo, patternExplanation };
    }

    tracker.setProgress(50, '🔍 Running match...');

    const matches: Array<{
        text: string;
        context: string;
        index: number;
        length: number;
        groups?: Record<string, string>;
        numberedGroups?: string[];
        groupTree?: {
            fullMatch: string;
            groups: Array<{
                index: number;
                name?: string;
                value: string;
                start: number;
                end: number;
                nested?: boolean;
            }>;
        };
    }> = [];

    const maxMatches = args.maxMatches || 100;
    const contextChars = args.contextChars || 50;
    const timeout = args.timeout || 5000;
    const startTime = Date.now();

    let match;
    while ((match = regex.exec(content)) !== null) {
        // Timeout protection
        if (Date.now() - startTime > timeout) {
            tracker.setProgress(80, '⚠️ Timeout reached, returning partial results');
            break;
        }

        const start = Math.max(0, match.index - contextChars);
        const end = Math.min(content.length, match.index + match[0].length + contextChars);
        let context = content.substring(start, end);

        // Highlight if requested
        if (args.highlightMatches) {
            const matchStart = match.index - start;
            const matchEnd = matchStart + match[0].length;
            context = context.substring(0, matchStart) + '<<MATCH>>' + context.substring(matchStart, matchEnd) + '<</MATCH>>' + context.substring(matchEnd);
        }

        const matchResult: any = {
            text: match[0],
            context,
            index: match.index,
            length: match[0].length,
        };

        // Extract groups if requested
        if (args.extractGroups !== false && !isSimpleSearch) {
            if (match.groups) {
                matchResult.groups = match.groups;
            }
            if (match.length > 1) {
                matchResult.numberedGroups = match.slice(1);
            }
        }

        // Build hierarchical group tree if requested
        if (args.showGroupTree && !isSimpleSearch && match.length > 1) {
            matchResult.groupTree = buildGroupTree(args.pattern, match);
        }

        matches.push(matchResult);

        if (matches.length >= maxMatches) break;

        // Prevent infinite loop for zero-length matches
        if (match[0].length === 0) {
            regex.lastIndex++;
        }
    }

    // Replace mode
    let replaced: string | undefined;
    if (args.replaceWith !== undefined) {
        tracker.setProgress(90, '🔄 Applying replacement...');
        replaced = content.replace(regex, args.replaceWith);
    }

    const modeText = isSimpleSearch ? 'text matches' : 'regex matches';
    tracker.complete(`🎉 Found ${matches.length} ${modeText}`);

    return {
        found: matches.length > 0,
        matches,
        count: matches.length,
        replaced,
        patternInfo,
        patternExplanation,
    };
}

/**
 * 🚀 INTELLIGENT Content Search Engine
 * Features: Fuzzy matching, proximity search, advanced operators,
 * relevance scoring, snippet extraction with highlighting
 */
export async function handleWebSearch(
    page: Page,
    args: WebSearchArgs
): Promise<{
    found: boolean;
    results: Array<{
        text: string;
        snippet: string;
        score: number;
        position: number;
        element?: string;
    }>;
    count: number;
    totalOccurrences: number;
    searchInfo: {
        query: string;
        searchIn: string;
        matchMode: string;
    };
}> {
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`web-search-${Date.now()}`);
    tracker.start(100, `🚀 Intelligent Search: "${args.query}"`);

    try {
        await page.waitForSelector('body', { timeout: 5000 });
    } catch { /* continue */ }

    tracker.setProgress(20, '📄 Extracting content...');

    // Get content based on searchIn type
    const searchIn = args.searchIn || 'text';
    let content = '';
    let elements: Array<{ text: string; element: string }> = [];

    content = await page.evaluate((opts: any) => {
        const { searchIn, selector } = opts;
        const root = selector ? document.querySelector(selector) : document.body;
        if (!root) return '';

        switch (searchIn) {
            case 'html':
                return root.innerHTML;
            case 'links':
                return Array.from(root.querySelectorAll('a')).map((a: any) =>
                    `${a.textContent?.trim()} [${a.getAttribute('href')}]`
                ).join('\n');
            case 'images':
                return Array.from(root.querySelectorAll('img')).map((img: any) =>
                    `${img.alt} [${img.src}]`
                ).join('\n');
            case 'videos':
                return Array.from(root.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]')).map((v: any) =>
                    v.getAttribute('src') || v.querySelector?.('source')?.getAttribute('src') || ''
                ).join('\n');
            case 'scripts':
                return Array.from(document.scripts).map((s: any) => s.textContent).join('\n');
            case 'json':
                return Array.from(document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]'))
                    .map((s: any) => s.textContent).join('\n');
            case 'schema':
                return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                    .map((s: any) => s.textContent).join('\n');
            case 'meta':
                return Array.from(document.querySelectorAll('meta')).map((m: any) =>
                    `${m.name || m.getAttribute('property')}: ${m.content}`
                ).join('\n');
            case 'all':
                return root.outerHTML;
            default:
                return root.textContent || '';
        }
    }, { searchIn, selector: args.selector });

    if (!content) {
        tracker.fail('No content to search');
        return {
            found: false,
            results: [],
            count: 0,
            totalOccurrences: 0,
            searchInfo: { query: args.query, searchIn, matchMode: 'none' },
        };
    }

    tracker.setProgress(40, '🔍 Processing search query...');

    const matchMode = args.matchMode || {};
    const operators = args.operators || {};
    const filters = args.filters || {};
    const maxResults = args.maxResults || 50;
    const snippetLength = args.snippetLength || 150;
    const highlightTag = args.highlightTag || '**';

    // Parse query for operators
    let searchTerms: string[] = [];
    let phrases: string[] = [];

    // Extract phrases (quoted strings)
    const phraseMatches = args.query.match(/"([^"]+)"/g);
    if (phraseMatches) {
        phrases = phraseMatches.map(p => p.replace(/"/g, ''));
    }

    // Get remaining terms
    const remainingQuery = args.query.replace(/"[^"]+"/g, '').trim();
    if (remainingQuery) {
        // Parse AND/OR/NOT operators
        const parts = remainingQuery.split(/\s+(AND|OR|NOT)\s+/i);
        searchTerms = parts.filter(p => !['AND', 'OR', 'NOT'].includes(p.toUpperCase()));
    }

    // Add explicit operator terms
    if (operators.must) searchTerms.push(...operators.must);
    if (operators.should) searchTerms.push(...operators.should);
    if (operators.phrase) phrases.push(operators.phrase);

    tracker.setProgress(60, '🎯 Matching content...');

    const results: Array<{
        text: string;
        snippet: string;
        score: number;
        position: number;
        element?: string;
    }> = [];

    // Levenshtein distance for fuzzy matching
    const levenshtein = (a: string, b: string): number => {
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }
        return matrix[b.length][a.length];
    };

    const fuzzyMatch = (text: string, term: string, threshold: number): boolean => {
        const distance = levenshtein(text.toLowerCase(), term.toLowerCase());
        const maxLen = Math.max(text.length, term.length);
        return (1 - distance / maxLen) >= threshold;
    };

    // Split content into searchable chunks
    const sentences = content.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
    let totalOccurrences = 0;

    for (let i = 0; i < sentences.length && results.length < maxResults; i++) {
        const sentence = sentences[i].trim();
        let score = 0;
        let matched = false;

        // Check phrases first
        for (const phrase of phrases) {
            const phraseRegex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchMode.caseSensitive ? 'g' : 'gi');
            if (phraseRegex.test(sentence)) {
                score += 10;
                matched = true;
                totalOccurrences += (sentence.match(phraseRegex) || []).length;
            }
        }

        // Check terms
        for (const term of searchTerms) {
            if (matchMode.fuzzy) {
                const words = sentence.split(/\s+/);
                for (const word of words) {
                    if (fuzzyMatch(word, term, matchMode.fuzzyThreshold || 0.8)) {
                        score += 5;
                        matched = true;
                        totalOccurrences++;
                    }
                }
            } else {
                const termRegex = matchMode.wholeWord
                    ? new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, matchMode.caseSensitive ? 'g' : 'gi')
                    : new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchMode.caseSensitive ? 'g' : 'gi');
                const termMatches = sentence.match(termRegex);
                if (termMatches) {
                    score += termMatches.length * 3;
                    matched = true;
                    totalOccurrences += termMatches.length;
                }
            }
        }

        // Check mustNot terms
        if (operators.mustNot) {
            for (const notTerm of operators.mustNot) {
                if (sentence.toLowerCase().includes(notTerm.toLowerCase())) {
                    matched = false;
                    score = 0;
                    break;
                }
            }
        }

        // Proximity search
        if (matched && operators.proximity?.words && operators.proximity.words.length >= 2) {
            const words = sentence.toLowerCase().split(/\s+/);
            const positions: number[] = [];
            for (const pw of operators.proximity.words) {
                const idx = words.findIndex(w => w.includes(pw.toLowerCase()));
                if (idx !== -1) positions.push(idx);
            }
            if (positions.length >= 2) {
                const distance = Math.abs(positions[0] - positions[1]);
                if (distance <= (operators.proximity.distance || 5)) {
                    score += 15;
                }
            }
        }

        // Apply filters
        if (matched && filters.minLength && sentence.length < filters.minLength) matched = false;
        if (matched && filters.maxLength && sentence.length > filters.maxLength) matched = false;
        if (matched && filters.containsPattern) {
            const containsRegex = new RegExp(filters.containsPattern, 'i');
            if (!containsRegex.test(sentence)) matched = false;
        }
        if (matched && filters.excludePattern) {
            const excludeRegex = new RegExp(filters.excludePattern, 'i');
            if (excludeRegex.test(sentence)) matched = false;
        }

        if (matched && score > 0) {
            // Create highlighted snippet
            let snippet = sentence.substring(0, snippetLength);
            for (const term of [...searchTerms, ...phrases]) {
                const highlightRegex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                snippet = snippet.replace(highlightRegex, `${highlightTag}$1${highlightTag}`);
            }

            results.push({
                text: sentence.substring(0, 100),
                snippet,
                score,
                position: i,
            });
        }
    }

    // Sort by relevance/position/frequency
    const sortBy = args.sortBy || 'relevance';
    if (sortBy === 'relevance') {
        results.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'position') {
        results.sort((a, b) => a.position - b.position);
    }

    tracker.complete(`🎉 Found ${results.length} results (${totalOccurrences} total occurrences)`);

    return {
        found: results.length > 0,
        results,
        count: results.length,
        totalOccurrences,
        searchInfo: {
            query: args.query,
            searchIn,
            matchMode: matchMode.fuzzy ? 'fuzzy' : matchMode.wholeWord ? 'wholeWord' : 'normal',
        },
    };
}


/**
 * Ultra-powerful element finder and batch scraper
 * Find elements using XPath, CSS, text, attributes with advanced filters
 * Supports batch scraping mode (merged from batch_element_scraper)
 */
export async function handleFindElementAdvanced(
    page: Page,
    args: FindElementAdvancedArgs
): Promise<{
    found: boolean;
    elements: { selector: string; text: string; tag: string; attributes?: Record<string, string>; position?: { x: number; y: number; width: number; height: number } }[];
    count: number;
    batchData?: Record<string, any>[];
}> {
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`find-element-${Date.now()}`);

    const limit = args.limit || 100;
    const selectorToUse = args.selector || args.cssSelector;

    // ============================================================
    // BATCH MODE (merged from batch_element_scraper)
    // ============================================================
    if (args.batchMode && selectorToUse) {
        tracker.start(100, '📋 Starting batch element extraction...');
        const attributes = args.extractAttributes || ['textContent', 'href', 'src'];

        tracker.setProgress(20, `🔍 Finding elements with selector: ${selectorToUse}`);

        const items = await page.evaluate((opts: any) => {
            const elements = Array.from(document.querySelectorAll(opts.selector)).slice(0, opts.limit);
            return elements.map((el, idx) => {
                const item: Record<string, any> = {};

                // Extract requested attributes
                for (const attr of opts.attributes) {
                    if (attr === 'textContent') {
                        item.text = el.textContent?.trim()?.substring(0, 500) || '';
                    } else if (attr === 'innerHTML') {
                        item.html = el.innerHTML?.substring(0, 1000) || '';
                    } else {
                        item[attr] = el.getAttribute(attr) || '';
                    }
                }

                // Include innerHTML if requested
                if (opts.includeInnerHTML) {
                    item.html = el.innerHTML?.substring(0, 1000) || '';
                }

                // Always include tag
                item.tag = el.tagName.toLowerCase();

                // Include position if requested
                if (opts.includePosition) {
                    const rect = el.getBoundingClientRect();
                    item.position = {
                        x: Math.round(rect.x),
                        y: Math.round(rect.y),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    };
                }

                // Generate unique selector
                const tagName = el.tagName.toLowerCase();
                const id = el.id;
                const className = typeof el.className === 'string' ? el.className.split(' ')[0] : '';
                item.selector = id ? `#${id}` : className ? `${tagName}.${className}` : `${opts.selector}:nth-of-type(${idx + 1})`;

                // Apply advanced filters if specified
                if (opts.filter) {
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);

                    if (opts.filter.visible !== undefined) {
                        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
                        if (opts.filter.visible !== isVisible) return null;
                    }
                    if (opts.filter.enabled !== undefined) {
                        const isEnabled = !(el as HTMLInputElement).disabled;
                        if (opts.filter.enabled !== isEnabled) return null;
                    }
                    if (opts.filter.minWidth && rect.width < opts.filter.minWidth) return null;
                    if (opts.filter.minHeight && rect.height < opts.filter.minHeight) return null;
                    if (opts.filter.hasChildren !== undefined) {
                        const hasKids = el.children.length > 0;
                        if (opts.filter.hasChildren !== hasKids) return null;
                    }
                    if (opts.filter.containsClass && !el.classList.contains(opts.filter.containsClass)) return null;
                    if (opts.filter.matchPattern) {
                        const regex = new RegExp(opts.filter.matchPattern);
                        if (!regex.test(el.textContent || '')) return null;
                    }
                }

                return item;
            }).filter((item: any) => item !== null);
        }, {
            selector: selectorToUse,
            limit,
            attributes,
            includeInnerHTML: args.includeInnerHTML,
            includePosition: args.includePosition,
            filter: args.filter
        });

        tracker.setProgress(80, `✅ Found ${items.length} elements`);

        // Format output based on returnType
        const returnType = args.returnType || 'elements';

        if (returnType === 'selectors') {
            tracker.complete(`🎉 Extracted ${items.length} selectors`);
            return {
                found: items.length > 0,
                elements: items.map((item: any) => ({
                    selector: item.selector,
                    text: '',
                    tag: item.tag,
                })),
                count: items.length,
            };
        }

        if (returnType === 'data') {
            tracker.complete(`🎉 Extracted data from ${items.length} elements`);
            return {
                found: items.length > 0,
                elements: [],
                count: items.length,
                batchData: items,
            };
        }

        // Default: elements
        tracker.complete(`🎉 Found and extracted ${items.length} elements`);
        return {
            found: items.length > 0,
            elements: items.map((item: any) => ({
                selector: item.selector,
                text: item.text || '',
                tag: item.tag,
                attributes: item,
                position: item.position,
            })),
            count: items.length,
            batchData: items,
        };
    }

    // ============================================================
    // STANDARD FIND MODE
    // ============================================================
    tracker.start(100, '🔍 Finding elements...');
    const elements: { selector: string; text: string; tag: string; attributes?: Record<string, string>; position?: { x: number; y: number; width: number; height: number } }[] = [];

    // Wait for body to be available
    try {
        await page.waitForSelector('body', { timeout: 5000 });
    } catch {
        // Continue anyway
    }

    tracker.setProgress(20, '📄 Searching with provided criteria...');

    // XPath search
    if (args.xpath) {
        const xpathResults = await page.evaluate((xpath: string) => {
            const results: any[] = [];
            try {
                const iterator = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let node = iterator.iterateNext();
                let count = 0;
                while (node && count < 50) {
                    if (node instanceof Element) {
                        const rect = node.getBoundingClientRect();
                        results.push({
                            text: node.textContent?.trim()?.substring(0, 100) || '',
                            tag: node.tagName.toLowerCase(),
                            id: node.id || '',
                            className: typeof node.className === 'string' ? node.className : '',
                            position: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
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
            position: args.includePosition ? e.position : undefined,
        })));
    }

    // CSS selector search
    if (selectorToUse) {
        const cssElements = await page.$$(selectorToUse);
        for (const el of cssElements.slice(0, limit)) {
            const data = await page.evaluate((e: any, includePos: boolean) => {
                const rect = e.getBoundingClientRect();
                return {
                    text: (e as Element).textContent?.trim()?.substring(0, 100) || '',
                    tag: (e as Element).tagName.toLowerCase(),
                    id: (e as Element).id,
                    className: (e as Element).className,
                    position: includePos ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : undefined,
                };
            }, el, args.includePosition);
            elements.push({
                selector: selectorToUse,
                text: data.text,
                tag: data.tag,
                position: data.position,
            });
        }
    }

    // Text content search
    if (args.contains || args.text) {
        const searchText = args.contains || args.text || '';
        const isExact = args.exact || false;

        const containsElements = await page.evaluate((opts: any) => {
            const results: any[] = [];
            const allElements = document.querySelectorAll(opts.elementType || '*');
            for (let i = 0; i < allElements.length && results.length < opts.limit; i++) {
                const el = allElements[i];
                const textContent = el.textContent || '';
                const matches = opts.exact
                    ? textContent.trim() === opts.text
                    : textContent.includes(opts.text);

                if (matches) {
                    const rect = el.getBoundingClientRect();
                    results.push({
                        text: textContent.trim()?.substring(0, 100) || '',
                        tag: el.tagName.toLowerCase(),
                        id: el.id || '',
                        className: typeof el.className === 'string' ? el.className : '',
                        position: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
                    });
                }
            }
            return results;
        }, { text: searchText, exact: isExact, elementType: args.elementType, limit });

        elements.push(...containsElements.map((e: any) => ({
            selector: e.id ? `#${e.id}` : e.className ? `.${e.className.split(' ')[0]}` : e.tag,
            text: e.text,
            tag: e.tag,
            position: args.includePosition ? e.position : undefined,
        })));
    }

    // Attribute search
    if (args.attributes) {
        let attributes: Record<string, string> = {};
        try {
            attributes = JSON.parse(args.attributes);
        } catch (e) {
            // Ignore invalid JSON
        }

        const attributeElements = await page.evaluate((opts: any) => {
            const results: any[] = [];
            const allElements = document.querySelectorAll('*');

            for (let i = 0; i < allElements.length && results.length < opts.limit; i++) {
                const el = allElements[i];
                let match = true;

                for (const [key, value] of Object.entries(opts.attrs)) {
                    if (el.getAttribute(key) !== value) {
                        match = false;
                        break;
                    }
                }

                if (match) {
                    const rect = el.getBoundingClientRect();
                    results.push({
                        text: el.textContent?.trim()?.substring(0, 100) || '',
                        tag: el.tagName.toLowerCase(),
                        id: el.id || '',
                        className: typeof el.className === 'string' ? el.className : '',
                        position: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
                    });
                }
            }
            return results;
        }, { attrs: attributes, limit });

        elements.push(...attributeElements.map((e: any) => ({
            selector: e.id ? `#${e.id}` : e.className ? `.${e.className.split(' ')[0]}` : e.tag,
            text: e.text,
            tag: e.tag,
            position: args.includePosition ? e.position : undefined,
        })));
    }

    tracker.complete(`🎉 Found ${elements.length} elements`);

    return {
        found: elements.length > 0,
        elements: elements.slice(0, limit),
        count: elements.length,
    };
}

/**
 * Extract embedded JSON/API data from page + Advanced Decode capabilities
 * Supports: base64, URL encoding, hex, rot13, reverse - with multi-layer decoding
 */

// ============================================================
// DECODE HELPER FUNCTIONS
// ============================================================

function decodeBase64(input: string): string {
    try {
        // Handle URL-safe base64
        const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
        return Buffer.from(padded, 'base64').toString('utf-8');
    } catch {
        return input;
    }
}

function decodeUrl(input: string): string {
    try {
        return decodeURIComponent(input);
    } catch {
        return input;
    }
}

function decodeHex(input: string): string {
    try {
        // Remove 0x prefix if present
        const hex = input.replace(/^0x/i, '').replace(/\s/g, '');
        return Buffer.from(hex, 'hex').toString('utf-8');
    } catch {
        return input;
    }
}

function decodeRot13(input: string): string {
    return input.replace(/[a-zA-Z]/g, (char) => {
        const base = char <= 'Z' ? 65 : 97;
        return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
    });
}

function reverseString(input: string): string {
    return input.split('').reverse().join('');
}

// ============================================================
// ULTRA ADVANCED DECODE FUNCTIONS
// ============================================================

/**
 * Common streaming site encryption keys database
 * Used for tryCommonKeys feature
 */
const COMMON_STREAMING_KEYS = {
    hubstream: {
        keys: ['kiemtienmua911ca', '0123456789abcdef'],
        ivs: ['1234567890oiuytr', '0123456789abcdef'],
    },
    vidstack: {
        keys: ['streamkey12345ab', 'vidstack1234567'],
        ivs: ['abcdef0123456789', '1234567890abcdef'],
    },
    player: {
        keys: ['playerkey123456', 'defaultkey12345'],
        ivs: ['playeriv12345678', 'defaultiv1234567'],
    },
    generic: {
        keys: ['aaaaaaaaaaaaaaaa', '0000000000000000', '1111111111111111'],
        ivs: ['0000000000000000', '1111111111111111', 'aaaaaaaaaaaaaaaa'],
    }
};

/**
 * XOR Cipher Decryption
 * XOR each byte with key (repeating if key is shorter)
 */
function decryptXOR(input: string, key: string | number, inputFormat: 'hex' | 'base64' | 'text' = 'hex'): string {
    try {
        let inputBytes: Buffer;

        // Parse input based on format
        if (inputFormat === 'hex') {
            inputBytes = Buffer.from(input.replace(/\s/g, ''), 'hex');
        } else if (inputFormat === 'base64') {
            inputBytes = Buffer.from(input, 'base64');
        } else {
            inputBytes = Buffer.from(input, 'utf-8');
        }

        // Parse key
        let keyBytes: Buffer;
        if (typeof key === 'number') {
            keyBytes = Buffer.from([key & 0xFF]);
        } else {
            keyBytes = Buffer.from(key, 'utf-8');
        }

        // XOR decrypt
        const result = Buffer.alloc(inputBytes.length);
        for (let i = 0; i < inputBytes.length; i++) {
            result[i] = inputBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        return result.toString('utf-8');
    } catch (e) {
        return input;
    }
}

/**
 * RC4 Stream Cipher Decryption
 * Used by some streaming sites for lightweight encryption
 */
function decryptRC4(inputHex: string, key: string): string {
    try {
        const input = Buffer.from(inputHex.replace(/\s/g, ''), 'hex');
        const keyBytes = Buffer.from(key, 'utf-8');

        // RC4 Key Scheduling Algorithm (KSA)
        const S = new Uint8Array(256);
        for (let i = 0; i < 256; i++) S[i] = i;

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + S[i] + keyBytes[i % keyBytes.length]) & 0xFF;
            [S[i], S[j]] = [S[j], S[i]]; // Swap
        }

        // RC4 Pseudo-Random Generation Algorithm (PRGA)
        const result = Buffer.alloc(input.length);
        let i = 0;
        j = 0;

        for (let k = 0; k < input.length; k++) {
            i = (i + 1) & 0xFF;
            j = (j + S[i]) & 0xFF;
            [S[i], S[j]] = [S[j], S[i]]; // Swap
            const keyByte = S[(S[i] + S[j]) & 0xFF];
            result[k] = input[k] ^ keyByte;
        }

        return result.toString('utf-8');
    } catch (e) {
        return inputHex;
    }
}

/**
 * AES-256-CBC Decryption
 * For sites using stronger 256-bit encryption
 */
function decryptAES256(inputHex: string, key: string, iv: string): string {
    try {
        const crypto = require('crypto');

        const inputBuffer = Buffer.from(inputHex, 'hex');
        const keyBuffer = Buffer.from(key, 'utf-8'); // 32 bytes for AES-256
        const ivBuffer = Buffer.from(iv, 'utf-8');   // 16 bytes

        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
        decipher.setAutoPadding(true);

        let decrypted = decipher.update(inputBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf-8');
    } catch (e) {
        throw new Error(`AES-256 decryption failed: ${e}`);
    }
}

/**
 * AES-GCM Decryption (Authenticated Encryption)
 * More secure mode used by modern sites
 */
function decryptAESGCM(inputHex: string, key: string, iv: string, authTag?: string): string {
    try {
        const crypto = require('crypto');

        const inputBuffer = Buffer.from(inputHex, 'hex');
        const keyBuffer = Buffer.from(key, 'utf-8');
        const ivBuffer = Buffer.from(iv, 'utf-8');

        const decipher = crypto.createDecipheriv('aes-128-gcm', keyBuffer, ivBuffer);

        if (authTag) {
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        }

        let decrypted = decipher.update(inputBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf-8');
    } catch (e) {
        throw new Error(`AES-GCM decryption failed: ${e}`);
    }
}

/**
 * Auto-Detect Encryption Type
 * Analyzes input and detects the most likely encryption/encoding
 */
function autoDetectEncryption(input: string): {
    type: 'base64' | 'hex' | 'rot13' | 'packedJs' | 'xor' | 'aes' | 'jsfuck' | 'unknown';
    confidence: number;
    details?: string;
} {
    // Check for JSFuck (all symbols)
    if (/^[\[\]\(\)\+\!\s]+$/.test(input) && input.length > 50) {
        return { type: 'jsfuck', confidence: 95, details: 'JSFuck obfuscated code' };
    }

    // Check for Packed JS
    if (input.includes('function(p,a,c,k,e,d)') || input.includes("eval(function(p,a,c,k,e")) {
        return { type: 'packedJs', confidence: 98, details: 'P.A.C.K.E.R. packed JavaScript' };
    }

    // Check for Hex (only hex chars and even length)
    if (/^[0-9a-fA-F]+$/.test(input) && input.length % 2 === 0 && input.length >= 32) {
        return { type: 'hex', confidence: 85, details: 'Hex-encoded data' };
    }

    // Check for Base64
    if (/^[A-Za-z0-9+/=_-]+$/.test(input) && input.length >= 4) {
        try {
            const decoded = decodeBase64(input);
            if (decoded && /^[\x20-\x7E\s]+$/.test(decoded)) {
                return { type: 'base64', confidence: 90, details: 'Base64 encoded' };
            }
        } catch { }
    }

    // Check for ROT13 (common ROT13 patterns)
    const rot13Decoded = decodeRot13(input);
    if (rot13Decoded.startsWith('http') || rot13Decoded.includes('://')) {
        return { type: 'rot13', confidence: 85, details: 'ROT13 encoded URL' };
    }

    // Check for AES (hex string of typical AES block sizes)
    if (/^[0-9a-fA-F]+$/.test(input) && (input.length === 32 || input.length === 64 || input.length % 32 === 0)) {
        return { type: 'aes', confidence: 70, details: 'Possibly AES encrypted' };
    }

    return { type: 'unknown', confidence: 0, details: 'Could not detect encryption type' };
}

/**
 * Extract URLs from decoded content
 * Finds http/https URLs in any text
 */
function extractUrlsFromText(text: string): string[] {
    const urlPatterns = [
        /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/gi,
        /https?:\/\/[^\s"'<>\\]+\.mp4[^\s"'<>\\]*/gi,
        /https?:\/\/[^\s"'<>\\]+\.mp3[^\s"'<>\\]*/gi,
        /https?:\/\/[^\s"'<>\\]+/gi,
    ];

    const urls: string[] = [];
    for (const pattern of urlPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const url = match[0].replace(/['",;}\]]+$/, ''); // Clean trailing chars
            if (!urls.includes(url) && url.length > 10) {
                urls.push(url);
            }
        }
    }

    return [...new Set(urls)]; // Remove duplicates
}

/**
 * Recursive Decode - Keep decoding until URL found or max depth reached
 */
function recursiveDecode(input: string, maxDepth: number = 10): {
    decoded: string;
    layers: string[];
    depth: number;
    foundUrls: string[];
} {
    let current = input;
    const layers: string[] = [];
    let depth = 0;

    while (depth < maxDepth) {
        const detection = autoDetectEncryption(current);

        if (detection.type === 'unknown' || detection.confidence < 50) {
            break;
        }

        let decoded: string;
        try {
            switch (detection.type) {
                case 'base64':
                    decoded = decodeBase64(current);
                    break;
                case 'hex':
                    decoded = decodeHex(current);
                    break;
                case 'rot13':
                    decoded = decodeRot13(current);
                    break;
                case 'packedJs':
                    decoded = unpackJs(current);
                    break;
                default:
                    decoded = current;
            }
        } catch {
            break;
        }

        if (decoded === current || !decoded) {
            break;
        }

        layers.push(detection.type);
        current = decoded;
        depth++;

        // Check if we found URLs
        const urls = extractUrlsFromText(current);
        if (urls.some(u => u.includes('.m3u8') || u.includes('.mp4') || u.includes('stream'))) {
            return { decoded: current, layers, depth, foundUrls: urls };
        }
    }

    return { decoded: current, layers, depth, foundUrls: extractUrlsFromText(current) };
}

/**
 * JSFuck Decoder
 * Decodes JSFuck obfuscated code (uses only []()!+)
 */
function decodeJSFuck(input: string): string {
    try {
        // JSFuck can only be safely decoded by evaluating it
        // We use a sandboxed approach
        if (!/^[\[\]\(\)\+\!\s]+$/.test(input)) {
            return input; // Not JSFuck
        }

        // Common JSFuck patterns that decode to strings
        const patterns: { [key: string]: string } = {
            '[]': '',
            '![]': 'false',
            '!![]': 'true',
            '+[]': '0',
            '+!![]': '1',
        };

        // This is a simplified decoder - full JSFuck requires eval
        // Return indication that it's JSFuck for browser-side decoding
        return `[JSFuck detected - length: ${input.length} - use execute_js with eval() for full decode]`;
    } catch {
        return input;
    }
}

/**
 * Try decryption with common streaming site keys
 */
async function tryCommonKeys(inputHex: string, page: any): Promise<{
    success: boolean;
    key?: string;
    iv?: string;
    decrypted?: string;
    site?: string;
}> {
    for (const [site, config] of Object.entries(COMMON_STREAMING_KEYS)) {
        for (const key of config.keys) {
            for (const iv of config.ivs) {
                try {
                    const result = await page.evaluate(async (params: { input: string; key: string; iv: string }) => {
                        try {
                            const hexToBytes = (hex: string) => {
                                const bytes = new Uint8Array(hex.length / 2);
                                for (let i = 0; i < hex.length; i += 2) {
                                    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
                                }
                                return bytes;
                            };

                            const keyData = new TextEncoder().encode(params.key);
                            const ivData = new TextEncoder().encode(params.iv);
                            const encryptedData = hexToBytes(params.input);

                            const cryptoKey = await crypto.subtle.importKey(
                                "raw", keyData, "AES-CBC", false, ["decrypt"]
                            );

                            const decrypted = await crypto.subtle.decrypt(
                                { name: "AES-CBC", iv: ivData },
                                cryptoKey,
                                encryptedData
                            );

                            return new TextDecoder().decode(decrypted);
                        } catch {
                            return null;
                        }
                    }, { input: inputHex, key, iv });

                    if (result && (result.includes('http') || result.includes('source'))) {
                        return { success: true, key, iv, decrypted: result, site };
                    }
                } catch {
                    continue;
                }
            }
        }
    }

    return { success: false };
}

/**
 * AES-CBC decryption for encrypted streaming responses
 * Used by sites like hubstream.art that encrypt video URLs
 * @param inputHex - Hex-encoded encrypted string
 * @param key - AES key (16 chars for AES-128)
 * @param iv - Initialization vector (16 chars)
 */
function decryptAES(inputHex: string, key: string, iv: string): string {
    try {
        const crypto = require('crypto');

        // Convert hex string to Buffer
        const inputBuffer = Buffer.from(inputHex, 'hex');
        const keyBuffer = Buffer.from(key, 'utf-8');
        const ivBuffer = Buffer.from(iv, 'utf-8');

        // Create decipher (AES-128-CBC requires 16-byte key and IV)
        const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, ivBuffer);
        decipher.setAutoPadding(true);

        // Decrypt
        let decrypted = decipher.update(inputBuffer);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf-8');
    } catch (e) {
        throw new Error(`AES decryption failed: ${e}`);
    }
}

/**
 * Unpack obfuscated JavaScript code using eval(function(p,a,c,k,e,d)) pattern
 * This is the most common packer used by streaming sites
 * 
 * Format: eval(function(p,a,c,k,e,d){while(c--)...}('packed_code',36,623,'dict'.split('|'),0,{}))
 */
function unpackJs(input: string): string {
    try {
        // Check if input contains packed JS pattern
        if (!input.includes('function(p,a,c,k,e,d)') && !input.includes('function (p,a,c,k,e,d)')) {
            return input;
        }

        // Strategy 1: Extract dictionary from the end (most reliable)
        // Pattern: 'dictionary_words'.split('|')
        const dictRegex = /'([^']{50,})'\.split\s*\(\s*'\|'\s*\)/;
        const dictMatch = input.match(dictRegex);

        if (!dictMatch) {
            return input;
        }

        const dictionary = dictMatch[1].split('|');

        // Strategy 2: Position-based extraction (handles escaped quotes in packed code)
        // Find start marker: }('
        const startMarker = "}('";
        const startIdx = input.indexOf(startMarker);

        if (startIdx === -1) {
            return input;
        }

        // Find radix and count pattern: ,radix,count,'
        // Common radix values: 36, 62, 10, 16
        const radixPattern = /,(\d{1,2}),(\d+),'/;
        const radixMatch = input.match(radixPattern);

        if (!radixMatch) {
            return input;
        }

        const radix = parseInt(radixMatch[1]);
        const count = parseInt(radixMatch[2]);

        // Validate radix (must be between 2-62)
        if (radix < 2 || radix > 62) {
            return input;
        }

        // Find position of radix pattern in input
        const radixSearchPattern = ',' + radixMatch[1] + ',' + radixMatch[2] + ",'";
        const radixPos = input.indexOf(radixSearchPattern);

        if (radixPos === -1 || radixPos <= startIdx) {
            return input;
        }

        // Extract packed code between }(' and the radix position
        const packedStart = startIdx + startMarker.length;
        const packed = input.substring(packedStart, radixPos);

        // Validate packed code (must end with quote)
        if (!packed.endsWith("'")) {
            // Try to trim trailing quote
            const cleanPacked = packed.replace(/'$/, '');
            return unpackPACKer(cleanPacked, radix, count, dictionary);
        }

        // Remove trailing quote
        const cleanPacked = packed.slice(0, -1);

        return unpackPACKer(cleanPacked, radix, count, dictionary);
    } catch (e) {
        return input;
    }
}

/**
 * Core P.A.C.K.E.R. decoding algorithm
 * Replaces placeholders in packed code with dictionary values
 */
function unpackPACKer(p: string, a: number, c: number, k: string[]): string {
    // Validate inputs
    if (!p || a < 2 || a > 62 || c <= 0 || !k || k.length === 0) {
        return p || '';
    }

    // Decode function to convert number to base-a representation
    function decode(d: number): string {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (d === 0) return '0';
        let result = '';
        while (d > 0) {
            result = chars[d % a] + result;
            d = Math.floor(d / a);
        }
        return result;
    }

    // Replace encoded values with dictionary words (iterate from high to low)
    let unpacked = p;
    for (let i = Math.min(c, k.length) - 1; i >= 0; i--) {
        if (k[i] && k[i].length > 0) {
            const encoded = decode(i);
            // Use word boundary matching
            const pattern = new RegExp('\\b' + encoded + '\\b', 'g');
            unpacked = unpacked.replace(pattern, k[i]);
        }
    }

    return unpacked;
}

/**
 * Extract all packed scripts from HTML and decode them
 */
function extractAndUnpackAll(html: string): { scripts: string[]; urls: string[] } {
    const scripts: string[] = [];
    const urls: string[] = [];

    // Find script contents that contain packed JS signature
    // Split by script tags and process each one
    const scriptBlocks: string[] = [];

    // Method 1: Find eval(function(p,a,c,k,e,d) blocks by searching for the pattern
    // and extracting until the matching closing ))
    const evalStarts = [...html.matchAll(/eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*d\s*\)/g)];

    for (const evalStart of evalStarts) {
        if (evalStart.index !== undefined) {
            // Find the end by looking for .split('|')))
            const searchStart = evalStart.index;
            const searchEnd = html.indexOf(".split('|')))", searchStart);
            if (searchEnd !== -1) {
                const block = html.substring(searchStart, searchEnd + 14); // +14 for ".split('|')))"
                scriptBlocks.push(block);
            }
        }
    }

    // Method 2: Fallback - look for any scripts containing the signature
    if (scriptBlocks.length === 0) {
        const signature = "function(p,a,c,k,e,d)";
        let searchPos = 0;
        while ((searchPos = html.indexOf(signature, searchPos)) !== -1) {
            // Extract surrounding context (up to 15000 chars)
            const start = Math.max(0, searchPos - 100);
            const end = Math.min(html.length, searchPos + 15000);
            const context = html.substring(start, end);

            // Check if this looks like a full packed script
            if (context.includes(".split('|')")) {
                scriptBlocks.push(context);
            }
            searchPos += signature.length;
        }
    }

    // Process all found script blocks
    for (const block of scriptBlocks) {
        try {
            const unpacked = unpackJs(block);
            if (unpacked && unpacked !== block && unpacked.length > 100) {
                scripts.push(unpacked);

                // Extract URLs from unpacked script
                const urlPatterns = [
                    /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/gi,
                    /https?:\/\/[^\s"'<>\\]+\.txt\?[^\s"'<>\\]*/gi,
                    /https?:\/\/[^\s"'<>\\]+\/stream\/[^\s"'<>\\]*/gi,
                    /https?:\/\/[^\s"'<>\\]+\/hls\/[^\s"'<>\\]*/gi,
                    /https?:\/\/[^\s"'<>\\]+pureluxury[^\s"'<>\\]*/gi,
                    /https?:\/\/[^\s"'<>\\]+minochinos[^\s"'<>\\]*/gi,
                ];

                for (const pattern of urlPatterns) {
                    let urlMatch;
                    while ((urlMatch = pattern.exec(unpacked)) !== null) {
                        const url = urlMatch[0].replace(/['"\\,;}\]]+$/, ''); // Clean trailing chars
                        if (!urls.includes(url) && url.length > 20) {
                            urls.push(url);
                        }
                    }
                }
            }
        } catch (e) {
            // Skip failed unpacking
        }
    }

    return { scripts, urls };
}

function applyDecodeLayer(input: string, layer: string): string {
    switch (layer) {
        case 'base64': return decodeBase64(input);
        case 'url': return decodeUrl(input);
        case 'hex': return decodeHex(input);
        case 'rot13': return decodeRot13(input);
        case 'reverse': return reverseString(input);
        case 'unpackJs': return unpackJs(input);
        case 'xor': return decryptXOR(input, 0xFF, 'text'); // Default XOR with 0xFF
        case 'rc4': return input; // RC4 requires key - use decryptRC4 directly
        case 'jsfuck': return decodeJSFuck(input);
        default: return input;
    }
}

function multiLayerDecode(input: string, layers: string[]): string {
    let result = input;
    for (const layer of layers) {
        result = applyDecodeLayer(result, layer);
    }
    return result;
}

function extractUrlParam(url: string, param: string = 'id'): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get(param);
    } catch {
        // Try regex fallback for malformed URLs
        const match = url.match(new RegExp(`[?&]${param}=([^&]+)`));
        return match ? match[1] : null;
    }
}

function findBase64InText(text: string, pattern?: string): string[] {
    const results: string[] = [];

    // Use custom pattern or default base64 pattern
    const regex = pattern
        ? new RegExp(pattern, 'g')
        : /[A-Za-z0-9+/=_-]{20,}/g;  // Match potential base64 strings

    let match;
    while ((match = regex.exec(text)) !== null) {
        // Validate it looks like base64
        const candidate = match[0];
        if (candidate.length >= 20 && /^[A-Za-z0-9+/=_-]+$/.test(candidate)) {
            try {
                const decoded = decodeBase64(candidate);
                // Only include if it decoded to something meaningful
                if (decoded && decoded.length > 0 && /^[\x20-\x7E\s]+$/.test(decoded)) {
                    results.push(decoded);
                }
            } catch {
                // Skip invalid base64
            }
        }
        if (results.length >= 50) break; // Limit results
    }

    return results;
}

// ============================================================
// MAIN HANDLER
// ============================================================

export async function handleExtractJson(
    page: Page,
    args: ExtractJsonArgs
): Promise<{ found: boolean; data: any[]; count: number; decoded?: any }> {
    const data: any[] = [];
    let decoded: any = null;

    // ============================================================
    // 1. DECODE FROM DIRECT BASE64 STRING
    // ============================================================
    if (args.decodeBase64) {
        try {
            const result = decodeBase64(args.decodeBase64);
            decoded = {
                source: 'decodeBase64',
                input: args.decodeBase64.substring(0, 50) + '...',
                output: result,
                isUrl: result.startsWith('http'),
            };
            data.push(decoded);
        } catch (e) {
            decoded = { source: 'decodeBase64', error: String(e) };
        }
    }

    // ============================================================
    // 2. DECODE FROM URL PARAMETER
    // ============================================================
    if (args.decodeFromUrl) {
        try {
            const paramName = args.decodeUrlParam || 'id';
            const encoded = extractUrlParam(args.decodeFromUrl, paramName);

            if (encoded) {
                const result = decodeBase64(encoded);
                decoded = {
                    source: 'decodeFromUrl',
                    url: args.decodeFromUrl.substring(0, 80) + '...',
                    param: paramName,
                    encoded: encoded.substring(0, 50) + '...',
                    decoded: result,
                    isUrl: result.startsWith('http'),
                };
                data.push(decoded);
            } else {
                decoded = { source: 'decodeFromUrl', error: `Parameter '${paramName}' not found in URL` };
            }
        } catch (e) {
            decoded = { source: 'decodeFromUrl', error: String(e) };
        }
    }

    // ============================================================
    // 3. ADVANCED MULTI-LAYER DECODE
    // ============================================================
    if (args.advancedDecode) {
        try {
            let input = args.advancedDecode.input || '';

            // Extract from page if requested
            if (args.advancedDecode.extractFromPage) {
                const pageContent = await page.evaluate((selector) => {
                    if (selector) {
                        const el = document.querySelector(selector);
                        return el?.textContent || '';
                    }
                    return document.body?.textContent || '';
                }, args.advancedDecode.pageSelector);
                input = pageContent;
            }

            if (input) {
                const result = multiLayerDecode(input, args.advancedDecode.layers);
                decoded = {
                    source: 'advancedDecode',
                    layers: args.advancedDecode.layers,
                    inputLength: input.length,
                    inputPreview: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
                    output: result,
                    outputLength: result.length,
                    isUrl: result.startsWith('http'),
                };
                data.push(decoded);
            }
        } catch (e) {
            decoded = { source: 'advancedDecode', error: String(e) };
        }
    }

    // ============================================================
    // 3b. AES DECRYPTION (for encrypted streaming responses)
    // Uses browser Web Crypto API via page.evaluate for reliability
    // ============================================================
    if (args.decryptAES) {
        try {
            const key = args.decryptAES.key || "kiemtienmua911ca";
            const ivList = args.decryptAES.ivList || ["1234567890oiuytr", "0123456789abcdef"];
            const autoIV = args.decryptAES.autoIV !== false; // Default to true for hubstream-style encryption
            let input = args.decryptAES.input || "";

            // Option: Fetch encrypted data from API URL directly (recommended for hubstream)
            if (!input && args.decryptAES.fetchUrl) {
                // Fetch will be done in browser context
                input = '__FETCH_FROM_URL__';
            }

            if (!input || input.length === 0) {
                decoded = { source: 'decryptAES', error: 'No input provided. Use "input" for hex string or "fetchUrl" for API URL.' };
            } else {
                // Use browser's Web Crypto API for reliable decryption
                const result = await page.evaluate(async (params: { input: string; key: string; ivList: string[]; autoIV: boolean; fetchUrl?: string }) => {
                    try {
                        let encryptedHex = params.input;

                        // Fetch from URL if specified
                        if (params.fetchUrl || params.input === '__FETCH_FROM_URL__') {
                            const response = await fetch(params.fetchUrl!);
                            encryptedHex = (await response.text()).trim();
                        }

                        const hexToBytes = (hex: string) => {
                            const bytes = new Uint8Array(hex.length / 2);
                            for (let i = 0; i < hex.length; i += 2) {
                                bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
                            }
                            return bytes;
                        };

                        // Build IV list - if autoIV, try extracting from first 16 bytes first
                        const ivsToTry: { iv: Uint8Array; label: string }[] = [];
                        
                        if (params.autoIV && encryptedHex.length >= 32) {
                            // First 32 hex chars = first 16 bytes = IV (hubstream style)
                            const ivHex = encryptedHex.substring(0, 32);
                            ivsToTry.push({ iv: hexToBytes(ivHex), label: 'autoIV (first 16 bytes)' });
                        }
                        
                        // Add manual IV list
                        for (const ivStr of params.ivList) {
                            ivsToTry.push({ iv: new TextEncoder().encode(ivStr), label: ivStr });
                        }

                        for (const { iv: ivData, label: ivLabel } of ivsToTry) {
                            try {
                                const keyData = new TextEncoder().encode(params.key);
                                
                                // If using autoIV, encrypted data starts after first 32 hex chars (16 bytes)
                                const isAutoIV = ivLabel.startsWith('autoIV');
                                const dataHex = isAutoIV ? encryptedHex.substring(32) : encryptedHex;
                                const encryptedData = hexToBytes(dataHex);

                                const cryptoKey = await crypto.subtle.importKey(
                                    "raw", keyData, "AES-CBC", false, ["decrypt"]
                                );

                                const decrypted = await crypto.subtle.decrypt(
                                    { name: "AES-CBC", iv: ivData as BufferSource },
                                    cryptoKey,
                                    encryptedData
                                );

                                const decryptedText = new TextDecoder().decode(decrypted);

                                // Extract URLs from decrypted JSON
                                const sourceMatch = /"source":"([^"]+)"/.exec(decryptedText);
                                const mp4Match = /"mp4":"([^"]+)"/.exec(decryptedText);
                                const hlsMatch = /"hls":"([^"]+)"/.exec(decryptedText);
                                
                                const streamUrl = sourceMatch ? sourceMatch[1].replace(/\\\//g, '/') : null;
                                const mp4Url = mp4Match ? mp4Match[1].replace(/\\\//g, '/') : null;
                                const hlsUrl = hlsMatch ? hlsMatch[1].replace(/\\\//g, '/') : null;

                                return {
                                    success: true,
                                    iv: ivLabel,
                                    decrypted: decryptedText,
                                    decryptedLength: decryptedText.length,
                                    extractedStreamUrl: streamUrl,
                                    extractedMp4Url: mp4Url,
                                    extractedHlsUrl: hlsUrl,
                                    isStreamUrl: (streamUrl && (streamUrl.includes('m3u8') || streamUrl.includes('.mp4'))) || !!mp4Url,
                                    inputLength: encryptedHex.length
                                };
                            } catch (e) {
                                continue; // Try next IV
                            }
                        }

                        return { success: false, error: 'Decryption failed with all IVs', inputLength: encryptedHex.length };
                    } catch (e) {
                        return { success: false, error: String(e) };
                    }
                }, { input, key, ivList, autoIV, fetchUrl: args.decryptAES.fetchUrl });

                decoded = {
                    source: 'decryptAES',
                    ...result,
                    key: key,
                };

                if (result.success) {
                    data.push(decoded);
                }
            }
        } catch (e) {
            decoded = { source: 'decryptAES', error: String(e) };
        }
    }

    // ============================================================
    // 4. FIND AND DECODE BASE64 PATTERNS IN PAGE
    // ============================================================
    if (args.decodePattern) {
        try {
            const pageText = await page.evaluate(() => {
                // Get all script contents + page text
                const scripts = Array.from(document.querySelectorAll('script'))
                    .map(s => s.textContent || '')
                    .join('\n');
                const bodyText = document.body?.textContent || '';
                return scripts + '\n' + bodyText;
            });

            const found = findBase64InText(pageText, args.decodePattern);

            decoded = {
                source: 'decodePattern',
                pattern: args.decodePattern,
                foundCount: found.length,
                results: found.slice(0, 20), // Limit to first 20
                urls: found.filter(f => f.startsWith('http')),
            };
            data.push(decoded);
        } catch (e) {
            decoded = { source: 'decodePattern', error: String(e) };
        }
    }

    // ============================================================
    // 5. DECODE PACKED JAVASCRIPT (AUTO-DETECT)
    // ============================================================
    if (args.decodePackedJs) {
        try {
            // Get all script contents from page
            const scriptContents = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                return scripts.map(s => s.textContent || '').filter(s => s.length > 0);
            });

            const allUnpacked: { scripts: string[]; urls: string[] } = { scripts: [], urls: [] };

            for (const script of scriptContents) {
                const result = extractAndUnpackAll(script);
                allUnpacked.scripts.push(...result.scripts);
                allUnpacked.urls.push(...result.urls);
            }

            // Remove duplicates from URLs
            const uniqueUrls = [...new Set(allUnpacked.urls)];

            if (allUnpacked.scripts.length > 0 || uniqueUrls.length > 0) {
                decoded = {
                    source: 'decodePackedJs',
                    packedScriptsFound: allUnpacked.scripts.length,
                    unpackedScripts: allUnpacked.scripts.slice(0, 5), // Limit to first 5
                    extractedUrls: uniqueUrls,
                    streamUrls: uniqueUrls.filter(u =>
                        u.includes('m3u8') || u.includes('.txt?') ||
                        u.includes('/stream/') || u.includes('/hls/')
                    ),
                };
                data.push(decoded);
            } else {
                decoded = {
                    source: 'decodePackedJs',
                    message: 'No packed JavaScript found in page',
                    hint: 'Try using execute_js or player_api_hook for dynamically loaded content',
                };
            }
        } catch (e) {
            decoded = { source: 'decodePackedJs', error: String(e) };
        }
    }

    // ============================================================
    // 6. ULTRA ADVANCED DECODE (NEW!)
    // ============================================================
    if (args.ultraDecode) {
        try {
            let input = args.ultraDecode.input || '';

            // Extract from page if requested
            if (args.ultraDecode.extractFromPage) {
                input = await page.evaluate((selector: string) => {
                    if (selector) {
                        const el = document.querySelector(selector);
                        return el?.textContent || '';
                    }
                    return document.body?.textContent || '';
                }, args.ultraDecode.pageSelector);
            }

            if (input) {
                // Auto-detect mode
                if (args.ultraDecode.autoDetect) {
                    const detection = autoDetectEncryption(input);
                    decoded = {
                        source: 'ultraDecode-autoDetect',
                        detectedType: detection.type,
                        confidence: detection.confidence,
                        details: detection.details,
                    };

                    // Try to decode based on detection
                    if (detection.confidence >= 70) {
                        const recursiveResult = recursiveDecode(input, args.ultraDecode.maxDepth || 10);
                        decoded = {
                            ...decoded,
                            decoded: recursiveResult.decoded,
                            layers: recursiveResult.layers,
                            depth: recursiveResult.depth,
                            foundUrls: recursiveResult.foundUrls,
                            streamUrls: recursiveResult.foundUrls.filter(u =>
                                u.includes('.m3u8') || u.includes('.mp4') || u.includes('stream')
                            ),
                        };
                    }
                    data.push(decoded);
                }

                // Recursive decode mode
                else if (args.ultraDecode.recursive) {
                    const result = recursiveDecode(input, args.ultraDecode.maxDepth || 10);
                    decoded = {
                        source: 'ultraDecode-recursive',
                        decoded: result.decoded,
                        layers: result.layers,
                        depth: result.depth,
                        foundUrls: result.foundUrls,
                        streamUrls: result.foundUrls.filter(u =>
                            u.includes('.m3u8') || u.includes('.mp4') || u.includes('stream')
                        ),
                    };
                    data.push(decoded);
                }

                // Try common keys mode
                else if (args.ultraDecode.tryCommonKeys) {
                    const result = await tryCommonKeys(input, page);
                    if (result.success) {
                        decoded = {
                            source: 'ultraDecode-commonKeys',
                            success: true,
                            matchedSite: result.site,
                            key: result.key,
                            iv: result.iv,
                            decrypted: result.decrypted,
                            extractedUrls: extractUrlsFromText(result.decrypted || ''),
                        };
                    } else {
                        decoded = {
                            source: 'ultraDecode-commonKeys',
                            success: false,
                            message: 'No matching key found in common keys database',
                            triedSites: Object.keys(COMMON_STREAMING_KEYS),
                        };
                    }
                    data.push(decoded);
                }
            }
        } catch (e) {
            decoded = { source: 'ultraDecode', error: String(e) };
        }
    }

    // ============================================================
    // 7. XOR CIPHER DECRYPTION
    // ============================================================
    if (args.decryptXOR) {
        try {
            const result = decryptXOR(
                args.decryptXOR.input,
                args.decryptXOR.key,
                args.decryptXOR.inputFormat || 'hex'
            );
            decoded = {
                source: 'decryptXOR',
                input: args.decryptXOR.input.substring(0, 50) + '...',
                key: String(args.decryptXOR.key),
                format: args.decryptXOR.inputFormat || 'hex',
                decrypted: result,
                foundUrls: extractUrlsFromText(result),
            };
            data.push(decoded);
        } catch (e) {
            decoded = { source: 'decryptXOR', error: String(e) };
        }
    }

    // ============================================================
    // 8. RC4 STREAM CIPHER DECRYPTION
    // ============================================================
    if (args.decryptRC4) {
        try {
            const result = decryptRC4(args.decryptRC4.input, args.decryptRC4.key);
            decoded = {
                source: 'decryptRC4',
                input: args.decryptRC4.input.substring(0, 50) + '...',
                key: args.decryptRC4.key,
                decrypted: result,
                foundUrls: extractUrlsFromText(result),
            };
            data.push(decoded);
        } catch (e) {
            decoded = { source: 'decryptRC4', error: String(e) };
        }
    }

    // ============================================================
    // 9. OBFUSCATED JS DECODER (eval interceptor)
    // ============================================================
    if (args.decodeObfuscatedJs) {
        try {
            // Intercept eval calls if requested
            const obfuscatedResults = await page.evaluate((options: { selector?: string; evalIntercept?: boolean }) => {
                const results: { type: string; content: string }[] = [];

                // Find JSFuck or heavily obfuscated scripts
                const scripts = options.selector
                    ? document.querySelectorAll(options.selector)
                    : document.querySelectorAll('script');

                scripts.forEach((script: Element) => {
                    const content = script.textContent || '';

                    // Detect JSFuck
                    if (/^[\[\]\(\)\+\!\s]+$/.test(content.trim()) && content.length > 50) {
                        results.push({ type: 'jsfuck', content: content.substring(0, 500) });
                    }

                    // Detect eval-based obfuscation
                    if (content.includes('eval(') || content.includes('Function(')) {
                        results.push({ type: 'eval-obfuscated', content: content.substring(0, 1000) });
                    }

                    // Detect hex-encoded strings
                    const hexMatches = content.match(/\\x[0-9a-fA-F]{2}/g);
                    if (hexMatches && hexMatches.length > 10) {
                        results.push({ type: 'hex-encoded', content: content.substring(0, 1000) });
                    }
                });

                return results;
            }, { selector: args.decodeObfuscatedJs.selector, evalIntercept: args.decodeObfuscatedJs.evalIntercept });

            decoded = {
                source: 'decodeObfuscatedJs',
                foundObfuscated: obfuscatedResults.length,
                results: obfuscatedResults,
                hint: 'Use execute_js with eval() to decode JSFuck, or use ultraDecode with recursive:true',
            };
            data.push(decoded);
        } catch (e) {
            decoded = { source: 'decodeObfuscatedJs', error: String(e) };
        }
    }

    // ============================================================
    // 10. CUSTOM CIPHER FUNCTION (user-provided decode logic)
    // ============================================================
    if (args.customCipher) {
        try {
            let input = args.customCipher.input;

            // Convert input format if needed
            if (args.customCipher.inputFormat === 'hex') {
                input = Buffer.from(input.replace(/\s/g, ''), 'hex').toString('utf-8');
            } else if (args.customCipher.inputFormat === 'base64') {
                input = decodeBase64(input);
            }

            // Execute custom decode function in browser context (safer)
            const result = await page.evaluate((params: { input: string; fn: string }) => {
                try {
                    // Create function from string and execute
                    const decodeFn = eval(`(${params.fn})`);
                    if (typeof decodeFn === 'function') {
                        return { success: true, result: decodeFn(params.input) };
                    }
                    return { success: false, error: 'Not a function' };
                } catch (e: any) {
                    return { success: false, error: e.message };
                }
            }, { input, fn: args.customCipher.decodeFunction });

            if (result.success) {
                decoded = {
                    source: 'customCipher',
                    input: args.customCipher.input.substring(0, 50) + '...',
                    function: args.customCipher.decodeFunction.substring(0, 100),
                    decrypted: result.result,
                    foundUrls: extractUrlsFromText(String(result.result)),
                };
            } else {
                decoded = {
                    source: 'customCipher',
                    error: result.error,
                    hint: 'Function must be a valid JS arrow function like: input => input.split("").reverse().join("")',
                };
            }
            data.push(decoded);
        } catch (e) {
            decoded = { source: 'customCipher', error: String(e) };
        }
    }

    // ============================================================
    // 11. ORIGINAL JSON EXTRACTION (preserved)
    // ============================================================

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
        decoded,
    };
}

/**
 * Extract SEO and Open Graph meta tags
 */
export async function handleScrapeMetaTags(
    page: Page,
    args: ScrapeMetaTagsArgs
): Promise<{ title: string; description: string; og: Record<string, string>; twitter: Record<string, string>; other: Record<string, string> }> {
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`meta-tags-${Date.now()}`);
    tracker.start(100, '🏷️ Scraping meta tags...');

    tracker.setProgress(20, '📄 Extracting page title and description...');

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

    const tagCount = Object.keys(result.og).length + Object.keys(result.twitter).length + Object.keys(result.other).length;
    tracker.complete(`🎉 Extracted ${tagCount} meta tags`);

    return result;
}

/**
 * Simulate keyboard key presses
 */
export async function handlePressKey(
    page: Page,
    args: PressKeyArgs
): Promise<{ success: boolean; key: string; count: number }> {
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`press-key-${Date.now()}`);
    tracker.start(100, `⌨️ Pressing key: ${args.key}...`);

    const count = args.count || 1;
    const delay = args.delay || 100;
    const modifiers = args.modifiers || [];

    const keyCombo = modifiers.length > 0 ? `${modifiers.join('+')}+${args.key}` : args.key;
    tracker.setProgress(20, `🎹 Pressing ${keyCombo} (${count}x)`);

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

        // Update progress for multiple presses
        if (count > 1) {
            const progress = 20 + Math.round(((i + 1) / count) * 70);
            tracker.setProgress(progress, `⌨️ Pressed ${i + 1}/${count}`);
        }
    }

    tracker.complete(`🎉 Key pressed: ${keyCombo}`);

    return {
        success: true,
        key: keyCombo,
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
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`deep-analysis-${Date.now()}`);
    tracker.start(100, '🔬 Starting deep analysis...');

    const consoleLogs: string[] = [];
    const networkRequests: any[] = [];
    const duration = args.duration || 5000;

    tracker.setProgress(10, `⏱️ Recording for ${duration}ms...`);

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
            tracker.setProgress(20, '📝 Monitoring console logs...');
            page.on('console', consoleHandler);
        }

        // Collect network using response events (safer than request interception)
        if (args.includeNetwork !== false) {
            tracker.setProgress(30, '🌐 Recording network traffic...');
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
 * Network recorder with API interception capabilities
 * ULTRA POWERFUL: API detection, media URLs, smart categorization
 * NEW: Request interception, mocking, blocking, and header modification
 */
export async function handleNetworkRecorder(
    page: Page,
    args: NetworkRecorderArgs
): Promise<{
    requests: any[];
    count: number;
    totalSize: number;
    categories?: Record<string, number>;
    apis?: { url: string; method: string; type: string; payload?: any }[];
    mediaUrls?: string[];
    blockedCount?: number;
    mockedCount?: number;
    interceptedRequests?: any[];
}> {
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`network-recorder-${Date.now()}`);
    tracker.start(100, '🌐 Starting network recording...');

    const requests: any[] = [];
    const duration = args.duration || 10000;
    let totalSize = 0;
    const categories: Record<string, number> = {};
    const apis: { url: string; method: string; type: string; payload?: any }[] = [];
    const mediaUrls: string[] = [];
    const seen = new Set<string>();
    const interceptedRequests: any[] = [];
    let blockedCount = 0;
    let mockedCount = 0;

    const interceptMode = args.interceptMode || 'record';
    const blockPatterns = args.blockPatterns || [];
    const mockResponses = args.mockResponses || [];
    const modifyHeaders = args.modifyHeaders || [];
    const capturePayloads = args.capturePayloads === true;

    tracker.setProgress(10, `⏱️ Recording for ${duration}ms (mode: ${interceptMode})...`);

    // ============================================================
    // SMART CATEGORIZATION HELPER
    // ============================================================
    const categorizeUrl = (url: string, resourceType: string): string => {
        const urlLower = url.toLowerCase();

        // API endpoints
        if (/\/api\/|\/v\d+\/|\.json(\?|$)|graphql/i.test(url)) return 'api';

        // Media
        if (/\.(mp4|webm|m3u8|ts|mp3|flac|ogg)/i.test(url)) return 'media';
        if (resourceType === 'media' || resourceType === 'video' || resourceType === 'audio') return 'media';

        // Images
        if (/\.(jpg|jpeg|png|gif|webp|svg|ico)/i.test(url) || resourceType === 'image') return 'image';

        // Scripts
        if (/\.js(\?|$)/i.test(url) || resourceType === 'script') return 'script';

        // Styles
        if (/\.css(\?|$)/i.test(url) || resourceType === 'stylesheet') return 'style';

        // Fonts
        if (/\.(woff2?|ttf|eot|otf)/i.test(url) || resourceType === 'font') return 'font';

        // XHR/Fetch
        if (resourceType === 'xhr' || resourceType === 'fetch') return 'xhr';

        // Documents
        if (resourceType === 'document') return 'document';

        return 'other';
    };

    // Helper to check URL against patterns
    const matchesPattern = (url: string, patterns: string[]): boolean => {
        return patterns.some(pattern => {
            try {
                if (pattern.startsWith('/') && pattern.endsWith('/')) {
                    // Regex pattern
                    const regex = new RegExp(pattern.slice(1, -1));
                    return regex.test(url);
                }
                // Simple includes check
                return url.includes(pattern);
            } catch {
                return url.includes(pattern);
            }
        });
    };

    // ============================================================
    // INTERCEPTION MODE - Uses request interception
    // ============================================================
    if (interceptMode === 'intercept' || interceptMode === 'mock') {
        try {
            await page.setRequestInterception(true);

            const requestHandler = async (request: any) => {
                const url = request.url();
                const method = request.method();
                const resourceType = request.resourceType();
                const category = categorizeUrl(url, resourceType);

                // Check if should block
                if (blockPatterns.length > 0 && matchesPattern(url, blockPatterns)) {
                    blockedCount++;
                    interceptedRequests.push({
                        url,
                        method,
                        action: 'blocked',
                        timestamp: Date.now()
                    });
                    await request.abort();
                    return;
                }

                // Check if should mock
                const mockConfig = mockResponses.find(m => matchesPattern(url, [m.urlPattern]));
                if (mockConfig) {
                    mockedCount++;
                    interceptedRequests.push({
                        url,
                        method,
                        action: 'mocked',
                        mockResponse: mockConfig.response,
                        timestamp: Date.now()
                    });
                    await request.respond({
                        status: mockConfig.statusCode || 200,
                        contentType: 'application/json',
                        body: typeof mockConfig.response === 'string' 
                            ? mockConfig.response 
                            : JSON.stringify(mockConfig.response)
                    });
                    return;
                }

                // Check if should modify headers
                const headerConfig = modifyHeaders.find(h => matchesPattern(url, [h.urlPattern]));
                if (headerConfig) {
                    const headers = {
                        ...request.headers(),
                        ...headerConfig.headers
                    };
                    interceptedRequests.push({
                        url,
                        method,
                        action: 'headers_modified',
                        modifiedHeaders: headerConfig.headers,
                        timestamp: Date.now()
                    });
                    await request.continue({ headers });
                    return;
                }

                // Continue normally but record
                if (!seen.has(url)) {
                    seen.add(url);
                    categories[category] = (categories[category] || 0) + 1;

                    const entry: any = {
                        url,
                        method,
                        resourceType,
                        category,
                        timestamp: Date.now()
                    };

                    // Capture POST/PUT payloads
                    if (capturePayloads && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                        try {
                            entry.payload = request.postData();
                        } catch {
                            // Ignore
                        }
                    }

                    requests.push(entry);

                    // Collect API endpoints
                    if (category === 'api' || resourceType === 'xhr' || resourceType === 'fetch') {
                        apis.push({ 
                            url, 
                            method, 
                            type: resourceType,
                            payload: entry.payload
                        });
                    }

                    // Collect media URLs
                    if (category === 'media' || /\.(mp4|webm|m3u8|ts|mp3)/i.test(url)) {
                        mediaUrls.push(url);
                    }
                }

                await request.continue();
            };

            page.on('request', requestHandler);
            await new Promise(r => setTimeout(r, duration));
            page.off('request', requestHandler);
            await page.setRequestInterception(false);

        } catch (e) {
            // Cleanup on error
            try {
                await page.setRequestInterception(false);
            } catch {}
        }
    } else {
        // ============================================================
        // RECORD MODE - Uses response events (safer)
        // ============================================================
        const responseHandler = (response: any) => {
            try {
                const url = response.url();

                // Dedup
                if (seen.has(url)) return;
                seen.add(url);

                if (args.filterUrl && !url.includes(args.filterUrl)) {
                    return;
                }

                const resourceType = response.request()?.resourceType?.() || 'unknown';
                const method = response.request()?.method?.() || 'GET';
                const category = categorizeUrl(url, resourceType);

                categories[category] = (categories[category] || 0) + 1;

                // Collect API endpoints
                if (category === 'api' || resourceType === 'xhr' || resourceType === 'fetch') {
                    const apiEntry: any = { url, method, type: resourceType };
                    
                    // Capture POST data if enabled
                    if (capturePayloads && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                        try {
                            apiEntry.payload = response.request()?.postData?.();
                        } catch {}
                    }
                    
                    apis.push(apiEntry);
                }

                // Collect media URLs
                if (category === 'media' || /\.(mp4|webm|m3u8|ts|mp3)/i.test(url)) {
                    mediaUrls.push(url);
                }

                const entry: any = {
                    url,
                    status: response.status(),
                    resourceType,
                    category,
                    method,
                    timestamp: Date.now(),
                };

                if (args.includeHeaders) {
                    try {
                        entry.headers = response.headers();
                    } catch (e) {
                        entry.headers = {};
                    }
                }

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
    }

    tracker.setProgress(90, `✅ Recorded ${requests.length} requests`);
    tracker.complete(`🎉 Network recording complete`);

    return {
        requests: requests.slice(0, 500),
        count: requests.length,
        totalSize,
        categories,
        apis: apis.length > 0 ? apis : undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        blockedCount: blockedCount > 0 ? blockedCount : undefined,
        mockedCount: mockedCount > 0 ? mockedCount : undefined,
        interceptedRequests: interceptedRequests.length > 0 ? interceptedRequests : undefined,
        message: `📡 Recorded ${requests.length} requests (${Math.round(totalSize / 1024)}KB) | APIs: ${apis.length} | Media: ${mediaUrls.length}` +
            (blockedCount > 0 ? ` | Blocked: ${blockedCount}` : '') +
            (mockedCount > 0 ? ` | Mocked: ${mockedCount}` : '')
    } as any;
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
 * ULTRA POWERFUL: Infinite scroll, lazy load, mutation observer
 */
export async function handleAjaxContentWaiter(
    page: Page,
    args: AjaxContentWaiterArgs
): Promise<{ loaded: boolean; waitTime: number; content?: string; newElementsCount?: number; scrollDepth?: number }> {
    const timeout = args.timeout || 30000;
    const pollInterval = args.pollInterval || 500;
    const startTime = Date.now();

    let content: string | undefined;
    let loaded = false;
    let newElementsCount = 0;
    let scrollDepth = 0;

    // ============================================================
    // 1. MUTATION OBSERVER: Track DOM changes in real-time
    // ============================================================
    const setupMutationObserver = async () => {
        return await page.evaluate(() => {
            return new Promise<{ added: number; modified: number }>((resolve) => {
                let added = 0;
                let modified = 0;
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(m => {
                        added += m.addedNodes.length;
                        if (m.type === 'attributes' || m.type === 'characterData') modified++;
                    });
                });
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                });

                // Return after 2 seconds of observation
                setTimeout(() => {
                    observer.disconnect();
                    resolve({ added, modified });
                }, 2000);
            });
        });
    };

    // ============================================================
    // 2. INFINITE SCROLL DETECTION
    // ============================================================
    const handleInfiniteScroll = async () => {
        const initialHeight = await page.evaluate(() => document.body.scrollHeight);
        const initialCount = await page.evaluate(() => document.querySelectorAll('*').length);

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 1000));

        // Check if new content loaded
        const newHeight = await page.evaluate(() => document.body.scrollHeight);
        const newCount = await page.evaluate(() => document.querySelectorAll('*').length);

        return {
            scrolled: newHeight > initialHeight,
            newElements: newCount - initialCount,
            scrollDepth: newHeight
        };
    };

    // ============================================================
    // 3. LAZY LOAD DETECTION
    // ============================================================
    const detectLazyLoad = async () => {
        return await page.evaluate(() => {
            const lazyElements: string[] = [];

            // Check for common lazy load patterns
            document.querySelectorAll('[data-src], [data-lazy], [loading="lazy"], .lazy, .lazyload').forEach(el => {
                const dataSrc = el.getAttribute('data-src') || el.getAttribute('data-lazy');
                if (dataSrc) lazyElements.push(dataSrc);
            });

            // Intersection Observer based lazy images
            document.querySelectorAll('img[data-src], img.lazy').forEach(img => {
                const dataSrc = (img as HTMLImageElement).dataset.src;
                if (dataSrc) lazyElements.push(dataSrc);
            });

            return lazyElements;
        });
    };

    // ============================================================
    // 4. MAIN WAITING LOGIC
    // ============================================================
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
            // Smart waiting: Check for ongoing activity
            const mutationResult = await setupMutationObserver();
            newElementsCount = mutationResult.added;

            if (mutationResult.added === 0 && mutationResult.modified === 0) {
                // No DOM changes, content likely loaded
                loaded = true;
                break;
            }
        }

        // Try infinite scroll to load more content
        const scrollResult = await handleInfiniteScroll();
        if (scrollResult.scrolled) {
            scrollDepth = scrollResult.scrollDepth;
            newElementsCount += scrollResult.newElements;
        }

        await new Promise((r) => setTimeout(r, pollInterval));
    }

    // Detect any lazy-loaded content
    const lazyElements = await detectLazyLoad();

    return {
        loaded,
        waitTime: Date.now() - startTime,
        content,
        newElementsCount,
        scrollDepth,
        lazyElements: lazyElements.length > 0 ? lazyElements : undefined,
        message: loaded
            ? `✅ Content loaded in ${Date.now() - startTime}ms (${newElementsCount} new elements, scroll: ${scrollDepth}px)`
            : `⏱️ Timeout after ${timeout}ms`
    } as any;
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
    // Progress tracking
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`element-screenshot-${Date.now()}`);
    tracker.start(100, '📸 Starting element screenshot...');

    // Import self-healing locators
    const { selfHealingLocators } = await import('../self-healing-locators.js');

    tracker.setProgress(20, `🔍 Finding element: ${args.selector}`);

    // Try self-healing locator first
    const elementResult = await selfHealingLocators.findElementWithFallbacks(page, args.selector);

    if (!elementResult) {
        tracker.fail('Element not found');
        return {
            success: false,
            dimensions: { width: 0, height: 0 },
            // @ts-ignore
            error: `Element not found: ${args.selector}. Self-healing tried multiple fallback strategies.`
        };
    }

    const { element, usedSelector, strategy } = elementResult;
    const strategyMsg = strategy !== 'primary' ? ` (found via ${strategy}: ${usedSelector})` : '';
    tracker.setProgress(40, `✅ Element found${strategyMsg}`);

    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
        tracker.fail('Element has no bounding box');
        return { success: false, dimensions: { width: 0, height: 0 } };
    }

    tracker.setProgress(60, `📐 Element size: ${Math.round(boundingBox.width)}x${Math.round(boundingBox.height)}`);

    const options: any = {
        type: args.format || 'png',
    };

    if (args.quality && (args.format === 'jpeg' || args.format === 'webp')) {
        options.quality = args.quality;
    }

    if (args.path) {
        options.path = args.path;
        try {
            tracker.setProgress(80, '📷 Capturing screenshot to file...');
            await element.screenshot(options);
            tracker.complete(`🎉 Screenshot saved: ${args.path}`);
            return {
                success: true,
                path: args.path,
                dimensions: { width: Math.round(boundingBox.width), height: Math.round(boundingBox.height) },
            };
        } catch (error) {
            tracker.fail('Screenshot failed');
            return {
                success: false,
                dimensions: { width: 0, height: 0 },
                // @ts-ignore
                error: `Screenshot failed: ${error.message}`
            };
        }
    } else {
        try {
            tracker.setProgress(80, '📷 Capturing screenshot to base64...');
            const buffer = await element.screenshot({ ...options, encoding: 'base64' });
            tracker.complete('🎉 Screenshot captured successfully');
            return {
                success: true,
                base64: buffer as string,
                dimensions: { width: Math.round(boundingBox.width), height: Math.round(boundingBox.height) },
            };
        } catch (error) {
            tracker.fail('Screenshot failed');
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
 * ULTRA POWERFUL: Pagination detection, smart categorization, file types
 * NEW: Auto-follow pagination to scrape multiple pages
 */
export async function handleLinkHarvester(
    page: Page,
    args: LinkHarvesterArgs
): Promise<{
    links: { url: string; text: string; type: string; category?: string; page?: number }[];
    internal: number;
    external: number;
    pagination?: { nextPage?: string; prevPage?: string; totalPages?: number; currentPage?: number };
    categories?: Record<string, number>;
    pagesScraped?: number;
    message?: string;
}> {
    // Progress tracking for real-time updates
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`link-harvester-${Date.now()}`);
    tracker.start(100, '🔗 Starting link harvesting...');

    const currentUrl = new URL(page.url());
    tracker.setProgress(10, `📍 Analyzing page: ${currentUrl.hostname}`);

    // Pagination settings
    const followPagination = args.followPagination === true;
    const maxPages = Math.min(args.maxPages || 5, 20); // Max 20 pages
    const delayBetweenPages = args.delayBetweenPages || 1000;
    const paginationSelector = args.paginationSelector;

    // Helper function to extract links from current page
    const extractLinksFromPage = async (): Promise<{
        links: { url: string; text: string; attrs: Record<string, string> }[];
        pagination: { nextPage?: string; prevPage?: string; totalPages?: number; currentPage?: number };
    }> => {
        const allLinks = await page.evaluate(() => {
            const links: { url: string; text: string; attrs: Record<string, string> }[] = [];

            document.querySelectorAll('a[href]').forEach((a) => {
                const anchor = a as HTMLAnchorElement;
                links.push({
                    url: anchor.href,
                    text: a.textContent?.trim()?.substring(0, 100) || '',
                    attrs: {
                        rel: anchor.rel || '',
                        target: anchor.target || '',
                        class: anchor.className || '',
                        id: anchor.id || '',
                        download: anchor.download || '',
                    }
                });
            });

            return links;
        });

        // Pagination detection
        const pagination = await page.evaluate((customSelector?: string) => {
            let nextPage: string | undefined;
            let prevPage: string | undefined;
            let totalPages: number | undefined;
            let currentPage: number | undefined;

            // Custom selector first
            if (customSelector) {
                try {
                    const el = document.querySelector(customSelector) as HTMLAnchorElement;
                    if (el?.href) nextPage = el.href;
                } catch { /* invalid selector */ }
            }

            // Common pagination selectors
            const nextSelectors = [
                'a[rel="next"]', 'a.next', 'a.pagination-next',
                '[aria-label="Next"]', 'a.page-link.next', '.next a',
                '.pagination a:last-child', 'a[title="Next"]',
                'a[aria-label*="next" i]', 'button.next', '[data-testid="next"]'
            ];
            const prevSelectors = [
                'a[rel="prev"]', 'a.prev', 'a.pagination-prev',
                '[aria-label="Previous"]', 'a.page-link.prev', '.prev a'
            ];

            if (!nextPage) {
                for (const sel of nextSelectors) {
                    try {
                        const el = document.querySelector(sel) as HTMLAnchorElement;
                        if (el?.href) { nextPage = el.href; break; }
                    } catch { /* invalid selector */ }
                }
            }

            // Text-based next detection
            if (!nextPage) {
                const links = Array.from(document.querySelectorAll('a'));
                for (const link of links) {
                    const text = link.textContent?.toLowerCase().trim() || '';
                    if (text === 'next' || text === 'next →' || text === '>' || text === '»' || text === 'next page') {
                        nextPage = (link as HTMLAnchorElement).href;
                        break;
                    }
                }
            }

            for (const sel of prevSelectors) {
                try {
                    const el = document.querySelector(sel) as HTMLAnchorElement;
                    if (el?.href) { prevPage = el.href; break; }
                } catch { /* invalid selector */ }
            }

            // Detect current page and total pages
            const pageNumbers = Array.from(document.querySelectorAll('.pagination a, .page-numbers a, nav a, .pager a'))
                .map(a => ({
                    num: parseInt(a.textContent || '0', 10),
                    isActive: a.classList.contains('active') || a.classList.contains('current') || 
                              a.getAttribute('aria-current') === 'page'
                }))
                .filter(p => !isNaN(p.num) && p.num > 0);
            
            if (pageNumbers.length > 0) {
                totalPages = Math.max(...pageNumbers.map(p => p.num));
                const active = pageNumbers.find(p => p.isActive);
                if (active) currentPage = active.num;
            }

            return { nextPage, prevPage, totalPages, currentPage };
        }, paginationSelector);

        return { links: allLinks, pagination };
    };

    // ============================================================
    // SMART LINK CATEGORIZATION
    // ============================================================
    const categorizeLink = (url: string, text: string, attrs: any): string => {
        const urlLower = url.toLowerCase();
        const textLower = text.toLowerCase();

        // File downloads
        if (/\.(pdf|doc|docx|xls|xlsx|zip|rar|7z|tar|gz)(\?.*)?$/i.test(url)) return 'document';
        if (/\.(mp4|mkv|avi|mov|webm|flv)(\?.*)?$/i.test(url)) return 'video';
        if (/\.(mp3|wav|flac|aac|ogg)(\?.*)?$/i.test(url)) return 'audio';
        if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url)) return 'image';
        if (attrs.download) return 'download';

        // Navigation
        if (/\/(next|page|p)\/\d+|[?&]page=\d+/i.test(url)) return 'pagination';
        if (textLower.includes('next') || textLower.includes('prev')) return 'pagination';

        // Social
        if (/facebook|twitter|instagram|linkedin|youtube|tiktok/i.test(url)) return 'social';

        // Common patterns
        if (/login|signin|sign-in/i.test(url)) return 'auth';
        if (/register|signup|sign-up/i.test(url)) return 'auth';
        if (/search|query|q=/i.test(url)) return 'search';
        if (/contact|about|faq|help/i.test(url)) return 'info';

        return 'navigation';
    };

    // ============================================================
    // MAIN SCRAPING LOGIC
    // ============================================================
    const processedLinks: { url: string; text: string; type: string; category: string; page: number }[] = [];
    const categories: Record<string, number> = {};
    const seen = new Set<string>();
    let internal = 0;
    let external = 0;
    let pagesScraped = 0;
    let lastPagination: { nextPage?: string; prevPage?: string; totalPages?: number; currentPage?: number } = {};
    const visitedPages = new Set<string>();

    // Process links from a page
    const processLinks = (
        allLinks: { url: string; text: string; attrs: Record<string, string> }[],
        pageNum: number
    ) => {
        for (const link of allLinks) {
            try {
                if (seen.has(link.url)) continue;
                seen.add(link.url);

                const linkUrl = new URL(link.url);
                const isInternal = linkUrl.hostname === currentUrl.hostname;

                if (args.filter && !link.url.includes(args.filter) && !link.text.includes(args.filter)) {
                    continue;
                }

                if (isInternal && args.includeInternal === false) continue;
                if (!isInternal && args.includeExternal === false) continue;

                const category = categorizeLink(link.url, link.text, link.attrs);
                categories[category] = (categories[category] || 0) + 1;

                processedLinks.push({
                    url: link.url,
                    text: link.text,
                    type: isInternal ? 'internal' : 'external',
                    category,
                    page: pageNum,
                });

                if (isInternal) internal++;
                else external++;

                if (args.maxLinks && processedLinks.length >= args.maxLinks) return true; // Stop
            } catch {
                // Invalid URL, skip
            }
        }
        return false; // Continue
    };

    // Scrape first page
    tracker.setProgress(20, '🔍 Extracting links from page 1...');
    const firstPage = await extractLinksFromPage();
    pagesScraped = 1;
    visitedPages.add(page.url());
    lastPagination = firstPage.pagination;
    
    const shouldStop = processLinks(firstPage.links, 1);

    // Follow pagination if enabled
    if (followPagination && !shouldStop && firstPage.pagination.nextPage) {
        let nextUrl: string | undefined = firstPage.pagination.nextPage;
        
        while (nextUrl && pagesScraped < maxPages && !(args.maxLinks && processedLinks.length >= args.maxLinks)) {
            // Check if we've already visited this page
            if (visitedPages.has(nextUrl)) {
                break;
            }
            visitedPages.add(nextUrl);

            tracker.setProgress(
                20 + (pagesScraped / maxPages) * 60,
                `📄 Scraping page ${pagesScraped + 1}...`
            );

            try {
                // Navigate to next page
                await page.goto(nextUrl, { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 15000 
                });
                
                // Wait for content to load
                await new Promise(r => setTimeout(r, delayBetweenPages));

                // Extract links from this page
                const pageData = await extractLinksFromPage();
                pagesScraped++;
                lastPagination = pageData.pagination;

                const stop = processLinks(pageData.links, pagesScraped);
                if (stop) break;

                // Get next page URL
                nextUrl = pageData.pagination.nextPage || undefined;

            } catch (error) {
                // Failed to navigate, stop pagination
                break;
            }
        }
    }

    tracker.setProgress(90, `✅ Processed ${processedLinks.length} links from ${pagesScraped} pages`);
    tracker.complete(`🎉 Link harvesting complete: ${processedLinks.length} links from ${pagesScraped} pages`);

    return {
        links: processedLinks,
        internal,
        external,
        pagination: (lastPagination.nextPage || lastPagination.prevPage || lastPagination.totalPages) ? lastPagination : undefined,
        categories,
        pagesScraped,
        message: `🔗 Found ${processedLinks.length} links (${internal} internal, ${external} external) from ${pagesScraped} pages` +
            (lastPagination.nextPage && pagesScraped >= maxPages ? ` | More pages available: ${lastPagination.nextPage}` : '')
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
    // Progress tracking for real-time updates
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`batch-scraper-${Date.now()}`);
    tracker.start(100, '📋 Starting batch element scraping...');

    const limit = args.limit || 100;
    const attributes = args.attributes || ['textContent', 'href', 'src'];

    tracker.setProgress(20, `🔍 Finding elements with selector: ${args.selector}`);

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

    tracker.setProgress(90, `✅ Scraped ${items.length} elements`);
    tracker.complete(`🎉 Batch scraping complete: ${items.length} items extracted`);

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
    // NEW: Enhanced parsing options
    parseSegments?: boolean;          // Parse individual TS segments
    fetchPlaylist?: boolean;          // Fetch and parse playlist content
    extractBandwidth?: boolean;       // Extract bandwidth info from variants
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
 * ENHANCED: Segment parsing, bandwidth extraction, playlist fetching
 */
export async function handleM3u8Parser(
    page: Page,
    args: M3u8ParserArgs
): Promise<{ 
    found: boolean; 
    streams: any[]; 
    masterPlaylist?: string; 
    qualities: string[];
    variants?: { quality: string; bandwidth: number; url: string; resolution?: string }[];
    segments?: { url: string; duration: number; index: number }[];
}> {
    const streams: any[] = [];
    const qualities: string[] = [];
    const variants: { quality: string; bandwidth: number; url: string; resolution?: string }[] = [];
    const segments: { url: string; duration: number; index: number }[] = [];
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

    // ============================================================
    // NEW: FETCH AND PARSE MASTER PLAYLIST FOR VARIANTS
    // ============================================================
    if ((args.fetchPlaylist || args.extractBandwidth) && masterPlaylist) {
        try {
            const playlistContent = await page.evaluate(async (url: string) => {
                try {
                    const response = await fetch(url);
                    return await response.text();
                } catch { return null; }
            }, masterPlaylist);

            if (playlistContent) {
                // Parse #EXT-X-STREAM-INF lines for variants
                const variantRegex = /#EXT-X-STREAM-INF:.*?BANDWIDTH=(\d+)(?:.*?RESOLUTION=(\d+x\d+))?[^\n]*\n([^\n]+)/g;
                let match;
                while ((match = variantRegex.exec(playlistContent)) !== null) {
                    const bandwidth = parseInt(match[1], 10);
                    const resolution = match[2] || undefined;
                    let variantUrl = match[3].trim();
                    
                    // Make relative URLs absolute
                    if (!variantUrl.startsWith('http')) {
                        const baseUrl = masterPlaylist.substring(0, masterPlaylist.lastIndexOf('/') + 1);
                        variantUrl = baseUrl + variantUrl;
                    }

                    // Determine quality from resolution or bandwidth
                    let quality = 'unknown';
                    if (resolution) {
                        const height = parseInt(resolution.split('x')[1], 10);
                        if (height >= 2160) quality = '4K';
                        else if (height >= 1080) quality = '1080p';
                        else if (height >= 720) quality = '720p';
                        else if (height >= 480) quality = '480p';
                        else if (height >= 360) quality = '360p';
                        else quality = `${height}p`;
                    } else if (bandwidth >= 5000000) quality = '1080p';
                    else if (bandwidth >= 2500000) quality = '720p';
                    else if (bandwidth >= 1000000) quality = '480p';
                    else quality = '360p';

                    variants.push({ quality, bandwidth, url: variantUrl, resolution });
                }

                // Sort variants by bandwidth (highest first)
                variants.sort((a, b) => b.bandwidth - a.bandwidth);
            }
        } catch (e) {
            // Ignore fetch errors
        }
    }

    // ============================================================
    // NEW: PARSE SEGMENTS FROM MEDIA PLAYLIST
    // ============================================================
    if (args.parseSegments && streams.length > 0) {
        const mediaPlaylistUrl = streams[0].url;
        try {
            const mediaContent = await page.evaluate(async (url: string) => {
                try {
                    const response = await fetch(url);
                    return await response.text();
                } catch { return null; }
            }, mediaPlaylistUrl);

            if (mediaContent) {
                const lines = mediaContent.split('\n');
                let segmentIndex = 0;
                let currentDuration = 0;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    // Parse duration from #EXTINF
                    if (line.startsWith('#EXTINF:')) {
                        currentDuration = parseFloat(line.replace('#EXTINF:', '').split(',')[0]);
                    }
                    // Capture segment URL
                    else if (line && !line.startsWith('#') && (line.includes('.ts') || line.includes('.m4s'))) {
                        let segmentUrl = line;
                        if (!segmentUrl.startsWith('http')) {
                            const baseUrl = mediaPlaylistUrl.substring(0, mediaPlaylistUrl.lastIndexOf('/') + 1);
                            segmentUrl = baseUrl + segmentUrl;
                        }
                        segments.push({ url: segmentUrl, duration: currentDuration, index: segmentIndex++ });
                    }
                }
            }
        } catch (e) {
            // Ignore segment parsing errors
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
        variants: variants.length > 0 ? variants : undefined,
        segments: segments.length > 0 ? segments : undefined,
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
    // Progress tracking for real-time download updates
    const progressNotifier = getProgressNotifier();
    const tracker = progressNotifier.createTracker(`file-download-${Date.now()}`);
    tracker.start(100, '📥 Starting file download...');

    const fs = await import('fs');
    const path = await import('path');
    const https = await import('https');
    const http = await import('http');

    const timeout = args.timeout || 300000; // 5 minutes default
    tracker.setProgress(5, `🔗 Connecting to: ${args.url.substring(0, 60)}...`);

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
    tracker.setProgress(10, `📁 Saving to: ${filename}`);

    // Check if file exists and overwrite is false
    if (!args.overwrite && fs.existsSync(fullPath)) {
        tracker.fail('File already exists');
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
        let lastProgressUpdate = 0;

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
            tracker.setProgress(20, `📊 Starting download (${totalSize > 0 ? (totalSize / 1024 / 1024).toFixed(2) + 'MB' : 'unknown size'})`);

            response.on('data', (chunk: Buffer) => {
                downloadedSize += chunk.length;
                // Update progress every 500KB or 5%
                const now = Date.now();
                if (now - lastProgressUpdate > 500 || (totalSize > 0 && downloadedSize - lastProgressUpdate > totalSize / 20)) {
                    lastProgressUpdate = now;
                    const percent = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 70) + 20 : 50;
                    const sizeStr = (downloadedSize / 1024 / 1024).toFixed(2);
                    tracker.setProgress(Math.min(percent, 90), `⬇️ Downloaded ${sizeStr}MB${totalSize > 0 ? ` / ${(totalSize / 1024 / 1024).toFixed(2)}MB` : ''}`);
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                tracker.complete(`🎉 Download complete: ${(downloadedSize / 1024 / 1024).toFixed(2)}MB`);
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
    // NEW: Multi-Quality Selector Options
    autoSelectBest?: boolean;           // Auto-select highest quality (1080p > 720p > 480p)
    preferredQuality?: '1080p' | '720p' | '480p' | '360p' | 'highest' | 'lowest';
    extractSubtitles?: boolean;         // Also extract subtitles
    // NEW: More Sites Support
    siteType?: 'auto' | 'vidsrc' | 'filemoon' | 'streamwish' | 'doodstream' | 'mixdrop' | 'streamtape' | 'vidcloud' | 'mp4upload';
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
 * ENHANCED: Multi-Quality Selector, VidSrc, Filemoon, StreamWish support
 */
export async function handleStreamExtractor(
    page: Page,
    args: StreamExtractorArgs
): Promise<{
    success: boolean;
    directUrls: { url: string; format: string; quality?: string; size?: string; source?: string }[];
    bestQuality?: { url: string; format: string; quality: string; source?: string };
    subtitles?: { url: string; language?: string; label?: string }[];
    message: string
}> {
    const formats = args.formats || ['mp4', 'mkv', 'm3u8', 'mp3', 'webm', 'flv', 'avi'];
    const maxRedirects = args.maxRedirects || 10;
    const directUrls: { url: string; format: string; quality?: string; size?: string; source?: string }[] = [];
    const subtitles: { url: string; language?: string; label?: string }[] = [];

    // Quality priority for auto-selection
    const qualityPriority: Record<string, number> = {
        '2160p': 100, '4k': 100, 'uhd': 100,
        '1080p': 90, 'fhd': 90, 'full hd': 90,
        '720p': 80, 'hd': 80,
        '480p': 70, 'sd': 70,
        '360p': 60,
        '240p': 50,
        '144p': 40,
        'unknown': 10, 'auto': 10
    };

    // Site-specific extraction patterns
    const sitePatterns: Record<string, { urlPattern: RegExp; sourcePattern: RegExp[] }> = {
        vidsrc: {
            urlPattern: /vidsrc|v2\.vidsrc/i,
            sourcePattern: [
                /source:\s*["']([^"']+\.m3u8[^"']*)/gi,
                /file:\s*["']([^"']+\.m3u8[^"']*)/gi
            ]
        },
        filemoon: {
            urlPattern: /filemoon|moonplayer/i,
            sourcePattern: [
                /sources:\s*\[\s*\{[^}]*file:\s*["']([^"']+)/gi,
                /eval\(function\(p,a,c,k,e,[rd]\)/gi
            ]
        },
        streamwish: {
            urlPattern: /streamwish|swish/i,
            sourcePattern: [
                /file:\s*["']([^"']+\.m3u8[^"']*)/gi,
                /sources:\s*\[.*?["']([^"']+\.m3u8[^"']*)/gi
            ]
        },
        doodstream: {
            urlPattern: /dood|doodstream/i,
            sourcePattern: [
                /\/pass_md5\/[^"']+/gi,
                /\$.get\(['"]([^'"]+pass_md5[^'"]+)/gi
            ]
        },
        mixdrop: {
            urlPattern: /mixdrop/i,
            sourcePattern: [
                /MDCore\.wurl\s*=\s*["']([^"']+)/gi,
                /wurl\s*=\s*["']([^"']+)/gi
            ]
        },
        streamtape: {
            urlPattern: /streamtape/i,
            sourcePattern: [
                /id=.*?&token=/gi,
                /robotlink.*?=\s*['"]([^'"]+)/gi
            ]
        },
        mp4upload: {
            urlPattern: /mp4upload/i,
            sourcePattern: [
                /player\.src\(\{src:\s*["']([^"']+)/gi,
                /src:\s*["']([^"']+\.mp4[^"']*)/gi
            ]
        }
    };

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

    // ============================================================
    // NEW: SITE-SPECIFIC EXTRACTION (VidSrc, Filemoon, StreamWish, etc.)
    // ============================================================
    if (args.siteType && args.siteType !== 'auto') {
        const siteConfig = sitePatterns[args.siteType];
        if (siteConfig) {
            const html = await page.content();
            for (const pattern of siteConfig.sourcePattern) {
                let match;
                while ((match = pattern.exec(html)) !== null) {
                    if (match[1] && !directUrls.some(d => d.url === match[1])) {
                        const format = formats.find(f => match[1].includes(`.${f}`)) || 'm3u8';
                        directUrls.push({ url: match[1], format, source: args.siteType });
                    }
                }
            }
        }
    } else {
        // Auto-detect site type from URL
        const currentUrl = page.url();
        for (const [siteName, config] of Object.entries(sitePatterns)) {
            if (config.urlPattern.test(currentUrl)) {
                const html = await page.content();
                for (const pattern of config.sourcePattern) {
                    let match;
                    while ((match = pattern.exec(html)) !== null) {
                        if (match[1] && !directUrls.some(d => d.url === match[1])) {
                            const format = formats.find(f => match[1].includes(`.${f}`)) || 'm3u8';
                            directUrls.push({ url: match[1], format, source: siteName });
                        }
                    }
                }
                break;
            }
        }
    }

    // ============================================================
    // NEW: EXTRACT QUALITY FROM URLs
    // ============================================================
    for (const item of directUrls) {
        if (!item.quality || item.quality === 'auto') {
            const url = item.url.toLowerCase();
            if (url.includes('2160') || url.includes('4k') || url.includes('uhd')) item.quality = '2160p';
            else if (url.includes('1080')) item.quality = '1080p';
            else if (url.includes('720')) item.quality = '720p';
            else if (url.includes('480')) item.quality = '480p';
            else if (url.includes('360')) item.quality = '360p';
            else if (url.includes('240')) item.quality = '240p';
            else if (url.includes('144')) item.quality = '144p';
            else item.quality = 'unknown';
        }
    }

    // ============================================================
    // NEW: AUTO-SELECT BEST QUALITY
    // ============================================================
    let bestQuality: { url: string; format: string; quality: string; source?: string } | undefined;
    
    if (args.autoSelectBest || args.preferredQuality) {
        const preferredQ = args.preferredQuality || 'highest';
        
        if (preferredQ === 'highest') {
            // Sort by quality priority (highest first)
            const sorted = [...directUrls].sort((a, b) => {
                const aScore = qualityPriority[a.quality?.toLowerCase() || 'unknown'] || 0;
                const bScore = qualityPriority[b.quality?.toLowerCase() || 'unknown'] || 0;
                return bScore - aScore;
            });
            if (sorted.length > 0) {
                bestQuality = { url: sorted[0].url, format: sorted[0].format, quality: sorted[0].quality || 'unknown', source: sorted[0].source };
            }
        } else if (preferredQ === 'lowest') {
            // Sort by quality priority (lowest first)
            const sorted = [...directUrls].sort((a, b) => {
                const aScore = qualityPriority[a.quality?.toLowerCase() || 'unknown'] || 0;
                const bScore = qualityPriority[b.quality?.toLowerCase() || 'unknown'] || 0;
                return aScore - bScore;
            });
            if (sorted.length > 0) {
                bestQuality = { url: sorted[0].url, format: sorted[0].format, quality: sorted[0].quality || 'unknown', source: sorted[0].source };
            }
        } else {
            // Find exact match for preferred quality
            const exact = directUrls.find(d => d.quality?.toLowerCase() === preferredQ.toLowerCase());
            if (exact) {
                bestQuality = { url: exact.url, format: exact.format, quality: exact.quality || preferredQ, source: exact.source };
            } else {
                // Fallback to highest available
                const sorted = [...directUrls].sort((a, b) => {
                    const aScore = qualityPriority[a.quality?.toLowerCase() || 'unknown'] || 0;
                    const bScore = qualityPriority[b.quality?.toLowerCase() || 'unknown'] || 0;
                    return bScore - aScore;
                });
                if (sorted.length > 0) {
                    bestQuality = { url: sorted[0].url, format: sorted[0].format, quality: sorted[0].quality || 'unknown', source: sorted[0].source };
                }
            }
        }
    }

    // ============================================================
    // NEW: EXTRACT SUBTITLES
    // ============================================================
    if (args.extractSubtitles) {
        const subData = await page.evaluate(() => {
            const subs: { url: string; language?: string; label?: string }[] = [];
            
            // HTML5 track elements
            document.querySelectorAll('track[kind="subtitles"], track[kind="captions"]').forEach(track => {
                const src = track.getAttribute('src');
                if (src) {
                    subs.push({
                        url: src,
                        language: track.getAttribute('srclang') || undefined,
                        label: track.getAttribute('label') || undefined
                    });
                }
            });
            
            // VTT/SRT links
            document.querySelectorAll('a[href*=".vtt"], a[href*=".srt"], a[href*=".ass"]').forEach(link => {
                const href = (link as HTMLAnchorElement).href;
                subs.push({ url: href, label: link.textContent?.trim() || undefined });
            });
            
            // Look in scripts for subtitle URLs
            const html = document.documentElement.innerHTML;
            const vttMatches = html.match(/https?:\/\/[^\s"']+\.vtt[^\s"']*/gi);
            const srtMatches = html.match(/https?:\/\/[^\s"']+\.srt[^\s"']*/gi);
            
            if (vttMatches) vttMatches.forEach(url => subs.push({ url }));
            if (srtMatches) srtMatches.forEach(url => subs.push({ url }));
            
            // Deduplicate
            const seen = new Set<string>();
            return subs.filter(s => {
                if (seen.has(s.url)) return false;
                seen.add(s.url);
                return true;
            });
        });
        
        subtitles.push(...subData);
    }

    return {
        success: directUrls.length > 0,
        directUrls,
        bestQuality,
        subtitles: args.extractSubtitles ? subtitles : undefined,
        message: directUrls.length > 0
            ? `🎬 Found ${directUrls.length} URL(s)${bestQuality ? ` | Best: ${bestQuality.quality}` : ''}${subtitles.length > 0 ? ` | ${subtitles.length} subtitles` : ''}`
            : 'No direct URLs found',
    };
}

// Single page scrape result type
interface JsScrapeResult {
    success: boolean;
    url: string;
    finalUrl: string;
    title: string;
    html?: string;
    text?: string;
    elements?: { tag: string; text: string; attributes: Record<string, string> }[];
    elementCount: number;
    error?: string;
    duration?: number;
}

// Helper function to scrape a single URL
async function scrapeSingleUrl(
    page: Page,
    url: string,
    args: JsScrapeArgs
): Promise<JsScrapeResult> {
    const startTime = Date.now();
    const waitForTimeout = args.waitForTimeout || 10000;
    const returnType = args.returnType || 'html';

    try {
        // Step 1: Navigate to URL
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: waitForTimeout
        });

        // Step 2: Wait for specific selector if provided
        if (args.waitForSelector) {
            try {
                await page.waitForSelector(args.waitForSelector, {
                    timeout: waitForTimeout,
                    visible: true
                });
            } catch (e) {
                // Continue even if selector not found - page might still have content
            }
        }

        // Step 3: Scroll to trigger lazy loading if requested
        if (args.scrollToLoad !== false) {
            await page.evaluate(async () => {
                const scrollStep = window.innerHeight;
                const scrollDelay = 200;
                let totalScrolled = 0;
                const maxScroll = document.body.scrollHeight;

                while (totalScrolled < maxScroll && totalScrolled < 5000) {
                    window.scrollBy(0, scrollStep);
                    totalScrolled += scrollStep;
                    await new Promise(r => setTimeout(r, scrollDelay));
                }

                // Scroll back to top
                window.scrollTo(0, 0);
            });

            // Wait for any lazy-loaded content
            await new Promise(r => setTimeout(r, 1000));
        }

        // Step 4: Wait additional time for JavaScript to execute
        await new Promise(r => setTimeout(r, 500));

        // Step 5: Extract content based on returnType
        const title = await page.title();
        const finalUrl = page.url();

        let html: string | undefined;
        let text: string | undefined;
        let elements: { tag: string; text: string; attributes: Record<string, string> }[] | undefined;
        let elementCount = 0;

        if (args.extractSelector) {
            // Extract specific elements
            const extractedData = await page.evaluate((selector: string, attrs: string[]) => {
                const nodeList = document.querySelectorAll(selector);
                const result: { tag: string; text: string; html: string; attributes: Record<string, string> }[] = [];

                nodeList.forEach((el) => {
                    const attrObj: Record<string, string> = {};
                    (attrs || ['href', 'src', 'alt', 'title', 'data-*']).forEach(attrName => {
                        if (attrName.endsWith('*')) {
                            // Handle wildcard attributes like data-*
                            const prefix = attrName.slice(0, -1);
                            Array.from(el.attributes).forEach(attr => {
                                if (attr.name.startsWith(prefix)) {
                                    attrObj[attr.name] = attr.value;
                                }
                            });
                        } else {
                            const val = el.getAttribute(attrName);
                            if (val) attrObj[attrName] = val;
                        }
                    });

                    result.push({
                        tag: el.tagName.toLowerCase(),
                        text: el.textContent?.trim()?.substring(0, 500) || '',
                        html: el.outerHTML.substring(0, 2000),
                        attributes: attrObj
                    });
                });

                return result;
            }, args.extractSelector, args.extractAttributes || []);

            elementCount = extractedData.length;

            if (returnType === 'elements') {
                elements = extractedData.map(e => ({
                    tag: e.tag,
                    text: e.text,
                    attributes: e.attributes
                }));
            } else if (returnType === 'html') {
                html = extractedData.map(e => e.html).join('\n');
            } else {
                text = extractedData.map(e => e.text).join('\n');
            }
        } else {
            // Extract full page content
            if (returnType === 'html') {
                html = await page.evaluate(() => document.documentElement.outerHTML);
            } else {
                text = await page.evaluate(() => document.body?.textContent || '');
            }
            elementCount = 1;
        }

        return {
            success: true,
            url,
            finalUrl,
            title,
            html,
            text,
            elements,
            elementCount,
            duration: Date.now() - startTime
        };

    } catch (error) {
        return {
            success: false,
            url,
            finalUrl: page.url() || url,
            title: '',
            elementCount: 0,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime
        };
    }
}

/**
 * JS Scrape - Single-call JavaScript-rendered content extraction
 * Combines navigation, waiting, scrolling, and content extraction in one call
 * Perfect for scraping dynamic/AJAX-loaded content
 * NEW: Supports parallel scraping of multiple URLs with concurrency control
 */
export async function handleJsScrape(
    page: Page,
    args: JsScrapeArgs
): Promise<{
    success: boolean;
    url?: string;
    urls?: string[];
    finalUrl?: string;
    title?: string;
    html?: string;
    text?: string;
    elements?: { tag: string; text: string; attributes: Record<string, string> }[];
    elementCount?: number;
    error?: string;
    // Parallel scraping results
    results?: JsScrapeResult[];
    totalUrls?: number;
    successCount?: number;
    failedCount?: number;
    totalDuration?: number;
    isParallel?: boolean;
}> {
    const startTime = Date.now();

    // Determine URLs to scrape
    const urlList = args.urls || (args.url ? [args.url] : []);
    
    if (urlList.length === 0) {
        return {
            success: false,
            error: 'No URL(s) provided. Use "url" for single URL or "urls" for multiple URLs.',
            elementCount: 0
        };
    }

    // Single URL mode - backward compatible
    if (urlList.length === 1 && !args.urls) {
        const result = await scrapeSingleUrl(page, urlList[0], args);
        return result;
    }

    // Parallel scraping mode
    const concurrency = Math.min(args.concurrency || 3, 10); // Max 10 concurrent
    const continueOnError = args.continueOnError !== false;
    const delayBetween = args.delayBetween || 500;
    
    const results: JsScrapeResult[] = [];
    const browser = page.browser();
    
    if (!browser) {
        return {
            success: false,
            error: 'Browser not available for parallel scraping',
            elementCount: 0
        };
    }

    // Create a semaphore for concurrency control
    let activeCount = 0;
    const queue = [...urlList];
    const errors: string[] = [];

    // Process URLs with concurrency limit
    const processUrl = async (url: string): Promise<JsScrapeResult | null> => {
        let newPage: Page | null = null;
        try {
            // Create new page for each URL
            newPage = await browser.newPage();
            
            // Copy settings from original page if needed
            await newPage.setViewport({ width: 1280, height: 720 });
            
            const result = await scrapeSingleUrl(newPage, url, args);
            return result;
        } catch (error) {
            return {
                success: false,
                url,
                finalUrl: url,
                title: '',
                elementCount: 0,
                error: error instanceof Error ? error.message : String(error),
                duration: 0
            };
        } finally {
            // Close the page
            if (newPage) {
                try {
                    await newPage.close();
                } catch (e) {
                    // Ignore close errors
                }
            }
        }
    };

    // Process all URLs with concurrency control
    const processBatch = async (): Promise<void> => {
        const promises: Promise<void>[] = [];
        
        while (queue.length > 0 || activeCount > 0) {
            // Start new tasks up to concurrency limit
            while (activeCount < concurrency && queue.length > 0) {
                const url = queue.shift()!;
                activeCount++;
                
                const promise = (async () => {
                    try {
                        // Add delay between starting each scrape
                        if (results.length > 0) {
                            await new Promise(r => setTimeout(r, delayBetween));
                        }
                        
                        const result = await processUrl(url);
                        if (result) {
                            results.push(result);
                            
                            if (!result.success && !continueOnError) {
                                // Clear queue to stop processing
                                queue.length = 0;
                                errors.push(`Stopped at ${url}: ${result.error}`);
                            }
                        }
                    } finally {
                        activeCount--;
                    }
                })();
                
                promises.push(promise);
            }
            
            // Wait for at least one to complete before continuing
            if (promises.length > 0) {
                await Promise.race(promises);
            }
            
            // Small delay to prevent tight loop
            await new Promise(r => setTimeout(r, 50));
        }
        
        // Wait for all remaining promises
        await Promise.all(promises);
    };

    await processBatch();

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return {
        success: successCount > 0,
        isParallel: true,
        urls: urlList,
        results,
        totalUrls: urlList.length,
        successCount,
        failedCount,
        totalDuration: Date.now() - startTime,
        error: errors.length > 0 ? errors.join('; ') : undefined
    };
}

// ============================================================
// NEW TOOLS: EXECUTE_JS & PLAYER_API_HOOK
// ============================================================

/**
 * Arguments for Execute JS tool - Run custom JavaScript on page
 */
export interface ExecuteJsArgs {
    code: string;                      // JavaScript code to execute
    returnValue?: boolean;             // Whether to return the result
    waitForResult?: number;            // Max wait time for async code (ms)
    context?: 'page' | 'isolated';     // Execution context
}

/**
 * Arguments for Player API Hook tool - Access video player internal APIs
 */
export interface PlayerApiHookArgs {
    action: 'detect' | 'getSources' | 'getState' | 'extractAll';
    playerType?: 'auto' | 'jwplayer' | 'videojs' | 'plyr' | 'hlsjs' | 'dashjs' | 'vidstack' | 'custom';
    customSelector?: string;           // For custom players
    waitForPlayer?: number;            // Wait time for player to initialize
}

/**
 * Execute custom JavaScript on page
 * ULTRA POWERFUL: Execute any JS code and get results
 */
export async function handleExecuteJs(
    page: Page,
    args: ExecuteJsArgs
): Promise<{
    success: boolean;
    result: any;
    error?: string;
    executionTime: number;
}> {
    const startTime = Date.now();
    const waitTime = args.waitForResult || 5000;

    try {
        let result: any;

        // Auto-detect if code contains await and wrap with async IIFE
        const hasAwait = /\bawait\b/.test(args.code);
        const isAlreadyAsync = /^\s*\(async\s+function|\(\s*async\s*\(|\(async\s*\(\)\s*=>/.test(args.code.trim());
        
        // Wrap code with async IIFE if it contains await but isn't already async
        const codeToExecute = (hasAwait && !isAlreadyAsync) 
            ? `(async () => { ${args.code} })()`
            : args.code;

        if (args.context === 'isolated') {
            // Execute in isolated context (sandboxed)
            result = await page.evaluate(codeToExecute);
        } else {
            // Execute in page context with full access
            result = await page.evaluate((code: string) => {
                try {
                    // eslint-disable-next-line no-eval
                    return eval(code);
                } catch (e) {
                    return { error: String(e) };
                }
            }, codeToExecute);
        }

        // Handle async results
        if (result instanceof Promise) {
            result = await Promise.race([
                result,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), waitTime)
                )
            ]);
        }

        return {
            success: true,
            result: args.returnValue !== false ? result : undefined,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : String(error),
            executionTime: Date.now() - startTime,
        };
    }
}

/**
 * Hook into video player APIs to extract sources and state
 * ULTRA POWERFUL: Detects and extracts from all major video players
 */
export async function handlePlayerApiHook(
    page: Page,
    args: PlayerApiHookArgs
): Promise<{
    success: boolean;
    playerDetected: string | null;
    sources: { url: string; type: string; quality?: string; label?: string }[];
    playerState?: { playing: boolean; currentTime: number; duration: number };
    rawConfig?: any;
    message: string;
}> {
    const action = args.action || 'extractAll';
    const waitTime = args.waitForPlayer || 3000;

    // Wait for player to initialize
    await new Promise(r => setTimeout(r, waitTime));

    try {
        const result = await page.evaluate((opts: { action: string; playerType: string; customSelector?: string }) => {
            const sources: { url: string; type: string; quality?: string; label?: string }[] = [];
            let playerDetected: string | null = null;
            let playerState: { playing: boolean; currentTime: number; duration: number } | undefined;
            let rawConfig: any = null;

            // ============================================================
            // 1. JW PLAYER
            // ============================================================
            if ((window as any).jwplayer && typeof (window as any).jwplayer === 'function') {
                try {
                    const jw = (window as any).jwplayer();
                    if (jw) {
                        playerDetected = 'jwplayer';

                        // Get sources
                        const playlist = jw.getPlaylist ? jw.getPlaylist() : [];
                        const currentItem = jw.getPlaylistItem ? jw.getPlaylistItem() : null;

                        if (currentItem) {
                            if (currentItem.file) {
                                sources.push({ url: currentItem.file, type: 'primary', quality: 'auto' });
                            }
                            if (currentItem.sources) {
                                currentItem.sources.forEach((s: any) => {
                                    if (s.file) {
                                        sources.push({
                                            url: s.file,
                                            type: s.type || 'video',
                                            quality: s.label || s.height ? `${s.height}p` : 'auto',
                                            label: s.label
                                        });
                                    }
                                });
                            }
                        }

                        // Get state
                        if (opts.action === 'getState' || opts.action === 'extractAll') {
                            playerState = {
                                playing: jw.getState ? jw.getState() === 'playing' : false,
                                currentTime: jw.getPosition ? jw.getPosition() : 0,
                                duration: jw.getDuration ? jw.getDuration() : 0,
                            };
                        }

                        rawConfig = jw.getConfig ? jw.getConfig() : null;
                    }
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 2. VIDEO.JS
            // ============================================================
            if (!playerDetected && (window as any).videojs) {
                try {
                    const players = (window as any).videojs.getPlayers ? (window as any).videojs.getPlayers() : {};
                    const playerIds = Object.keys(players);

                    if (playerIds.length > 0) {
                        const vjs = players[playerIds[0]];
                        if (vjs) {
                            playerDetected = 'videojs';

                            const src = vjs.currentSrc ? vjs.currentSrc() : vjs.src();
                            if (src) {
                                sources.push({ url: src, type: 'primary' });
                            }

                            // Check for quality levels
                            if (vjs.qualityLevels) {
                                const levels = vjs.qualityLevels();
                                for (let i = 0; i < levels.length; i++) {
                                    const level = levels[i];
                                    if (level.uri) {
                                        sources.push({
                                            url: level.uri,
                                            type: 'quality',
                                            quality: level.height ? `${level.height}p` : 'auto',
                                        });
                                    }
                                }
                            }

                            playerState = {
                                playing: !vjs.paused(),
                                currentTime: vjs.currentTime ? vjs.currentTime() : 0,
                                duration: vjs.duration ? vjs.duration() : 0,
                            };
                        }
                    }
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 3. HLS.JS
            // ============================================================
            if (!playerDetected && (window as any).Hls) {
                try {
                    // Look for HLS instances
                    const videos = document.querySelectorAll('video');
                    videos.forEach(video => {
                        if ((video as any).hls) {
                            playerDetected = 'hlsjs';
                            const hls = (video as any).hls;
                            if (hls.url) {
                                sources.push({ url: hls.url, type: 'hls_master' });
                            }
                            if (hls.levels) {
                                hls.levels.forEach((level: any, i: number) => {
                                    if (level.uri || level.url) {
                                        sources.push({
                                            url: level.uri || level.url,
                                            type: 'hls_level',
                                            quality: level.height ? `${level.height}p` : `Level ${i}`,
                                        });
                                    }
                                });
                            }
                            playerState = {
                                playing: !video.paused,
                                currentTime: video.currentTime,
                                duration: video.duration || 0,
                            };
                        }
                    });
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 4. PLYR
            // ============================================================
            if (!playerDetected && (window as any).Plyr) {
                try {
                    const plyrElements = document.querySelectorAll('.plyr');
                    plyrElements.forEach(el => {
                        if ((el as any).plyr) {
                            playerDetected = 'plyr';
                            const plyr = (el as any).plyr;
                            if (plyr.source) {
                                sources.push({ url: plyr.source, type: 'primary' });
                            }
                            playerState = {
                                playing: plyr.playing || false,
                                currentTime: plyr.currentTime || 0,
                                duration: plyr.duration || 0,
                            };
                        }
                    });
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 5. VIDSTACK (Modern player like Hubstream uses)
            // ENHANCED: Check blob URLs, HLS sources, and performance entries
            // ============================================================
            if (!playerDetected) {
                try {
                    const mediaPlayers = document.querySelectorAll('media-player');
                    mediaPlayers.forEach(mp => {
                        playerDetected = 'vidstack';

                        // Method 1: Check video element
                        const video = mp.querySelector('video');
                        if (video) {
                            // Direct src
                            if (video.src && !video.src.startsWith('blob:')) {
                                sources.push({ url: video.src, type: 'video_src' });
                            }
                            // CurrentSrc (may be blob but check anyway)
                            if (video.currentSrc && !video.currentSrc.startsWith('blob:')) {
                                sources.push({ url: video.currentSrc, type: 'current_src' });
                            }

                            playerState = {
                                playing: !video.paused,
                                currentTime: video.currentTime,
                                duration: video.duration || 0,
                            };
                        }

                        // Method 2: Check source elements
                        mp.querySelectorAll('source').forEach(s => {
                            if (s.src && !s.src.startsWith('blob:')) {
                                sources.push({ url: s.src, type: s.type || 'source_element' });
                            }
                        });

                        // Method 3: Check media-provider for HLS sources
                        const provider = mp.querySelector('media-provider');
                        if (provider) {
                            const hlsSrc = provider.getAttribute('src') || provider.getAttribute('data-src');
                            if (hlsSrc && !hlsSrc.startsWith('blob:')) {
                                sources.push({ url: hlsSrc, type: 'media_provider' });
                            }
                        }

                        // Method 4: Check for Vidstack state/context
                        if ((mp as any).$state) {
                            const state = (mp as any).$state;
                            if (state.src && !state.src.startsWith('blob:')) {
                                sources.push({ url: state.src, type: 'vidstack_state' });
                            }
                        }

                        // Method 5: Check __svelte_meta or similar
                        if ((mp as any).__player) {
                            const pl = (mp as any).__player;
                            if (pl.src) sources.push({ url: pl.src, type: 'vidstack_player' });
                        }
                    });
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 6. DOOP PLAYER (Custom player used by some streaming sites)
            // ============================================================
            if (!playerDetected && ((window as any).DoopPlayer || (window as any).doop_player || document.querySelector('.doop-player, #doop-player'))) {
                try {
                    playerDetected = 'doop_player';

                    // Check window.DoopPlayer
                    const doop = (window as any).DoopPlayer || (window as any).doop_player;
                    if (doop) {
                        if (doop.source) sources.push({ url: doop.source, type: 'doop_source' });
                        if (doop.src) sources.push({ url: doop.src, type: 'doop_src' });
                        if (doop.file) sources.push({ url: doop.file, type: 'doop_file' });
                        if (doop.config?.source) sources.push({ url: doop.config.source, type: 'doop_config' });
                        if (doop.config?.file) sources.push({ url: doop.config.file, type: 'doop_config' });
                        rawConfig = doop.config || doop;
                    }

                    // Check DOM elements with doop class
                    document.querySelectorAll('.doop-player video, #doop-player video').forEach(video => {
                        const v = video as HTMLVideoElement;
                        if (v.src && !v.src.startsWith('blob:')) {
                            sources.push({ url: v.src, type: 'doop_video' });
                        }
                        if (v.currentSrc && !v.currentSrc.startsWith('blob:')) {
                            sources.push({ url: v.currentSrc, type: 'doop_current' });
                        }
                    });

                    // Check for doop_source or doopSource window var
                    if ((window as any).doop_source) {
                        sources.push({ url: (window as any).doop_source, type: 'doop_window' });
                    }
                    if ((window as any).doopSource) {
                        sources.push({ url: (window as any).doopSource, type: 'doop_window' });
                    }
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 7. DASH.JS
            // ============================================================
            if (!playerDetected && (window as any).dashjs) {
                try {
                    const dashPlayer = (window as any).dashPlayer || (window as any).player;
                    if (dashPlayer && dashPlayer.getSource) {
                        playerDetected = 'dashjs';
                        sources.push({ url: dashPlayer.getSource(), type: 'dash_mpd' });
                    }
                } catch (e) { /* ignore */ }
            }

            // ============================================================
            // 8. FALLBACK: Check video elements directly
            // ============================================================
            if (sources.length === 0) {
                document.querySelectorAll('video').forEach(video => {
                    if (video.src && !video.src.startsWith('blob:')) {
                        sources.push({ url: video.src, type: 'video_element' });
                    }
                    video.querySelectorAll('source').forEach(s => {
                        if (s.src && !s.src.startsWith('blob:')) {
                            sources.push({ url: s.src, type: s.type || 'video' });
                        }
                    });

                    // Check currentSrc (only if not blob)
                    if (video.currentSrc && !video.currentSrc.startsWith('blob:') && !sources.some(s => s.url === video.currentSrc)) {
                        sources.push({ url: video.currentSrc, type: 'current_src' });
                    }
                });

                if (sources.length > 0) {
                    playerDetected = 'native_video';
                }
            }

            // ============================================================
            // 9. NETWORK RESOURCES: Extract m3u8/mp4 from performance entries
            // This catches HLS streams that were loaded dynamically
            // ============================================================
            try {
                const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
                resources.forEach(r => {
                    const url = r.name;
                    if (url && (
                        url.includes('.m3u8') ||
                        url.includes('.mp4') ||
                        url.includes('.ts') ||
                        url.includes('.txt') ||
                        url.includes('master') ||
                        url.includes('/hls/')
                    ) && !url.endsWith('.jpg') && !url.endsWith('.png') && !url.endsWith('.woff2')) {
                        // Only add if it looks like a video URL
                        if (!sources.some(s => s.url === url)) {
                            const type = url.includes('.m3u8') ? 'hls_network' :
                                url.includes('.mp4') ? 'mp4_network' :
                                    url.includes('.txt') ? 'txt_network' : 'network';
                            sources.push({ url, type });
                        }
                    }
                });
            } catch (e) { /* ignore performance API errors */ }

            // ============================================================
            // 10. Check window variables for player configs
            // ============================================================
            const configVars = ['playerConfig', 'videoConfig', 'streamConfig', 'sources', 'videoSources',
                'streamUrl', 'videoUrl', 'hlsUrl', 'm3u8Url', 'playbackUrl'];
            configVars.forEach(varName => {
                if ((window as any)[varName]) {
                    const config = (window as any)[varName];
                    if (typeof config === 'string' && config.includes('http') && !config.startsWith('blob:')) {
                        sources.push({ url: config, type: 'window_var' });
                    } else if (config.file || config.src || config.url) {
                        const url = config.file || config.src || config.url;
                        if (url && !url.startsWith('blob:')) {
                            sources.push({ url, type: 'window_var' });
                        }
                    }
                }
            });

            // ============================================================
            // 11. REGEX SCAN: Find m3u8/mp4 URLs in page scripts
            // ============================================================
            try {
                document.querySelectorAll('script').forEach(script => {
                    const text = script.textContent || '';
                    // Find m3u8 URLs
                    const m3u8Matches = text.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/gi);
                    if (m3u8Matches) {
                        m3u8Matches.forEach(url => {
                            if (!sources.some(s => s.url === url)) {
                                sources.push({ url, type: 'script_m3u8' });
                            }
                        });
                    }
                    // Find mp4 URLs
                    const mp4Matches = text.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/gi);
                    if (mp4Matches) {
                        mp4Matches.forEach(url => {
                            if (!sources.some(s => s.url === url)) {
                                sources.push({ url, type: 'script_mp4' });
                            }
                        });
                    }
                    // Find txt URLs (HLS alternate format)
                    const txtMatches = text.match(/https?:\/\/[^"'\s<>]+cf-master[^"'\s<>]*\.txt/gi);
                    if (txtMatches) {
                        txtMatches.forEach(url => {
                            if (!sources.some(s => s.url === url)) {
                                sources.push({ url, type: 'script_txt' });
                            }
                        });
                    }
                });
            } catch (e) { /* ignore */ }

            // Deduplicate sources
            const seen = new Set<string>();
            const uniqueSources = sources.filter(s => {
                if (seen.has(s.url)) return false;
                seen.add(s.url);
                return true;
            });

            return {
                playerDetected,
                sources: uniqueSources,
                playerState,
                rawConfig,
            };
        }, { action, playerType: args.playerType || 'auto', customSelector: args.customSelector });

        return {
            success: result.sources.length > 0 || result.playerDetected !== null,
            playerDetected: result.playerDetected,
            sources: result.sources,
            playerState: result.playerState,
            rawConfig: result.rawConfig,
            message: result.playerDetected
                ? `🎬 Detected ${result.playerDetected} player with ${result.sources.length} source(s)`
                : result.sources.length > 0
                    ? `Found ${result.sources.length} video source(s) without player detection`
                    : 'No video player or sources detected',
        };
    } catch (error) {
        return {
            success: false,
            playerDetected: null,
            sources: [],
            message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}


// ============================================================
// FORM AUTOMATOR - Auto-fill forms with human-like behavior
// ============================================================

interface FormAutomatorArgs {
    action?: 'fill' | 'autoFill' | 'getFields' | 'submit' | 'fillField';
    formSelector?: string;
    data?: Record<string, any>;
    fieldSelector?: string;
    fieldValue?: string;
    humanLike?: boolean;
    clearFields?: boolean;
    submitAfter?: boolean;
    submitSelector?: string;
    waitForNavigation?: boolean;
    delayBetweenFields?: number;
}

// Field type detection patterns
const FIELD_PATTERNS: Record<string, RegExp[]> = {
    email: [/email/i, /e-mail/i, /mail/i],
    password: [/password/i, /pass/i, /pwd/i],
    username: [/username/i, /user/i, /login/i, /uname/i],
    firstName: [/first.?name/i, /fname/i, /given.?name/i],
    lastName: [/last.?name/i, /lname/i, /surname/i, /family.?name/i],
    fullName: [/full.?name/i, /name/i],
    phone: [/phone/i, /tel/i, /mobile/i, /cell/i],
    address: [/address/i, /street/i, /addr/i],
    city: [/city/i, /town/i],
    state: [/state/i, /province/i, /region/i],
    zip: [/zip/i, /postal/i, /postcode/i],
    country: [/country/i, /nation/i],
    cardNumber: [/card.?number/i, /cc.?num/i, /credit.?card/i],
    cvv: [/cvv/i, /cvc/i, /security.?code/i],
    expiry: [/expir/i, /exp.?date/i],
    search: [/search/i, /query/i, /q/i],
    message: [/message/i, /comment/i, /feedback/i, /note/i],
    company: [/company/i, /organization/i, /org/i],
    website: [/website/i, /url/i, /web/i],
    age: [/age/i, /birth/i, /dob/i],
};

// Detect field type from attributes
function detectFieldType(attributes: { name?: string; id?: string; type?: string; placeholder?: string; label?: string; autocomplete?: string }): string {
    const { name = '', id = '', type = '', placeholder = '', label = '', autocomplete = '' } = attributes;
    const combined = `${name} ${id} ${type} ${placeholder} ${label} ${autocomplete}`.toLowerCase();
    
    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(combined)) {
                return fieldType;
            }
        }
    }
    
    return 'unknown';
}

export async function handleFormAutomator(page: Page, args: FormAutomatorArgs): Promise<any> {
    const action = args.action || 'fill';
    const formSelector = args.formSelector || 'form';
    const humanLike = args.humanLike !== false;
    const clearFields = args.clearFields !== false;
    const delayBetweenFields = args.delayBetweenFields || 500;
    
    try {
        // Get form fields
        const getFormFields = async () => {
            return await page.evaluate((selector: string) => {
                const form = document.querySelector(selector);
                if (!form) return [];
                
                const inputs = form.querySelectorAll('input, textarea, select');
                const fields: any[] = [];
                
                inputs.forEach((input: any, index: number) => {
                    // Find associated label
                    let label = '';
                    if (input.id) {
                        const labelEl = document.querySelector(`label[for="${input.id}"]`);
                        if (labelEl) label = (labelEl as HTMLElement).textContent?.trim() || '';
                    }
                    if (!label) {
                        const parent = input.closest('label');
                        if (parent) label = (parent as HTMLElement).textContent?.replace(input.value || '', '').trim() || '';
                    }
                    
                    fields.push({
                        index,
                        tagName: input.tagName.toLowerCase(),
                        type: input.type || 'text',
                        name: input.name || '',
                        id: input.id || '',
                        placeholder: input.placeholder || '',
                        label,
                        autocomplete: input.autocomplete || '',
                        required: input.required,
                        value: input.value || '',
                        visible: input.offsetWidth > 0 && input.offsetHeight > 0,
                        selector: input.id ? `#${input.id}` : 
                                 input.name ? `[name="${input.name}"]` : 
                                 `${selector} ${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`
                    });
                });
                
                return fields;
            }, formSelector);
        };
        
        // Human-like typing function
        const humanType = async (selector: string, text: string) => {
            const element = await page.$(selector);
            if (!element) throw new Error(`Element not found: ${selector}`);
            
            // Focus and clear field
            await element.click();
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            
            const minDelay = 50;
            const maxDelay = 150;
            const errorRate = 0.02;
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                
                // Random delay between keystrokes
                const delay = minDelay + Math.random() * (maxDelay - minDelay);
                await new Promise(r => setTimeout(r, delay));
                
                // Simulate occasional typo
                if (Math.random() < errorRate && i > 0 && i < text.length - 1) {
                    const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
                    await page.keyboard.type(wrongChar);
                    await new Promise(r => setTimeout(r, 200));
                    await page.keyboard.press('Backspace');
                    await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
                }
                
                await page.keyboard.type(char);
            }
        };
        
        // Handle different actions
        switch (action) {
            case 'getFields': {
                const fields = await getFormFields();
                const detectedFields = fields.map(f => ({
                    ...f,
                    detectedType: detectFieldType(f)
                }));
                return {
                    success: true,
                    formFound: fields.length > 0,
                    totalFields: fields.length,
                    visibleFields: fields.filter(f => f.visible).length,
                    fields: detectedFields,
                    message: `Found ${fields.length} fields in form`
                };
            }
            
            case 'fillField': {
                if (!args.fieldSelector || !args.fieldValue) {
                    throw new Error('fieldSelector and fieldValue are required for fillField action');
                }
                
                if (humanLike) {
                    await humanType(args.fieldSelector, args.fieldValue);
                } else {
                    if (clearFields) {
                        await page.$eval(args.fieldSelector, (el: any) => el.value = '');
                    }
                    await page.type(args.fieldSelector, args.fieldValue);
                }
                
                return {
                    success: true,
                    field: args.fieldSelector,
                    value: args.fieldValue,
                    message: `Field filled successfully`
                };
            }
            
            case 'submit': {
                const submitSelector = args.submitSelector || 'button[type="submit"], input[type="submit"]';
                const waitForNav = args.waitForNavigation !== false;
                
                const submitButton = await page.$(submitSelector);
                
                if (waitForNav) {
                    const navigationPromise = page.waitForNavigation({ timeout: 30000 }).catch(() => null);
                    
                    if (submitButton) {
                        await submitButton.click();
                    } else {
                        await page.$eval(formSelector, (f: any) => f.submit());
                    }
                    
                    await navigationPromise;
                } else {
                    if (submitButton) {
                        await submitButton.click();
                    } else {
                        await page.$eval(formSelector, (f: any) => f.submit());
                    }
                }
                
                return {
                    success: true,
                    submitted: true,
                    currentUrl: page.url(),
                    message: 'Form submitted successfully'
                };
            }
            
            case 'autoFill': {
                // Default test data
                const defaultData: Record<string, string> = {
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    username: 'testuser',
                    firstName: 'John',
                    lastName: 'Doe',
                    fullName: 'John Doe',
                    phone: '+1-555-123-4567',
                    address: '123 Main Street',
                    city: 'New York',
                    state: 'NY',
                    zip: '10001',
                    country: 'United States',
                    company: 'Acme Corp',
                    website: 'https://example.com',
                    message: 'This is a test message.',
                    ...args.data
                };
                
                args.data = defaultData;
                // Fall through to fill action
            }
            
            case 'fill':
            default: {
                const data = args.data || {};
                const fields = await getFormFields();
                const filledFields: any[] = [];
                const errors: any[] = [];
                
                for (const field of fields) {
                    if (!field.visible) continue;
                    
                    // Detect field type
                    const fieldType = detectFieldType(field);
                    
                    // Find matching data
                    let value: any = null;
                    if (data[field.name]) value = data[field.name];
                    else if (data[field.id]) value = data[field.id];
                    else if (data[fieldType]) value = data[fieldType];
                    
                    if (!value) continue;
                    
                    try {
                        if (field.tagName === 'select') {
                            await page.select(field.selector, value);
                        } else if (field.type === 'checkbox') {
                            const isChecked = await page.$eval(field.selector, (el: any) => el.checked);
                            if ((value === true || value === 'true' || value === '1') && !isChecked) {
                                await page.click(field.selector);
                            } else if ((value === false || value === 'false' || value === '0') && isChecked) {
                                await page.click(field.selector);
                            }
                        } else if (field.type === 'radio') {
                            const radioSelector = `${field.selector}[value="${value}"]`;
                            await page.click(radioSelector);
                        } else {
                            if (humanLike) {
                                await humanType(field.selector, String(value));
                            } else {
                                if (clearFields) {
                                    await page.$eval(field.selector, (el: any) => el.value = '');
                                }
                                await page.type(field.selector, String(value));
                            }
                        }
                        
                        filledFields.push({
                            field: field.name || field.id || field.selector,
                            type: fieldType,
                            success: true
                        });
                        
                        // Delay between fields
                        if (humanLike) {
                            await new Promise(r => setTimeout(r, delayBetweenFields * (0.5 + Math.random())));
                        }
                        
                    } catch (err: any) {
                        errors.push({
                            field: field.name || field.id || field.selector,
                            error: err.message
                        });
                    }
                }
                
                // Submit if requested
                let submitted = false;
                if (args.submitAfter) {
                    try {
                        const submitSelector = args.submitSelector || 'button[type="submit"], input[type="submit"]';
                        const submitButton = await page.$(submitSelector);
                        
                        if (args.waitForNavigation !== false) {
                            const navigationPromise = page.waitForNavigation({ timeout: 30000 }).catch(() => null);
                            if (submitButton) {
                                await submitButton.click();
                            } else {
                                await page.$eval(formSelector, (f: any) => f.submit());
                            }
                            await navigationPromise;
                        } else {
                            if (submitButton) {
                                await submitButton.click();
                            } else {
                                await page.$eval(formSelector, (f: any) => f.submit());
                            }
                        }
                        submitted = true;
                    } catch (err: any) {
                        errors.push({ field: 'submit', error: err.message });
                    }
                }
                
                return {
                    success: errors.length === 0,
                    filledFields,
                    errors,
                    submitted,
                    totalFields: fields.filter(f => f.visible).length,
                    currentUrl: page.url(),
                    message: `Filled ${filledFields.length} fields${submitted ? ' and submitted form' : ''}`
                };
            }
        }
        
    } catch (error) {
        return {
            success: false,
            message: `Form automator error: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}























