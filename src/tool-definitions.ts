// MCP Tool Definitions and Schemas

// Server metadata
export const SERVER_INFO = {
  name: 'brave-real-browser-mcp-server',
  version: '2.25.0',
};

// MCP capabilities with LSP-compatible streaming support
export const CAPABILITIES = {
  tools: {},
  resources: { subscribe: true, listChanged: true },
  prompts: { listChanged: true },
};

// MCP Resources - Dynamic browser state resources
export const RESOURCES = [
  {
    uri: 'browser://state',
    name: 'Browser State',
    description: 'Current browser instance state including page URL, title, and session info',
    mimeType: 'application/json',
  },
  {
    uri: 'browser://page/content',
    name: 'Page Content',
    description: 'Current page HTML content',
    mimeType: 'text/html',
  },
  {
    uri: 'browser://page/text',
    name: 'Page Text',
    description: 'Current page text content (no HTML)',
    mimeType: 'text/plain',
  },
  {
    uri: 'browser://cookies',
    name: 'Browser Cookies',
    description: 'All cookies in current browser session',
    mimeType: 'application/json',
  },
  {
    uri: 'browser://network/requests',
    name: 'Network Requests',
    description: 'Recent network requests captured during browsing',
    mimeType: 'application/json',
  },
  {
    uri: 'browser://console/logs',
    name: 'Console Logs',
    description: 'Browser console log messages',
    mimeType: 'application/json',
  },
];

// MCP Prompts - Reusable automation workflows
export const PROMPTS = [
  {
    name: 'scrape_website',
    description: 'Scrape content from a website with automatic navigation and extraction',
    arguments: [
      { name: 'url', description: 'URL to scrape', required: true },
      { name: 'selector', description: 'CSS selector for target content', required: false },
      { name: 'outputFormat', description: 'Output format (json, markdown, text)', required: false },
    ],
  },
  {
    name: 'extract_download_links',
    description: 'Extract all download links from a page with quality and size info',
    arguments: [
      { name: 'url', description: 'Page URL to extract from', required: true },
      { name: 'fileTypes', description: 'File types to extract (mp4, mkv, pdf, etc.)', required: false },
    ],
  },
  {
    name: 'monitor_page_changes',
    description: 'Monitor a page for changes and notify when content updates',
    arguments: [
      { name: 'url', description: 'URL to monitor', required: true },
      { name: 'selector', description: 'Element to watch for changes', required: true },
      { name: 'interval', description: 'Check interval in seconds', required: false },
    ],
  },
  {
    name: 'automate_login',
    description: 'Automate login to a website with credentials',
    arguments: [
      { name: 'url', description: 'Login page URL', required: true },
      { name: 'usernameSelector', description: 'Username field selector', required: true },
      { name: 'passwordSelector', description: 'Password field selector', required: true },
      { name: 'submitSelector', description: 'Submit button selector', required: true },
    ],
  },
  {
    name: 'batch_screenshot',
    description: 'Take screenshots of multiple URLs',
    arguments: [
      { name: 'urls', description: 'Comma-separated list of URLs', required: true },
      { name: 'outputDir', description: 'Directory to save screenshots', required: true },
    ],
  },
  {
    name: 'extract_video_stream',
    description: 'Extract video streaming URL from a page (m3u8, mp4)',
    arguments: [
      { name: 'url', description: 'Video page URL', required: true },
      { name: 'quality', description: 'Preferred quality (highest, 1080p, 720p)', required: false },
    ],
  },
];

