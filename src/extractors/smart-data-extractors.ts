// Smart Data Extractors Module
// Table Scraper, List Extractor, JSON Extractor, Meta Tags, Schema.org Data

// Using any type for Page compatibility with brave-real-browser
type Page = any;

/**
 * Table Scraper - HTML tables से structured data extract करना
 */
export async function extractTables(page: Page, selector?: string): Promise<any[]> {
  return await page.evaluate((sel: any) => {
    const tables = sel ? 
      Array.from(document.querySelectorAll(sel)) : 
      Array.from(document.querySelectorAll('table'));
    
    return tables.map((table: any) => {
      const headers: string[] = [];
      const rows: any[] = [];
      
      // Extract headers
      const headerCells = table.querySelectorAll('thead th, thead td');
      headerCells.forEach((cell: any) => {
        headers.push(cell.textContent?.trim() || '');
      });
      
      // If no thead, try first row
      if (headers.length === 0) {
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          firstRow.querySelectorAll('th, td').forEach((cell: any) => {
            headers.push(cell.textContent?.trim() || '');
          });
        }
      }
      
      // Extract data rows
      const dataRows = table.querySelectorAll('tbody tr, tr');
      dataRows.forEach((row: any, idx: number) => {
        // Skip first row if it was used as header
        if (idx === 0 && headers.length > 0 && !table.querySelector('thead')) {
          return;
        }
        
        const cells = row.querySelectorAll('td, th');
        const rowData: any = {};
        
        cells.forEach((cell: any, cellIdx: number) => {
          const header = headers[cellIdx] || `column_${cellIdx}`;
          rowData[header] = cell.textContent?.trim() || '';
        });
        
        if (Object.keys(rowData).length > 0) {
          rows.push(rowData);
        }
      });
      
      return {
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length
      };
    });
  }, selector);
}

/**
 * List Extractor - Bullet lists, numbered lists से data निकालना
 */
export async function extractLists(page: Page, selector?: string): Promise<any> {
  return await page.evaluate((sel: any) => {
    const lists = sel ? 
      Array.from(document.querySelectorAll(sel)) : 
      Array.from(document.querySelectorAll('ul, ol'));
    
    return lists.map((list: any) => {
      const items: string[] = [];
      const listItems = list.querySelectorAll('li');
      
      listItems.forEach((item: any) => {
        items.push(item.textContent?.trim() || '');
      });
      
      return {
        type: list.tagName.toLowerCase(),
        itemCount: items.length,
        items
      };
    });
  }, selector);
}

/**
 * JSON Extractor - Pages में embedded JSON/API data खोजना
 */
export async function extractJSON(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const jsonData: any[] = [];
    
    // Extract from script tags with type="application/json" or type="application/ld+json"
    const scriptTags = document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]');
    scriptTags.forEach((script: any) => {
      try {
        const data = JSON.parse(script.textContent || '');
        jsonData.push({
          type: 'script_tag',
          dataType: script.getAttribute('type'),
          data
        });
      } catch (e) {
        // Invalid JSON, skip
      }
    });
    
    // Extract from data attributes
    const elementsWithData = document.querySelectorAll('[data-json], [data-config], [data-props]');
    elementsWithData.forEach((el: any) => {
      ['data-json', 'data-config', 'data-props'].forEach(attr => {
        const value = el.getAttribute(attr);
        if (value) {
          try {
            const data = JSON.parse(value);
            jsonData.push({
              type: 'data_attribute',
              attribute: attr,
              data
            });
          } catch (e) {
            // Invalid JSON, skip
          }
        }
      });
    });
    
    return jsonData;
  });
}

/**
 * Meta Tags Scraper - SEO meta tags, Open Graph data extract करना
 */
export async function extractMetaTags(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const metaData: any = {
      basic: {},
      openGraph: {},
      twitter: {},
      other: {}
    };
    
    // Extract all meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach((meta: any) => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      
      if (!name || !content) return;
      
      // Categorize meta tags
      if (name.startsWith('og:')) {
        metaData.openGraph[name] = content;
      } else if (name.startsWith('twitter:')) {
        metaData.twitter[name] = content;
      } else if (['description', 'keywords', 'author', 'viewport', 'robots'].includes(name)) {
        metaData.basic[name] = content;
      } else {
        metaData.other[name] = content;
      }
    });
    
    // Extract title
    metaData.basic.title = document.title;
    
    // Extract canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      metaData.basic.canonical = canonical.getAttribute('href');
    }
    
    return metaData;
  });
}

/**
 * Schema.org Data - Structured data (JSON-LD, Microdata) निकालना
 */
export async function extractSchemaOrg(page: Page): Promise<any[]> {
  return await page.evaluate(() => {
    const schemas: any[] = [];
    
    // Extract JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script: any) => {
      try {
        const data = JSON.parse(script.textContent || '');
        schemas.push({
          format: 'json-ld',
          data
        });
      } catch (e) {
        // Invalid JSON, skip
      }
    });
    
    // Extract Microdata
    const microdataItems = document.querySelectorAll('[itemscope]');
    microdataItems.forEach((item: any) => {
      const schema: any = {
        format: 'microdata',
        type: item.getAttribute('itemtype'),
        properties: {}
      };
      
      const props = item.querySelectorAll('[itemprop]');
      props.forEach((prop: any) => {
        const propName = prop.getAttribute('itemprop');
        const propValue = prop.getAttribute('content') || 
                         prop.getAttribute('href') || 
                         prop.textContent?.trim();
        
        if (propName && propValue) {
          schema.properties[propName] = propValue;
        }
      });
      
      schemas.push(schema);
    });
    
    return schemas;
  });
}
