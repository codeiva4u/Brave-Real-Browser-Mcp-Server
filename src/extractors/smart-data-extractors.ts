// Smart Data Extractors Module
import * as cheerio from 'cheerio';
import { Page } from 'puppeteer-core';

/**
 * Table Scraper - Extract structured data from HTML tables
 */
export async function scrapeTable(page: Page, selector?: string): Promise<Array<Record<string, string>>> {
  return await page.evaluate((tableSelector) => {
    const tables = tableSelector 
      ? document.querySelectorAll(tableSelector)
      : document.querySelectorAll('table');
    
    const results: Array<Record<string, string>> = [];
    
    tables.forEach((table) => {
      const headers: string[] = [];
      const headerCells = table.querySelectorAll('thead th, thead td');
      
      headerCells.forEach((cell) => {
        headers.push((cell as HTMLElement).innerText.trim());
      });
      
      // If no headers in thead, try first row
      if (headers.length === 0) {
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          firstRow.querySelectorAll('th, td').forEach((cell) => {
            headers.push((cell as HTMLElement).innerText.trim());
          });
        }
      }
      
      const rows = table.querySelectorAll('tbody tr, tr');
      rows.forEach((row, index) => {
        // Skip header row if it's in body
        if (index === 0 && headers.length === 0) return;
        
        const cells = row.querySelectorAll('td, th');
        if (cells.length === 0) return;
        
        const rowData: Record<string, string> = {};
        cells.forEach((cell, cellIndex) => {
          const header = headers[cellIndex] || `column_${cellIndex}`;
          rowData[header] = (cell as HTMLElement).innerText.trim();
        });
        
        results.push(rowData);
      });
    });
    
    return results;
  }, selector || null);
}

/**
 * List Extractor - Extract data from bullet lists and numbered lists
 */
export async function extractLists(page: Page, selector?: string): Promise<{
  unorderedLists: string[][];
  orderedLists: string[][];
}> {
  return await page.evaluate((listSelector) => {
    const scope = listSelector 
      ? document.querySelector(listSelector)
      : document;
    
    if (!scope) return { unorderedLists: [], orderedLists: [] };
    
    const unorderedLists: string[][] = [];
    const orderedLists: string[][] = [];
    
    // Extract unordered lists (ul)
    const ulElements = scope.querySelectorAll('ul');
    ulElements.forEach((ul) => {
      const items: string[] = [];
      ul.querySelectorAll('li').forEach((li) => {
        items.push((li as HTMLElement).innerText.trim());
      });
      if (items.length > 0) {
        unorderedLists.push(items);
      }
    });
    
    // Extract ordered lists (ol)
    const olElements = scope.querySelectorAll('ol');
    olElements.forEach((ol) => {
      const items: string[] = [];
      ol.querySelectorAll('li').forEach((li) => {
        items.push((li as HTMLElement).innerText.trim());
      });
      if (items.length > 0) {
        orderedLists.push(items);
      }
    });
    
    return { unorderedLists, orderedLists };
  }, selector || null);
}

/**
 * JSON Extractor - Find and extract embedded JSON data from pages
 */