// Extended capabilities for streaming and auto-sync (for documentation/client info)
export const EXTENDED_CAPABILITIES = {
  streaming: true,
  sessionManagement: true,
  autoSync: true,
  progressNotifications: true,
  transports: ['stdio', 'sse', 'http-stream'],
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
export const TOOLS = [
  {
    name: 'browser_init',
    description: 'Initialize a new Brave browser instance with anti-detection features, built-in uBlock Origin, and Stealth mode',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        headless: {
          type: 'boolean',
          description: 'Run browser in headless mode',
          default: false,
        },
        disableXvfb: {
          type: 'boolean',
          description: 'Disable Xvfb (X Virtual Framebuffer)',
          default: false,
        },
        ignoreAllFlags: {
          type: 'boolean',
          description: 'Ignore all browser flags (recommended: true for clean startup)',
          default: true,
        },
        proxy: {
          type: 'string',
          description: 'Proxy server URL (format: protocol://host:port)',
        },
        plugins: {
          type: 'array',
          description: 'Array of plugins to load',
          items: {
            type: 'string',
          },
        },
        connectOption: {
          type: 'string',
          description: 'JSON string of additional connection options (e.g. {"defaultViewport": null})',
        },
        customConfig: {
          type: 'object',
          description: 'Custom configuration for Brave launcher',
          properties: {
            bravePath: {
              type: 'string',
              description: 'Custom path to Brave executable',
            },
          },
          additionalProperties: false,
        },
        contentPriority: {
          type: 'object',
          description: 'Configuration for content-first workflow enforcement',
          properties: {
            prioritizeContent: {
              type: 'boolean',
              description: 'Prioritize get_content method for better reliability and workflow enforcement',
              default: true,
            },
            autoSuggestGetContent: {
              type: 'boolean',
              description: 'Automatically suggest get_content alternatives when other methods fail',
              default: true,
            },
          },
          additionalProperties: false,
        },
      },
    },
  },
  {
    name: 'navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: {
          type: 'string',
          description: 'The URL to navigate to',
        },
        waitUntil: {
          type: 'string',
          description: 'When to consider navigation complete',
          enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
          default: 'domcontentloaded',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_content',
    description: '**Recommended** method to get page content (HTML or text) - More reliable than screenshots for content analysis and navigation tasks',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: ['html', 'text'],
          description: 'Type of content to retrieve',
          default: 'html',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to get content from specific element',
        },
      },
    },
  },
  {
    name: 'wait',
    description: 'Wait for various conditions',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: ['selector', 'navigation', 'timeout'],
          description: 'Type of wait condition',
        },
        value: {
          type: 'string',
          description: 'Selector to wait for or timeout in ms',
        },
        timeout: {
          type: 'number',
          description: 'Maximum wait time in ms',
          default: 30000,
        },
      },
      required: ['type', 'value'],
    },
  },
  {
    name: 'click',
    description: 'Click on an element',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element to click. Also supports direct text content (e.g., "Download") for AI convenience.',
        },
        waitForNavigation: {
          type: 'boolean',
          description: 'Wait for navigation after click',
          default: false,
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'type',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of input element',
        },
        text: {
          type: 'string',
          description: 'Text to type',
        },
        delay: {
          type: 'number',
          description: 'Delay between keystrokes in ms',
          default: 100,
        },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'browser_close',
    description: 'Close the browser instance',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        force: {
          type: 'boolean',
          description: 'Force close',
          default: false
        }
      },
    },
  },
  {
    name: 'solve_captcha',
    description: 'Attempt to solve CAPTCHAs (if supported)',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: {
          type: 'string',
          enum: ['recaptcha', 'hCaptcha', 'turnstile'],
          description: 'Type of captcha to solve',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'random_scroll',
    description: 'Perform random scrolling with natural timing',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        steps: {
          type: 'number',
          description: 'Number of scroll steps',
          default: 10
        }
      },
    },
  },
  {
    name: 'find_element',
    description: 'Find elements using text, CSS selector, XPath, attributes, or AI-powered description. Supports Shadow DOM and cross-frame search.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        text: { type: 'string', description: 'Text content to search for in elements' },
        selector: { type: 'string', description: 'CSS selector' },
        xpath: { type: 'string', description: 'XPath expression' },
        attributes: { type: 'string', description: 'JSON string of attributes to match' },
        description: { type: 'string', description: 'Natural language description (AI-powered)' },
        elementType: { type: 'string', description: 'HTML element type (e.g., button, a, div)', default: '*' },
        exact: { type: 'boolean', description: 'Exact text match', default: false },
        context: { type: 'string', description: 'Additional context for AI search' },
        shadowDOM: { type: 'boolean', description: 'Search inside Shadow DOM elements', default: false },
        searchFrames: { type: 'boolean', description: 'Search across all iframes/frames', default: false },
      },
    },
  },
  {
    name: 'save_content_as_markdown',
    description: 'Extract page content and save it as a formatted markdown file',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute path where the markdown file should be saved (must end with .md)',
        },
        contentType: {
          type: 'string',
          enum: ['text', 'html'],
          description: 'Type of content to extract and convert',
          default: 'text',
        },
        selector: {
          type: 'string',
          description: 'Optional CSS selector to extract content from specific element',
        },
        formatOptions: {
          type: 'object',
          description: 'Options for markdown formatting',
          properties: {
            includeMetadata: {
              type: 'boolean',
              description: 'Include metadata header with timestamp and source URL',
              default: true,
            },
            cleanupWhitespace: {
              type: 'boolean',
              description: 'Clean up excessive whitespace in the output',
              default: true,
            },
            preserveLinks: {
              type: 'boolean',
              description: 'Preserve link URLs in markdown format',
              default: true,
            },
            headingStyle: {
              type: 'string',
              enum: ['atx', 'setext'],
              description: 'Heading style for markdown conversion',
              default: 'atx',
            },
          },
          additionalProperties: false,
        },
      },
      required: ['filePath'],
    },
  },
  // ============================================================
  // ADVANCED TOOLS (24 advanced tools)
  // ============================================================
  {
    name: 'breadcrumb_navigator',
    description: 'Navigate using site breadcrumbs - find and click breadcrumb links',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        targetIndex: { type: 'number', description: 'Index of breadcrumb to click (0-based)' },
        targetText: { type: 'string', description: 'Text of breadcrumb to click' },
      },
    },
  },
  {
    name: 'redirect_tracer',
    description: 'Trace URL redirects including standard, JavaScript, and meta refresh redirects',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: { type: 'string', description: 'URL to trace redirects for' },
        maxRedirects: { type: 'number', description: 'Maximum redirects to follow', default: 10 },
        includeJsRedirects: { type: 'boolean', description: 'Include JavaScript redirects', default: false },
        includeMetaRefresh: { type: 'boolean', description: 'Include meta refresh redirects', default: false },
        timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
      },
      required: ['url'],
    },
  },
  {
    name: 'search_content',
    description: 'Search text or Regex patterns in page content',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        pattern: { type: 'string', description: 'Search pattern (text or regex)' },
        isRegex: { type: 'boolean', description: 'Treat pattern as regex', default: false },
        caseSensitive: { type: 'boolean', description: 'Case sensitive search', default: false },
        selector: { type: 'string', description: 'CSS selector to limit search scope' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'extract_json',
    description: 'Extract embedded JSON/API data from page (LD+JSON, __NEXT_DATA__, etc.) + Advanced Decode capabilities for complex websites (base64, URL, hex, rot13, multi-layer) + Packed JavaScript decoder (eval/function(p,a,c,k,e,d) unpacker)',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        // Original JSON extraction
        selector: { type: 'string', description: 'CSS selector for script tags' },
        scriptIndex: { type: 'number', description: 'Index of script to extract' },
        variableName: { type: 'string', description: 'Window variable name to extract' },
        // Advanced Decode capabilities
        decodeBase64: { type: 'string', description: 'Direct base64 string to decode' },
        decodeFromUrl: { type: 'string', description: 'URL to extract and decode encoded parameter from (e.g., gadgetsweb.xyz/?id=xxx)' },
        decodeUrlParam: { type: 'string', description: 'URL parameter name to decode (default: id)', default: 'id' },
        decodePattern: { type: 'string', description: 'Regex pattern to find and decode base64 strings in page content' },
        // NEW: Packed JavaScript decoder
        decodePackedJs: { type: 'boolean', description: 'Auto-detect and decode packed JavaScript (eval/function(p,a,c,k,e,d)) in page scripts. Extracts m3u8/stream URLs automatically.', default: false },
        advancedDecode: {
          type: 'object',
          description: 'Multi-layer decode for complex obfuscation (supports base64, url, hex, rot13, reverse, unpackJs)',
          properties: {
            input: { type: 'string', description: 'Input string to decode (if not using page content)' },
            layers: {
              type: 'array',
              items: { type: 'string', enum: ['base64', 'url', 'hex', 'rot13', 'reverse', 'unpackJs'] },
              description: 'Decode layers to apply in order (e.g., ["base64", "url", "unpackJs"])'
            },
            extractFromPage: { type: 'boolean', description: 'Extract input from current page content', default: false },
            pageSelector: { type: 'string', description: 'CSS selector to extract from (for extractFromPage)' },
          },
        },
      },
    },
  },
  {
    name: 'scrape_meta_tags',
    description: 'Extract SEO and Open Graph meta tags from page',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        includeOG: { type: 'boolean', description: 'Include Open Graph tags', default: true },
        includeTwitter: { type: 'boolean', description: 'Include Twitter cards', default: true },
        includeSchema: { type: 'boolean', description: 'Include Schema.org', default: false },
      },
    },
  },
  {
    name: 'press_key',
    description: 'Simulate keyboard key presses with optional modifiers',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        key: { type: 'string', description: 'Key to press (e.g., "Enter", "Tab", "Escape")' },
        modifiers: { type: 'array', items: { type: 'string' }, description: 'Modifier keys (Control, Shift, Alt, Meta)' },
        count: { type: 'number', description: 'Number of times to press', default: 1 },
        delay: { type: 'number', description: 'Delay between presses in ms', default: 100 },
      },
      required: ['key'],
    },
  },
  {
    name: 'progress_tracker',
    description: 'Track automation progress for multi-step tasks',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        taskName: { type: 'string', description: 'Name of the task' },
        currentStep: { type: 'number', description: 'Current step number' },
        totalSteps: { type: 'number', description: 'Total number of steps' },
        message: { type: 'string', description: 'Progress message' },
      },
      required: ['taskName', 'currentStep', 'totalSteps'],
    },
  },
  {
    name: 'deep_analysis',
    description: 'Comprehensive analysis: Console logs, Network traffic, DOM stats, and Screenshot',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        includeConsole: { type: 'boolean', description: 'Include console logs', default: true },
        includeNetwork: { type: 'boolean', description: 'Include network requests', default: true },
        includeDom: { type: 'boolean', description: 'Include DOM statistics', default: true },
        includeScreenshot: { type: 'boolean', description: 'Include screenshot', default: false },
        duration: { type: 'number', description: 'Recording duration in ms', default: 5000 },
      },
    },
  },
  {
    name: 'network_recorder',
    description: 'Record full network traffic including headers and body',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        duration: { type: 'number', description: 'Recording duration in ms', default: 10000 },
        filterUrl: { type: 'string', description: 'Filter requests by URL pattern' },
        includeHeaders: { type: 'boolean', description: 'Include request headers', default: false },
        includeBody: { type: 'boolean', description: 'Include request body', default: false },
      },
    },
  },
  {
    name: 'api_finder',
    description: 'Discover hidden API endpoints by monitoring network traffic',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        patterns: { type: 'array', items: { type: 'string' }, description: 'URL patterns to match' },
        includeInternal: { type: 'boolean', description: 'Include internal XHR/fetch', default: true },
      },
    },
  },
  {
    name: 'ajax_content_waiter',
    description: 'Wait for dynamic AJAX/JavaScript content to load',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        selector: { type: 'string', description: 'CSS selector to wait for' },
        timeout: { type: 'number', description: 'Maximum wait time in ms', default: 30000 },
        pollInterval: { type: 'number', description: 'Check interval in ms', default: 500 },
        expectedContent: { type: 'string', description: 'Expected text content to wait for' },
      },
    },
  },
  // media_extractor REMOVED - functionality merged into stream_extractor
  {
    name: 'element_screenshot',
    description: 'Capture screenshot of a specific element',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to capture' },
        path: { type: 'string', description: 'File path to save screenshot' },
        format: { type: 'string', enum: ['png', 'jpeg', 'webp'], description: 'Image format', default: 'png' },
        quality: { type: 'number', description: 'Quality for JPEG/WebP (0-100)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'link_harvester',
    description: 'Harvest all links from page with filtering options',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        filter: { type: 'string', description: 'Filter links by URL or text pattern' },
        includeExternal: { type: 'boolean', description: 'Include external links', default: true },
        includeInternal: { type: 'boolean', description: 'Include internal links', default: true },
        maxLinks: { type: 'number', description: 'Maximum links to return' },
      },
    },
  },
  {
    name: 'batch_element_scraper',
    description: 'Efficiently scrape lists of similar elements',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        selector: { type: 'string', description: 'CSS selector for elements to scrape' },
        attributes: { type: 'array', items: { type: 'string' }, description: 'Attributes to extract' },
        limit: { type: 'number', description: 'Maximum elements to scrape', default: 100 },
      },
      required: ['selector'],
    },
  },
  {
    name: 'extract_schema',
    description: 'Extract Schema.org structured data (JSON-LD and Microdata)',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        schemaTypes: { type: 'array', items: { type: 'string' }, description: 'Schema types to extract (e.g., Product, Article)' },
      },
    },
  },
  // m3u8_parser REMOVED - functionality merged into stream_extractor
  {
    name: 'cookie_manager',
    description: 'Manage browser cookies for premium accounts and sessions',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'delete', 'export', 'import', 'clear'], description: 'Cookie action to perform' },
        domain: { type: 'string', description: 'Domain to filter cookies' },
        cookies: { type: 'array', items: { type: 'object' }, description: 'Cookies to set (for set/import action)' },
        name: { type: 'string', description: 'Cookie name (for get/delete action)' },
        filePath: { type: 'string', description: 'File path for export/import' },
        format: { type: 'string', enum: ['json', 'netscape'], description: 'Export/Import format', default: 'json' },
      },
      required: ['action'],
    },
  },
  // ============================================================
  // FILE DOWNLOAD TOOLS (2 new tools)
  // ============================================================
  {
    name: 'file_downloader',
    description: 'Download a file from URL directly to disk with progress tracking',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: { type: 'string', description: 'URL of the file to download' },
        savePath: { type: 'string', description: 'Absolute path where to save the file' },
        filename: { type: 'string', description: 'Optional filename (auto-detected if not provided)' },
        overwrite: { type: 'boolean', description: 'Overwrite existing file', default: false },
        headers: { type: 'string', description: 'JSON string of custom headers' },
        timeout: { type: 'number', description: 'Download timeout in ms', default: 300000 },
      },
      required: ['url', 'savePath'],
    },
  },
  // ============================================================
  // ENHANCED STREAMING/DOWNLOAD TOOLS
  // ============================================================
  {
    name: 'iframe_handler',
    description: 'Extract content from nested iframes including embedded video players. Use action=deep_scrape for HTTP-based recursive crawling of complex streaming sites (5x faster than browser navigation)',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['list', 'enter', 'extract', 'exitAll', 'deep_scrape'], description: 'Action to perform. deep_scrape: HTTP-based recursive iframe crawling for complex sites' },
        selector: { type: 'string', description: 'CSS selector of target iframe' },
        frameIndex: { type: 'number', description: 'Index of iframe to enter (0-based)' },
        maxDepth: { type: 'number', description: 'Maximum nesting depth to traverse', default: 3 },
        extractSelector: { type: 'string', description: 'Selector to extract content from within iframe' },
        recursive: { type: 'boolean', description: 'Traverse nested iframes via HTTP (for deep_scrape)', default: true },
        flatten: { type: 'boolean', description: 'Return flat list vs tree structure', default: true },
        filterPattern: { type: 'string', description: 'Regex to filter iframe URLs (e.g., "multimoviesshg|streamhg")' },
        extractVideoSources: { type: 'boolean', description: 'Auto-extract m3u8/mp4 video sources', default: true },
        timeout: { type: 'number', description: 'HTTP request timeout in ms', default: 10000 },
      },
    },
  },

  {
    name: 'stream_extractor',
    description: 'Master tool: Extract direct download/stream URLs from any page with automatic redirect following, countdown waiting, and format detection',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: { type: 'string', description: 'Source page URL to extract from' },
        maxRedirects: { type: 'number', description: 'Maximum redirects to follow', default: 10 },
        waitForCountdown: { type: 'boolean', description: 'Wait for countdown timers', default: true },
        bypassCloudflare: { type: 'boolean', description: 'Handle Cloudflare if detected', default: true },
        formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Preferred formats to extract',
          default: ['mp4', 'mkv', 'm3u8', 'mp3'],
        },
        quality: { type: 'string', description: 'Preferred quality (highest, lowest, 1080p, 720p)', default: 'highest' },
      },
    },
  },
  {
    name: 'js_scrape',
    description: 'Single-call JavaScript-rendered content extraction. Combines navigation, auto-wait, scrolling, and content extraction. Perfect for AJAX/dynamic pages that Jsoup cannot parse.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        url: { type: 'string', description: 'URL to scrape (required)' },
        waitForSelector: { type: 'string', description: 'CSS selector to wait for before extracting content' },
        waitForTimeout: { type: 'number', description: 'Maximum wait time in ms', default: 10000 },
        extractSelector: { type: 'string', description: 'CSS selector for specific elements to extract (optional, extracts full page if not specified)' },
        extractAttributes: { type: 'array', items: { type: 'string' }, description: 'Attributes to extract from elements (e.g., href, src, data-*)' },
        returnType: { type: 'string', enum: ['html', 'text', 'elements'], description: 'Return format', default: 'html' },
        scrollToLoad: { type: 'boolean', description: 'Scroll page to trigger lazy loading', default: true },
        closeBrowserAfter: { type: 'boolean', description: 'Close browser after scraping', default: false },
      },
      required: ['url'],
    },
  },
  // ============================================================
  // NEW: EXECUTE_JS & PLAYER_API_HOOK TOOLS
  // ============================================================
  {
    name: 'execute_js',
    description: 'Execute custom JavaScript code on the page. ULTRA POWERFUL: Run any JS and get results. Perfect for extracting data from complex obfuscated pages.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
        returnValue: { type: 'boolean', description: 'Whether to return the result', default: true },
        waitForResult: { type: 'number', description: 'Max wait time for async code (ms)', default: 5000 },
        context: { type: 'string', enum: ['page', 'isolated'], description: 'Execution context', default: 'page' },
      },
      required: ['code'],
    },
  },
  {
    name: 'player_api_hook',
    description: 'Hook into video player APIs to extract sources, state, and configuration. ULTRA POWERFUL: Detects JWPlayer, Video.js, HLS.js, Plyr, Vidstack, DASH.js, DoopPlayer and extracts all stream URLs including from network resources and page scripts.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['detect', 'getSources', 'getState', 'extractAll'], description: 'Action to perform', default: 'extractAll' },
        playerType: { type: 'string', enum: ['auto', 'jwplayer', 'videojs', 'plyr', 'hlsjs', 'dashjs', 'vidstack', 'doop_player', 'custom'], description: 'Target player type', default: 'auto' },
        customSelector: { type: 'string', description: 'CSS selector for custom players' },
        waitForPlayer: { type: 'number', description: 'Wait time for player to initialize (ms)', default: 3000 },
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
  WAIT: 'wait',
  BROWSER_CLOSE: 'browser_close',
  SOLVE_CAPTCHA: 'solve_captcha',
  RANDOM_SCROLL: 'random_scroll',
  FIND_ELEMENT: 'find_element',
  SAVE_CONTENT_AS_MARKDOWN: 'save_content_as_markdown',
  // Advanced tools
  BREADCRUMB_NAVIGATOR: 'breadcrumb_navigator',
  REDIRECT_TRACER: 'redirect_tracer',
  SEARCH_CONTENT: 'search_content',
  EXTRACT_JSON: 'extract_json',
  SCRAPE_META_TAGS: 'scrape_meta_tags',
  PRESS_KEY: 'press_key',
  PROGRESS_TRACKER: 'progress_tracker',
  DEEP_ANALYSIS: 'deep_analysis',
  NETWORK_RECORDER: 'network_recorder',
  API_FINDER: 'api_finder',
  AJAX_CONTENT_WAITER: 'ajax_content_waiter',
  // MEDIA_EXTRACTOR: 'media_extractor', // REMOVED - merged into STREAM_EXTRACTOR
  ELEMENT_SCREENSHOT: 'element_screenshot',
  LINK_HARVESTER: 'link_harvester',
  BATCH_ELEMENT_SCRAPER: 'batch_element_scraper',
  EXTRACT_SCHEMA: 'extract_schema',
  // M3U8_PARSER: 'm3u8_parser', // REMOVED - merged into STREAM_EXTRACTOR
  COOKIE_MANAGER: 'cookie_manager',
  FILE_DOWNLOADER: 'file_downloader',
  // Enhanced tools
  IFRAME_HANDLER: 'iframe_handler',
  STREAM_EXTRACTOR: 'stream_extractor',
  JS_SCRAPE: 'js_scrape',
  // New JS extraction tools
  EXECUTE_JS: 'execute_js',
  PLAYER_API_HOOK: 'player_api_hook',

} as const;

