// Multi-Element Extractors Module
import { Page } from 'puppeteer-core';

/**
 * Batch Element Scraper - Extract multiple similar elements (products, articles, etc.)
 */
export async function batchScrapeElements(
  page: Page,
  containerSelector: string,
  fields: Record<string, string>
): Promise<Array<Record<string, any>>> {
  return await page.evaluate((container, fieldMap) => {
    const containers = document.querySelectorAll(container);
    const results: Array<Record<string, any>> = [];
    
    containers.forEach((containerEl) => {
      const item: Record<string, any> = {};
      
      Object.entries(fieldMap).forEach(([fieldName, selector]) => {
        const element = containerEl.querySelector(selector);
        if (element) {
          // Extract different types of data based on element type
          if (element.tagName === 'IMG') {
            item[fieldName] = {
              src: (element as HTMLImageElement).src,
              alt: (element as HTMLImageElement).alt,
              title: element.getAttribute('title') || ''
            };
          } else if (element.tagName === 'A') {
            item[fieldName] = {
              text: (element as HTMLElement).innerText.trim(),
              href: (element as HTMLAnchorElement).href
            };
          } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            item[fieldName] = (element as HTMLInputElement).value;
          } else {
            item[fieldName] = (element as HTMLElement).innerText.trim();
          }
        } else {
          item[fieldName] = null;
        }
      });
      
      // Only add if at least some fields were found
      const hasData = Object.values(item).some(v => v !== null);
      if (hasData) {
        results.push(item);
      }
    });
    
    return results;
  }, containerSelector, fields);
}

/**
 * Nested Data Extraction - Extract hierarchical data maintaining parent-child relationships
 */
export async function extractNestedData(
  page: Page,
  parentSelector: string,
  childSelector: string,
  options?: {
    parentFields?: Record<string, string>;
    childFields?: Record<string, string>;
    maxDepth?: number;
  }
): Promise<Array<{
  parent: Record<string, any>;
  children: Array<Record<string, any>>;
}>> {
  const opts = {
    parentFields: {},
    childFields: {},
    maxDepth: 3,
    ...options
  };
  
  return await page.evaluate(
    (parentSel, childSel, config) => {
      const results: Array<any> = [];
      const parents = document.querySelectorAll(parentSel);
      
      parents.forEach((parentEl) => {
        const parentData: Record<string, any> = {};
        
        // Extract parent fields
        if (Object.keys(config.parentFields).length > 0) {
          Object.entries(config.parentFields).forEach(([fieldName, selector]) => {
            const element = parentEl.querySelector(selector as string);
            if (element) {
              parentData[fieldName] = (element as HTMLElement).innerText.trim();
            }
          });
        } else {
          // Default: extract text content
          parentData.content = (parentEl as HTMLElement).innerText.trim();
        }
        
        // Extract children
        const children: Array<Record<string, any>> = [];
        const childElements = parentEl.querySelectorAll(childSel);
        
        childElements.forEach((childEl) => {
          const childData: Record<string, any> = {};
          
          if (Object.keys(config.childFields).length > 0) {
            Object.entries(config.childFields).forEach(([fieldName, selector]) => {
              const element = childEl.querySelector(selector as string);
              if (element) {
                childData[fieldName] = (element as HTMLElement).innerText.trim();
              }
            });
          } else {
            // Default: extract text content
            childData.content = (childEl as HTMLElement).innerText.trim();
          }
          
          if (Object.keys(childData).length > 0) {
            children.push(childData);
          }
        });
        
        results.push({
          parent: parentData,
          children: children
        });
      });
      
      return results;
    },
    parentSelector,
    childSelector,
    opts
  );
}

/**
 * Attribute Harvester - Collect all attributes from elements
 */
export async function harvestAttributes(
  page: Page,
  selector: string,
  attributes?: string[]
): Promise<Array<Record<string, string>>> {
  return await page.evaluate((sel, attrs) => {
    const elements = document.querySelectorAll(sel);
    const results: Array<Record<string, string>> = [];
    
    elements.forEach((element) => {
      const attrData: Record<string, string> = {};
      
      if (attrs && attrs.length > 0) {
        // Collect specific attributes
        attrs.forEach((attrName) => {
          const value = element.getAttribute(attrName);
          if (value !== null) {
            attrData[attrName] = value;
          }
        });
      } else {
        // Collect all attributes
        Array.from(element.attributes).forEach((attr) => {
          attrData[attr.name] = attr.value;
        });
      }
      
      // Add element tag name and text content
      attrData._tagName = element.tagName.toLowerCase();
      attrData._textContent = (element as HTMLElement).innerText?.trim() || '';
      
      results.push(attrData);
    });
    
    return results;
  }, selector, attributes || null);
}

/**
 * Deep Element Scraper - Extract elements with all their properties and computed styles
 */
