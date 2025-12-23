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
    name: 'press_key',
    description: 'Press keyboard keys (Enter, Tab, Escape, Arrow keys, etc.) - Useful for form submission, navigation, and keyboard shortcuts',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Key to press. Common keys: Enter, Tab, Escape, Backspace, Delete, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space, PageUp, PageDown, Home, End, F1-F12',
          enum: ['Enter', 'Tab', 'Escape', 'Backspace', 'Delete', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
        },
        selector: {
          type: 'string',
          description: 'Optional: CSS selector of element to focus before pressing key',
        },
        modifiers: {
          type: 'array',
          description: 'Optional: Modifier keys to hold (Ctrl, Shift, Alt, Meta)',
          items: {
            type: 'string',
            enum: ['Control', 'Shift', 'Alt', 'Meta'],
          },
        },
      },
      required: ['key'],
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
    name: 'extract_json',
    description: 'Extract embedded JSON/API data from the page',
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
    description: 'Extract SEO meta tags and Open Graph data',
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
    description: 'Extract Schema.org structured data (JSON-LD, Microdata)',
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
    description: 'Scrape multiple similar elements in a batch',
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
    name: 'attribute_harvester',
    description: 'Collect attributes (href, src, data-*) from elements',
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
    name: 'link_harvester',
    description: 'Collect internal/external links with classification',
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
    description: 'Extract URLs and metadata for videos, audio, and iframes',
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string', enum: ['video', 'audio', 'iframe'] } },
        includeEmbeds: { type: 'boolean', default: true },
      },
    },
  },

  // Pagination Tools



  {
    name: 'breadcrumb_navigator',
    description: 'Extract navigation path by following site structure',
    inputSchema: {
      type: 'object',
      properties: {
        breadcrumbSelector: { type: 'string' },
        followLinks: { type: 'boolean', default: false },
      },
    },
  },
  // Data Processing Tools

  // Data Validation Tools



  // Data Validation Tools



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

  // Data Quality & Validation (5 tools)


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
        duration: { type: 'number', default: 15000 },
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
        duration: { type: 'number', default: 15000 },
      },
    },
  },
  {
    name: 'network_recorder',
    description: 'Record all network activity',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 20000 },
        filterTypes: { type: 'array', items: { type: 'string' }, default: ['video', 'xhr', 'fetch', 'media'] },
      },
    },
  },
  {
    name: 'api_finder',
    description: 'Discover API endpoints on page',
    inputSchema: {
      type: 'object',
      properties: {
        deepScan: { type: 'boolean', default: true },
      },
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







  // Advanced Extraction Tools (Ad-Bypass & Obfuscation)
  {
    name: 'advanced_video_extraction',
    description: 'Advanced video source extractor with ad-protection bypass and comprehensive network monitoring. Extracts direct video URLs, HLS/DASH streams, iframe sources, detects obfuscated content, and identifies video hosting platforms.',
    inputSchema: {
      type: 'object',
      properties: {
        waitTime: {
          type: 'number',
          default: 10000,
          description: 'Time to wait (in ms) for dynamic content and video sources to load'
        },
      },
    },
  },
  {
    name: 'deobfuscate_js',
    description: 'Deobfuscate JavaScript code and extract hidden URLs, domains, and base64-encoded content. Detects eval, atob, hex encoding, and identifier obfuscation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'multi_layer_redirect_trace',
    description: 'Follow multiple layers of redirects (URL redirects and iframe chains) to find final video source. Traces up to specified depth.',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: {
          type: 'string',
          description: 'Starting URL to trace redirects from'
        },
        maxDepth: {
          type: 'number',
          default: 5,
          description: 'Maximum redirect depth to follow'
        },
      },
    },
  },
  {
    name: 'ad_protection_detector',
    description: 'Detect ad-protection mechanisms including ad-block detection, anti-debugger code, popup layers, and hidden elements.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of the page to analyze (optional)' },
        selector: { type: 'string', description: 'CSS selector for content to analyze (optional)' },
        text: { type: 'string', description: 'Direct text to analyze (optional)' },
        criteria: { type: 'object', description: 'Visual criteria (visible, color, size, etc.)' },
      },
    },
  },

  // Phase 3: Media & Video Tools
  {
    name: 'video_source_extractor',
    description: 'Extract raw video sources from video tags and sources',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      }
    }
  },
  {
    name: 'video_player_finder',
    description: 'Identify video players (JWPlayer, VideoJS, etc) and extract config',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' }
      }
    }
  },
  {
    name: 'stream_detector',
    description: 'Detects HLS (m3u8) and DASH (mpd) streams from network traffic',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: 'Monitoring duration in ms' }
      }
    }
  },

  {
    name: 'video_download_link_finder',
    description: 'Find direct download links for video files',
    inputSchema: {
      type: 'object',
      properties: {
        extensions: { type: 'array', items: { type: 'string' } }
      }
    }
  }
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
  ATTRIBUTE_HARVESTER: 'attribute_harvester',
  // Content Type Specific
  LINK_HARVESTER: 'link_harvester',
  MEDIA_EXTRACTOR: 'media_extractor',

  // DOM & HTML Extraction (Phase 1)
  HTML_ELEMENTS_EXTRACTOR: 'html_elements_extractor',
  TAGS_FINDER: 'tags_finder',
  LINKS_FINDER: 'links_finder',
  XPATH_LINKS: 'xpath_links',
  SHADOW_DOM_EXTRACTOR: 'shadow_dom_extractor',
  IFRAME_EXTRACTOR: 'iframe_extractor',
  EMBED_PAGE_EXTRACTOR: 'embed_page_extractor',

  // Network Tools (Phase 1)
  AJAX_EXTRACTOR: 'ajax_extractor',
  FETCH_XHR: 'fetch_xhr',
  NETWORK_RECORDER: 'network_recorder',
  API_FINDER: 'api_finder',

  // Pagination Tools
  BREADCRUMB_NAVIGATOR: 'breadcrumb_navigator',

  // Data Processing


  // AI-Powered Features
  SMART_SELECTOR_GENERATOR: 'smart_selector_generator',
  CONTENT_CLASSIFICATION: 'content_classification',


  // Phase 3: Media & Video
  VIDEO_SOURCE_EXTRACTOR: 'video_source_extractor',
  VIDEO_PLAYER_FINDER: 'video_player_finder',
  STREAM_DETECTOR: 'stream_detector',



  // Search & Filter Tools
  KEYWORD_SEARCH: 'keyword_search',
  REGEX_PATTERN_MATCHER: 'regex_pattern_matcher',
  XPATH_SUPPORT: 'xpath_support',
  ADVANCED_CSS_SELECTORS: 'advanced_css_selectors',
  // Data Quality & Validation

  DATA_TYPE_VALIDATOR: 'data_type_validator',


  // Advanced Captcha Handling
  OCR_ENGINE: 'ocr_engine',
  AUDIO_CAPTCHA_SOLVER: 'audio_captcha_solver',
  PUZZLE_CAPTCHA_HANDLER: 'puzzle_captcha_handler',
  // Screenshot & Visual Tools

  ELEMENT_SCREENSHOT: 'element_screenshot',

  VIDEO_RECORDING: 'video_recording',

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
