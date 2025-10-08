# Brave Real Browser MCP Server - Complete Features Documentation

## 📋 Table of Contents

1. [Smart Data Extractors](#smart-data-extractors)
2. [Multi-Element Extractors](#multi-element-extractors)
3. [Content Type Extractors](#content-type-extractors)
4. [Pagination & Navigation](#pagination--navigation)
5. [Data Processing & Transformation](#data-processing--transformation)
6. [Advanced Scraping Features](#advanced-scraping-features)
7. [Monitoring & Reporting](#monitoring--reporting)
8. [AI-Powered Features](#ai-powered-features)
9. [Search & Filter Tools](#search--filter-tools)
10. [Captcha Handling](#captcha-handling)
11. [Screenshot & Visual Tools](#screenshot--visual-tools)
12. [API & Integration](#api--integration)

---

## 🎯 Smart Data Extractors

### Extract Tables
Automatically extracts all tables from a webpage with headers and data rows.

```typescript
// Usage
{
  "tool": "extract_tables",
  "arguments": {
    "selector": "table.data-table",  // Optional: specific table selector
    "includeHeaders": true
  }
}
```

**Returns:**
```json
{
  "tables": [
    {
      "headers": ["Name", "Age", "City"],
      "rows": [
        ["John", "30", "NYC"],
        ["Jane", "25", "LA"]
      ]
    }
  ]
}
```

### Extract Lists
Extracts ordered and unordered lists from pages.

```typescript
{
  "tool": "extract_lists",
  "arguments": {
    "type": "all"  // "all", "ul", or "ol"
  }
}
```

### Extract JSON Data
Finds and parses JSON data embedded in pages (scripts, data attributes).

```typescript
{
  "tool": "extract_json",
  "arguments": {}
}
```

### Extract Meta Tags
Retrieves all meta tags including Open Graph and Twitter Card data.

```typescript
{
  "tool": "extract_meta_tags",
  "arguments": {}
}
```

### Extract Schema.org Data
Extracts structured data (JSON-LD, microdata).

```typescript
{
  "tool": "extract_schema_org",
  "arguments": {}
}
```

---

## 🔄 Multi-Element Extractors

### Batch Extract Elements
Extract multiple elements in one operation.

```typescript
{
  "tool": "batch_extract_elements",
  "arguments": {
    "selectors": [
      { "name": "title", "selector": "h1" },
      { "name": "price", "selector": ".price" },
      { "name": "description", "selector": ".desc" }
    ]
  }
}
```

### Extract Products
E-commerce product extraction with price, images, ratings.

```typescript
{
  "tool": "extract_products",
  "arguments": {
    "containerSelector": ".product-card"
  }
}
```

### Extract Articles
Blog post and article extraction.

```typescript
{
  "tool": "extract_articles",
  "arguments": {
    "includeMetadata": true
  }
}
```

### Harvest Attributes
Extract specific HTML attributes from multiple elements.

```typescript
{
  "tool": "harvest_attributes",
  "arguments": {
    "selector": "a",
    "attributes": ["href", "title", "rel"]
  }
}
```

---

## 📸 Content Type Extractors

### Extract Images
Get all images with metadata.

```typescript
{
  "tool": "extract_images",
  "arguments": {
    "includeDataUrls": false,
    "minWidth": 100,
    "minHeight": 100
  }
}
```

### Extract Links
Extract all links with classification (internal/external).

```typescript
{
  "tool": "extract_links",
  "arguments": {
    "type": "all"  // "all", "internal", "external"
  }
}
```

### Extract Media
Extract video and audio elements.

```typescript
{
  "tool": "extract_media",
  "arguments": {}
}
```

### Extract Downloadable Files
Find PDF, ZIP, and other downloadable files.

```typescript
{
  "tool": "extract_downloadable_files",
  "arguments": {}
}
```

### Extract Social Media Links
Find social media profile links.

```typescript
{
  "tool": "extract_social_media",
  "arguments": {}
}
```

---

## 🔁 Pagination & Navigation

### Auto Paginate
Automatically navigate through paginated content.

```typescript
{
  "tool": "auto_paginate",
  "arguments": {
    "nextButtonSelector": ".next-page",
    "maxPages": 10,
    "extractCallback": "extract_products"
  }
}
```

### Infinite Scroll Handler
Handle infinite scrolling pages.

```typescript
{
  "tool": "infinite_scroll_handler",
  "arguments": {
    "maxScrolls": 5,
    "scrollDelay": 1000
  }
}
```

### Parse Sitemap
Extract URLs from XML sitemaps.

```typescript
{
  "tool": "parse_sitemap",
  "arguments": {
    "url": "https://example.com/sitemap.xml"
  }
}
```

### Extract Breadcrumbs
Get navigation breadcrumbs.

```typescript
{
  "tool": "extract_breadcrumbs",
  "arguments": {}
}
```

---

## 🔧 Data Processing & Transformation

### Clean Text
Remove extra whitespace, normalize text.

```typescript
{
  "tool": "clean_data",
  "arguments": {
    "data": "  Hello   World  ",
    "operations": ["trim", "normalize"]
  }
}
```

### Parse Dates
Convert various date formats to ISO 8601.

```typescript
{
  "tool": "parse_dates",
  "arguments": {
    "dateString": "March 15, 2024",
    "format": "MMMM DD, YYYY"
  }
}
```

### Validate Data
Validate emails, URLs, phone numbers.

```typescript
{
  "tool": "validate_data",
  "arguments": {
    "data": { "email": "test@example.com" },
    "rules": {
      "email": "email"
    }
  }
}
```

---

## 🚀 Advanced Scraping Features

### Dynamic Content Waiting
Wait for AJAX/dynamic content to load.

```typescript
{
  "tool": "wait_for_dynamic_content",
  "arguments": {
    "selector": ".loaded-content",
    "timeout": 10000
  }
}
```

### Authentication Handler
Handle login forms and sessions.

```typescript
{
  "tool": "authenticate",
  "arguments": {
    "username": "user@example.com",
    "password": "********",
    "loginUrl": "https://example.com/login"
  }
}
```

### Rate Limiting
Control request rate to avoid blocking.

```typescript
{
  "tool": "set_rate_limit",
  "arguments": {
    "requestsPerMinute": 30,
    "burstSize": 5
  }
}
```

### Session Management
Maintain cookies and session state.

```typescript
{
  "tool": "save_session",
  "arguments": {
    "path": "./session.json"
  }
}

{
  "tool": "load_session",
  "arguments": {
    "path": "./session.json"
  }
}
```

---

## 📊 Monitoring & Reporting

### Progress Tracking
Track scraping progress with callbacks.

```typescript
{
  "tool": "track_progress",
  "arguments": {
    "totalItems": 100,
    "callback": "updateProgress"
  }
}
```

### Error Logging
Log errors with context and stack traces.

```typescript
{
  "tool": "log_error",
  "arguments": {
    "error": errorObject,
    "context": { "url": "...", "action": "..." }
  }
}
```

### Success Rate Monitoring
Track success/failure rates.

```typescript
{
  "tool": "get_success_rate",
  "arguments": {}
}
```

---

## 🤖 AI-Powered Features

### Smart Selector Generation
AI generates robust CSS selectors from descriptions.

```typescript
{
  "tool": "generate_smart_selector",
  "arguments": {
    "description": "submit button",
    "preferStable": true
  }
}
```

**Returns:**
```json
{
  "selector": "button[type='submit']",
  "confidence": 95,
  "alternatives": ["#submit-btn", ".btn-submit"]
}
```

### Content Classification
Automatically classify page content type.

```typescript
{
  "tool": "classify_content",
  "arguments": {
    "categories": ["e-commerce", "blog", "news"]
  }
}
```

**Returns:**
```json
{
  "category": "e-commerce",
  "confidence": 85,
  "subcategories": ["product-page", "shopping"]
}
```

### Sentiment Analysis
Analyze sentiment of page content.

```typescript
{
  "tool": "analyze_sentiment",
  "arguments": {
    "selector": ".review-text"
  }
}
```

**Returns:**
```json
{
  "sentiment": "positive",
  "score": 75,
  "keywords": ["great", "excellent", "love"]
}
```

### Content Summarization
Generate intelligent summaries.

```typescript
{
  "tool": "generate_summary",
  "arguments": {
    "maxLength": 200,
    "includeKeywords": true
  }
}
```

### Language Detection
Detect page language and alternatives.

```typescript
{
  "tool": "detect_language",
  "arguments": {}
}
```

**Returns:**
```json
{
  "language": "en",
  "confidence": 95,
  "alternateLanguages": ["es", "fr"]
}
```

---

## 🔍 Search & Filter Tools

### Keyword Search
Search for keywords in page content.

```typescript
{
  "tool": "keyword_search",
  "arguments": {
    "keywords": ["product", "price"],
    "caseSensitive": false
  }
}
```

### Regex Search
Advanced regex pattern matching.

```typescript
{
  "tool": "regex_search",
  "arguments": {
    "pattern": "\\d{3}-\\d{3}-\\d{4}",  // Phone numbers
    "flags": "gi"
  }
}
```

### XPath Queries
Execute XPath queries.

```typescript
{
  "tool": "xpath_query",
  "arguments": {
    "query": "//div[@class='product']//span[@class='price']"
  }
}
```

### Advanced CSS Selectors
Complex CSS selector support.

```typescript
{
  "tool": "css_query",
  "arguments": {
    "selector": "div.product:has(> .in-stock) .price"
  }
}
```

---

## 🛡️ Captcha Handling

### Detect Captcha
Identify captcha type on page.

```typescript
{
  "tool": "detect_captcha",
  "arguments": {}
}
```

**Returns:**
```json
{
  "found": true,
  "type": "recaptcha",
  "selector": ".g-recaptcha"
}
```

### Solve reCAPTCHA v2
Attempt to solve reCAPTCHA.

```typescript
{
  "tool": "solve_recaptcha_v2",
  "arguments": {
    "apiKey": "your_2captcha_api_key"  // Optional
  }
}
```

### Solve hCaptcha
Handle hCaptcha challenges.

```typescript
{
  "tool": "solve_hcaptcha",
  "arguments": {
    "apiKey": "your_api_key"
  }
}
```

### Solve Puzzle Captcha
Handle slider/puzzle captchas.

```typescript
{
  "tool": "solve_puzzle_captcha",
  "arguments": {
    "type": "slider",
    "selector": ".slider-captcha"
  }
}
```

### 2Captcha Integration
Send captcha to solving service.

```typescript
{
  "tool": "solve_2captcha",
  "arguments": {
    "apiKey": "your_2captcha_key",
    "type": "recaptcha",
    "siteKey": "site_key_here"
  }
}
```

### Auto Solve Captcha
Automatically detect and solve captcha.

```typescript
{
  "tool": "solve_captcha_auto",
  "arguments": {
    "apiKey": "optional_api_key"
  }
}
```

---

## 📷 Screenshot & Visual Tools

### Full Page Screenshot
Capture entire page.

```typescript
{
  "tool": "take_full_page_screenshot",
  "arguments": {
    "path": "./screenshot.png",
    "type": "png"
  }
}
```

### Element Screenshot
Capture specific element.

```typescript
{
  "tool": "take_element_screenshot",
  "arguments": {
    "selector": ".product-image",
    "path": "./element.png",
    "padding": 10
  }
}
```

### Generate PDF
Convert page to PDF.

```typescript
{
  "tool": "generate_pdf",
  "arguments": {
    "path": "./page.pdf",
    "format": "A4",
    "landscape": false,
    "printBackground": true
  }
}
```

### Viewport Screenshot
Capture visible viewport only.

```typescript
{
  "tool": "take_viewport_screenshot",
  "arguments": {
    "path": "./viewport.png"
  }
}
```

### Element Visibility Check
Check if element is visible.

```typescript
{
  "tool": "is_element_visible",
  "arguments": {
    "selector": ".popup-modal"
  }
}
```

### Scroll Into View
Scroll element into viewport.

```typescript
{
  "tool": "scroll_into_view",
  "arguments": {
    "selector": ".footer",
    "behavior": "smooth"
  }
}
```

### Highlight Element
Temporarily highlight element for debugging.

```typescript
{
  "tool": "highlight_element",
  "arguments": {
    "selector": ".target-element",
    "duration": 2000
  }
}
```

---

## 🔌 API & Integration

### Call REST API
Make HTTP requests from browser context.

```typescript
{
  "tool": "call_rest_endpoint",
  "arguments": {
    "method": "GET",
    "url": "https://api.example.com/data",
    "headers": { "Authorization": "Bearer token" }
  }
}
```

### Send to Webhook
Post scraped data to webhook.

```typescript
{
  "tool": "send_to_webhook",
  "arguments": {
    "url": "https://webhook.site/unique-id",
    "data": { "scraped": "data" },
    "retries": 3
  }
}
```

### Zapier Integration
Trigger Zapier workflows.

```typescript
{
  "tool": "trigger_zapier_webhook",
  "arguments": {
    "webhookUrl": "https://hooks.zapier.com/...",
    "eventType": "scrape_complete",
    "data": { "results": [...] }
  }
}
```

### Execute GraphQL
Run GraphQL queries.

```typescript
{
  "tool": "execute_graphql",
  "arguments": {
    "endpoint": "https://api.example.com/graphql",
    "query": "query { users { name email } }",
    "variables": {}
  }
}
```

### Plugin System
Register and execute custom plugins.

```typescript
// Register plugin
{
  "tool": "register_plugin",
  "arguments": {
    "plugin": {
      "name": "my-plugin",
      "version": "1.0.0",
      "initialize": async (context) => { /* init code */ },
      "execute": async (page, args) => { /* execution code */ }
    }
  }
}

// Execute plugin
{
  "tool": "execute_plugin",
  "arguments": {
    "name": "my-plugin",
    "args": { "param": "value" }
  }
}
```

### Data Export
Export data in multiple formats.

```typescript
{
  "tool": "export_data",
  "arguments": {
    "data": { "results": [...] },
    "format": "csv",  // json, csv, xml, yaml
    "pretty": true
  }
}
```

### Batch Operations
Execute multiple operations in sequence or parallel.

```typescript
{
  "tool": "execute_batch_operations",
  "arguments": {
    "operations": [
      { "type": "navigate", "params": { "url": "..." } },
      { "type": "extract_products", "params": {} },
      { "type": "send_to_webhook", "params": { "url": "..." } }
    ],
    "parallel": false,
    "stopOnError": true
  }
}
```

---

## 🎓 Usage Examples

### Complete E-commerce Scraping Workflow

```typescript
// 1. Initialize browser
await browser_init({ headless: false });

// 2. Navigate to product page
await navigate({ url: "https://example.com/products" });

// 3. Handle any captcha
await solve_captcha_auto({ apiKey: "your_key" });

// 4. Extract products
const products = await extract_products({
  containerSelector: ".product-card"
});

// 5. Auto-paginate through results
const allProducts = await auto_paginate({
  nextButtonSelector: ".next-page",
  maxPages: 5,
  extractCallback: "extract_products"
});

// 6. Process and validate data
const cleaned = await clean_data({
  data: allProducts,
  operations: ["trim", "deduplicate"]
});

// 7. Send to webhook
await send_to_webhook({
  url: "https://your-webhook.com/endpoint",
  data: cleaned
});

// 8. Generate report
await generate_pdf({
  path: "./report.pdf"
});

// 9. Close browser
await browser_close();
```

### AI-Powered Content Analysis

```typescript
// Navigate to page
await navigate({ url: "https://blog.example.com/article" });

// Detect language
const language = await detect_language();

// Classify content
const category = await classify_content({
  categories: ["blog", "news", "tutorial"]
});

// Analyze sentiment
const sentiment = await analyze_sentiment({
  selector: "article"
});

// Generate summary
const summary = await generate_summary({
  maxLength: 200,
  includeKeywords: true
});

// Extract keywords and metadata
const meta = await extract_meta_tags();

// Save analysis report
const report = {
  language,
  category,
  sentiment,
  summary,
  meta
};

await send_to_webhook({
  url: "https://analysis-api.com/store",
  data: report
});
```

---

## 🔒 Best Practices

1. **Rate Limiting**: Always use rate limiting to avoid being blocked
2. **Error Handling**: Implement retry logic and proper error handling
3. **Session Management**: Save/load sessions for authenticated scraping
4. **Captcha Handling**: Have backup strategies for captcha solving
5. **Data Validation**: Always validate extracted data before using
6. **Monitoring**: Track success rates and errors
7. **Stealth Mode**: Use stealth plugins for anti-detection
8. **Resource Cleanup**: Always close browser after scraping

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

---

## 📧 Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)
- Email: support@example.com
