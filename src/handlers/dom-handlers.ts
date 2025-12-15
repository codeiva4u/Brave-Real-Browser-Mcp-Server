
import { getPageInstance } from '../browser-manager.js';

// Interfaces
export interface HtmlElementsExtractorArgs {
    selector?: string;
    maxElements?: number;
    includeStyles?: boolean;
}

export interface TagsFinderArgs {
    tags: string[];
}

export interface LinksFinderArgs {
    includeExternal?: boolean;
    maxLinks?: number;
}

export interface XpathLinksArgs {
    xpath: string;
}

export interface ShadowDomExtractorArgs {
    selector?: string;
}

export async function handleHtmlElementsExtractor(args: HtmlElementsExtractorArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const selector = args.selector || '*';
    const max = args.maxElements || 100;
    const includeStyles = args.includeStyles || false;

    const elements = await page.evaluate((sel: string, maxCount: number, incStyles: boolean) => {
        const els = Array.from(document.querySelectorAll(sel)).slice(0, maxCount);
        return els.map(el => {
            const rect = el.getBoundingClientRect();
            const info: any = {
                tagName: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                text: el.textContent?.slice(0, 100).trim(),
                attributes: {},
                rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            };

            if (incStyles) {
                const computed = window.getComputedStyle(el);
                info.styles = {
                    display: computed.display,
                    position: computed.position,
                    color: computed.color,
                    backgroundColor: computed.backgroundColor,
                    fontSize: computed.fontSize
                };
            }

            Array.from(el.attributes).forEach((attr: any) => {
                info.attributes[attr.name] = attr.value;
            });

            return info;
        });
    }, selector, max, includeStyles);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(elements, null, 2)
        }]
    };
}

export async function handleTagsFinder(args: TagsFinderArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const results = await page.evaluate((tags: string[]) => {
        const found: any = {};
        tags.forEach(tag => {
            const elements = document.querySelectorAll(tag);
            found[tag] = Array.from(elements).map(el => ({
                text: el.textContent?.slice(0, 50).trim(),
                html: el.outerHTML.slice(0, 100)
            }));
        });
        return found;
    }, args.tags);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
        }]
    };
}

export async function handleLinksFinder(args: LinksFinderArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const includeExt = args.includeExternal ?? true;
    const max = args.maxLinks ?? 200;

    const links = await page.evaluate((incExt: boolean, maxCount: number) => {
        const allLinks = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];
        const filtered = incExt
            ? allLinks
            : allLinks.filter(a => a.href.startsWith(window.location.origin));

        return filtered.slice(0, maxCount).map(a => ({
            text: a.textContent?.trim(),
            href: a.href,
            isExternal: !a.href.startsWith(window.location.origin)
        }));
    }, includeExt, max);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(links, null, 2)
        }]
    };
}

export async function handleXpathLinks(args: XpathLinksArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const links = await page.evaluate((xpathExpr: string) => {
        const result = document.evaluate(xpathExpr, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const items = [];
        for (let i = 0; i < result.snapshotLength; i++) {
            const node = result.snapshotItem(i);
            if (node instanceof HTMLAnchorElement) {
                items.push({ text: node.textContent?.trim(), href: node.href });
            } else if (node && node.textContent) {
                items.push({ text: node.textContent.trim() });
            }
        }
        return items;
    }, args.xpath);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(links, null, 2)
        }]
    };
}

export async function handleShadowDomExtractor(args: ShadowDomExtractorArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const sel = args.selector || '*';

    const results = await page.evaluate((selector: string) => {
        function findAllShadowRoots(root: Node): ShadowRoot[] {
            const shadowRoots: ShadowRoot[] = [];
            if (root instanceof Element && root.shadowRoot) {
                shadowRoots.push(root.shadowRoot);
                shadowRoots.push(...findAllShadowRoots(root.shadowRoot));
            }
            if (root.childNodes) {
                root.childNodes.forEach(child => {
                    shadowRoots.push(...findAllShadowRoots(child));
                });
            }
            return shadowRoots;
        }

        const allShadows = findAllShadowRoots(document.body);
        const data: any[] = [];

        allShadows.forEach((shadow, index) => {
            const elements = shadow.querySelectorAll(selector);
            if (elements.length > 0) {
                data.push({
                    shadowRootIndex: index,
                    elements: Array.from(elements).map(el => el.outerHTML)
                });
            }
        });

        return data;
    }, sel);

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({ message: `Found content in ${results.length} shadow roots`, data: results }, null, 2)
        }]
    };
}

export async function handleIframeExtractor() {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const frames = page.frames();
    const frameData = await Promise.all(frames.map(async (frame: any, index: number) => {
        try {
            const title = await frame.title();
            const url = frame.url();
            const bodyText = await frame.evaluate(() => document.body.innerText.slice(0, 500));

            return {
                id: index,
                url,
                title,
                preview: bodyText,
                isMainFrame: frame === page.mainFrame()
            };
        } catch (e) {
            return { id: index, error: String(e) };
        }
    }));

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(frameData, null, 2)
        }]
    };
}

export async function handleEmbedPageExtractor() {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized');

    const embeds = await page.evaluate(() => {
        const embedTags = Array.from(document.querySelectorAll('embed')).map(el => ({
            type: 'embed',
            src: el.src,
            typeAttr: el.type
        }));
        const objectTags = Array.from(document.querySelectorAll('object')).map(el => ({
            type: 'object',
            data: el.data,
            typeAttr: (el as HTMLObjectElement).type // Type casting
        }));
        return [...embedTags, ...objectTags];
    });

    return {
        content: [{
            type: 'text',
            text: JSON.stringify(embeds, null, 2)
        }]
    };
}
