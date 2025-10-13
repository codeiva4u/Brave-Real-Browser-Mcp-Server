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
          description: 'Ignore all browser flags (recommended: true for clean startup without --no-sandbox)',
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
          description: 'Custom configuration for Brave launcher. Use chromePath to specify custom Brave executable path',
          properties: {
            chromePath: {
              type: 'string',
              description: 'Custom path to Brave executable (auto-detected if not specified)',
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
  // Video Extraction Tools
  {
    name: 'html_elements_extraction',
    description: 'Extract video sources from HTML elements (video tags, iframes, embeds, meta tags, data attributes)',
    inputSchema: {
      type: 'object',
      properties: {
        extractVideoTags: {
          type: 'boolean',
          description: 'Extract sources from <video> and <source> tags',
          default: true
        },
        extractIframes: {
          type: 'boolean',
          description: 'Extract sources from <iframe> elements',
          default: true
        },
        extractEmbeds: {
          type: 'boolean',
          description: 'Extract sources from <embed> and <object> elements',
          default: true
        },
        extractMetaTags: {
          type: 'boolean',
          description: 'Extract sources from Open Graph and Twitter Card meta tags',
          default: true
        },
        extractDataAttributes: {
          type: 'boolean',
          description: 'Extract sources from data-* attributes',
          default: true
        }
      }
    }
  },
  {
    name: 'network_video_extraction',
    description: 'Extract video sources from network requests and responses',
    inputSchema: {
      type: 'object',
      properties: {
        interceptRequests: {
          type: 'boolean',
          description: 'Intercept and analyze network requests',
          default: false
        },
        captureResponses: {
          type: 'boolean',
          description: 'Capture and analyze network responses',
          default: true
        },
        filterResourceTypes: {
          type: 'array',
          description: 'Filter by resource types (xhr, fetch, media, etc.)',
          items: { type: 'string' }
        },
        maxRecords: {
          type: 'number',
          description: 'Maximum number of network requests to record',
          default: 1000
        },
        recordingDuration: {
          type: 'number',
          description: 'Duration to record network traffic (ms)',
          default: 10000
        }
      }
    }
  },
  {
    name: 'video_selector_generation',
    description: 'Generate CSS selectors for video-related elements on the page',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'comprehensive_video_extraction',
    description: 'Extract video sources using all available strategies (DOM + Network)',
    inputSchema: {
      type: 'object',
      properties: {
        enableDOMAnalysis: {
          type: 'boolean',
          description: 'Enable DOM-based video extraction',
          default: true
        },
        enableNetworkRecording: {
          type: 'boolean',
          description: 'Enable network-based video extraction',
          default: true
        },
        recordingDuration: {
          type: 'number',
          description: 'Duration to record network traffic (ms)',
          default: 10000
        },
        maxSources: {
          type: 'number',
          description: 'Maximum number of video sources to return',
          default: 50
        },
        filterFormats: {
          type: 'array',
          description: 'Filter results by video format',
          items: {
            type: 'string',
            enum: ['mp4', 'webm', 'avi', 'mkv', 'hls', 'dash', 'ts', 'flv', 'blob']
          }
        }
      }
    }
  },
  {
    name: 'url_redirect_trace',
    description: 'Trace URL redirects and get final destinations',
    inputSchema: {
      type: 'object',
      properties: {
        targetUrl: {
          type: 'string',
          description: 'Specific URL to trace redirects for'
        },
        recordingDuration: {
          type: 'number',
          description: 'Duration to record network traffic (ms)',
          default: 5000
        }
      }
    }
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
  // Specialized Video and Links Extraction Tools
  {
    name: 'links_finders',
    description: 'Find and extract all types of links from page (HTTP, HTTPS, FTP, email, phone, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        includeExternal: {
          type: 'boolean',
          description: 'Include external links',
          default: true
        },
        includeInternal: {
          type: 'boolean',
          description: 'Include internal links',
          default: true
        },
        includeMediaLinks: {
          type: 'boolean',
          description: 'Include media file links',
          default: true
        },
        includeEmailPhone: {
          type: 'boolean',
          description: 'Include email and phone links',
          default: false
        },
        filterDomains: {
          type: 'array',
          description: 'Filter links by specific domains',
          items: { type: 'string' }
        }
      }
    }
  },
  {
    name: 'video_play_sources_finder',
    description: 'Find direct video play sources and streaming URLs',
    inputSchema: {
      type: 'object',
      properties: {
        includeHLS: {
          type: 'boolean',
          description: 'Include HLS (.m3u8) sources',
          default: true
        },
        includeDASH: {
          type: 'boolean',
          description: 'Include DASH (.mpd) sources',
          default: true
        },
        includeDirectMP4: {
          type: 'boolean',
          description: 'Include direct MP4 sources',
          default: true
        },
        includeBlob: {
          type: 'boolean',
          description: 'Include blob URLs',
          default: true
        },
        recordingDuration: {
          type: 'number',
          description: 'Network recording duration (ms)',
          default: 15000
        }
      }
    }
  },
  {
    name: 'video_player_hostars_sources_finder',
    description: 'Find video sources from popular hosting platforms (YouTube, Vimeo, Dailymotion, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        platforms: {
          type: 'array',
          description: 'Specific platforms to search',
          items: {
            type: 'string',
            enum: ['youtube', 'vimeo', 'dailymotion', 'twitch', 'facebook', 'instagram', 'tiktok', 'all']
          },
          default: ['all']
        },
        extractEmbedCodes: {
          type: 'boolean',
          description: 'Extract embed codes',
          default: true
        },
        extractAPIKeys: {
          type: 'boolean',
          description: 'Extract API keys from network requests',
          default: false
        }
      }
    }
  },
  {
    name: 'video_sources_links_finders',
    description: 'Comprehensive video source links extraction from all possible locations',
    inputSchema: {
      type: 'object',
      properties: {
        searchInJS: {
          type: 'boolean',
          description: 'Search in JavaScript code',
          default: true
        },
        searchInJSON: {
          type: 'boolean',
          description: 'Search in JSON responses',
          default: true
        },
        searchInCSS: {
          type: 'boolean',
          description: 'Search in CSS files',
          default: false
        },
        searchInComments: {
          type: 'boolean',
          description: 'Search in HTML comments',
          default: true
        },
        deepScan: {
          type: 'boolean',
          description: 'Enable deep scanning mode',
          default: true
        }
      }
    }
  },
  {
    name: 'video_download_page',
    description: 'Find and navigate to video download pages',
    inputSchema: {
      type: 'object',
      properties: {
        searchKeywords: {
          type: 'array',
          description: 'Keywords to identify download pages',
          items: { type: 'string' },
          default: ['download', 'save', 'get', 'grab']
        },
        followRedirects: {
          type: 'boolean',
          description: 'Follow redirects to find actual download pages',
          default: true
        },
        maxDepth: {
          type: 'number',
          description: 'Maximum navigation depth',
          default: 3
        }
      }
    }
  },
  {
    name: 'video_sources_extracts',
    description: 'Extract and process video sources with metadata',
    inputSchema: {
      type: 'object',
      properties: {
        includeMetadata: {
          type: 'boolean',
          description: 'Include video metadata (duration, resolution, codec)',
          default: true
        },
        validateSources: {
          type: 'boolean',
          description: 'Validate source URLs accessibility',
          default: false
        },
        extractThumbnails: {
          type: 'boolean',
          description: 'Extract thumbnail URLs',
          default: true
        },
        extractSubtitles: {
          type: 'boolean',
          description: 'Extract subtitle tracks',
          default: true
        }
      }
    }
  },
  {
    name: 'video_download_button',
    description: 'Find and interact with video download buttons',
    inputSchema: {
      type: 'object',
      properties: {
        buttonSelectors: {
          type: 'array',
          description: 'Custom button selectors to search',
          items: { type: 'string' }
        },
        clickButton: {
          type: 'boolean',
          description: 'Automatically click found download buttons',
          default: false
        },
        waitAfterClick: {
          type: 'number',
          description: 'Wait time after clicking (ms)',
          default: 3000
        }
      }
    }
  },
  {
    name: 'video_play_push_sources',
    description: 'Find video sources from push/streaming services',
    inputSchema: {
      type: 'object',
      properties: {
        includeWebSocket: {
          type: 'boolean',
          description: 'Include WebSocket streaming sources',
          default: true
        },
        includeWebRTC: {
          type: 'boolean',
          description: 'Include WebRTC sources',
          default: true
        },
        includePush: {
          type: 'boolean',
          description: 'Include server push sources',
          default: true
        },
        monitoringDuration: {
          type: 'number',
          description: 'Duration to monitor for push sources (ms)',
          default: 20000
        }
      }
    }
  },
  {
    name: 'original_video_hosters_finder',
    description: 'Find original video hosting sources bypassing CDNs',
    inputSchema: {
      type: 'object',
      properties: {
        bypassCDN: {
          type: 'boolean',
          description: 'Attempt to bypass CDN and find original sources',
          default: true
        },
        traceOrigin: {
          type: 'boolean',
          description: 'Trace back to original hosting domain',
          default: true
        },
        includeBackupSources: {
          type: 'boolean',
          description: 'Include backup/mirror sources',
          default: true
        },
        deepNetworkAnalysis: {
          type: 'boolean',
          description: 'Perform deep network analysis',
          default: true
        }
      }
    }
  },
  {
    name: 'ajax_finders',
    description: 'Find and monitor AJAX requests and endpoints',
    inputSchema: {
      type: 'object',
      properties: {
        interceptXHR: {
          type: 'boolean',
          description: 'Intercept XMLHttpRequest calls',
          default: true
        },
        interceptFetch: {
          type: 'boolean',
          description: 'Intercept Fetch API calls',
          default: true
        },
        recordResponses: {
          type: 'boolean',
          description: 'Record AJAX response data',
          default: true
        },
        filterByContentType: {
          type: 'array',
          description: 'Filter by response content types',
          items: { type: 'string' },
          default: ['application/json', 'text/html', 'application/xml']
        },
        monitoringDuration: {
          type: 'number',
          description: 'Duration to monitor AJAX calls (ms)',
          default: 10000
        }
      }
    }
  },
  {
    name: 'ajax_extracts',
    description: 'Extract and process data from AJAX responses',
    inputSchema: {
      type: 'object',
      properties: {
        parseJSON: {
          type: 'boolean',
          description: 'Parse JSON responses',
          default: true
        },
        parseXML: {
          type: 'boolean',
          description: 'Parse XML responses',
          default: true
        },
        extractVideoSources: {
          type: 'boolean',
          description: 'Extract video sources from AJAX responses',
          default: true
        },
        extractAPIEndpoints: {
          type: 'boolean',
          description: 'Extract API endpoints from responses',
          default: true
        },
        saveRawData: {
          type: 'boolean',
          description: 'Save raw response data',
          default: false
        }
      }
    }
  },
  {
    name: 'user_agent_finders',
    description: 'Find and analyze User-Agent strings and browser fingerprinting',
    inputSchema: {
      type: 'object',
      properties: {
        detectFingerprinting: {
          type: 'boolean',
          description: 'Detect browser fingerprinting attempts',
          default: true
        },
        analyzeHeaders: {
          type: 'boolean',
          description: 'Analyze all browser headers',
          default: true
        },
        findCustomUA: {
          type: 'boolean',
          description: 'Find custom User-Agent requirements',
          default: true
        },
        trackingDetection: {
          type: 'boolean',
          description: 'Detect tracking mechanisms',
          default: true
        }
      }
    }
  },
  {
    name: 'user_agent_extracts',
    description: 'Extract and generate User-Agent strings for bypassing restrictions',
    inputSchema: {
      type: 'object',
      properties: {
        generateMobile: {
          type: 'boolean',
          description: 'Generate mobile User-Agent strings',
          default: true
        },
        generateDesktop: {
          type: 'boolean',
          description: 'Generate desktop User-Agent strings',
          default: true
        },
        generateBot: {
          type: 'boolean',
          description: 'Generate bot/crawler User-Agent strings',
          default: false
        },
        targetPlatforms: {
          type: 'array',
          description: 'Target specific platforms',
          items: {
            type: 'string',
            enum: ['windows', 'mac', 'linux', 'android', 'ios']
          },
          default: ['windows', 'mac', 'android']
        }
      }
    }
  },
  {
    name: 'regex_pattern_finders',
    description: 'Advanced regex pattern finding and matching (alias for regex_pattern_matcher)',
    inputSchema: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          description: 'Array of regex patterns to search',
          items: { type: 'string' }
        },
        flags: {
          type: 'string',
          description: 'Regex flags (g, i, m, s, u, y)',
          default: 'gi'
        },
        extractGroups: {
          type: 'boolean',
          description: 'Extract capture groups from matches',
          default: true
        },
        searchScope: {
          type: 'string',
          enum: ['html', 'text', 'scripts', 'network', 'all'],
          description: 'Scope of search',
          default: 'all'
        }
      },
      required: ['patterns']
    }
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
  // Video Extraction Tools
  HTML_ELEMENTS_EXTRACTION: 'html_elements_extraction',
  NETWORK_VIDEO_EXTRACTION: 'network_video_extraction',
  VIDEO_SELECTOR_GENERATION: 'video_selector_generation',
  COMPREHENSIVE_VIDEO_EXTRACTION: 'comprehensive_video_extraction',
  URL_REDIRECT_TRACE: 'url_redirect_trace',
  // Specialized Video and Links Extraction Tools
  LINKS_FINDERS: 'links_finders',
  VIDEO_PLAY_SOURCES_FINDER: 'video_play_sources_finder',
  VIDEO_PLAYER_HOSTARS_SOURCES_FINDER: 'video_player_hostars_sources_finder',
  VIDEO_SOURCES_LINKS_FINDERS: 'video_sources_links_finders',
  VIDEO_DOWNLOAD_PAGE: 'video_download_page',
  VIDEO_SOURCES_EXTRACTS: 'video_sources_extracts',
  VIDEO_DOWNLOAD_BUTTON: 'video_download_button',
  VIDEO_PLAY_PUSH_SOURCES: 'video_play_push_sources',
  ORIGINAL_VIDEO_HOSTERS_FINDER: 'original_video_hosters_finder',
  AJAX_FINDERS: 'ajax_finders',
  AJAX_EXTRACTS: 'ajax_extracts',
  USER_AGENT_FINDERS: 'user_agent_finders',
  USER_AGENT_EXTRACTS: 'user_agent_extracts',
  REGEX_PATTERN_FINDERS: 'regex_pattern_finders',
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
    chromePath?: string; // Note: Still named chromePath for compatibility with underlying browser engine
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