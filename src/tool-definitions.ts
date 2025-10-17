// MCP Tool Definitions and Schemas

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
export const TOOLS = [
  {
    name: 'browser_init',
    description: 'Initialize a new browser instance with anti-detection features and automatic Brave Browser path detection',
    inputSchema: {
      type: 'object',
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
          type: 'object',
          description: 'Additional connection options',
          additionalProperties: true,
        },
        customConfig: {
          type: 'object',
          description: 'Custom configuration for Brave Browser launcher. Use chromePath property to specify custom Brave executable path (property name kept for API compatibility)',
          properties: {
            chromePath: {
              type: 'string',
              description: 'Custom path to Brave Browser executable (auto-detected if not specified). Note: Property name is chromePath for API compatibility with brave-real-browser',
            },
          },
          additionalProperties: true,
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
    name: 'click',
    description: 'Click on an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element to click',
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
    name: 'wait',
    description: 'Wait for various conditions',
    inputSchema: {
      type: 'object',
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
    name: 'browser_close',
    description: 'Close the browser instance',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'solve_captcha',
    description: 'Attempt to solve CAPTCHAs (if supported)',
    inputSchema: {
      type: 'object',
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
      properties: {},
    },
  },
  {
    name: 'find_selector',
    description: 'Find CSS selector for element containing specific text',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text content to search for in elements',
        },
        elementType: {
          type: 'string',
          description: 'HTML element type to search within (e.g., "button", "a", "div"). Default is "*" for any element',
          default: '*',
        },
        exact: {
          type: 'boolean',
          description: 'Whether to match exact text (true) or partial text (false)',
          default: false,
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'save_content_as_markdown',
    description: 'Extract page content and save it as a formatted markdown file',
    inputSchema: {
      type: 'object',
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
  // Smart Data Extractors
  {
    name: 'scrape_table',
    description: 'HTML tables से structured data extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Table selector', default: 'table' },
        includeHeaders: { type: 'boolean', default: true },
        cleanData: { type: 'boolean', default: true },
        maxRows: { type: 'number', default: 1000 },
      },
    },
  },
  {
    name: 'extract_list',
    description: 'Bullet lists और numbered lists से data extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: 'ul, ol' },
        includeNested: { type: 'boolean', default: true },
        maxItems: { type: 'number', default: 500 },
      },
    },
  },
  {
    name: 'extract_json',
    description: 'Page में embedded JSON/API data extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        source: { type: 'string', enum: ['script', 'all'], default: 'all' },
        selector: { type: 'string' },
        filter: { type: 'string' },
      },
    },
  },
  {
    name: 'scrape_meta_tags',
    description: 'SEO meta tags और Open Graph data extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        includeOgTags: { type: 'boolean', default: true },
        includeTwitterCards: { type: 'boolean', default: true },
        includeCustomTags: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'extract_schema',
    description: 'Schema.org structured data (JSON-LD, Microdata) extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json-ld', 'microdata', 'all'], default: 'all' },
        schemaType: { type: 'string' },
      },
    },
  },
  // Multi-Element Extractors
  {
    name: 'batch_element_scraper',
    description: 'Multiple similar elements को batch में scrape करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        includeHtml: { type: 'boolean', default: false },
        maxElements: { type: 'number', default: 100 },
        attributes: { type: 'array', items: { type: 'string' } },
      },
      required: ['selector'],
    },
  },
  {
    name: 'nested_data_extraction',
    description: 'Parent-child relationships maintain करते हुए data extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        parentSelector: { type: 'string' },
        childSelector: { type: 'string' },
        maxParents: { type: 'number', default: 50 },
      },
      required: ['parentSelector', 'childSelector'],
    },
  },
  {
    name: 'attribute_harvester',
    description: 'Elements के attributes (href, src, data-*) collect करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        attributes: { type: 'array', items: { type: 'string' } },
        maxElements: { type: 'number', default: 100 },
      },
      required: ['selector'],
    },
  },
  // Content Type Specific Extractors
  {
    name: 'image_scraper',
    description: 'सभी images URLs, alt text, dimensions के साथ extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: 'img' },
        includeDataUrls: { type: 'boolean', default: false },
        includeDimensions: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'link_harvester',
    description: 'Internal/external links classification के साथ collect करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: 'a[href]' },
        classifyLinks: { type: 'boolean', default: true },
        includeAnchors: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'media_extractor',
    description: 'Videos, audio, iframes का URLs और metadata extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string', enum: ['video', 'audio', 'iframe'] } },
        includeEmbeds: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'pdf_link_finder',
    description: 'Downloadable files (PDF, DOC, etc.) detect करता है',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: 'a[href]' },
        includeOtherFiles: { type: 'boolean', default: true },
      },
    },
  },
  // Pagination Tools
  {
    name: 'auto_pagination',
    description: 'Next button automatically detect करके pages scrape करता है',
    inputSchema: {
      type: 'object',
      properties: {
        nextButtonSelector: { type: 'string' },
        maxPages: { type: 'number', default: 10 },
        dataSelector: { type: 'string' },
        waitBetweenPages: { type: 'number', default: 1000 },
      },
    },
  },
  {
    name: 'infinite_scroll',
    description: 'Lazy-loading pages के लिए auto-scroll करता है',
    inputSchema: {
      type: 'object',
      properties: {
        maxScrolls: { type: 'number', default: 10 },
        scrollDelay: { type: 'number', default: 1000 },
        dataSelector: { type: 'string' },
      },
    },
  },
  {
    name: 'multi_page_scraper',
    description: 'Multiple pages से data collect और merge करता है',
    inputSchema: {
      type: 'object',
      properties: {
        urls: { type: 'array', items: { type: 'string' } },
        dataSelector: { type: 'string' },
        waitBetweenPages: { type: 'number', default: 1000 },
      },
      required: ['urls', 'dataSelector'],
    },
  },
  {
    name: 'sitemap_parser',
    description: 'sitemap.xml से URLs automatically extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        sitemapUrl: { type: 'string' },
        maxUrls: { type: 'number', default: 100 },
        filterPattern: { type: 'string' },
      },
    },
  },
  {
    name: 'breadcrumb_navigator',
    description: 'Site structure follow करके navigation path extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        breadcrumbSelector: { type: 'string' },
        followLinks: { type: 'boolean', default: false },
      },
    },
  },
  // Data Processing Tools
  {
    name: 'smart_text_cleaner',
    description: 'Text cleaning - whitespace, special characters remove करता है',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        removeExtraWhitespace: { type: 'boolean', default: true },
        removeSpecialChars: { type: 'boolean', default: false },
        toLowerCase: { type: 'boolean', default: false },
        trim: { type: 'boolean', default: true },
      },
      required: ['text'],
    },
  },
  {
    name: 'html_to_text',
    description: 'HTML को clean text में convert करता है',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' },
        preserveLinks: { type: 'boolean', default: false },
        preserveFormatting: { type: 'boolean', default: false },
      },
      required: ['html'],
    },
  },
  {
    name: 'price_parser',
    description: 'Currency symbols से actual numbers extract करता है',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        currency: { type: 'string' },
      },
      required: ['text'],
    },
  },
  {
    name: 'date_normalizer',
    description: 'Different date formats को standard format में convert करता है',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        outputFormat: { type: 'string', enum: ['iso', 'locale', 'unix'], default: 'iso' },
        timezone: { type: 'string' },
      },
      required: ['text'],
    },
  },
  {
    name: 'contact_extractor',
    description: 'Phone numbers और email addresses automatically detect करता है',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        types: { type: 'array', items: { type: 'string', enum: ['phone', 'email'] } },
        defaultCountry: { type: 'string', default: 'US' },
      },
      required: ['text'],
    },
  },
  // Data Validation Tools
  {
    name: 'schema_validator',
    description: 'JSON schema के against data validate करता है',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        schema: { type: 'object' },
      },
      required: ['data', 'schema'],
    },
  },
  {
    name: 'required_fields_checker',
    description: 'Missing required fields check करता है',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'object' },
        requiredFields: { type: 'array', items: { type: 'string' } },
      },
      required: ['data', 'requiredFields'],
    },
  },
  {
    name: 'duplicate_remover',
    description: 'Array से duplicate items remove करता है',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        uniqueKey: { type: 'string' },
      },
      required: ['data'],
    },
  },
  // AI-Powered Features (5 tools)
  {
    name: 'smart_selector_generator',
    description: 'AI-powered CSS selector generation based on element description',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        description: { type: 'string', description: 'Description of element to find' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['description'],
    },
  },
  {
    name: 'content_classification',
    description: 'Classify webpage content into categories',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        categories: { type: 'array', description: 'Custom categories to classify' },
      },
    },
  },
  {
    name: 'sentiment_analysis',
    description: 'Analyze sentiment of page content or text',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        selector: { type: 'string' },
        text: { type: 'string' },
      },
    },
  },
  {
    name: 'summary_generator',
    description: 'Generate summary of page content using TF-IDF',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        maxSentences: { type: 'number', default: 5 },
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'translation_support',
    description: 'Detect language and provide translation info',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        selector: { type: 'string' },
        text: { type: 'string' },
        targetLanguage: { type: 'string', default: 'en' },
      },
    },
  },
  // Search & Filter Tools (5 tools)
  {
    name: 'keyword_search',
    description: 'Advanced keyword search in page content',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
        caseSensitive: { type: 'boolean', default: false },
        wholeWord: { type: 'boolean', default: false },
        context: { type: 'number', default: 50 },
      },
      required: ['keywords'],
    },
  },
  {
    name: 'regex_pattern_matcher',
    description: 'Search using regular expressions',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        pattern: { type: 'string', description: 'Regular expression pattern' },
        flags: { type: 'string', default: 'g' },
        selector: { type: 'string' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'xpath_support',
    description: 'Query elements using XPath',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        xpath: { type: 'string', description: 'XPath expression' },
        returnType: { type: 'string', default: 'elements' },
      },
      required: ['xpath'],
    },
  },
  {
    name: 'advanced_css_selectors',
    description: 'Support for complex CSS selectors',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        selector: { type: 'string' },
        operation: { type: 'string', enum: ['query', 'closest', 'matches'], default: 'query' },
        returnType: { type: 'string', default: 'elements' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'visual_element_finder',
    description: 'Find elements by visual properties',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        criteria: {
          type: 'object',
          description: 'Visual criteria (color, size, position, etc.)'
        },
      },
      required: ['criteria'],
    },
  },
  // Data Quality & Validation (5 tools)
  {
    name: 'data_deduplication',
    description: 'Remove duplicate entries from scraped data',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        uniqueKeys: { type: 'array', items: { type: 'string' } },
        fuzzyMatch: { type: 'boolean', default: false },
        threshold: { type: 'number', default: 0.9 },
      },
      required: ['data'],
    },
  },
  {
    name: 'missing_data_handler',
    description: 'Detect and handle missing data',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        requiredFields: { type: 'array', items: { type: 'string' } },
        strategy: { type: 'string', enum: ['report', 'remove', 'fill', 'flag'], default: 'report' },
      },
      required: ['data'],
    },
  },
  {
    name: 'data_type_validator',
    description: 'Validate data types against JSON schema',
    inputSchema: {
      type: 'object',
      properties: {
        data: { description: 'Data to validate' },
        schema: { type: 'object', description: 'JSON Schema' },
      },
      required: ['data', 'schema'],
    },
  },
  {
    name: 'outlier_detection',
    description: 'Detect outliers in numerical data',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        field: { type: 'string', description: 'Field to analyze' },
        method: { type: 'string', enum: ['iqr', 'zscore'], default: 'iqr' },
        threshold: { type: 'number', default: 1.5 },
      },
      required: ['data'],
    },
  },
  {
    name: 'consistency_checker',
    description: 'Check data consistency across fields',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
        rules: { type: 'array', description: 'Validation rules' },
      },
      required: ['data', 'rules'],
    },
  },
  // Advanced Captcha Handling (3 tools)
  {
    name: 'ocr_engine',
    description: 'Extract text from captcha images using OCR',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        selector: { type: 'string' },
        imageUrl: { type: 'string' },
        imageBuffer: { type: 'string', description: 'Base64 encoded image' },
        language: { type: 'string', default: 'eng' },
      },
    },
  },
  {
    name: 'audio_captcha_solver',
    description: 'Handle audio captchas',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        audioSelector: { type: 'string' },
        audioUrl: { type: 'string' },
        downloadPath: { type: 'string' },
      },
    },
  },
  {
    name: 'puzzle_captcha_handler',
    description: 'Handle slider and puzzle captchas',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        puzzleSelector: { type: 'string' },
        sliderSelector: { type: 'string' },
        method: { type: 'string', enum: ['auto', 'manual'], default: 'auto' },
      },
    },
  },
  // Screenshot & Visual Tools (5 tools)
  {
    name: 'full_page_screenshot',
    description: 'Capture entire page screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        outputPath: { type: 'string' },
        format: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
        quality: { type: 'number', default: 90 },
        fullPage: { type: 'boolean', default: true },
      },
      required: ['outputPath'],
    },
  },
  {
    name: 'element_screenshot',
    description: 'Capture screenshot of specific element',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        selector: { type: 'string' },
        outputPath: { type: 'string' },
        format: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
        padding: { type: 'number', default: 0 },
      },
      required: ['selector', 'outputPath'],
    },
  },
  {
    name: 'pdf_generation',
    description: 'Convert page to PDF',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        outputPath: { type: 'string' },
        format: { type: 'string', default: 'A4' },
        landscape: { type: 'boolean', default: false },
        printBackground: { type: 'boolean', default: true },
        margin: { type: 'object' },
      },
      required: ['outputPath'],
    },
  },
  {
    name: 'video_recording',
    description: 'Record browser session',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        duration: { type: 'number', default: 10 },
        outputPath: { type: 'string' },
      },
      required: ['outputPath'],
    },
  },
  {
    name: 'visual_comparison',
    description: 'Compare two screenshots',
    inputSchema: {
      type: 'object',
      properties: {
        image1Path: { type: 'string' },
        image2Path: { type: 'string' },
        diffOutputPath: { type: 'string' },
        threshold: { type: 'number', default: 0.1 },
      },
      required: ['image1Path', 'image2Path'],
    },
  },
  // Website API Integration (3 tools)
  {
    name: 'rest_api_endpoint_finder',
    description: 'Discover REST API endpoints',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        analyzeNetworkRequests: { type: 'boolean', default: true },
        scanDuration: { type: 'number', default: 5000 },
      },
    },
  },
  {
    name: 'webhook_support',
    description: 'Set up and test webhooks',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string' },
        method: { type: 'string', default: 'POST' },
        payload: { type: 'object' },
        headers: { type: 'object' },
        testMode: { type: 'boolean', default: true },
      },
      required: ['webhookUrl'],
    },
  },
  {
    name: 'all_website_api_finder',
    description: 'Comprehensive API discovery',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        deepScan: { type: 'boolean', default: true },
        includeExternal: { type: 'boolean', default: false },
      },
      required: ['url'],
    },
  },
  // Smart Data Extractors (Advanced)
  {
    name: 'html_elements_extractor',
    description: 'Extract all HTML elements with complete details',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: '*' },
        maxElements: { type: 'number', default: 100 },
        includeStyles: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'tags_finder',
    description: 'Find specific HTML tags',
    inputSchema: {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' }, default: ['div', 'span', 'p', 'a', 'img'] },
      },
    },
  },
  {
    name: 'links_finder',
    description: 'Extract all links from page',
    inputSchema: {
      type: 'object',
      properties: {
        includeExternal: { type: 'boolean', default: true },
        maxLinks: { type: 'number', default: 200 },
      },
    },
  },
  {
    name: 'xpath_links',
    description: 'Use XPath to find links',
    inputSchema: {
      type: 'object',
      properties: {
        xpath: { type: 'string', default: '//a[@href]' },
      },
    },
  },
  {
    name: 'ajax_extractor',
    description: 'Extract AJAX/XHR request data',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 5000 },
        url: { type: 'string' },
      },
    },
  },
  {
    name: 'fetch_xhr',
    description: 'Capture fetch and XHR requests with responses',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 5000 },
      },
    },
  },
  {
    name: 'network_recorder',
    description: 'Record all network activity',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 10000 },
        filterTypes: { type: 'array', items: { type: 'string' }, default: ['all'] },
      },
    },
  },
  {
    name: 'api_finder',
    description: 'Discover API endpoints on page',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'regex_pattern_finder',
    description: 'Find patterns using regex',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        flags: { type: 'string', default: 'gi' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'iframe_extractor',
    description: 'Extract all iframes and their content',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'embed_page_extractor',
    description: 'Extract embedded content (iframes, objects, embeds)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'image_extractor_advanced',
    description: 'Advanced image extraction with metadata',
    inputSchema: {
      type: 'object',
      properties: {
        includeDataUrls: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'video_source_extractor',
    description: 'Extract video sources from video elements',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'video_player_extractor',
    description: 'Extract video player information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'video_player_hoster_finder',
    description: 'Detect video hosting platform (YouTube, Vimeo, etc.)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'original_video_hoster_finder',
    description: 'Find original video source',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'url_redirect_tracer',
    description: 'Trace URL redirects',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'user_agent_extractor',
    description: 'Extract user agent information',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  // Dynamic Content & Session Handling
  {
    name: 'shadow_dom_extractor',
    description: 'Extract content from Shadow DOM',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: '*' },
      },
    },
  },
  {
    name: 'cookie_manager',
    description: 'Manage cookies (get, set, delete, clear)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['get', 'set', 'delete', 'clear'], default: 'get' },
        cookie: { type: 'object' },
        cookieName: { type: 'string' },
      },
    },
  },
  {
    name: 'session_persistence',
    description: 'Save and restore browser session',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['save', 'restore'], default: 'save' },
        sessionData: { type: 'object' },
      },
    },
  },
  {
    name: 'form_auto_fill',
    description: 'Automatically fill form fields',
    inputSchema: {
      type: 'object',
      properties: {
        formData: { type: 'object' },
        submitAfterFill: { type: 'boolean', default: false },
        submitButtonSelector: { type: 'string' },
      },
    },
  },
  {
    name: 'ajax_content_waiter',
    description: 'Wait for dynamic content to load',
    inputSchema: {
      type: 'object',
      properties: {
        waitFor: { type: 'string', enum: ['selector', 'xhr', 'timeout'], default: 'selector' },
        value: { type: 'string' },
        timeout: { type: 'number', default: 30000 },
      },
    },
  },
  {
    name: 'modal_popup_handler',
    description: 'Handle modal popups (detect, close)',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['detect', 'close'], default: 'detect' },
        closeSelector: { type: 'string' },
      },
    },
  },
  {
    name: 'login_session_manager',
    description: 'Manage login sessions',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['check', 'login', 'logout'], default: 'check' },
        username: { type: 'string' },
        password: { type: 'string' },
        usernameSelector: { type: 'string' },
        passwordSelector: { type: 'string' },
        submitSelector: { type: 'string' },
      },
    },
  },
  // Monitoring & Reporting
  {
    name: 'progress_tracker',
    description: 'Track operation progress',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'start', 'complete', 'reset'], default: 'status' },
        operationId: { type: 'string' },
        operationName: { type: 'string' },
        success: { type: 'boolean' },
        result: { type: 'object' },
        metadata: { type: 'object' },
      },
    },
  },
  {
    name: 'error_logger',
    description: 'Log and track errors',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['log', 'get', 'clear'], default: 'log' },
        message: { type: 'string' },
        type: { type: 'string' },
        context: { type: 'object' },
        stackTrace: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'success_rate_reporter',
    description: 'Report success metrics',
    inputSchema: {
      type: 'object',
      properties: {
        timeRange: { type: 'string', enum: ['all', 'last_hour', 'last_day'], default: 'all' },
      },
    },
  },
  {
    name: 'data_quality_metrics',
    description: 'Report data quality metrics',
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'array' },
      },
    },
  },
  {
    name: 'performance_monitor',
    description: 'Monitor browser and page performance',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'monitoring_summary',
    description: 'Get overall monitoring summary',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  // Advanced Video & Media Download Tools
  {
    name: 'video_link_finder',
    description: 'Find all video links on page',
    inputSchema: {
      type: 'object',
      properties: {
        includeEmbedded: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'video_download_page',
    description: 'Detect and analyze video download pages',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'video_download_button',
    description: 'Find and interact with video download buttons',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['find', 'click'], default: 'find' },
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'video_play_push_source',
    description: 'Capture video sources when play button is clicked',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'video_play_button_click',
    description: 'Click video play button',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'url_redirect_trace_endpoints',
    description: 'Trace all URL redirect endpoints',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      required: ['url'],
    },
  },
  {
    name: 'network_recording_finder',
    description: 'Find and analyze network recordings',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 10000 },
        filterType: { type: 'string', enum: ['video', 'audio', 'media'], default: 'video' },
      },
    },
  },
  {
    name: 'network_recording_extractors',
    description: 'Extract data from network recordings',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 10000 },
      },
    },
  },
  {
    name: 'video_links_finders',
    description: 'Advanced video link detection',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'videos_selectors',
    description: 'Get all video-related selectors',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'link_process_extracts',
    description: 'Process and extract links with categorization',
    inputSchema: {
      type: 'object',
      properties: {
        processType: { type: 'string', enum: ['all', 'video', 'download', 'external'], default: 'all' },
      },
    },
  },
  {
    name: 'video_link_finders_extracts',
    description: 'Extract video links with complete metadata',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'video_download_button_finders',
    description: 'Find all video download buttons on page',
    inputSchema: {
      type: 'object',
      properties: {},
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
  FIND_SELECTOR: 'find_selector',
  SAVE_CONTENT_AS_MARKDOWN: 'save_content_as_markdown',
  // Smart Data Extractors
  SCRAPE_TABLE: 'scrape_table',
  EXTRACT_LIST: 'extract_list',
  EXTRACT_JSON: 'extract_json',
  SCRAPE_META_TAGS: 'scrape_meta_tags',
  EXTRACT_SCHEMA: 'extract_schema',
  // Multi-Element Extractors
  BATCH_ELEMENT_SCRAPER: 'batch_element_scraper',
  NESTED_DATA_EXTRACTION: 'nested_data_extraction',
  ATTRIBUTE_HARVESTER: 'attribute_harvester',
  // Content Type Specific
  IMAGE_SCRAPER: 'image_scraper',
  LINK_HARVESTER: 'link_harvester',
  MEDIA_EXTRACTOR: 'media_extractor',
  PDF_LINK_FINDER: 'pdf_link_finder',
  // Pagination Tools
  AUTO_PAGINATION: 'auto_pagination',
  INFINITE_SCROLL: 'infinite_scroll',
  MULTI_PAGE_SCRAPER: 'multi_page_scraper',
  SITEMAP_PARSER: 'sitemap_parser',
  BREADCRUMB_NAVIGATOR: 'breadcrumb_navigator',
  // Data Processing
  SMART_TEXT_CLEANER: 'smart_text_cleaner',
  HTML_TO_TEXT: 'html_to_text',
  PRICE_PARSER: 'price_parser',
  DATE_NORMALIZER: 'date_normalizer',
  CONTACT_EXTRACTOR: 'contact_extractor',
  // Data Validation
  SCHEMA_VALIDATOR: 'schema_validator',
  REQUIRED_FIELDS_CHECKER: 'required_fields_checker',
  DUPLICATE_REMOVER: 'duplicate_remover',
  // AI-Powered Features
  SMART_SELECTOR_GENERATOR: 'smart_selector_generator',
  CONTENT_CLASSIFICATION: 'content_classification',
  SENTIMENT_ANALYSIS: 'sentiment_analysis',
  SUMMARY_GENERATOR: 'summary_generator',
  TRANSLATION_SUPPORT: 'translation_support',
  // Search & Filter Tools
  KEYWORD_SEARCH: 'keyword_search',
  REGEX_PATTERN_MATCHER: 'regex_pattern_matcher',
  XPATH_SUPPORT: 'xpath_support',
  ADVANCED_CSS_SELECTORS: 'advanced_css_selectors',
  VISUAL_ELEMENT_FINDER: 'visual_element_finder',
  // Data Quality & Validation
  DATA_DEDUPLICATION: 'data_deduplication',
  MISSING_DATA_HANDLER: 'missing_data_handler',
  DATA_TYPE_VALIDATOR: 'data_type_validator',
  OUTLIER_DETECTION: 'outlier_detection',
  CONSISTENCY_CHECKER: 'consistency_checker',
  // Advanced Captcha Handling
  OCR_ENGINE: 'ocr_engine',
  AUDIO_CAPTCHA_SOLVER: 'audio_captcha_solver',
  PUZZLE_CAPTCHA_HANDLER: 'puzzle_captcha_handler',
  // Screenshot & Visual Tools
  FULL_PAGE_SCREENSHOT: 'full_page_screenshot',
  ELEMENT_SCREENSHOT: 'element_screenshot',
  PDF_GENERATION: 'pdf_generation',
  VIDEO_RECORDING: 'video_recording',
  VISUAL_COMPARISON: 'visual_comparison',
  // Website API Integration
  REST_API_ENDPOINT_FINDER: 'rest_api_endpoint_finder',
  WEBHOOK_SUPPORT: 'webhook_support',
  ALL_WEBSITE_API_FINDER: 'all_website_api_finder',
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
  CONTENT: [TOOL_NAMES.GET_CONTENT, TOOL_NAMES.FIND_SELECTOR, TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN],
} as const;