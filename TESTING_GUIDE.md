# Testing Guide - Brave Real Browser MCP Server

## 📋 Overview

This guide contains comprehensive testing instructions for all MCP tools. Use the `test-urls-config.json` file for quick access to test URLs.

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure MCP server is running
npm run build
```

### Test URLs Configuration

All test URLs are defined in `test-urls-config.json`:
- **CAPTCHA URLs**: For testing CAPTCHA handlers
- **General URLs**: For data extraction and AI tools
- **API URLs**: For API discovery tools
- **E-commerce URLs**: For content classification

## 🔐 CAPTCHA Tools Testing

### 1. Cloudflare Challenge
**URL**: https://nopecha.com/demo/cloudflare

**Tools to Test**:
- `puzzle_captcha_handler`
- `solve_captcha` (Turnstile)

**Steps**:
```javascript
// 1. Initialize browser
browser_init({ headless: false })

// 2. Navigate to Cloudflare challenge
navigate({ url: "https://nopecha.com/demo/cloudflare" })

// 3. Wait for challenge to load (5-10 seconds)
wait({ type: "selector", value: "div[id^='cf-chl-widget']", timeout: 30000 })

// 4. Analyze puzzle
puzzle_captcha_handler({ 
  sliderSelector: "div[id^='cf-chl-widget']",
  method: "auto" 
})
```

### 2. eCourts India CAPTCHA
**URL**: https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&app_token=22e7493ca224682349cf0986dd144491a950819d30918b8e319ab0d39618f847

**Tools to Test**:
- `ocr_engine`
- `element_screenshot`

**Steps**:
```javascript
// 1. Initialize & Navigate
browser_init({ headless: false })
navigate({ url: "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&app_token=..." })

// 2. Find CAPTCHA image
find_selector({ text: "captcha", elementType: "img" })

// 3. Take screenshot of CAPTCHA
element_screenshot({ 
  selector: "img[src*='captcha']",
  outputPath: "captcha_image.png" 
})

// 4. Extract text using OCR
ocr_engine({ 
  selector: "img[src*='captcha']",
  language: "eng" 
})
```

## 📊 Data Extraction Testing

### Wikipedia Test
**URL**: https://en.wikipedia.org/wiki/Web_scraping

**Tools to Test**:
- `scrape_table`
- `image_scraper`
- `link_harvester`
- `extract_list`

**Example**:
```javascript
browser_init({ headless: false })
navigate({ url: "https://en.wikipedia.org/wiki/Web_scraping" })

// Extract images
image_scraper({ includeDimensions: true })

// Harvest links
link_harvester({ classifyLinks: true })

// Extract lists
extract_list({ includeNested: true })

// Scrape tables
scrape_table({ includeHeaders: true })
```

## 🤖 AI-Powered Tools Testing

### Content Analysis
```javascript
// Navigate to any page
navigate({ url: "https://en.wikipedia.org/wiki/Web_scraping" })

// 1. Sentiment Analysis
sentiment_analysis({}) // Uses current page

// Or with specific text
sentiment_analysis({ 
  text: "This is an amazing product! Highly recommended!" 
})

// 2. Content Classification
content_classification({}) // Analyzes current page

// 3. Summary Generation
summary_generator({ 
  maxSentences: 5,
  selector: "#mw-content-text" 
})

// 4. Translation Support
translation_support({ 
  text: "Bonjour, comment allez-vous?" 
})
```

## 🎨 Visual Tools Testing

### Screenshot & PDF
```javascript
navigate({ url: "https://en.wikipedia.org/wiki/Web_scraping" })

// 1. Element Screenshot
element_screenshot({ 
  selector: "#firstHeading",
  outputPath: "C:\\Users\\Admin\\Desktop\\element.png" 
})

// 2. Full Page Screenshot
full_page_screenshot({ 
  fullPage: true,
  outputPath: "C:\\Users\\Admin\\Desktop\\fullpage.png" 
})

