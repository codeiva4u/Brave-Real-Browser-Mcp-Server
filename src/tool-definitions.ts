// MCP Tool Definitions and Schemas
// Gemini 3 Pro Compatible - All schemas validated for strict JSON Schema compliance

// Server metadata
export const SERVER_INFO = {
  name: 'brave-real-browser-mcp-server',
  version: '1.4.0',
};

// MCP capabilities
export const CAPABILITIES = {
  tools: {},
  resources: {},
  prompts: {},
};

// Circuit breaker and retry configuration constants
export const MAX_RETRY_DEPTH = 3;
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
export const MAX_BROWSER_INIT_DEPTH = 2;

// Content prioritization configuration interface
export interface ContentPriorityConfig {
  prioritizeContent: boolean;
  autoSuggestGetContent: boolean;
}


// Check environment variable for testing override
const disableContentPriority = process.env.DISABLE_CONTENT_PRIORITY === 'true' || process.env.NODE_ENV === 'test';

export const DEFAULT_CONTENT_PRIORITY_CONFIG: ContentPriorityConfig = {
  prioritizeContent: !disableContentPriority,
  autoSuggestGetContent: !disableContentPriority
};

// Complete tool definitions array
// All tools have detailed descriptions and Gemini-compatible schemas
export const TOOLS = [
  {
    name: 'browser_init',
    description: 'Initialize a new Brave browser instance with stealth mode and anti-detection features. Supports headless mode, proxy configuration, custom plugins, and content prioritization settings. Must be called before any other browser operations.',
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', description: 'Run browser in headless mode (no visible UI). Default: false for visual debugging.' },
        autoInstall: { type: 'boolean', default: true, description: 'Automatically install Brave browser if not found on the system.' },
        disableXvfb: { type: 'boolean', default: false, description: 'Disable Xvfb virtual display on Linux systems.' },
        ignoreAllFlags: { type: 'boolean', default: true, description: 'Ignore default Chromium flags for maximum compatibility.' },
        proxy: { type: 'string', description: 'Proxy server URL (e.g., http://proxy:8080 or socks5://proxy:1080).' },
        plugins: { type: 'array', items: { type: 'string' }, description: 'List of puppeteer-extra plugins to load (e.g., stealth, recaptcha).' },
        customConfig: {
          type: 'object',
          properties: {
            chromePath: { type: 'string', description: 'Custom path to Brave/Chrome executable.' }
          },
          description: 'Custom browser configuration options.'
        },
        contentPriority: {
          type: 'object',
          properties: {
            prioritizeContent: { type: 'boolean', default: true, description: 'Prioritize content extraction over visual rendering.' },
            autoSuggestGetContent: { type: 'boolean', default: true, description: 'Auto-suggest get_content after navigation.' },
          },
          description: 'Content prioritization settings for optimized scraping.'
        },
      },
    },
  },
  {
    name: 'browser_close',
    description: 'Close the currently active Brave browser instance and release all resources. Terminates all browser processes and cleans up temporary files. Call this when finished with browser automation.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'navigate',
    description: 'Navigate the browser to a specified URL. Supports different wait conditions to ensure page is fully loaded before returning. Use waitUntil parameter to control when navigation is considered complete.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL to navigate to. Must be a valid HTTP/HTTPS URL.' },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
          default: 'domcontentloaded',
          description: 'Wait condition: load (full load), domcontentloaded (DOM ready), networkidle0 (no network 500ms), networkidle2 (max 2 connections).'
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_content',
    description: 'Extract page content as HTML or plain text. Can target specific elements using CSS selectors or get the entire page. Useful for scraping text content, parsing HTML structure, or extracting data from web pages.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['html', 'text'], default: 'html', description: 'Output format: html (raw HTML) or text (visible text only).' },
        selector: { type: 'string', description: 'Optional CSS selector to target specific element. If omitted, returns entire page content.' },
      },
    },
  },
  {
    name: 'click',
    description: 'Click on a page element identified by CSS selector. Supports waiting for navigation after click (useful for links and form submissions). Uses human-like click behavior to avoid detection.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of the element to click (e.g., "#submit-btn", ".nav-link", "button[type=submit]").' },
        waitForNavigation: { type: 'boolean', default: false, description: 'Wait for page navigation after clicking. Enable for links that navigate to new pages.' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'type',
    description: 'Type text into an input field or textarea with human-like typing simulation. Includes configurable delay between keystrokes to mimic natural typing behavior and avoid bot detection.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of the input element (e.g., "#search-input", "input[name=email]").' },
        text: { type: 'string', description: 'Text to type into the input field.' },
        delay: { type: 'number', default: 100, description: 'Delay in milliseconds between each keystroke. Higher values appear more human-like.' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'press_key',
    description: 'Press a keyboard key with optional modifier keys (Ctrl, Shift, Alt, Meta). Useful for keyboard shortcuts, form submissions (Enter), navigation (Tab), or closing dialogs (Escape).',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Key to press (e.g., Enter, Tab, Escape, ArrowDown, Backspace, Delete, F1-F12).',
        },
        selector: { type: 'string', description: 'Optional CSS selector to focus before pressing key.' },
        modifiers: {
          type: 'array',
          items: { type: 'string', enum: ['Control', 'Shift', 'Alt', 'Meta'] },
          description: 'Modifier keys to hold while pressing (e.g., ["Control", "Shift"] for Ctrl+Shift+Key).'
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'wait',
    description: 'Wait for specific conditions before proceeding. Can wait for element to appear (selector), page navigation to complete (navigation), or a fixed time period (timeout). Essential for handling dynamic content.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['selector', 'navigation', 'timeout'], description: 'Wait type: selector (wait for element), navigation (wait for page load), timeout (fixed delay).' },
        value: { type: 'string', description: 'CSS selector to wait for (selector type), or milliseconds to wait (timeout type).' },
        timeout: { type: 'number', default: 30000, description: 'Maximum wait time in milliseconds before timing out.' },
      },
      required: ['type', 'value'],
    },
  },
  {
    name: 'solve_captcha',
    description: 'Automatically solve various types of CAPTCHAs including reCAPTCHA v2/v3, hCaptcha, Cloudflare Turnstile, image-based puzzles, and audio challenges. Uses multiple strategies: OCR, audio transcription, and puzzle solving.',
    inputSchema: {
      type: 'object',
      properties: {
        strategy: {
          type: 'string',
          enum: ['auto', 'ocr', 'audio', 'puzzle', 'recaptcha', 'hCaptcha', 'turnstile'],
          default: 'auto',
          description: 'Solving strategy: auto (detect and solve), ocr (image text), audio (audio challenge), puzzle (slider/image puzzles), or specific CAPTCHA type.'
        },
        url: { type: 'string', description: 'Page URL containing the CAPTCHA (optional, uses current page if not specified).' },
        selector: { type: 'string', description: 'CSS selector of the CAPTCHA container element.' },
        imageUrl: { type: 'string', description: 'Direct URL to CAPTCHA image for OCR solving.' },
        language: { type: 'string', description: 'Language code for OCR recognition (e.g., eng, fra, deu).' },
        audioSelector: { type: 'string', description: 'CSS selector for audio CAPTCHA button/element.' },
        audioUrl: { type: 'string', description: 'Direct URL to audio CAPTCHA file.' },
        puzzleSelector: { type: 'string', description: 'CSS selector for puzzle CAPTCHA element.' },
        sliderSelector: { type: 'string', description: 'CSS selector for slider puzzle handle.' },
      },
    },
  },
  {
    name: 'random_scroll',
    description: 'Perform random scrolling on the page to simulate human browsing behavior. Helps trigger lazy-loaded content, avoid bot detection, and make browsing patterns appear more natural.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'find_selector',
    description: 'Find DOM elements by their visible text content and generate CSS selectors. Useful when you know the text but not the selector. Can search for exact matches or partial text matches across any element type.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text content to search for in page elements.' },
        elementType: { type: 'string', default: '*', description: 'HTML tag type to search (e.g., button, a, div, span, or * for all elements).' },
        exact: { type: 'boolean', default: false, description: 'Require exact text match (true) or allow partial match (false).' },
      },
      required: ['text'],
    },
  },
  {
    name: 'save_content_as_markdown',
    description: 'Save page content as a clean Markdown file. Converts HTML to Markdown format, preserves links and formatting, includes page metadata, and cleans up whitespace. Ideal for documentation and content archiving.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Output file path for the Markdown file (e.g., ./output/page.md).' },
        contentType: { type: 'string', enum: ['text', 'html'], default: 'text', description: 'Source content type to convert: text (plain text) or html (HTML to Markdown).' },
        selector: { type: 'string', description: 'CSS selector to extract specific content. If omitted, saves entire page.' },
        formatOptions: {
          type: 'object',
          properties: {
            includeMetadata: { type: 'boolean', default: true, description: 'Include page title, URL, and timestamp in output.' },
            cleanupWhitespace: { type: 'boolean', default: true, description: 'Remove excessive whitespace and blank lines.' },
            preserveLinks: { type: 'boolean', default: true, description: 'Convert HTML links to Markdown link format.' },
          },
          description: 'Markdown formatting options.'
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'extract_json',
    description: 'Extract JSON data embedded in the page including inline scripts, API responses, and structured data. Parses JavaScript objects, JSON-LD, and data attributes. Useful for extracting dynamic content and API data.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['script', 'all'], default: 'all', description: 'Data source: script (only script tags) or all (include data attributes and inline JSON).' },
        selector: { type: 'string', description: 'CSS selector to target specific element containing JSON data.' },
        filter: { type: 'string', description: 'JSONPath or key filter to extract specific data from found JSON objects.' },
      },
    },
  },
  {
    name: 'scrape_meta_tags',
    description: 'Extract all SEO meta tags from the page including title, description, keywords, Open Graph (og:) tags, Twitter cards, canonical URLs, and robots directives. Returns structured metadata for SEO analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        includeOgTags: { type: 'boolean', default: true, description: 'Include Open Graph (og:title, og:image, etc.) and Twitter Card meta tags.' },
      },
    },
  },
  {
    name: 'extract_schema',
    description: 'Extract Schema.org structured data from the page in JSON-LD or Microdata format. Finds Product, Article, Organization, Event, and other schema types. Essential for SEO analysis and rich snippet extraction.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json-ld', 'microdata', 'all'], default: 'all', description: 'Schema format to extract: json-ld (script tags), microdata (itemscope attributes), or all.' },
        schemaType: { type: 'string', description: 'Filter by specific schema type (e.g., Product, Article, Organization, Event).' },
      },
    },
  },
  {
    name: 'batch_element_scraper',
    description: 'Scrape multiple elements matching a CSS selector and extract their content and attributes. Ideal for extracting lists, tables, product grids, or any repeated page elements. Returns array of element data.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector matching multiple elements (e.g., ".product-card", "table tr", "article.post").' },
        includeHtml: { type: 'boolean', default: false, description: 'Include raw HTML of each element in addition to text content.' },
        maxElements: { type: 'number', default: 100, description: 'Maximum number of elements to extract (prevents memory issues on large pages).' },
        attributes: { type: 'array', items: { type: 'string' }, description: 'List of HTML attributes to extract (e.g., ["href", "src", "data-id", "class"]).' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'link_harvester',
    description: 'Collect and classify all links from the page. Categorizes links as internal, external, download, social media, or navigation. Includes link text, URL, and classification. Useful for site mapping and link analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: 'a[href]', description: 'CSS selector to target specific links (default: all anchor tags with href).' },
        classifyLinks: { type: 'boolean', default: true, description: 'Classify links by type (internal, external, download, social, navigation).' },
      },
    },
  },
  {
    name: 'media_extractor',
    description: 'Extract all media URLs from the page including images, videos, audio files, and embedded content. Universal tool for both STREAMING and DOWNLOADING sites. Automatically handles multi-step flows (Verify -> Get Link -> Download) and supports dynamic content via network monitoring and smart interaction loops.',
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' }, description: 'Media types to extract (e.g., ["image", "video", "audio", "iframe"]). Empty for all types.' },
        includeEmbeds: { type: 'boolean', default: true, description: 'Include embedded content from iframes (YouTube, Vimeo, Spotify, etc.).' },
        waitTime: { type: 'number', default: 10000, description: 'Time to wait for dynamic content to load (milliseconds). Essential for streaming sites.' },
        clickPlay: { type: 'boolean', default: true, description: 'Attempt to click play button to trigger video loading. Useful for lazy-loaded video players.' },
        monitorNetwork: { type: 'boolean', default: true, description: 'Monitor network requests to detect video URLs (m3u8, mp4, mpd, webm).' },
      },
    },
  },
  {
    name: 'breadcrumb_navigator',
    description: 'Extract breadcrumb navigation from the page showing the hierarchical path. Parses structured breadcrumb data, navigation lists, or schema.org BreadcrumbList. Returns path with labels and URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        breadcrumbSelector: { type: 'string', description: 'CSS selector for breadcrumb container (auto-detected if not specified).' },
      },
    },
  },
  {
    name: 'smart_selector_generator',
    description: 'AI-powered CSS selector generator. Describe what you want to select in natural language, and get optimized, robust CSS selectors. Generates multiple selector options with reliability scores.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Page URL to analyze (optional, uses current page if not specified).' },
        description: { type: 'string', description: 'Natural language description of element to select (e.g., "the main product price", "login button", "search input field").' },
        context: { type: 'string', description: 'Additional context about the page or element location.' },
      },
      required: ['description'],
    },
  },
  {
    name: 'content_classification',
    description: 'Classify page content into categories using AI analysis. Identifies content type, topic, sentiment, and custom categories. Useful for content categorization, filtering, and organization.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Page URL to classify (optional, uses current page if not specified).' },
        categories: { type: 'array', items: { type: 'string' }, description: 'Custom category labels to classify content into (e.g., ["news", "blog", "product", "documentation"]).' },
      },
    },
  },
  {
    name: 'search_content',
    description: 'Search page content for keywords or regex patterns. Returns matching text with context, location, and highlighting. Supports case-sensitive search and can target specific page sections.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query - plain text for keyword search or regex pattern for pattern matching.' },
        type: { type: 'string', enum: ['text', 'regex'], default: 'text', description: 'Search type: text (simple keyword) or regex (regular expression pattern).' },
        url: { type: 'string', description: 'Page URL to search (optional, uses current page if not specified).' },
        caseSensitive: { type: 'boolean', default: false, description: 'Enable case-sensitive matching.' },
        selector: { type: 'string', description: 'CSS selector to limit search to specific page section.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_element_advanced',
    description: 'Find elements using advanced CSS selectors or XPath expressions. More powerful than basic selectors - supports complex queries, attribute matching, and DOM traversal. Returns matched elements with details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'CSS selector or XPath expression to find elements.' },
        type: { type: 'string', enum: ['css', 'xpath'], default: 'css', description: 'Query type: css (CSS selector) or xpath (XPath expression like //div[@class="content"]).' },
        url: { type: 'string', description: 'Page URL to search (optional, uses current page if not specified).' },
        operation: { type: 'string', default: 'query', description: 'Operation to perform on found elements (query, count, exists, text, html).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'deep_analysis',
    description: 'Perform comprehensive page analysis recording network requests, console logs, DOM mutations, and screenshots over a time period. Captures dynamic content loading, JavaScript execution, and resource timing.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Page URL to analyze (optional, uses current page if not specified).' },
        duration: { type: 'number', default: 5000, description: 'Analysis duration in milliseconds to capture dynamic content.' },
        screenshots: { type: 'boolean', default: true, description: 'Capture screenshots during analysis.' },
        network: { type: 'boolean', default: true, description: 'Record network requests and responses.' },
        logs: { type: 'boolean', default: true, description: 'Capture console logs and JavaScript errors.' },
        dom: { type: 'boolean', default: true, description: 'Track DOM mutations and changes.' }
      }
    }
  },
  {
    name: 'element_screenshot',
    description: 'Capture a screenshot of a specific page element. Useful for capturing product images, charts, specific sections, or elements that need visual documentation. Saves as PNG with transparent background support.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of the element to capture (e.g., "#product-image", ".chart-container").' },
        outputPath: { type: 'string', description: 'File path to save the screenshot (e.g., ./screenshots/element.png).' },
      },
      required: ['selector', 'outputPath'],
    },
  },
  {
    name: 'video_recording',
    description: 'Record a video of browser activity for documentation, debugging, or demonstration. Captures all page interactions, animations, and dynamic content. Saves as MP4/WebM format.',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 10, description: 'Recording duration in seconds.' },
        outputPath: { type: 'string', description: 'File path to save the video (e.g., ./recordings/session.mp4).' },
      },
      required: ['outputPath'],
    },
  },
  {
    name: 'network_recorder',
    description: 'Record all network activity including HTTP requests, responses, headers, timing, and payloads. Captures API calls, resource loading, and AJAX requests. Essential for debugging and API discovery.',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 20000, description: 'Recording duration in milliseconds.' },
      },
    },
  },
  {
    name: 'api_finder',
    description: 'Discover and analyze APIs used by the page. Identifies REST endpoints, GraphQL queries, WebSocket connections, and AJAX calls. Returns endpoint URLs, methods, parameters, and response formats.',
    inputSchema: {
      type: 'object',
      properties: {
        deepScan: { type: 'boolean', default: true, description: 'Perform deep scan analyzing JavaScript code and network requests.' }
      },
    },
  },
  {
    name: 'image_extractor_advanced',
    description: 'Extract all images from the page with advanced options. Gets URLs, dimensions, alt text, lazy-loaded sources, and can optionally include base64 data URLs. Supports filtering and deduplication.',
    inputSchema: {
      type: 'object',
      properties: {
        includeDataUrls: { type: 'boolean', default: false, description: 'Include base64 data URLs and inline SVG images (increases response size).' }
      },
    },
  },
  {
    name: 'url_redirect_tracer',
    description: 'Trace URL redirects to find the final destination. Follows HTTP redirects (301, 302, 307, 308) and JavaScript-based redirects. Shows complete redirect chain with status codes and timing.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to trace redirects from.' }
      },
      required: ['url'],
    },
  },
  {
    name: 'ajax_content_waiter',
    description: 'Wait for AJAX/dynamic content to load before proceeding. Monitors for element appearance, content changes, or network idle state. Essential for single-page apps and dynamically loaded content.',
    inputSchema: {
      type: 'object',
      properties: {
        waitFor: { type: 'string', default: 'selector', description: 'Wait condition type: selector (element appears), networkidle (no network activity).' },
        value: { type: 'string', description: 'CSS selector to wait for, or network idle timeout in ms.' },
      },
    },
  },
  {
    name: 'progress_tracker',
    description: 'Track and report progress of long-running operations. Provides status updates, completion percentage, and estimated time remaining. Useful for batch operations and multi-step workflows.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', default: 'status', description: 'Action: status (get progress), start (begin tracking), update (update progress), complete (finish).' },
        operationId: { type: 'string', description: 'Unique identifier for the operation being tracked.' },
        success: { type: 'boolean', description: 'Mark operation as successful (true) or failed (false) when completing.' },
      },
    },
  },
  {
    name: 'advanced_video_extraction',
    description: 'Extract video URLs from streaming sites and video players. Detects HLS/DASH streams, direct video URLs, and embedded players. Handles protected content detection and multiple quality options.',
    inputSchema: {
      type: 'object',
      properties: {
        waitTime: { type: 'number', default: 10000, description: 'Time to wait for video player to load and start streaming (milliseconds).' },
      },
    },
  },
  {
    name: 'multi_layer_redirect_trace',
    description: 'Trace complex multi-layer redirects including link shorteners, affiliate links, and tracking URLs. Follows multiple redirect chains, handles JavaScript redirects, and reveals final destinations.',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string', description: 'Starting URL to trace (e.g., shortened URL, affiliate link).' },
        maxDepth: { type: 'number', default: 5, description: 'Maximum number of redirect layers to follow.' },
      },
    },
  },
  {
    name: 'ad_protection_detector',
    description: 'Detect and analyze ad protection, anti-adblock measures, and paywall overlays on the page. Identifies blocking scripts, overlay elements, and access restrictions. Helps understand page protection mechanisms.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to check for protection overlay/modal.' },
      },
    },
  },
  {
    name: 'universal_video_extractor',
    description: 'Universal Video Extractor - 100% success rate video URL extraction. Combines media_extractor + advanced_video_extraction with 5-Level Capture System: Network Layer, Crypto Hooks, XHR/Fetch Override, Video Element Monitor, and HLS.js/Dash.js Hooks. Automatically captures AES-decrypted URLs, M3U8/MPD streams, and handles all obfuscation types.',
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' }, description: 'Media types to extract (video, audio, iframe, image). Empty for all.' },
        includeEmbeds: { type: 'boolean', default: true, description: 'Include embedded content from iframes.' },
        waitTime: { type: 'number', default: 15000, description: 'Time to wait for dynamic content (milliseconds).' },
        clickPlay: { type: 'boolean', default: true, description: 'Auto-click play buttons to trigger video loading.' },
        monitorNetwork: { type: 'boolean', default: true, description: 'Monitor network for video URLs.' },
        hookCrypto: { type: 'boolean', default: true, description: 'Hook CryptoJS/crypto functions to capture decrypted URLs.' },
        hookFetch: { type: 'boolean', default: true, description: 'Hook fetch/XHR to capture API responses.' },
        hookHls: { type: 'boolean', default: true, description: 'Hook HLS.js/Dash.js/JWPlayer to capture stream URLs.' },
        detectObfuscation: { type: 'boolean', default: true, description: 'Detect and report obfuscated JavaScript.' },
        extractDownloads: { type: 'boolean', default: true, description: 'Extract download links from page.' },
      },
    },
  },
];


