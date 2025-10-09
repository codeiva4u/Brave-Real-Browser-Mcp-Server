// Pagination & Navigation Utilities
import { Page } from 'puppeteer-core';
import axios from 'axios';
import { parseString } from 'xml2js';

/**
 * Auto Pagination - Automatically detect and click next button
 */
export async function autoPaginate(
  page: Page,
  options?: {
    maxPages?: number;
    nextButtonSelector?: string;
    waitTime?: number;
    stopCondition?: (page: Page) => Promise<boolean>;
  }
): Promise<Array<string>> {
  const opts = {
    maxPages: 10,
    nextButtonSelector: 'a[rel="next"], button:contains("Next"), a:contains("Next"), .pagination .next',
    waitTime: 2000,
    ...options
  };
  
  const visitedUrls: string[] = [page.url()];
  let currentPage = 1;
  
  while (currentPage < opts.maxPages) {
    // Check stop condition
    if (opts.stopCondition && await opts.stopCondition(page)) {
      break;
    }
    
    // Try to find next button
    const nextButton = await page.$(opts.nextButtonSelector).catch(() => null);
    if (!nextButton) {
      // Try common selectors
      const commonSelectors = [
        'a[rel="next"]',
        'button[aria-label*="next" i]',
        'a[aria-label*="next" i]',
        '.pagination a.next',
        '.pager a.next',
        'a.nextpostslink'
      ];
      
      let found = false;
      for (const selector of commonSelectors) {
        const btn = await page.$(selector).catch(() => null);
        if (btn) {
          await btn.click();
          found = true;
          break;
        }
      }
      
      if (!found) break;
    } else {
      await nextButton.click();
    }
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, opts.waitTime));
    
    const newUrl = page.url();
    if (visitedUrls.includes(newUrl)) {
      break; // Circular pagination
    }
    
    visitedUrls.push(newUrl);
    currentPage++;
  }
  
  return visitedUrls;
}

/**
 * Infinite Scroll Handler - Auto-scroll for lazy-loading content
 */
export async function handleInfiniteScroll(
  page: Page,
  options?: {
    maxScrolls?: number;
    scrollDelay?: number;
    scrollDistance?: number;
    stopWhenNoNewContent?: boolean;
  }
): Promise<{
  scrollCount: number;
  finalHeight: number;
}> {
  const opts = {
    maxScrolls: 20,
    scrollDelay: 1000,
    scrollDistance: 500,
    stopWhenNoNewContent: true,
    ...options
  };
  
  let scrollCount = 0;
  let previousHeight = 0;
  let unchangedCount = 0;
  
  while (scrollCount < opts.maxScrolls) {
    // Get current scroll height
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Scroll down
    await page.evaluate((distance) => {
      window.scrollBy(0, distance);
    }, opts.scrollDistance);
    
    // Wait for new content
    await new Promise(resolve => setTimeout(resolve, opts.scrollDelay));
    
    // Check if height changed
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    
    if (opts.stopWhenNoNewContent && newHeight === currentHeight) {
      unchangedCount++;
      if (unchangedCount >= 3) {
        break; // No new content after 3 attempts
      }
    } else {
      unchangedCount = 0;
    }
    
    previousHeight = newHeight;
    scrollCount++;
  }
  
  return {
    scrollCount,
    finalHeight: previousHeight
  };
}

/**
 * Multi-page Scraper - Scrape data from multiple pages
 */
export async function scrapeMultiplePages<T>(
  page: Page,
  urls: string[],
  scrapeFn: (page: Page) => Promise<T>,
  options?: {
    delay?: number;
    retries?: number;
  }
): Promise<Array<{ url: string; data: T | null; error: string | null }>> {
  const opts = {
    delay: 1000,
    retries: 3,
    ...options
  };
  
  const results: Array<{ url: string; data: T | null; error: string | null }> = [];
  
  for (const url of urls) {
    let data: T | null = null;
    let error: string | null = null;
    let attempts = 0;
    
    while (attempts < opts.retries && data === null && error === null) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        data = await scrapeFn(page);
        attempts = opts.retries; // Success, exit retry loop
      } catch (e) {
        attempts++;
        error = e instanceof Error ? e.message : 'Unknown error';
        if (attempts < opts.retries) {
          await new Promise(resolve => setTimeout(resolve, opts.delay));
        }
      }
    }
    
    results.push({ url, data, error });
    
    // Delay between pages
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, opts.delay));
    }
  }
  
  return results;
}

