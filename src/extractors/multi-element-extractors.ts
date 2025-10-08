// Multi-Element Extractors Module
// Batch Element Scraper, Nested Data Extraction, Attribute Harvester

// Using any type for Page compatibility with brave-real-browser
type Page = any;

/**
 * Batch Element Scraper - Multiple similar elements को एक साथ scrape करना
 */
export async function batchExtractElements(
  page: Page, 
  selector: string, 
  fields: { [key: string]: string }
): Promise<any[]> {
  return await page.evaluate((sel: any, fieldMap: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    
    return elements.map((element: any) => {
      const data: any = {};
      
      for (const [fieldName, fieldSelector] of Object.entries(fieldMap)) {
        const fieldElement = element.querySelector(fieldSelector);
        if (fieldElement) {
          data[fieldName] = fieldElement.textContent?.trim() || '';
        } else {
          data[fieldName] = null;
        }
      }
      
      return data;
    });
  }, selector, fields);
}

/**
 * Nested Data Extraction - Parent-child relationships maintain करते हुए data निकालना
 */
export async function extractNestedData(
  page: Page,
  parentSelector: string,
  childSelector: string,
  config?: {
    parentFields?: { [key: string]: string };
    childFields?: { [key: string]: string };
  }
): Promise<any[]> {
  return await page.evaluate((pSel: any, cSel: any, cfg: any) => {
    const parents = Array.from(document.querySelectorAll(pSel));
    
    return parents.map((parent: any) => {
      const parentData: any = {
        children: []
      };
      
      // Extract parent fields
      if (cfg?.parentFields) {
        for (const [fieldName, fieldSelector] of Object.entries(cfg.parentFields)) {
          const field = parent.querySelector(fieldSelector);
          parentData[fieldName] = field ? field.textContent?.trim() || '' : null;
        }
      } else {
        parentData.text = parent.textContent?.trim() || '';
      }
      
      // Extract children
      const children = Array.from(parent.querySelectorAll(cSel));
      parentData.children = children.map((child: any) => {
        const childData: any = {};
        
        if (cfg?.childFields) {
          for (const [fieldName, fieldSelector] of Object.entries(cfg.childFields)) {
            const field = child.querySelector(fieldSelector);
            childData[fieldName] = field ? field.textContent?.trim() || '' : null;
          }
        } else {
          childData.text = child.textContent?.trim() || '';
        }
        
        return childData;
      });
      
      parentData.childCount = parentData.children.length;
      return parentData;
    });
  }, parentSelector, childSelector, config);
}

/**
 * Attribute Harvester - सभी elements के attributes collect करना
 */
export async function harvestAttributes(
  page: Page,
  selector: string,
  attributes?: string[]
): Promise<any[]> {
  return await page.evaluate((sel: any, attrs: any) => {
    const elements = Array.from(document.querySelectorAll(sel));
    
    return elements.map((element: any) => {
      const data: any = {
        tagName: element.tagName.toLowerCase(),
        text: element.textContent?.trim() || ''
      };
      
      // If specific attributes requested
      if (attrs && attrs.length > 0) {
        attrs.forEach((attr: any) => {
          data[attr] = element.getAttribute(attr);
        });
      } else {
        // Harvest all attributes
        const allAttrs = element.attributes;
        for (let i = 0; i < allAttrs.length; i++) {
          const attr = allAttrs[i];
          data[attr.name] = attr.value;
        }
      }
      
      return data;
    });
  }, selector, attributes);
}

/**
 * Extract Multiple Products/Cards - E-commerce या listing pages के लिए
 */
export async function extractProducts(
  page: Page,
  containerSelector: string,
  productConfig: {
    name?: string;
    price?: string;
    image?: string;
    link?: string;
    rating?: string;
    description?: string;
  }
): Promise<any[]> {
  return await page.evaluate((container: any, config: any) => {
    const products = Array.from(document.querySelectorAll(container));
    
    return products.map((product: any) => {
      const data: any = {};
      
      // Extract name
      if (config.name) {
        const nameEl = product.querySelector(config.name);
        data.name = nameEl ? nameEl.textContent?.trim() : null;
      }
      
      // Extract price
      if (config.price) {
        const priceEl = product.querySelector(config.price);
        data.price = priceEl ? priceEl.textContent?.trim() : null;
      }
      
      // Extract image
      if (config.image) {
        const imgEl = product.querySelector(config.image);
        data.image = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src')) : null;
      }
      
      // Extract link
      if (config.link) {
        const linkEl = product.querySelector(config.link);
        data.link = linkEl ? linkEl.getAttribute('href') : null;
      }
      
      // Extract rating
      if (config.rating) {
        const ratingEl = product.querySelector(config.rating);
        data.rating = ratingEl ? ratingEl.textContent?.trim() : null;
      }
      
      // Extract description
      if (config.description) {
        const descEl = product.querySelector(config.description);
        data.description = descEl ? descEl.textContent?.trim() : null;
      }
      
      return data;
    });
  }, containerSelector, productConfig);
}

/**
 * Extract Articles/Posts - Blog या news sites के लिए
 */
export async function extractArticles(
  page: Page,
  articleSelector: string,
  config?: {
    title?: string;
    author?: string;
    date?: string;
    excerpt?: string;
    link?: string;
    image?: string;
    category?: string;
  }
): Promise<any[]> {
  return await page.evaluate((artSel: any, cfg: any) => {
    const articles = Array.from(document.querySelectorAll(artSel));
    
    return articles.map((article: any) => {
      const data: any = {};
      
      if (cfg?.title) {
        const el = article.querySelector(cfg.title);
        data.title = el ? el.textContent?.trim() : null;
      }
      
      if (cfg?.author) {
        const el = article.querySelector(cfg.author);
        data.author = el ? el.textContent?.trim() : null;
      }
      
      if (cfg?.date) {
        const el = article.querySelector(cfg.date);
        data.date = el ? el.textContent?.trim() : null;
      }
      
      if (cfg?.excerpt) {
        const el = article.querySelector(cfg.excerpt);
        data.excerpt = el ? el.textContent?.trim() : null;
      }
      
      if (cfg?.link) {
        const el = article.querySelector(cfg.link);
        data.link = el ? el.getAttribute('href') : null;
      }
      
      if (cfg?.image) {
        const el = article.querySelector(cfg.image);
        data.image = el ? (el.getAttribute('src') || el.getAttribute('data-src')) : null;
      }
      
      if (cfg?.category) {
        const el = article.querySelector(cfg.category);
        data.category = el ? el.textContent?.trim() : null;
      }
      
      return data;
    });
  }, articleSelector, config);
}
