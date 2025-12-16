// Pagination & Navigation Tools
// Auto pagination, infinite scroll, multi-page scraping, sitemap parser
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling, sleep } from '../system-utils.js';


// Type definitions
export interface PaginationResult {
  pages: number;
  data: any[];
  hasMore: boolean;
}





// Multi-page Scraper Arguments
export interface MultiPageScraperArgs {
  urls: string[];
  dataSelector: string;
  waitBetweenPages?: number;
}

/**
 * Multiple pages से data collect और merge करता है
 */
export async function handleMultiPageScraper(args: MultiPageScraperArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('multi_page_scraper', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const urls = args.urls;
    const dataSelector = args.dataSelector;
    const waitBetweenPages = args.waitBetweenPages || 1000;

    const allData: any[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await sleep(waitBetweenPages);

        const pageData = await page.evaluate((selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map((el) => ({
            text: el.textContent?.trim() || '',
            html: el.innerHTML,
          }));
        }, dataSelector);

        allData.push({
          url,
          pageIndex: i,
          itemCount: pageData.length,
          data: pageData,
        });
      } catch (error) {
        allData.push({
          url,
          pageIndex: i,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Scraped ${urls.length} pages\n\n${JSON.stringify(allData, null, 2)}`,
        },
      ],
    };
  }, 'Failed to scrape multiple pages');
}



// Breadcrumb Navigator Arguments
export interface BreadcrumbNavigatorArgs {
  breadcrumbSelector?: string;
  followLinks?: boolean;
}

/**
 * Site structure follow करके pages scrape करता है
 */
export async function handleBreadcrumbNavigator(args: BreadcrumbNavigatorArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('breadcrumb_navigator', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const breadcrumbSelector = args.breadcrumbSelector || '.breadcrumb, nav[aria-label="breadcrumb"], .breadcrumbs';
    const followLinks = args.followLinks || false;

    const breadcrumbData = await page.evaluate((selector) => {
      const breadcrumbs = document.querySelectorAll(selector);
      const results: any[] = [];

      breadcrumbs.forEach((breadcrumb) => {
        const links = breadcrumb.querySelectorAll('a');
        const items: any[] = [];

        links.forEach((link: any, index) => {
          items.push({
            text: link.textContent?.trim() || '',
            href: link.href,
            level: index,
          });
        });

        if (items.length > 0) {
          results.push({
            path: items.map((i) => i.text).join(' > '),
            links: items,
          });
        }
      });

      return results;
    }, breadcrumbSelector);

    if (breadcrumbData.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: '❌ No breadcrumbs found on page',
          },
        ],
      };
    }

    let additionalData = '';
    if (followLinks && breadcrumbData[0]?.links) {
      additionalData = `\n\n📌 To scrape breadcrumb pages, use multi_page_scraper with URLs: ${JSON.stringify(breadcrumbData[0].links.map((l: any) => l.href))}`;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Found ${breadcrumbData.length} breadcrumb trail(s)\n\n${JSON.stringify(breadcrumbData, null, 2)}${additionalData}`,
        },
      ],
    };
  }, 'Failed to navigate breadcrumbs');
}
