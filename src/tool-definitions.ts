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
    description: 'Initialize a new browser instance.',
    inputSchema: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', description: 'Run headless' },
        autoInstall: { type: 'boolean', default: true },
        disableXvfb: { type: 'boolean', default: false },
        ignoreAllFlags: { type: 'boolean', default: true },
        proxy: { type: 'string' },
        plugins: { type: 'array', items: { type: 'string' } },
        customConfig: {
          type: 'object',
          properties: { chromePath: { type: 'string' } },
          additionalProperties: true,
        },
        contentPriority: {
          type: 'object',
          properties: {
            prioritizeContent: { type: 'boolean', default: true },
            autoSuggestGetContent: { type: 'boolean', default: true },
          },
        },
      },
    },
  },
  {
    name: 'browser_close',
    description: 'Close the browser.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'navigate',
    description: 'Navigate to a URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        waitUntil: {
          type: 'string',
          enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
          default: 'domcontentloaded',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_content',
    description: 'Get page content (HTML or text).',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['html', 'text'], default: 'html' },
        selector: { type: 'string' },
      },
    },
  },
  {
    name: 'click',
    description: 'Click on an element.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        waitForNavigation: { type: 'boolean', default: false },
      },
      required: ['selector'],
    },
  },
  {
    name: 'type',
    description: 'Type text into an input.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        text: { type: 'string' },
        delay: { type: 'number', default: 100 },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'press_key',
    description: 'Press a keyboard key.',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Key (e.g., Enter, Tab, Escape)',
        },
        selector: { type: 'string' },
        modifiers: {
          type: 'array',
          items: { type: 'string', enum: ['Control', 'Shift', 'Alt', 'Meta'] },
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'wait',
    description: 'Wait for conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['selector', 'navigation', 'timeout'] },
        value: { type: 'string' },
        timeout: { type: 'number', default: 30000 },
      },
      required: ['type', 'value'],
    },
  },
  {
    name: 'solve_captcha',
    description: 'Solve CAPTCHAs (Auto/OCR/Audio/Puzzle).',
    inputSchema: {
      type: 'object',
      properties: {
        strategy: {
          type: 'string',
          enum: ['auto', 'ocr', 'audio', 'puzzle', 'recaptcha', 'hCaptcha', 'turnstile'],
          default: 'auto'
        },
        url: { type: 'string' },
        selector: { type: 'string' },
        imageUrl: { type: 'string' },
        language: { type: 'string' },
        audioSelector: { type: 'string' },
        audioUrl: { type: 'string' },
        puzzleSelector: { type: 'string' },
        sliderSelector: { type: 'string' },
      },
    },
  },
  {
    name: 'random_scroll',
    description: 'Scroll randomly.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'find_selector',
    description: 'Find component by text.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        elementType: { type: 'string', default: '*' },
        exact: { type: 'boolean', default: false },
      },
      required: ['text'],
    },
  },
  {
    name: 'save_content_as_markdown',
    description: 'Save content as Markdown.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        contentType: { type: 'string', enum: ['text', 'html'], default: 'text' },
        selector: { type: 'string' },
        formatOptions: {
          type: 'object',
          properties: {
            includeMetadata: { type: 'boolean', default: true },
            cleanupWhitespace: { type: 'boolean', default: true },
            preserveLinks: { type: 'boolean', default: true },
          },
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'extract_json',
    description: 'Extract extracted JSON/API data.',
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
    description: 'Extract SEO meta tags.',
    inputSchema: {
      type: 'object',
      properties: {
        includeOgTags: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'extract_schema',
    description: 'Extract Schema.org data.',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['json-ld', 'microdata', 'all'], default: 'all' },
        schemaType: { type: 'string' },
      },
    },
  },
  {
    name: 'batch_element_scraper',
    description: 'Scrape multiple elements.',
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
    name: 'link_harvester',
    description: 'Collect links.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', default: 'a[href]' },
        classifyLinks: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'media_extractor',
    description: 'Extract media URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' } },
        includeEmbeds: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'breadcrumb_navigator',
    description: 'Extract breadcrumbs.',
    inputSchema: {
      type: 'object',
      properties: {
        breadcrumbSelector: { type: 'string' },
      },
    },
  },
  {
    name: 'smart_selector_generator',
    description: 'AI selector generator.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        description: { type: 'string' },
        context: { type: 'string' },
      },
      required: ['description'],
    },
  },
  {
    name: 'content_classification',
    description: 'Classify content.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        categories: { type: 'array' },
      },
    },
  },
  {
    name: 'search_content',
    description: 'Search content (keyword/regex).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        type: { type: 'string', enum: ['text', 'regex'], default: 'text' },
        url: { type: 'string' },
        caseSensitive: { type: 'boolean', default: false },
        selector: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_element_advanced',
    description: 'Find elements (CSS/XPath).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        type: { type: 'string', enum: ['css', 'xpath'], default: 'css' },
        url: { type: 'string' },
        operation: { type: 'string', default: 'query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'deep_analysis',
    description: 'Record traces (network, console, DOM).',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        duration: { type: 'number', default: 5000 },
        screenshots: { type: 'boolean', default: true },
        network: { type: 'boolean', default: true },
        logs: { type: 'boolean', default: true },
        dom: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'element_screenshot',
    description: 'Capture element screenshot.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
        outputPath: { type: 'string' },
      },
      required: ['selector', 'outputPath'],
    },
  },
  {
    name: 'video_recording',
    description: 'Record video.',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 10 },
        outputPath: { type: 'string' },
      },
      required: ['outputPath'],
    },
  },
  {
    name: 'network_recorder',
    description: 'Record network.',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', default: 20000 },
      },
    },
  },
  {
    name: 'api_finder',
    description: 'Find APIs.',
    inputSchema: {
      type: 'object',
      properties: { deepScan: { type: 'boolean', default: true } },
    },
  },
  {
    name: 'image_extractor_advanced',
    description: 'Extract images.',
    inputSchema: {
      type: 'object',
      properties: { includeDataUrls: { type: 'boolean', default: false } },
    },
  },
  {
    name: 'url_redirect_tracer',
    description: 'Trace redirects.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string' } },
      required: ['url'],
    },
  },
  {
    name: 'ajax_content_waiter',
    description: 'Wait for AJAX.',
    inputSchema: {
      type: 'object',
      properties: {
        waitFor: { type: 'string', default: 'selector' },
        value: { type: 'string' },
      },
    },
  },
  {
    name: 'progress_tracker',
    description: 'Track progress.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', default: 'status' },
        operationId: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  },
  {
    name: 'advanced_video_extraction',
    description: 'Advanced video extraction.',
    inputSchema: {
      type: 'object',
      properties: {
        waitTime: { type: 'number', default: 10000 },
      },
    },
  },
  {
    name: 'multi_layer_redirect_trace',
    description: 'Trace multi-layer redirects.',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' },
        maxDepth: { type: 'number', default: 5 },
      },
    },
  },
  {
    name: 'ad_protection_detector',
    description: 'Detect ad protection.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string' },
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

