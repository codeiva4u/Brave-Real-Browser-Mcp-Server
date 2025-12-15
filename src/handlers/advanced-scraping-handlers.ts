
import { getPageInstance } from '../browser-manager.js';

export interface MultiPageScraperArgs {
    urls: string[];
    dataSelector: string;
    waitBetweenPages?: number;
}

export interface BreadcrumbNavigatorArgs {
    breadcrumbSelector: string;
    followLinks?: boolean;
}

export async function handleMultiPageScraper(args: MultiPageScraperArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized. Use browser_init first.');

    const results = [];
    const errors = [];

    for (const url of args.urls) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });

            if (args.waitBetweenPages) {
                await new Promise(resolve => setTimeout(resolve, args.waitBetweenPages));
            }

            const data = await page.evaluate((selector: string) => {
                const elements = document.querySelectorAll(selector);
                return Array.from(elements).map(el => el.textContent?.trim()).filter(Boolean);
            }, args.dataSelector);

            results.push({ url, data, success: true });
        } catch (error) {
            errors.push({ url, error: String(error) });
            results.push({ url, success: false, error: String(error) });
        }
    }

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({ summary: `Scraped ${results.length} pages`, results, errors }, null, 2)
        }]
    };
}

export async function handleBreadcrumbNavigator(args: BreadcrumbNavigatorArgs) {
    const page = getPageInstance();
    if (!page) throw new Error('Browser not initialized. Use browser_init first.');

    const breadcrumbs = await page.evaluate((selector: string) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(el => ({
            text: el.textContent?.trim() || '',
            href: (el as HTMLAnchorElement).href || null
        }));
    }, args.breadcrumbSelector);

    let navigationResult = null;
    if (args.followLinks && breadcrumbs.length > 0) {
        // Navigate to parent (second to last)
        const parent = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;
        if (parent && parent.href) {
            await page.goto(parent.href);
            navigationResult = `Navigated to parent: ${parent.text} (${parent.href})`;
        }
    }

    return {
        content: [{
            type: 'text',
            text: JSON.stringify({ breadcrumbs, navigationResult }, null, 2)
        }]
    };
}
