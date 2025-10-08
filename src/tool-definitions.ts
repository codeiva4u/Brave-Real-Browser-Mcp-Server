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
    description: 'Initialize a new browser instance with anti-detection features and automatic Chrome path detection',
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
          description: 'Ignore all Chrome flags (recommended: true for clean startup without --no-sandbox)',
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
          description: 'Custom configuration for Chrome launcher. Use chromePath to specify custom Chrome executable path',
          properties: {
            chromePath: {
              type: 'string',
              description: 'Custom path to Chrome executable (auto-detected if not specified)',
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
  {
    name: 'extract_tables',
    description: 'Extract structured data from HTML tables',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Optional CSS selector to target specific tables',
        },
      },
    },
  },
  {
    name: 'extract_lists',
    description: 'Extract data from bullet lists and numbered lists',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Optional CSS selector to target specific lists',
        },
      },
    },
  },
  {
    name: 'extract_json',
    description: 'Extract embedded JSON data from page (JSON-LD, data attributes)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'extract_meta_tags',
    description: 'Extract SEO meta tags and Open Graph data',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'extract_schema_org',
    description: 'Extract Schema.org structured data (JSON-LD, Microdata)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'batch_extract_elements',
    description: 'Extract multiple similar elements with custom field mapping',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for container elements',
        },
        fields: {
          type: 'object',
          description: 'Field name to CSS selector mapping',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['selector', 'fields'],
    },
  },
  {
    name: 'extract_products',
    description: 'Extract product information from e-commerce pages',
    inputSchema: {
      type: 'object',
      properties: {
        containerSelector: {
          type: 'string',
          description: 'CSS selector for product containers',
        },
        productConfig: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'string' },
            image: { type: 'string' },
            link: { type: 'string' },
            rating: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      required: ['containerSelector', 'productConfig'],
    },
  },
  {
    name: 'extract_articles',
    description: 'Extract article/post information from blog or news pages',
    inputSchema: {
      type: 'object',
      properties: {
        articleSelector: {
          type: 'string',
          description: 'CSS selector for article containers',
        },
        config: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            author: { type: 'string' },
            date: { type: 'string' },
            excerpt: { type: 'string' },
            link: { type: 'string' },
            image: { type: 'string' },
            category: { type: 'string' },
          },
        },
      },
      required: ['articleSelector'],
    },
  },
  {
    name: 'extract_images',
    description: 'Extract all images with URLs, alt text, and dimensions',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Optional CSS selector to target specific images',
        },
      },
    },
  },
  {
    name: 'extract_links',
    description: 'Extract and classify internal/external links',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'Optional CSS selector to target specific links',
        },
      },
    },
  },
  {
    name: 'extract_media',
    description: 'Extract videos, audio files, and iframes with metadata',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'extract_downloadable_files',
    description: 'Find and categorize downloadable files (PDFs, docs, archives)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'extract_social_media',
    description: 'Extract social media profile links',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'auto_paginate',
    description: 'Automatically navigate through paginated results',
    inputSchema: {
      type: 'object',
      properties: {
        nextButtonSelector: { type: 'string' },
        maxPages: { type: 'number', default: 10 },
        waitTime: { type: 'number', default: 2000 },
      },
    },
  },
  {
    name: 'handle_infinite_scroll',
    description: 'Handle infinite scroll/lazy loading pages',
    inputSchema: {
      type: 'object',
      properties: {
        maxScrolls: { type: 'number', default: 20 },
        scrollDelay: { type: 'number', default: 1000 },
        scrollDistance: { type: 'number', default: 500 },
      },
    },
  },
  {
    name: 'extract_breadcrumbs',
    description: 'Extract breadcrumb navigation links',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'extract_pagination_info',
    description: 'Extract pagination information (current page, total pages)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'parse_sitemap',
    description: 'Parse sitemap.xml and extract URLs',
    inputSchema: {
      type: 'object',
      properties: {
        sitemapUrl: {
          type: 'string',
          description: 'URL of the sitemap.xml file',
        },
      },
      required: ['sitemapUrl'],
    },
  },
  {
    name: 'extract_contact_info',
    description: 'Extract phone numbers, emails, and URLs from page',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'harvest_attributes',
    description: 'Harvest all attributes from elements',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for elements',
        },
        attributes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific attributes to extract (optional)',
        },
      },
      required: ['selector'],
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
  EXTRACT_TABLES: 'extract_tables',
  EXTRACT_LISTS: 'extract_lists',
  EXTRACT_JSON: 'extract_json',
  EXTRACT_META_TAGS: 'extract_meta_tags',
  EXTRACT_SCHEMA_ORG: 'extract_schema_org',
  // Multi-Element Extractors
  BATCH_EXTRACT_ELEMENTS: 'batch_extract_elements',
  EXTRACT_PRODUCTS: 'extract_products',
  EXTRACT_ARTICLES: 'extract_articles',
  // Content Type Extractors
  EXTRACT_IMAGES: 'extract_images',
  EXTRACT_LINKS: 'extract_links',
  EXTRACT_MEDIA: 'extract_media',
  EXTRACT_DOWNLOADABLE_FILES: 'extract_downloadable_files',
  EXTRACT_SOCIAL_MEDIA: 'extract_social_media',
  // Pagination & Navigation
  AUTO_PAGINATE: 'auto_paginate',
  HANDLE_INFINITE_SCROLL: 'handle_infinite_scroll',
  EXTRACT_BREADCRUMBS: 'extract_breadcrumbs',
  EXTRACT_PAGINATION_INFO: 'extract_pagination_info',
  PARSE_SITEMAP: 'parse_sitemap',
  // Data Processing
  EXTRACT_CONTACT_INFO: 'extract_contact_info',
  HARVEST_ATTRIBUTES: 'harvest_attributes',
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