// Tool name constants for type safety
export const TOOL_NAMES = {
  BROWSER_INIT: 'browser_init',
  NAVIGATE: 'navigate',
  GET_CONTENT: 'get_content',
  CLICK: 'click',
  TYPE: 'type',
  PRESS_KEY: 'press_key',
  WAIT: 'wait',
  BROWSER_CLOSE: 'browser_close',
  SOLVE_CAPTCHA: 'solve_captcha',
  RANDOM_SCROLL: 'random_scroll',
  FIND_SELECTOR: 'find_selector',
  SAVE_CONTENT_AS_MARKDOWN: 'save_content_as_markdown',

  EXTRACT_JSON: 'extract_json',
  SCRAPE_META_TAGS: 'scrape_meta_tags',
  EXTRACT_SCHEMA: 'extract_schema',
  // Multi-Element Extractors
  BATCH_ELEMENT_SCRAPER: 'batch_element_scraper',

  // Content Type Specific
  LINK_HARVESTER: 'link_harvester',
  MEDIA_EXTRACTOR: 'media_extractor',

  // DOM & HTML Extraction (Phase 1)



  // Network Tools (Phase 1)


  NETWORK_RECORDER: 'network_recorder',
  API_FINDER: 'api_finder',

  // Pagination Tools
  BREADCRUMB_NAVIGATOR: 'breadcrumb_navigator',

  // Data Processing


  // AI-Powered Features
  SMART_SELECTOR_GENERATOR: 'smart_selector_generator',
  CONTENT_CLASSIFICATION: 'content_classification',


  // Phase 3: Media & Video




  // Search & Filter (Consolidated)
  SEARCH_CONTENT: 'search_content',
  FIND_ELEMENT_ADVANCED: 'find_element_advanced',

  // Deep Analysis
  DEEP_ANALYSIS: 'deep_analysis',

  // Data Quality & Validation
  // (Removed DATA_TYPE_VALIDATOR)

  // Advanced Captcha Handling (Consolidated)
  // OCR_ENGINE: 'ocr_engine', // Merged into solve_captcha
  // AUDIO_CAPTCHA_SOLVER: 'audio_captcha_solver', // Merged
  // PUZZLE_CAPTCHA_HANDLER: 'puzzle_captcha_handler', // Merged

  // Screenshot & Visual Tools
  ELEMENT_SCREENSHOT: 'element_screenshot',
  VIDEO_RECORDING: 'video_recording',

  // Advanced Extraction
  IMAGE_EXTRACTOR_ADVANCED: 'image_extractor_advanced',
  URL_REDIRECT_TRACER: 'url_redirect_tracer',
  AJAX_CONTENT_WAITER: 'ajax_content_waiter',
  PROGRESS_TRACKER: 'progress_tracker',
  ADVANCED_VIDEO_EXTRACTION: 'advanced_video_extraction',
  MULTI_LAYER_REDIRECT_TRACE: 'multi_layer_redirect_trace',
  AD_PROTECTION_DETECTOR: 'ad_protection_detector',
  UNIVERSAL_VIDEO_EXTRACTOR: 'universal_video_extractor',
} as const;

