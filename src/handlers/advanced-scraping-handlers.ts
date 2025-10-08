// Advanced Scraping Handlers
// All new extraction tools के लिए MCP handlers

import { getBrowserPage } from '../browser-manager.js';

// Import extractors
import {
  extractTables,
  extractLists,
  extractJSON,
  extractMetaTags,
  extractSchemaOrg
} from '../extractors/smart-data-extractors.js';

import {
  batchExtractElements,
  extractNestedData,
  harvestAttributes,
  extractProducts,
  extractArticles
} from '../extractors/multi-element-extractors.js';

import {
  extractImages,
  extractLinks,
  extractMedia,
  extractDownloadableFiles,
  extractSocialMediaLinks
} from '../extractors/content-type-extractors.js';

import {
  autoPaginate,
  handleInfiniteScroll,
  extractBreadcrumbs,
  extractPaginationInfo,
  parseSitemap
} from '../navigation/pagination-tools.js';

import {
  cleanText,
  htmlToText,
  parsePrice,
  normalizeDate,
  extractPhoneNumbers,
  extractEmails,
  extractUrls,
  validateData,
  removeDuplicates,
  sanitizeData
} from '../processors/data-processors.js';

/**
 * Handler: Extract Tables
 */
export async function handleExtractTables(args: { selector?: string }) {
  const page = await getBrowserPage();
  const tables = await extractTables(page, args.selector);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${tables.length} table(s)\n\n${JSON.stringify(tables, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Lists
 */
export async function handleExtractLists(args: { selector?: string }) {
  const page = await getBrowserPage();
  const lists = await extractLists(page, args.selector);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${lists.length} list(s)\n\n${JSON.stringify(lists, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract JSON Data
 */
export async function handleExtractJSON() {
  const page = await getBrowserPage();
  const jsonData = await extractJSON(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Found ${jsonData.length} JSON data source(s)\n\n${JSON.stringify(jsonData, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Meta Tags
 */
export async function handleExtractMetaTags() {
  const page = await getBrowserPage();
  const metaTags = await extractMetaTags(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Meta Tags Extracted\n\n${JSON.stringify(metaTags, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Schema.org Data
 */
export async function handleExtractSchemaOrg() {
  const page = await getBrowserPage();
  const schemas = await extractSchemaOrg(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Found ${schemas.length} schema(s)\n\n${JSON.stringify(schemas, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Batch Extract Elements
 */
export async function handleBatchExtractElements(args: {
  selector: string;
  fields: { [key: string]: string };
}) {
  const page = await getBrowserPage();
  const elements = await batchExtractElements(page, args.selector, args.fields);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${elements.length} element(s)\n\n${JSON.stringify(elements, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Products
 */
export async function handleExtractProducts(args: {
  containerSelector: string;
  productConfig: {
    name?: string;
    price?: string;
    image?: string;
    link?: string;
    rating?: string;
    description?: string;
  };
}) {
  const page = await getBrowserPage();
  const products = await extractProducts(page, args.containerSelector, args.productConfig);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${products.length} product(s)\n\n${JSON.stringify(products, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Articles
 */
export async function handleExtractArticles(args: {
  articleSelector: string;
  config?: {
    title?: string;
    author?: string;
    date?: string;
    excerpt?: string;
    link?: string;
    image?: string;
    category?: string;
  };
}) {
  const page = await getBrowserPage();
  const articles = await extractArticles(page, args.articleSelector, args.config);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${articles.length} article(s)\n\n${JSON.stringify(articles, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Images
 */
export async function handleExtractImages(args: { selector?: string }) {
  const page = await getBrowserPage();
  const images = await extractImages(page, args.selector);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${images.length} image(s)\n\n${JSON.stringify(images, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Links
 */
export async function handleExtractLinks(args: { selector?: string }) {
  const page = await getBrowserPage();
  const links = await extractLinks(page, args.selector);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Link Analysis\n` +
              `Total Links: ${links.totalLinks}\n` +
              `Internal: ${links.internalCount}\n` +
              `External: ${links.externalCount}\n\n` +
              `${JSON.stringify(links, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Media
 */
export async function handleExtractMedia() {
  const page = await getBrowserPage();
  const media = await extractMedia(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Media Extracted\n` +
              `Videos: ${media.videoCount}\n` +
              `Audio: ${media.audioCount}\n` +
              `iFrames: ${media.iframeCount}\n\n` +
              `${JSON.stringify(media, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Downloadable Files
 */
export async function handleExtractDownloadableFiles() {
  const page = await getBrowserPage();
  const files = await extractDownloadableFiles(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Downloadable Files Found\n` +
              `Total: ${files.totalFiles}\n` +
              `PDFs: ${files.pdfs.length}\n` +
              `Docs: ${files.docs.length}\n` +
              `Images: ${files.images.length}\n` +
              `Archives: ${files.archives.length}\n\n` +
              `${JSON.stringify(files, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Social Media Links
 */
export async function handleExtractSocialMedia() {
  const page = await getBrowserPage();
  const social = await extractSocialMediaLinks(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Social Media Links\n\n${JSON.stringify(social, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Auto Paginate
 */
export async function handleAutoPaginate(args: {
  nextButtonSelector?: string;
  maxPages?: number;
  waitTime?: number;
}) {
  const page = await getBrowserPage();
  const result = await autoPaginate(page, args);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Pagination Complete\n` +
              `Pages Visited: ${result.pagesVisited}\n` +
              `Current URL: ${result.currentUrl}`
      }
    ]
  };
}

/**
 * Handler: Infinite Scroll
 */
export async function handleInfiniteScrollHandler(args: {
  maxScrolls?: number;
  scrollDelay?: number;
  scrollDistance?: number;
}) {
  const page = await getBrowserPage();
  const result = await handleInfiniteScroll(page, args);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Infinite Scroll Complete\n` +
              `Scrolls: ${result.scrollCount}\n` +
              `Final Height: ${result.finalHeight}px`
      }
    ]
  };
}

/**
 * Handler: Extract Breadcrumbs
 */
export async function handleExtractBreadcrumbs() {
  const page = await getBrowserPage();
  const breadcrumbs = await extractBreadcrumbs(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Extracted ${breadcrumbs.length} breadcrumb(s)\n\n${JSON.stringify(breadcrumbs, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Pagination Info
 */
export async function handleExtractPaginationInfo() {
  const page = await getBrowserPage();
  const paginationInfo = await extractPaginationInfo(page);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Pagination Info\n\n${JSON.stringify(paginationInfo, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Parse Sitemap
 */
export async function handleParseSitemap(args: { sitemapUrl: string }) {
  const page = await getBrowserPage();
  const urls = await parseSitemap(page, args.sitemapUrl);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Sitemap Parsed\nFound ${urls.length} URLs\n\n${JSON.stringify(urls, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Extract Contact Information (Phone & Email)
 */
export async function handleExtractContactInfo() {
  const page = await getBrowserPage();
  const text = await page.evaluate(() => document.body.textContent || '');
  
  const phones = extractPhoneNumbers(text);
  const emails = extractEmails(text);
  const urls = extractUrls(text);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Contact Information\n\n` +
              `Phone Numbers: ${phones.length}\n${JSON.stringify(phones, null, 2)}\n\n` +
              `Email Addresses: ${emails.length}\n${JSON.stringify(emails, null, 2)}\n\n` +
              `URLs: ${urls.length}\n${JSON.stringify(urls, null, 2)}`
      }
    ]
  };
}

/**
 * Handler: Harvest Attributes
 */
export async function handleHarvestAttributes(args: {
  selector: string;
  attributes?: string[];
}) {
  const page = await getBrowserPage();
  const attributes = await harvestAttributes(page, args.selector, args.attributes);
  
  return {
    content: [
      {
        type: 'text',
        text: `✅ Harvested attributes from ${attributes.length} element(s)\n\n${JSON.stringify(attributes, null, 2)}`
      }
    ]
  };
}