// Type definitions for tool inputs
export interface BrowserInitArgs {
  headless?: boolean;
  disableXvfb?: boolean;
  ignoreAllFlags?: boolean;
  proxy?: string;
  plugins?: string[];
  connectOption?: string;
  customConfig?: {
    bravePath?: string;
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

export interface WaitArgs {
  type: 'selector' | 'navigation' | 'timeout';
  value: string;
  timeout?: number;
}

export interface SolveCaptchaArgs {
  type: 'recaptcha' | 'hCaptcha' | 'turnstile';
}

export interface FindSelectorArgs {
  text?: string;
  selector?: string;
  xpath?: string;
  attributes?: string;
  description?: string;
  elementType?: string;
  exact?: boolean;
  context?: string;
  shadowDOM?: boolean;
  searchFrames?: boolean;
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
  | WaitArgs
  | SolveCaptchaArgs
  | FindSelectorArgs
  | SaveContentAsMarkdownArgs
  | Record<string, never>; // For tools with no arguments

// Tool categories for organization
export const TOOL_CATEGORIES = {
  BROWSER_MANAGEMENT: [TOOL_NAMES.BROWSER_INIT, TOOL_NAMES.BROWSER_CLOSE],
  NAVIGATION: [TOOL_NAMES.NAVIGATE, TOOL_NAMES.WAIT],
  INTERACTION: [TOOL_NAMES.CLICK, TOOL_NAMES.TYPE, TOOL_NAMES.SOLVE_CAPTCHA, TOOL_NAMES.RANDOM_SCROLL],
  CONTENT: [TOOL_NAMES.GET_CONTENT, TOOL_NAMES.FIND_ELEMENT, TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN],
} as const;