export async function extractJSON(page: Page): Promise<Array<Record<string, any>>> {
  return await page.evaluate(() => {
    const jsonData: Array<Record<string, any>> = [];
    
    // Check script tags for JSON-LD
    const scripts = document.querySelectorAll('script[type="application/ld+json"], script[type="application/json"]');
    scripts.forEach((script) => {
      try {
        const content = script.textContent || '';
        const parsed = JSON.parse(content);
        jsonData.push(parsed);
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    // Check for inline JSON in data attributes
    const elementsWithData = document.querySelectorAll('[data-json], [data-config], [data-state]');
    elementsWithData.forEach((element) => {
      const dataAttrs = ['data-json', 'data-config', 'data-state', 'data-props'];
      dataAttrs.forEach((attr) => {
        const value = element.getAttribute(attr);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            jsonData.push(parsed);
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });
    });
    
    // Check window object for common JSON properties
    const windowProps = ['__INITIAL_STATE__', '__NEXT_DATA__', '__PRELOADED_STATE__', '__APOLLO_STATE__'];
    windowProps.forEach((prop) => {
      if ((window as any)[prop]) {
        try {
          jsonData.push((window as any)[prop]);
        } catch (e) {
          // Skip if not accessible
        }
      }
    });
    
    return jsonData;
  });
}

/**
 * Meta Tags Scraper - Extract SEO meta tags and Open Graph data
 */
export async function scrapeMetaTags(page: Page): Promise<{
  title: string;
  description: string;
  keywords: string;
  author: string;
  openGraph: Record<string, string>;
  twitter: Record<string, string>;
  other: Record<string, string>;
}> {
  return await page.evaluate(() => {
    const metaTags: any = {
      title: document.title || '',
      description: '',
      keywords: '',
      author: '',
      openGraph: {},
      twitter: {},
      other: {}
    };
    
    // Standard meta tags
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      metaTags.description = descriptionTag.getAttribute('content') || '';
    }
    
    const keywordsTag = document.querySelector('meta[name="keywords"]');
    if (keywordsTag) {
      metaTags.keywords = keywordsTag.getAttribute('content') || '';
    }
    
    const authorTag = document.querySelector('meta[name="author"]');
    if (authorTag) {
      metaTags.author = authorTag.getAttribute('content') || '';
    }
    
    // Open Graph tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    ogTags.forEach((tag) => {
      const property = tag.getAttribute('property')?.replace('og:', '') || '';
      const content = tag.getAttribute('content') || '';
      if (property) {
        metaTags.openGraph[property] = content;
      }
    });
    
    // Twitter Card tags
    const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
    twitterTags.forEach((tag) => {
      const name = tag.getAttribute('name')?.replace('twitter:', '') || '';
      const content = tag.getAttribute('content') || '';
      if (name) {
        metaTags.twitter[name] = content;
      }
    });
    
    // Other meta tags
    const allMetaTags = document.querySelectorAll('meta');
    allMetaTags.forEach((tag) => {
      const name = tag.getAttribute('name');
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');
      
      if (content && name && !name.startsWith('twitter:') && !name.startsWith('og:')) {
        metaTags.other[name] = content;
      } else if (content && property && !property.startsWith('og:')) {
        metaTags.other[property] = content;
      }
    });
    
    return metaTags;
  });
}

/**
 * Schema.org Data Extractor - Extract structured data (JSON-LD, Microdata)
 */
export async function extractSchemaData(page: Page): Promise<Array<Record<string, any>>> {
  return await page.evaluate(() => {
    const schemaData: Array<Record<string, any>> = [];
    
    // Extract JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script) => {
      try {
        const content = script.textContent || '';
        const parsed = JSON.parse(content);
        
        // Handle both single objects and arrays
        if (Array.isArray(parsed)) {
          schemaData.push(...parsed);
        } else {
          schemaData.push(parsed);
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });
    
    // Extract Microdata
    const itemScopes = document.querySelectorAll('[itemscope]');
    itemScopes.forEach((element) => {
      const item: Record<string, any> = {};
      const itemType = element.getAttribute('itemtype');
      if (itemType) {
        item['@type'] = itemType.split('/').pop();
      }
      
      const properties = element.querySelectorAll('[itemprop]');
      properties.forEach((prop) => {
        const propName = prop.getAttribute('itemprop') || '';
        let propValue = '';
        
        // Get value based on element type
        if (prop.tagName === 'META') {
          propValue = prop.getAttribute('content') || '';
        } else if (prop.tagName === 'A' || prop.tagName === 'LINK') {
          propValue = prop.getAttribute('href') || '';
        } else if (prop.tagName === 'IMG') {
          propValue = prop.getAttribute('src') || '';
        } else {
          propValue = (prop as HTMLElement).innerText.trim();
        }
        
        if (propName && propValue) {
          item[propName] = propValue;
        }
      });
      
      if (Object.keys(item).length > 1) {
        schemaData.push(item);
      }
    });
    
    return schemaData;
  });
}

/**
 * Combined Smart Extractor - Extract all data types at once
 */
export async function extractAllSmartData(page: Page, options?: {
  includeTables?: boolean;
  includeLists?: boolean;
  includeJSON?: boolean;
  includeMeta?: boolean;
  includeSchema?: boolean;
}): Promise<{
  tables?: Array<Record<string, string>>;
  lists?: { unorderedLists: string[][]; orderedLists: string[][] };
  json?: Array<Record<string, any>>;
  meta?: any;
  schema?: Array<Record<string, any>>;
}> {
  const opts = {
    includeTables: true,
    includeLists: true,
    includeJSON: true,
    includeMeta: true,
    includeSchema: true,
    ...options
  };
  
  const result: any = {};
  
  if (opts.includeTables) {
    result.tables = await scrapeTable(page);
  }
  
  if (opts.includeLists) {
    result.lists = await extractLists(page);
  }
  
  if (opts.includeJSON) {
    result.json = await extractJSON(page);
  }
  
  if (opts.includeMeta) {
    result.meta = await scrapeMetaTags(page);
  }
  
  if (opts.includeSchema) {
    result.schema = await extractSchemaData(page);
  }
  
  return result;
}
