// Pagination & Navigation Tools
// Auto Pagination, Infinite Scroll, Multi-page Scraper, Sitemap Parser

// Using any type for Page compatibility with brave-real-browser
type Page = any;

/**
 * Auto Pagination - "Next" button automatically detect और click करना
 */
export async function autoPaginate(
  page: Page,
  options?: {
    nextButtonSelector?: string;
    maxPages?: number;
    waitTime?: number;
  }
): Promise<{ success: boolean; pagesVisited: number; currentUrl: string }> {
  const maxPages = options?.maxPages || 10;
  const waitTime = options?.waitTime || 2000;
  let pagesVisited = 0;
  
  for (let i = 0; i < maxPages; i++) {
    try {
      // Find next button
      const nextButton = options?.nextButtonSelector ||
        await page.evaluate(() => {
          // Common next button patterns
          const patterns = [
            'a:contains("Next")', 'button:contains("Next")',
            'a:contains("→")', '.next', '.pagination-next',
            '[aria-label*="next" i]', '[rel="next"]'
          ];
          
          // Try to find next button
          const selectors = [
            'a[rel="next"]',
            'button[aria-label*="next" i]',
            '.next:not(.disabled)',
            '.pagination-next:not(.disabled)',
            'a:has-text("Next")',
            'button:has-text("Next")'
          ];
          
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && !el.classList.contains('disabled')) {
              return sel;
            }
          }
          return null;
        });
      
      if (!nextButton) {
        console.log('No next button found');
        break;
      }
      
      // Click next button
      await page.click(nextButton as string);
      await page.waitForTimeout(waitTime);
      pagesVisited++;
    } catch (error) {
      console.error('Pagination error:', error);
      break;
    }
  }
  
  return {
    success: true,
    pagesVisited,
    currentUrl: page.url()
  };
}

/**
 * Infinite Scroll Handler - Lazy-loading pages के लिए auto-scroll
 */
export async function handleInfiniteScroll(
  page: Page,
  options?: {
    maxScrolls?: number;
    scrollDelay?: number;
    scrollDistance?: number;
  }
): Promise<{ scrollCount: number; finalHeight: number }> {
  const maxScrolls = options?.maxScrolls || 20;
  const scrollDelay = options?.scrollDelay || 1000;
  const scrollDistance = options?.scrollDistance || 500;
  
  let scrollCount = 0;
  let previousHeight = 0;
  
  for (let i = 0; i < maxScrolls; i++) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Check if we've reached the bottom
    if (currentHeight === previousHeight) {
      break;
    }
    
    // Scroll down
    await page.evaluate((distance: any) => {
      window.scrollBy(0, distance);
    }, scrollDistance);
    
    await page.waitForTimeout(scrollDelay);
    previousHeight = currentHeight;
    scrollCount++;
  }
  
  return {
    scrollCount,
    finalHeight: await page.evaluate(() => document.body.scrollHeight)
  };
}

/**
 * Multi-page Scraper - Multiple pages से data collect करना
 */
export async function scrapeMultiplePages(
  page: Page,
  urls: string[],
  extractorFn: (page: Page) => Promise<any>,
  options?: {
    delay?: number;
    continueOnError?: boolean;
  }
): Promise<any[]> {
  const results: any[] = [];
  const delay = options?.delay || 1000;
  const continueOnError = options?.continueOnError !== false;
  
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(delay);
      
      const data = await extractorFn(page);
      results.push({
        url,
        success: true,
        data
      });
    } catch (error: any) {
      results.push({
        url,
        success: false,
        error: error.message
      });
      
      if (!continueOnError) {
        break;
      }
    }
  }
  
  return results;
}

/**
 * Sitemap Parser - sitemap.xml से URLs extract करना
 */
export async function parseSitemap(page: Page, sitemapUrl: string): Promise<string[]> {
  await page.goto(sitemapUrl, { waitUntil: 'domcontentloaded' });
  
  return await page.evaluate(() => {
    const urls: string[] = [];
    
    // Parse XML sitemap
    const urlElements = document.querySelectorAll('url loc, sitemap loc');
    urlElements.forEach((el: any) => {
      const url = el.textContent?.trim();
      if (url) {
        urls.push(url);
      }
    });
    
    return urls;
  });
}

/**
 * Breadcrumb Navigator - Breadcrumb links extract करना
 */
export async function extractBreadcrumbs(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const breadcrumbs: any[] = [];
    
    // Common breadcrumb selectors
    const selectors = [
      '[itemtype*="BreadcrumbList"]',
      '.breadcrumb',
      '.breadcrumbs',
      '[aria-label*="breadcrumb" i]',
      'nav[class*="breadcrumb"]'
    ];
    
    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        const links = container.querySelectorAll('a');
        links.forEach((link: any, index: number) => {
          breadcrumbs.push({
            position: index + 1,
            text: link.textContent?.trim() || '',
            href: link.href || ''
          });
        });
        
        if (breadcrumbs.length > 0) {
          break;
        }
      }
    }
    
    return breadcrumbs;
  });
}

/**
 * Page Number Extractor - Pagination information निकालना
 */
export async function extractPaginationInfo(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const pagination: any = {
      currentPage: null,
      totalPages: null,
      hasNext: false,
      hasPrevious: false,
      pages: []
    };
    
    // Find pagination container
    const paginationContainer = document.querySelector('.pagination, .pager, [role="navigation"][aria-label*="pagination" i]');
    
    if (paginationContainer) {
      // Find current page
      const current = paginationContainer.querySelector('.active, .current, [aria-current="page"]');
      if (current) {
        pagination.currentPage = parseInt(current.textContent?.trim() || '0');
      }
      
      // Find all page links
      const pageLinks = paginationContainer.querySelectorAll('a');
      pageLinks.forEach((link: any) => {
        const text = link.textContent?.trim();
        const pageNum = parseInt(text);
        
        if (!isNaN(pageNum)) {
          pagination.pages.push({
            page: pageNum,
            href: link.href,
            isCurrent: link.classList.contains('active') || link.classList.contains('current')
          });
        }
        
        // Check for next/previous
        if (text?.toLowerCase().includes('next') || link.rel === 'next') {
          pagination.hasNext = true;
        }
        if (text?.toLowerCase().includes('prev') || link.rel === 'prev') {
          pagination.hasPrevious = true;
        }
      });
      
      // Determine total pages
      if (pagination.pages.length > 0) {
        pagination.totalPages = Math.max(...pagination.pages.map((p: any) => p.page));
      }
    }
    
    return pagination;
  });
}