export async function deepScrapeElements(
  page: Page,
  selector: string,
  options?: {
    includeStyles?: boolean;
    includePosition?: boolean;
    includeVisibility?: boolean;
  }
): Promise<Array<Record<string, any>>> {
  const opts = {
    includeStyles: false,
    includePosition: true,
    includeVisibility: true,
    ...options
  };
  
  return await page.evaluate((sel, config) => {
    const elements = document.querySelectorAll(sel);
    const results: Array<Record<string, any>> = [];
    
    elements.forEach((element) => {
      const data: Record<string, any> = {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: Array.from(element.classList),
        textContent: (element as HTMLElement).innerText?.trim() || '',
        attributes: {}
      };
      
      // Collect all attributes
      Array.from(element.attributes).forEach((attr) => {
        data.attributes[attr.name] = attr.value;
      });
      
      // Get position and dimensions
      if (config.includePosition) {
        const rect = element.getBoundingClientRect();
        data.position = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        };
      }
      
      // Get visibility information
      if (config.includeVisibility) {
        const styles = window.getComputedStyle(element);
        data.visibility = {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          isVisible: styles.display !== 'none' && 
                     styles.visibility !== 'hidden' && 
                     parseFloat(styles.opacity) > 0
        };
      }
      
      // Get computed styles
      if (config.includeStyles) {
        const styles = window.getComputedStyle(element);
        data.styles = {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
          fontFamily: styles.fontFamily,
          fontWeight: styles.fontWeight,
          textAlign: styles.textAlign,
          padding: styles.padding,
          margin: styles.margin,
          border: styles.border
        };
      }
      
      results.push(data);
    });
    
    return results;
  }, selector, opts);
}

/**
 * Smart Product Scraper - Specialized scraper for e-commerce products
 */
export async function scrapeProducts(
  page: Page,
  containerSelector: string,
  customFields?: Record<string, string>
): Promise<Array<Record<string, any>>> {
  const defaultFields = {
    title: '[class*="title"], [class*="name"], h2, h3',
    price: '[class*="price"], [data-price]',
    image: 'img',
    link: 'a',
    rating: '[class*="rating"], [class*="stars"]',
    description: '[class*="desc"], p',
    ...customFields
  };
  
  return await page.evaluate((container, fields) => {
    const containers = document.querySelectorAll(container);
    const products: Array<Record<string, any>> = [];
    
    containers.forEach((containerEl) => {
      const product: Record<string, any> = {};
      
      // Extract title
      const titleEl = containerEl.querySelector(fields.title);
      if (titleEl) {
        product.title = (titleEl as HTMLElement).innerText.trim();
      }
      
      // Extract price
      const priceEl = containerEl.querySelector(fields.price);
      if (priceEl) {
        const priceText = (priceEl as HTMLElement).innerText.trim();
        product.price = priceText;
        
        // Try to extract numeric value
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          product.priceNumeric = parseFloat(priceMatch[0].replace(/,/g, ''));
        }
      }
      
      // Extract image
      const imageEl = containerEl.querySelector(fields.image);
      if (imageEl) {
        product.image = {
          src: (imageEl as HTMLImageElement).src,
          alt: (imageEl as HTMLImageElement).alt,
          srcset: (imageEl as HTMLImageElement).srcset || null
        };
      }
      
      // Extract link
      const linkEl = containerEl.querySelector(fields.link);
      if (linkEl) {
        product.url = (linkEl as HTMLAnchorElement).href;
      }
      
      // Extract rating
      const ratingEl = containerEl.querySelector(fields.rating);
      if (ratingEl) {
        const ratingText = (ratingEl as HTMLElement).innerText.trim();
        product.rating = ratingText;
        
        // Try to extract numeric rating
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        if (ratingMatch) {
          product.ratingNumeric = parseFloat(ratingMatch[1]);
        }
      }
      
      // Extract description
      const descEl = containerEl.querySelector(fields.description);
      if (descEl) {
        product.description = (descEl as HTMLElement).innerText.trim();
      }
      
      // Only add if at least title or link exists
      if (product.title || product.url) {
        products.push(product);
      }
    });
    
    return products;
  }, containerSelector, defaultFields);
}

/**
 * Smart Article Scraper - Specialized scraper for articles/blog posts
 */
export async function scrapeArticles(
  page: Page,
  containerSelector: string,
  customFields?: Record<string, string>
): Promise<Array<Record<string, any>>> {
  const defaultFields = {
    title: 'h1, h2, h3, [class*="title"]',
    author: '[class*="author"], [rel="author"]',
    date: '[class*="date"], time',
    content: '[class*="content"], [class*="body"], article, p',
    image: 'img',
    link: 'a',
    category: '[class*="category"], [class*="tag"]',
    ...customFields
  };
  
  return await page.evaluate((container, fields) => {
    const containers = document.querySelectorAll(container);
    const articles: Array<Record<string, any>> = [];
    
    containers.forEach((containerEl) => {
      const article: Record<string, any> = {};
      
      // Extract each field
      Object.entries(fields).forEach(([fieldName, selector]) => {
        const element = containerEl.querySelector(selector as string);
        if (element) {
          if (fieldName === 'image') {
            article[fieldName] = {
              src: (element as HTMLImageElement).src,
              alt: (element as HTMLImageElement).alt
            };
          } else if (fieldName === 'link') {
            article[fieldName] = (element as HTMLAnchorElement).href;
          } else if (fieldName === 'date') {
            article[fieldName] = (element as HTMLElement).getAttribute('datetime') ||
                                (element as HTMLElement).innerText.trim();
          } else {
            article[fieldName] = (element as HTMLElement).innerText.trim();
          }
        }
      });
      
      // Only add if at least title exists
      if (article.title) {
        articles.push(article);
      }
    });
    
    return articles;
  }, containerSelector, defaultFields);
}
