/**
 * Constants for Brave Real Browser MCP Server
 * Centralizes all magic numbers and configuration values
 */

// Timeout configurations (in milliseconds)
export const TIMEOUTS = {
  NAVIGATION: 30000,        // 30 seconds for page navigation
  ELEMENT_WAIT: 10000,      // 10 seconds to wait for elements
  BROWSER_LAUNCH: 60000,    // 60 seconds for browser launch
  CAPTCHA_SOLVE: 300000,    // 5 minutes for captcha solving
  SCRIPT_EXECUTION: 30000,  // 30 seconds for script execution
  PAGE_LOAD: 30000,         // 30 seconds for page load
} as const;

// Retry configurations
export const RETRIES = {
  MAX_ATTEMPTS: 3,
  BACKOFF_MULTIPLIER: 2,
  INITIAL_DELAY: 1000,      // 1 second initial delay
  MAX_DELAY: 10000,         // 10 seconds max delay
} as const;

// Browser configurations
export const BROWSER = {
  DEFAULT_VIEWPORT: {
    width: 1920,
    height: 1080,
  },
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  DEFAULT_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
  ],
} as const;

// Content extraction limits
export const CONTENT = {
  MAX_TEXT_LENGTH: 1000000,   // 1MB max text content
  MAX_HTML_LENGTH: 5000000,   // 5MB max HTML content
  MAX_SCREENSHOT_SIZE: 10000000, // 10MB max screenshot
  MARKDOWN_MAX_LENGTH: 2000000,  // 2MB max markdown
} as const;

// Selector timeouts
export const SELECTORS = {
  WAIT_TIMEOUT: 10000,        // 10 seconds
  POLL_INTERVAL: 100,         // 100ms polling
  MAX_RETRIES: 3,
} as const;

// File operation limits
export const FILES = {
  MAX_FILE_SIZE: 50000000,    // 50MB max file size
  ALLOWED_EXTENSIONS: ['.md', '.txt', '.html', '.json'],
  TEMP_DIR: '.temp',
} as const;

// Error codes
export const ERROR_CODES = {
  // Browser errors (1xxx)
  BROWSER_NOT_INITIALIZED: 'MCP_1001',
  BROWSER_LAUNCH_FAILED: 'MCP_1002',
  BROWSER_CONNECTION_LOST: 'MCP_1003',
  
  // Navigation errors (2xxx)
  NAVIGATION_FAILED: 'MCP_2001',
  NAVIGATION_TIMEOUT: 'MCP_2002',
  PAGE_NOT_FOUND: 'MCP_2003',
  
  // Element errors (3xxx)
  ELEMENT_NOT_FOUND: 'MCP_3001',
  ELEMENT_NOT_VISIBLE: 'MCP_3002',
  ELEMENT_NOT_CLICKABLE: 'MCP_3003',
  
  // Content errors (4xxx)
  CONTENT_TOO_LARGE: 'MCP_4001',
  CONTENT_EXTRACTION_FAILED: 'MCP_4002',
  INVALID_SELECTOR: 'MCP_4003',
  
  // File errors (5xxx)
  FILE_NOT_FOUND: 'MCP_5001',
  FILE_TOO_LARGE: 'MCP_5002',
  FILE_WRITE_FAILED: 'MCP_5003',
  INVALID_FILE_TYPE: 'MCP_5004',
  
  // General errors (9xxx)
  UNKNOWN_ERROR: 'MCP_9001',
  INVALID_ARGUMENTS: 'MCP_9002',
  OPERATION_TIMEOUT: 'MCP_9003',
} as const;

// HTTP status codes for common scenarios
export const HTTP_STATUS = {
  OK: 200,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Logging levels
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
} as const;

// MCP Server configuration
export const MCP_CONFIG = {
  SERVER_NAME: 'brave-real-browser-mcp-server',
  SERVER_VERSION: '2.0.0',
  PROTOCOL_VERSION: '2024-11-05',
  MAX_TOOLS: 50,
  MAX_RESOURCES: 100,
} as const;

// Performance monitoring thresholds
export const PERFORMANCE = {
  SLOW_OPERATION_THRESHOLD: 5000,  // 5 seconds
  MEMORY_WARNING_THRESHOLD: 500 * 1024 * 1024, // 500MB
  CPU_WARNING_THRESHOLD: 80, // 80%
} as const;

// Type guards for constants
export function isValidErrorCode(code: string): code is keyof typeof ERROR_CODES {
  return code in ERROR_CODES;
}

export function isValidTimeout(timeout: number): boolean {
  return timeout > 0 && timeout <= 300000; // Max 5 minutes
}

export function isValidRetryCount(count: number): boolean {
  return count >= 0 && count <= 10;
}
