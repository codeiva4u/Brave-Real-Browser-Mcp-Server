// @ts-nocheck
import { getPageInstance } from '../browser-manager.js';
import { withErrorHandling } from '../system-utils.js';
import { validateWorkflow } from '../workflow-validation.js';

export interface SearchContentArgs {
    query: string;
    type?: 'text' | 'regex';
    url?: string;
    // Text options
    caseSensitive?: boolean;
    wholeWord?: boolean;
    context?: number;
    // Regex options
    flags?: string;
    selector?: string; // Scope search to element
}

export interface FindElementAdvancedArgs {
    query: string;
    type?: 'css' | 'xpath';
    url?: string;
    // CSS options
    operation?: 'query' | 'closest' | 'matches';
    // Shared
    returnType?: 'elements' | 'styles' | 'html';
}

/**
 * Unified Search Content Handler
 * Merges Keyword Search and Regex Pattern Matcher
 */
export async function handleSearchContent(args: SearchContentArgs): Promise<any> {
    return await withErrorHandling(async () => {
        validateWorkflow('search_content', { requireBrowser: true, requirePage: true });

        // Logic based on type
        if (args.type === 'regex') {
            return await handleRegexPatternMatcher(args);
        } else {
            return await handleKeywordSearch(args);
        }
    }, 'Search Content Failed');
}

/**
 * Unified Find Element Advanced Handler
 * Merges XPath and Advanced CSS Selectors
 */
export async function handleFindElementAdvanced(args: FindElementAdvancedArgs): Promise<any> {
    return await withErrorHandling(async () => {
        validateWorkflow('find_element_advanced', { requireBrowser: true, requirePage: true });

        if (args.type === 'xpath') {
            return await handleXPathSupport(args);
        } else {
            return await handleAdvancedCSSSelectors(args);
        }
    }, 'Find Element Advanced Failed');
}

// --- Internal Sub-Handlers (Preserved Logic) ---

async function handleKeywordSearch(args: SearchContentArgs) {
    const { url, query, caseSensitive = false, wholeWord = false, context = 50 } = args;
    const keywords = Array.isArray(query) ? query : [query]; // Handling if someone passes array (unlikely with new schema but good for compat)

    const page = getPageInstance();
    if (url && page.url() !== url) await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const results = await page.evaluate((kws: string[], caseSens: boolean, whole: boolean, ctx: number) => {
        const allMatches: any[] = [];
        kws.forEach(keyword => {
            const flags = caseSens ? 'g' : 'gi';
            const pattern = whole ? `\\b${keyword}\\b` : keyword;

            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent || '';
                const nodeRegex = new RegExp(pattern, flags);
                let match;
                while ((match = nodeRegex.exec(text)) !== null) {
                    allMatches.push({
                        keyword,
                        match: match[0],
                        context: text.substring(Math.max(0, match.index - ctx), Math.min(text.length, match.index + match[0].length + ctx))
                    });
                }
            }
        });
        return { totalMatches: allMatches.length, matches: allMatches.slice(0, 100) };
    }, keywords, caseSensitive, wholeWord, context);

    return {
        content: [{ type: 'text', text: `Keyword Search Results (${results.totalMatches}):\n${JSON.stringify(results.matches, null, 2)}` }]
    };
}

async function handleRegexPatternMatcher(args: SearchContentArgs) {
    const { url, query, flags = 'g', selector } = args;
    const page = getPageInstance();
    if (url && page.url() !== url) await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const results = await page.evaluate((pat: string, flgs: string, sel: string) => {
        const content = sel ? document.querySelector(sel)?.textContent || '' : document.body.innerText;
        const regex = new RegExp(pat, flgs);
        const matches: any[] = [];
        let match;
        let count = 0;
        while ((match = regex.exec(content)) !== null && count < 1000) {
            count++;
            matches.push({ match: match[0], index: match.index, groups: match.slice(1) });
            if (match.index === regex.lastIndex) regex.lastIndex++;
        }
        return { totalMatches: matches.length, matches: matches.slice(0, 100) };
    }, query, flags, selector || '');

    return { content: [{ type: 'text', text: `Regex Results (${results.totalMatches}):\n${JSON.stringify(results.matches, null, 2)}` }] };
}

async function handleXPathSupport(args: FindElementAdvancedArgs) {
    const { url, query, returnType = 'elements' } = args;
    const page = getPageInstance();
    if (url && page.url() !== url) await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const results = await page.evaluate((xp: string, type: string) => {
        const xpathResult = document.evaluate(xp, document, null, XPathResult.ANY_TYPE, null);
        const elements: any[] = [];
        let node = xpathResult.iterateNext();
        while (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                elements.push({
                    tagName: el.tagName.toLowerCase(),
                    text: el.textContent?.substring(0, 100),
                    attributes: Array.from(el.attributes).reduce((acc: any, a) => { acc[a.name] = a.value; return acc; }, {})
                });
            }
            node = xpathResult.iterateNext();
        }
        return { count: elements.length, elements };
    }, query, returnType);

    return { content: [{ type: 'text', text: `XPath Results (${results.count}):\n${JSON.stringify(results.elements, null, 2)}` }] };
}

async function handleAdvancedCSSSelectors(args: FindElementAdvancedArgs) {
    const { url, query, operation = 'query', returnType = 'elements' } = args;
    const page = getPageInstance();
    if (url && page.url() !== url) await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const results = await page.evaluate((sel: string, op: string) => {
        let elements: Element[] = [];
        if (op === 'closest') elements = document.querySelector(sel) ? [document.querySelector(sel)!.closest(sel)].filter(Boolean) as Element[] : [];
        else if (op === 'matches') elements = Array.from(document.querySelectorAll('*')).filter(el => el.matches(sel));
        else elements = Array.from(document.querySelectorAll(sel));

        return {
            count: elements.length,
            elements: elements.map(el => ({
                tagName: el.tagName.toLowerCase(),
                className: el.className,
                text: el.textContent?.substring(0, 100)
            })).slice(0, 50)
        };
    }, query, operation);

    return { content: [{ type: 'text', text: `CSS Results (${results.count}):\n${JSON.stringify(results.elements, null, 2)}` }] };
}