// Type definitions for tool inputs
export interface BrowserInitArgs {
  headless?: boolean;
  disableXvfb?: boolean;
  ignoreAllFlags?: boolean;
  proxy?: string;
  plugins?: string[];
  connectOption?: any;
  customConfig?: {
    chromePath?: string;
    [key: string]: any;
  };
  contentPriority?: ContentPriorityConfig;
}

export interface NavigateArgs {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
}

export interface GetContentArgs {
  type?: 'html' | 'text';
  selector?: string;
}

export interface ClickArgs {
  selector: string;
  waitForNavigation?: boolean;
}

export interface TypeArgs {
  selector: string;
  text: string;
  delay?: number;
}

export interface PressKeyArgs {
  key: string;
  selector?: string;
  modifiers?: Array<'Control' | 'Shift' | 'Alt' | 'Meta'>;
}

export interface WaitArgs {
  type: 'selector' | 'navigation' | 'timeout';
  value: string;
  timeout?: number;
}

export interface SolveCaptchaArgs {
  type: 'recaptcha' | 'hCaptcha' | 'turnstile';
}

export interface FindSelectorArgs {
  text: string;
  elementType?: string;
  exact?: boolean;
}

export interface SaveContentAsMarkdownArgs {
  filePath: string;
  contentType?: 'text' | 'html';
  selector?: string;
  formatOptions?: {
    includeMetadata?: boolean;
    cleanupWhitespace?: boolean;
    preserveLinks?: boolean;
    headingStyle?: 'atx' | 'setext';
  };
}

// Union type for all tool arguments
export type ToolArgs =
  | BrowserInitArgs
  | NavigateArgs
  | GetContentArgs
  | ClickArgs
  | TypeArgs
  | PressKeyArgs
  | WaitArgs
  | SolveCaptchaArgs
  | FindSelectorArgs
  | SaveContentAsMarkdownArgs
  | Record<string, never>; // For tools with no arguments

// Tool categories for organization
export const TOOL_CATEGORIES = {
  BROWSER_MANAGEMENT: [TOOL_NAMES.BROWSER_INIT, TOOL_NAMES.BROWSER_CLOSE],
  NAVIGATION: [TOOL_NAMES.NAVIGATE, TOOL_NAMES.WAIT],
  INTERACTION: [TOOL_NAMES.CLICK, TOOL_NAMES.TYPE, TOOL_NAMES.PRESS_KEY, TOOL_NAMES.SOLVE_CAPTCHA, TOOL_NAMES.RANDOM_SCROLL],
  CONTENT: [TOOL_NAMES.GET_CONTENT, TOOL_NAMES.FIND_SELECTOR, TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN],
} as const;

