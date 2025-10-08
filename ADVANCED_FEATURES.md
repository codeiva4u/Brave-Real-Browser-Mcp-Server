# 🚀 Advanced Web Scraping Features Documentation

यह document **Brave Real Browser MCP Server** के सभी advanced scraping features की comprehensive guide है।

---

## 📋 Table of Contents

1. [Smart Data Extractors](#smart-data-extractors)
2. [Multi-Element Extractors](#multi-element-extractors)
3. [Content Type Extractors](#content-type-extractors)
4. [Pagination & Navigation](#pagination--navigation)
5. [Data Processing & Transformation](#data-processing--transformation)
6. [Advanced Scraping Features](#advanced-scraping-features)
7. [Monitoring & Reporting](#monitoring--reporting)
8. [Search & Filter Tools](#search--filter-tools)
9. [Visual & Screenshot Tools](#visual--screenshot-tools)

---

## 1. Smart Data Extractors

### ✅ Table Scraper
HTML tables से structured data extract करना।

**MCP Tool**: `extract_tables`

```javascript
// उपयोग
await use_mcp_tool("extract_tables", {
  selector: "table.data-table" // Optional
});

// Output
{
  headers: ["Name", "Age", "City"],
  rows: [
    { Name: "John", Age: "30", City: "NYC" },
    { Name: "Jane", Age: "25", City: "LA" }
  ],
  rowCount: 2,
  columnCount: 3
}
```

### ✅ List Extractor
Bullet lists और numbered lists से data निकालना।

**MCP Tool**: `extract_lists`

```javascript
await use_mcp_tool("extract_lists", {
  selector: "ul.features" // Optional
});
```

### ✅ JSON Extractor
Page में embedded JSON/JSON-LD data खोजना।

**MCP Tool**: `extract_json`

```javascript
await use_mcp_tool("extract_json", {});
```

### ✅ Meta Tags Scraper
SEO meta tags और Open Graph data।

**MCP Tool**: `extract_meta_tags`

```javascript
await use_mcp_tool("extract_meta_tags", {});
```

### ✅ Schema.org Data
Structured data (JSON-LD, Microdata) निकालना।

**MCP Tool**: `extract_schema_org`

```javascript
await use_mcp_tool("extract_schema_org", {});
```

---

## 2. Multi-Element Extractors

### ✅ Batch Element Scraper
Multiple similar elements को एक साथ scrape करना।

**MCP Tool**: `batch_extract_elements`

```javascript
await use_mcp_tool("batch_extract_elements", {
  selector: ".product-card",
  fields: {
    title: "h2.title",
    price: ".price",
    image: "img"
  }
});
```

### ✅ Product Extractor
E-commerce pages के लिए specialized।

**MCP Tool**: `extract_products`

```javascript
await use_mcp_tool("extract_products", {
  containerSelector: ".product",
  productConfig: {
    name: ".product-name",
    price: ".product-price",
    image: "img.product-image",
    rating: ".rating",
    link: "a.product-link"
  }
});
```

### ✅ Article Extractor
Blog/news sites के लिए।

**MCP Tool**: `extract_articles`

```javascript
await use_mcp_tool("extract_articles", {
  articleSelector: "article",
  config: {
    title: "h1",
    author: ".author",
    date: ".publish-date",
    excerpt: ".summary"
  }
});
```

### ✅ Attribute Harvester
Element attributes को collect करना।

**MCP Tool**: `harvest_attributes`

```javascript
await use_mcp_tool("harvest_attributes", {
  selector: "a.link",
  attributes: ["href", "title", "rel"]
});
```

---

## 3. Content Type Extractors

### ✅ Image Scraper
सभी images URLs, alt text, dimensions के साथ।

**MCP Tool**: `extract_images`

```javascript
await use_mcp_tool("extract_images", {
  selector: "img" // Optional
});
```

### ✅ Link Harvester
Internal/external links classification।

**MCP Tool**: `extract_links`

```javascript
await use_mcp_tool("extract_links", {});

// Output
{
  internal: [...],
  external: [...],
  totalLinks: 150,
  internalCount: 120,
  externalCount: 30
}
```

### ✅ Media Extractor
Videos, audio files और iframes।

**MCP Tool**: `extract_media`

```javascript
await use_mcp_tool("extract_media", {});
```

### ✅ Downloadable Files Finder
PDFs, docs, archives categorization।

**MCP Tool**: `extract_downloadable_files`

```javascript
await use_mcp_tool("extract_downloadable_files", {});
```

### ✅ Social Media Extractor
Social media profile links।

**MCP Tool**: `extract_social_media`

```javascript
await use_mcp_tool("extract_social_media", {});
```

---

## 4. Pagination & Navigation

### ✅ Auto Pagination
"Next" button automatically detect और click।

**MCP Tool**: `auto_paginate`

```javascript
await use_mcp_tool("auto_paginate", {
  nextButtonSelector: ".next-page", // Optional
  maxPages: 10,
  waitTime: 2000
});
```

### ✅ Infinite Scroll Handler
Lazy-loading pages के लिए।

**MCP Tool**: `handle_infinite_scroll`

```javascript
await use_mcp_tool("handle_infinite_scroll", {
  maxScrolls: 20,
  scrollDelay: 1000,
  scrollDistance: 500
});
```

### ✅ Breadcrumb Extractor
Navigation breadcrumbs।

**MCP Tool**: `extract_breadcrumbs`

```javascript
await use_mcp_tool("extract_breadcrumbs", {});
```

### ✅ Pagination Info
Current/total pages information।

**MCP Tool**: `extract_pagination_info`

```javascript
await use_mcp_tool("extract_pagination_info", {});
```

### ✅ Sitemap Parser
sitemap.xml से URLs extract।

**MCP Tool**: `parse_sitemap`

```javascript
await use_mcp_tool("parse_sitemap", {
  sitemapUrl: "https://example.com/sitemap.xml"
});
```

---

## 5. Data Processing & Transformation

### ✅ Text Cleaner
Whitespace और special characters removal।

### ✅ HTML to Text
Clean text extraction।

### ✅ Price Parser
Multi-currency support।

### ✅ Date Normalizer
Various formats को ISO format में।

### ✅ Contact Extractors
Phone numbers, emails, URLs extraction।

**MCP Tool**: `extract_contact_info`

```javascript
await use_mcp_tool("extract_contact_info", {});

// Output
{
  phones: ["123-456-7890", "+1-555-123-4567"],
  emails: ["info@example.com", "contact@example.com"],
  urls: ["https://example.com"]
}
```

---

## 6. Advanced Scraping Features

### 🔐 Session Management
Session cookies और storage maintain करना।

```typescript
import { SessionManager } from './advanced/advanced-scraping';

const sessionManager = new SessionManager();

// Save session
await sessionManager.saveSession(page, 'user_session_1');

// Restore session
await sessionManager.restoreSession(page, 'user_session_1');

// List all sessions
const sessions = sessionManager.listSessions();
```

### ⏱️ Rate Limiting
Request throttling और delays।

```typescript
import { RateLimiter } from './advanced/advanced-scraping';

const limiter = new RateLimiter(
  1000, // Min delay between requests (ms)
  10,   // Max requests per window
  60000 // Window duration (ms)
);

await limiter.waitForNextRequest();
// Your scraping code here
```

### 🔄 User Agent Rotation
Different user agents।

```typescript
import { UserAgentRotator } from './advanced/advanced-scraping';

const uaRotator = new UserAgentRotator();
const userAgent = uaRotator.getRandom();
```

### 🤖 Robots.txt Checker
Website permissions check।

```typescript
import { checkRobotsTxt } from './advanced/advanced-scraping';

const result = await checkRobotsTxt(page, 'https://example.com');
console.log(result.allowed); // true/false
console.log(result.rules);   // Disallowed paths
```

---

## 7. Monitoring & Reporting

### 📊 Progress Tracker
Real-time progress monitoring।

```typescript
import { globalProgressTracker } from './monitoring/monitoring-tools';

// Start tracking
globalProgressTracker.start(100, 'Product Scraping');

// Update progress
globalProgressTracker.increment(true); // Success
globalProgressTracker.increment(false); // Failure

// Get progress
const progress = globalProgressTracker.getProgress();
console.log(progress.percentage); // 45.5%
console.log(progress.estimatedTimeRemaining); // 30000 ms
```

### 📝 Error Logger
Failed requests logging।

```typescript
import { globalErrorLogger } from './monitoring/monitoring-tools';

// Log error
globalErrorLogger.log(new Error('Request failed'), {
  url: 'https://example.com',
  context: 'product_scraping'
});

// Get errors
const recentErrors = globalErrorLogger.getRecentErrors(5);
const summary = globalErrorLogger.getErrorSummary();
```

### ✅ Success Reporter
Success/failure statistics।

```typescript
import { globalSuccessReporter } from './monitoring/monitoring-tools';

globalSuccessReporter.start();

globalSuccessReporter.recordSuccess('https://example.com', 250);
globalSuccessReporter.recordFailure('https://failed.com');

globalSuccessReporter.end();

const report = globalSuccessReporter.getReport();
console.log(report.successRate); // 95.5%
```

### 📈 Data Quality Metrics
Extracted data की quality measurement।

```typescript
import { globalDataQualityMetrics } from './monitoring/monitoring-tools';

const data = [/* your scraped data */];

const metrics = globalDataQualityMetrics.analyze(data, ['name', 'price']);

console.log(metrics.quality); // 'excellent', 'good', 'fair', 'poor'
console.log(metrics.completenessRate); // 98.5%
console.log(metrics.duplicateRate); // 2.1%
```

---

## 8. Search & Filter Tools

### 🔍 Keyword Search
Page में specific keywords search।

```typescript
import { searchKeywords } from './search/search-filter-tools';

const results = await searchKeywords(page, ['product', 'price'], {
  caseSensitive: false,
  wholeWord: true,
  context: 50
});
```

### 🔎 Regex Pattern Matcher
Complex patterns के साथ extraction।

```typescript
import { matchRegexPattern } from './search/search-filter-tools';

const matches = await matchRegexPattern(
  page, 
  '\\$\\d+\\.\\d{2}', // Price pattern
  'g'
);
```

### 📍 XPath Support
XPath selectors के साथ element finding।

```typescript
import { findByXPath } from './search/search-filter-tools';

const elements = await findByXPath(
  page,
  '//div[@class="product"]//h2'
);
```

### 🎯 Advanced CSS Selector
Complex CSS queries।

```typescript
import { queryAdvancedCSS } from './search/search-filter-tools';

const results = await queryAdvancedCSS(
  page,
  'div.product:has(> span.sale)',
  {
    limit: 10,
    extractText: true,
    extractAttributes: ['data-id', 'data-price']
  }
);
```

### 👁️ Visual Element Finder
Screen coordinates से elements locate।

```typescript
import { findElementAtPosition } from './search/search-filter-tools';

const element = await findElementAtPosition(page, 500, 300);
console.log(element.tagName);
console.log(element.selector);
```

---

## 9. Visual & Screenshot Tools

### 📸 Full Page Screenshot
Complete page का screenshot।

```typescript
import { takeFullPageScreenshot } from './visual/visual-tools';

const result = await takeFullPageScreenshot(page, {
  path: './screenshots/page.png',
  type: 'png'
});
```

### 🎯 Element Screenshot
Specific element की image।

```typescript
import { takeElementScreenshot } from './visual/visual-tools';

const result = await takeElementScreenshot(page, '.product-card', {
  path: './screenshots/product.png',
  padding: 10
});
```

### 📄 PDF Generation
Webpage को PDF में convert।

```typescript
import { generatePDF } from './visual/visual-tools';

const result = await generatePDF(page, {
  path: './pdfs/page.pdf',
  format: 'A4',
  landscape: false,
  printBackground: true
});
```

### 👀 Element Visibility Checker
Element visible है या नहीं।

```typescript
import { isElementVisible } from './visual/visual-tools';

const visibility = await isElementVisible(page, '.modal');
console.log(visibility.visible); // true/false
console.log(visibility.inViewport); // true/false
```

### 🔆 Highlight Element
Element को temporarily highlight (debugging)।

```typescript
import { highlightElement } from './visual/visual-tools';

await highlightElement(page, '.target-element', 3000);
```

---

## 🎯 Complete Usage Example

```javascript
// 1. Initialize browser
await use_mcp_tool("browser_init", { headless: false });

// 2. Navigate to page
await use_mcp_tool("navigate", { url: "https://example.com/products" });

// 3. Handle infinite scroll
await use_mcp_tool("handle_infinite_scroll", { maxScrolls: 5 });

// 4. Extract products
const products = await use_mcp_tool("extract_products", {
  containerSelector: ".product-card",
  productConfig: {
    name: ".product-name",
    price: ".product-price",
    image: "img",
    rating: ".rating"
  }
});

// 5. Extract contact info
const contacts = await use_mcp_tool("extract_contact_info", {});

// 6. Take screenshot
await takeFullPageScreenshot(page, {
  path: "./screenshots/products.png"
});

// 7. Close browser
await use_mcp_tool("browser_close", {});
```

---

## 📊 Tool Summary

**कुल MCP Tools**: **20+ Tools**

- ✅ Smart Data Extractors: 5 tools
- ✅ Multi-Element Extractors: 4 tools  
- ✅ Content Type Extractors: 5 tools
- ✅ Pagination & Navigation: 5 tools
- ✅ Data Processing: 1 tool
- ✅ Advanced Features: Session, Rate Limiting, etc.
- ✅ Monitoring: Progress, Errors, Quality
- ✅ Search & Filter: Keyword, Regex, XPath
- ✅ Visual Tools: Screenshots, PDF

---

## 🚀 Performance Tips

1. **Rate Limiting का उपयोग करें** - Server पर load control
2. **Session Management** - Login state maintain करना
3. **Progress Tracking** - Real-time monitoring
4. **Error Logging** - Failed requests को track करना
5. **Data Quality Metrics** - Output quality verify करना

---

## 🛡️ Best Practices

1. ✅ हमेशा `robots.txt` check करें
2. ✅ Reasonable delays use करें
3. ✅ User agent rotation करें
4. ✅ Error handling implement करें
5. ✅ Data quality validate करें
6. ✅ Progress monitor करें
7. ✅ Sessions properly close करें

---

## 📚 Additional Resources

- [MCP SDK Documentation](https://modelcontextprotocol.io)
- [Puppeteer Docs](https://pptr.dev)
- [Brave Browser](https://brave.com)

---

**Version**: 2.3.3+advanced
**Last Updated**: 2025-10-08
**Author**: Your Team