/**
 * Sitemap Parser - Extract URLs from sitemap.xml
 */
export async function parseSitemap(sitemapUrl: string): Promise<{
  urls: string[];
  lastMod: Record<string, string>;
  priority: Record<string, number>;
}> {
  try {
    const response = await axios.get(sitemapUrl);
    const xmlData = response.data;
    
    return new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        const urls: string[] = [];
        const lastMod: Record<string, string> = {};
        const priority: Record<string, number> = {};
        
        if (result.urlset && result.urlset.url) {
          result.urlset.url.forEach((urlEntry: any) => {
            const loc = urlEntry.loc[0];
            urls.push(loc);
            
            if (urlEntry.lastmod) {
              lastMod[loc] = urlEntry.lastmod[0];
            }
            
            if (urlEntry.priority) {
              priority[loc] = parseFloat(urlEntry.priority[0]);
            }
          });
        }
        
        // Handle sitemap index
        if (result.sitemapindex && result.sitemapindex.sitemap) {
          result.sitemapindex.sitemap.forEach((sitemapEntry: any) => {
            const loc = sitemapEntry.loc[0];
            urls.push(loc);
          });
        }
        
        resolve({ urls, lastMod, priority });
      });
    });
  } catch (error) {
    throw new Error(`Failed to parse sitemap: ${error}`);
  }
}

/**
 * Breadcrumb Navigator - Extract breadcrumb navigation structure
 */
export async function extractBreadcrumbs(page: Page): Promise<Array<{
  text: string;
  url: string;
  position: number;
}>> {
  return await page.evaluate(() => {
    const breadcrumbs: Array<any> = [];
    
    // Try common breadcrumb selectors
    const selectors = [
      'nav[aria-label="breadcrumb"]',
      '.breadcrumb',
      '.breadcrumbs',
      '[itemtype="https://schema.org/BreadcrumbList"]'
    ];
    
    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        const links = container.querySelectorAll('a');
        links.forEach((link, index) => {
          breadcrumbs.push({
            text: (link as HTMLElement).innerText.trim(),
            url: (link as HTMLAnchorElement).href,
            position: index + 1
          });
        });
        
        if (breadcrumbs.length > 0) break;
      }
    }
    
    return breadcrumbs;
  });
}

/**
 * Page Number Detector - Detect current page number and total pages
 */
export async function detectPagination(page: Page): Promise<{
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}> {
  return await page.evaluate(() => {
    let currentPage = 1;
    let totalPages = 1;
    let hasNext = false;
    let hasPrevious = false;
    
    // Look for pagination container
    const paginationSelectors = ['.pagination', '.pager', '[role="navigation"]'];
    let paginationContainer: Element | null = null;
    
    for (const selector of paginationSelectors) {
      paginationContainer = document.querySelector(selector);
      if (paginationContainer) break;
    }
    
    if (paginationContainer) {
      // Find current page
      const current = paginationContainer.querySelector('.active, .current, [aria-current="page"]');
      if (current) {
        const pageText = (current as HTMLElement).innerText.trim();
        currentPage = parseInt(pageText) || 1;
      }
      
      // Find total pages
      const allPages = paginationContainer.querySelectorAll('a, button');
      allPages.forEach((el) => {
        const text = (el as HTMLElement).innerText.trim();
        const pageNum = parseInt(text);
        if (!isNaN(pageNum) && pageNum > totalPages) {
          totalPages = pageNum;
        }
      });
      
      // Check for next/previous
      hasNext = !!paginationContainer.querySelector('[rel="next"], .next:not(.disabled)');
      hasPrevious = !!paginationContainer.querySelector('[rel="prev"], .previous:not(.disabled)');
    }
    
    return { currentPage, totalPages, hasNext, hasPrevious };
  });
}
