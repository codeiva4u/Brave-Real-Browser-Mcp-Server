// Pagination & Navigation Tools
// Auto pagination, infinite scroll, multi-page scraping, sitemap parser
// @ts-nocheck

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';
import * as xml2js from 'xml2js';

// Type definitions
export interface PaginationResult {
  pages: number;
  data: any[];
  hasMore: boolean;
}

// Auto Pagination Arguments
export interface AutoPaginationArgs {
  nextButtonSelector?: string;
  maxPages?: number;
  dataSelector?: string;
  waitBetweenPages?: number;
}

/**
 * "Next" button automatically detect और click करके सभी pages से data collect करता है
 */
export async function handleAutoPagination(args: AutoPaginationArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('auto_pagination', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const nextButtonSelector = args.nextButtonSelector || 'a[rel="next"], button:contains("Next"), .next, .pagination-next';
    const maxPages = args.maxPages || 10;
    const dataSelector = args.dataSelector;
    const waitBetweenPages = args.waitBetweenPages || 1000;

    const allData: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (currentPage <= maxPages && hasMore) {
      // Extract data from current page
      if (dataSelector) {
        const pageData = await page.evaluate((selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map((el) => ({
            text: el.textContent?.trim() || '',
            html: el.innerHTML,
          }));
        }, dataSelector);
        allData.push(...pageData);
      }

      // Check for next button
      const nextButton = await page.$(nextButtonSelector);
      if (!nextButton) {
        hasMore = false;
        break;
      }

      // Check if button is disabled
      const isDisabled = await page.evaluate((selector) => {
        const btn = document.querySelector(selector);
        return btn?.hasAttribute('disabled') || btn?.classList.contains('disabled');
      }, nextButtonSelector);

      if (isDisabled) {
        hasMore = false;
        break;
      }

      // Click next button
      await nextButton.click();
      await page.waitForTimeout(waitBetweenPages);
      
      // Wait for navigation or content load
      try {
        await page.waitForNavigation({ timeout: 5000, waitUntil: 'domcontentloaded' });
      } catch (e) {
        // No navigation occurred, content loaded dynamically
        await page.waitForTimeout(1000);
      }

      currentPage++;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Auto-paginated through ${currentPage} pages\n\nCollected ${allData.length} items\n\n${JSON.stringify(allData.slice(0, 10), null, 2)}${allData.length > 10 ? '\n\n... (showing first 10 items)' : ''}`,
        },
      ],
    };
  }, 'Failed to auto-paginate');
}

// Infinite Scroll Handler Arguments
export interface InfiniteScrollArgs {
  maxScrolls?: number;
  scrollDelay?: number;
  dataSelector?: string;
}

/**
 * Lazy-loading pages के लिए auto-scroll करता है
 */
export async function handleInfiniteScroll(args: InfiniteScrollArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('infinite_scroll', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const maxScrolls = args.maxScrolls || 10;
    const scrollDelay = args.scrollDelay || 1000;
    const dataSelector = args.dataSelector;

    const allData: any[] = [];
    let scrollCount = 0;
    let previousHeight = 0;

    while (scrollCount < maxScrolls) {
      // Get current scroll height
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      // If height hasn't changed, we've reached the end
      if (currentHeight === previousHeight && scrollCount > 0) {
        break;
      }

      previousHeight = currentHeight;

      // Collect data if selector provided
      if (dataSelector) {
        const pageData = await page.evaluate((selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map((el, idx) => ({
            index: idx,
            text: el.textContent?.trim() || '',
          }));
        }, dataSelector);
        
        // Add only new items (avoid duplicates)
        const newItems = pageData.filter(
          (item) => !allData.some((existing) => existing.text === item.text)
        );
        allData.push(...newItems);
      }

      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for new content to load
      await page.waitForTimeout(scrollDelay);

      scrollCount++;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Infinite scroll completed (${scrollCount} scrolls)\n\nCollected ${allData.length} items\n\n${JSON.stringify(allData.slice(0, 10), null, 2)}${allData.length > 10 ? '\n\n... (showing first 10 items)' : ''}`,
        },
      ],
    };
  }, 'Failed to handle infinite scroll');
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
        await page.waitForTimeout(waitBetweenPages);

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

// Sitemap Parser Arguments
export interface SitemapParserArgs {
  sitemapUrl?: string;
  maxUrls?: number;
  filterPattern?: string;
}

/**
 * sitemap.xml से URLs automatically extract करता है
 */
export async function handleSitemapParser(args: SitemapParserArgs) {
  return await withErrorHandling(async () => {
    validateWorkflow('sitemap_parser', {
      requireBrowser: true,
      requirePage: true,
    });

    const page = getCurrentPage();
    const currentUrl = page.url();
    const baseUrl = new URL(currentUrl).origin;
    const sitemapUrl = args.sitemapUrl || `${baseUrl}/sitemap.xml`;
    const maxUrls = args.maxUrls || 100;
    const filterPattern = args.filterPattern;

    // Fetch sitemap
    await page.goto(sitemapUrl, { waitUntil: 'domcontentloaded' });

    // Get sitemap XML content
    const sitemapContent = await page.evaluate(() => {
      return document.body.textContent || document.documentElement.innerHTML;
    });

    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(sitemapContent);

    const urls: any[] = [];

    // Extract URLs from sitemap
    if (result.urlset && result.urlset.url) {
      for (const urlEntry of result.urlset.url) {
        if (urls.length >= maxUrls) break;

        const loc = urlEntry.loc?.[0];
        if (!loc) continue;

        // Apply filter if specified
        if (filterPattern && !loc.includes(filterPattern)) {
          continue;
        }

        urls.push({
          url: loc,
          lastmod: urlEntry.lastmod?.[0],
          changefreq: urlEntry.changefreq?.[0],
          priority: urlEntry.priority?.[0],
        });
      }
    }
    // Handle sitemap index
    else if (result.sitemapindex && result.sitemapindex.sitemap) {
      for (const sitemapEntry of result.sitemapindex.sitemap) {
        const loc = sitemapEntry.loc?.[0];
        if (loc) {
          urls.push({
            url: loc,
            type: 'sitemap',
            lastmod: sitemapEntry.lastmod?.[0],
          });
        }
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Parsed sitemap: ${urls.length} URLs found\n\n${JSON.stringify(urls, null, 2)}`,
        },
      ],
    };
  }, 'Failed to parse sitemap');
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