// 3. PDF Generation
pdf_generation({ 
  format: "A4",
  outputPath: "C:\\Users\\Admin\\Desktop\\page.pdf" 
})

// 4. Visual Comparison
visual_comparison({ 
  image1Path: "C:\\Users\\Admin\\Desktop\\img1.png",
  image2Path: "C:\\Users\\Admin\\Desktop\\img2.png",
  threshold: 0.1 
})
```

## 🔍 Search & Filter Tools

### Selector Testing
```javascript
navigate({ url: "https://en.wikipedia.org/wiki/Web_scraping" })

// 1. XPath Support
xpath_support({ xpath: "//h1[@id='firstHeading']" })

// 2. Advanced CSS Selectors
advanced_css_selectors({ 
  selector: "h1:first-of-type",
  operation: "query" 
})

// 3. Visual Element Finder
visual_element_finder({ 
  criteria: {
    minHeight: 30,
    minWidth: 100,
    visible: true
  }
})

// 4. Smart Selector Generator
smart_selector_generator({ 
  description: "main heading of the page" 
})
```

## 🌐 API Discovery Testing

### REST API Discovery
```javascript
navigate({ url: "https://jsonplaceholder.typicode.com" })

// 1. REST API Endpoint Finder
rest_api_endpoint_finder({ 
  analyzeNetworkRequests: true,
  scanDuration: 5000 
})

// 2. All Website API Finder
all_website_api_finder({ 
  deepScan: true,
  includeExternal: false 
})
```

## 📝 Test Scenarios

### Smoke Test (30 seconds)
```javascript
// Basic functionality check
browser_init({ headless: false })
navigate({ url: "https://en.wikipedia.org/wiki/Web_scraping" })
get_content({ type: "text" })
find_selector({ text: "Web scraping" })
browser_close()
```

### CAPTCHA Quick Test (2 minutes)
```javascript
browser_init({ headless: false })

// Test 1: Cloudflare
navigate({ url: "https://nopecha.com/demo/cloudflare" })
wait({ type: "timeout", value: "10000" })
puzzle_captcha_handler({ method: "auto" })

// Test 2: eCourts
navigate({ url: "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&app_token=..." })
ocr_engine({ selector: "img[src*='captcha']" })

browser_close()
```

### Full System Test (10 minutes)
Run all test scenarios defined in `test-urls-config.json`

## 🛠️ Troubleshooting

### Empty Response
**Issue**: Tool returns `{}`
**Solution**: Restart MCP server to load latest code changes

### Browser Not Initialized
**Issue**: "Browser not initialized" error
**Solution**: Always call `browser_init()` first

### Selector Not Found
**Issue**: Element not found
**Solution**: 
1. Use `get_content()` to see page structure
2. Use `find_selector()` to locate elements
3. Wait for dynamic content with `wait()`

### CAPTCHA Not Loading
**Issue**: CAPTCHA doesn't appear
**Solution**: 
1. Use `headless: false` to see browser
2. Add wait time: `wait({ type: "timeout", value: "5000" })`
3. Check network connectivity

## 📊 Test Results Template

```markdown
## Test Session: [Date]

### Environment
- MCP Server Version: 2.8.9
- Browser: Brave
- OS: Windows

### Tests Executed
- [ ] CAPTCHA Tools (3/3)
- [ ] Visual Tools (5/5)
- [ ] AI Tools (5/5)
- [ ] Search Tools (3/3)
- [ ] Data Extraction (4/4)
- [ ] API Discovery (3/3)

### Results
- **Total Tests**: 23
- **Passed**: 
- **Failed**: 
- **Skipped**: 

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
- [Any observations]
```

## 🔗 Quick Links

- **Test URLs Config**: `test-urls-config.json`
- **MCP Fixes Summary**: `MCP_FIXES_SUMMARY.md`
- **Main README**: `README.md`

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues
- Documentation: Project README

---

**Last Updated**: 2025-10-11  
**Version**: 2.8.9  
**Status**: ✅ All tools fixed and ready for testing
