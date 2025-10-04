/**
 * Centralized Error Handling System for MCP Server
 * 
 * This module provides a comprehensive error handling framework with:
 * - Custom error classes for different error categories
 * - Error factory functions for consistent error creation
 * - Error recovery strategies
 * - Error serialization for MCP protocol
 */

// ============================================================================
// ERROR CATEGORIES
// ============================================================================

export enum ErrorCategory {
  // Browser-related errors
  BROWSER_NOT_INITIALIZED = 'BROWSER_NOT_INITIALIZED',
  BROWSER_INITIALIZATION_FAILED = 'BROWSER_INITIALIZATION_FAILED',
  BROWSER_CONNECTION_FAILED = 'BROWSER_CONNECTION_FAILED',
  BROWSER_CLOSED = 'BROWSER_CLOSED',
  
  // Navigation errors
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  NAVIGATION_TIMEOUT = 'NAVIGATION_TIMEOUT',
  PAGE_LOAD_FAILED = 'PAGE_LOAD_FAILED',
  
  // Element interaction errors
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  ELEMENT_NOT_INTERACTABLE = 'ELEMENT_NOT_INTERACTABLE',
  SELECTOR_INVALID = 'SELECTOR_INVALID',
  CLICK_FAILED = 'CLICK_FAILED',
  TYPE_FAILED = 'TYPE_FAILED',
  
  // Content retrieval errors
  CONTENT_RETRIEVAL_FAILED = 'CONTENT_RETRIEVAL_FAILED',
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  
  // File operation errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  INVALID_FILE_PATH = 'INVALID_FILE_PATH',
  
  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  WORKFLOW_VIOLATION = 'WORKFLOW_VIOLATION',
  
  // Protocol errors
  FRAME_DETACHED = 'FRAME_DETACHED',
  SESSION_CLOSED = 'SESSION_CLOSED',
  TARGET_CLOSED = 'TARGET_CLOSED',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  
  // System errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// ERROR SEVERITY LEVELS
// ============================================================================

export enum ErrorSeverity {
  LOW = 'LOW',           // Recoverable, minor issues
  MEDIUM = 'MEDIUM',     // Recoverable with retry
  HIGH = 'HIGH',         // Requires user intervention
  CRITICAL = 'CRITICAL', // Unrecoverable, requires restart
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base error class for all MCP Server errors
 */
export class MCPError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isRecoverable: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly suggestedAction?: string;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    isRecoverable: boolean = false,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    super(message);
    this.name = 'MCPError';
    this.category = category;
    this.severity = severity;
    this.isRecoverable = isRecoverable;
    this.timestamp = new Date();
    this.context = context;
    this.suggestedAction = suggestedAction;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for MCP protocol response
   */
  toMCPResponse(): { content: Array<{ type: string; text: string }> } {
    let errorText = `❌ Error: ${this.message}\n\n`;
    errorText += `📋 Category: ${this.category}\n`;
    errorText += `⚠️ Severity: ${this.severity}\n`;
    
    if (this.suggestedAction) {
      errorText += `\n💡 Suggested Action:\n${this.suggestedAction}\n`;
    }
    
    if (this.context && Object.keys(this.context).length > 0) {
      errorText += `\n🔍 Context:\n${JSON.stringify(this.context, null, 2)}\n`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: errorText,
        },
      ],
    };
  }
}

/**
 * Browser initialization and lifecycle errors
 */
export class BrowserError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.BROWSER_INITIALIZATION_FAILED,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    const severity = category === ErrorCategory.BROWSER_NOT_INITIALIZED 
      ? ErrorSeverity.HIGH 
      : ErrorSeverity.CRITICAL;
    
    const isRecoverable = category === ErrorCategory.BROWSER_NOT_INITIALIZED;
    
    super(message, category, severity, isRecoverable, context, suggestedAction);
    this.name = 'BrowserError';
  }
}

/**
 * Navigation-related errors
 */
export class NavigationError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.NAVIGATION_FAILED,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    const severity = category === ErrorCategory.NAVIGATION_TIMEOUT 
      ? ErrorSeverity.MEDIUM 
      : ErrorSeverity.HIGH;
    
    super(message, category, severity, true, context, suggestedAction);
    this.name = 'NavigationError';
  }
}

/**
 * Element interaction errors
 */
export class InteractionError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.ELEMENT_NOT_FOUND,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    super(message, category, ErrorSeverity.MEDIUM, true, context, suggestedAction);
    this.name = 'InteractionError';
  }
}

/**
 * Content retrieval errors
 */
export class ContentError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.CONTENT_RETRIEVAL_FAILED,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    super(message, category, ErrorSeverity.MEDIUM, true, context, suggestedAction);
    this.name = 'ContentError';
  }
}

/**
 * File operation errors
 */
export class FileError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.FILE_WRITE_ERROR,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    const severity = category === ErrorCategory.INVALID_FILE_PATH 
      ? ErrorSeverity.HIGH 
      : ErrorSeverity.MEDIUM;
    
    super(message, category, severity, false, context, suggestedAction);
    this.name = 'FileError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.VALIDATION_FAILED,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    super(message, category, ErrorSeverity.HIGH, false, context, suggestedAction);
    this.name = 'ValidationError';
  }
}

/**
 * Protocol-level errors
 */
export class ProtocolError extends MCPError {
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.PROTOCOL_ERROR,
    context?: Record<string, any>,
    suggestedAction?: string
  ) {
    const severity = [
      ErrorCategory.FRAME_DETACHED,
      ErrorCategory.SESSION_CLOSED,
      ErrorCategory.TARGET_CLOSED
    ].includes(category) ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH;
    
    const isRecoverable = category === ErrorCategory.FRAME_DETACHED;
    
    super(message, category, severity, isRecoverable, context, suggestedAction);
    this.name = 'ProtocolError';
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Create browser not initialized error
 */
export function createBrowserNotInitializedError(): BrowserError {
  return new BrowserError(
    'Browser is not initialized',
    ErrorCategory.BROWSER_NOT_INITIALIZED,
    {},
    'Please call browser_init first to initialize the browser instance.'
  );
}

/**
 * Create browser initialization failed error
 */
export function createBrowserInitializationError(
  originalError: Error,
  context?: Record<string, any>
): BrowserError {
  return new BrowserError(
    `Failed to initialize browser: ${originalError.message}`,
    ErrorCategory.BROWSER_INITIALIZATION_FAILED,
    { originalError: originalError.message, ...context },
    'Check browser installation and ensure all dependencies are installed. Try running with different configuration options.'
  );
}

/**
 * Create navigation error
 */
export function createNavigationError(
  url: string,
  originalError: Error
): NavigationError {
  return new NavigationError(
    `Failed to navigate to ${url}: ${originalError.message}`,
    ErrorCategory.NAVIGATION_FAILED,
    { url, originalError: originalError.message },
    'Verify the URL is correct and accessible. Check network connectivity.'
  );
}

/**
 * Create navigation timeout error
 */
export function createNavigationTimeoutError(
  url: string,
  timeout: number
): NavigationError {
  return new NavigationError(
    `Navigation to ${url} timed out after ${timeout}ms`,
    ErrorCategory.NAVIGATION_TIMEOUT,
    { url, timeout },
    'Try increasing the timeout value or use a different waitUntil option.'
  );
}

/**
 * Create element not found error
 */
export function createElementNotFoundError(
  selector: string,
  context?: Record<string, any>
): InteractionError {
  return new InteractionError(
    `Element not found: ${selector}`,
    ErrorCategory.ELEMENT_NOT_FOUND,
    { selector, ...context },
    'Use get_content to analyze the page first, then use find_selector to locate elements by text content.'
  );
}

/**
 * Create element not interactable error
 */
export function createElementNotInteractableError(
  selector: string,
  reason: string
): InteractionError {
  return new InteractionError(
    `Element not interactable: ${selector}. Reason: ${reason}`,
    ErrorCategory.ELEMENT_NOT_INTERACTABLE,
    { selector, reason },
    'Wait for the element to become visible and enabled using the wait tool.'
  );
}

/**
 * Create invalid selector error
 */
export function createInvalidSelectorError(
  selector: string,
  originalError: Error
): InteractionError {
  return new InteractionError(
    `Invalid CSS selector: ${selector}. ${originalError.message}`,
    ErrorCategory.SELECTOR_INVALID,
    { selector, originalError: originalError.message },
    'Ensure the selector follows valid CSS syntax. Use find_selector to generate selectors from text content.'
  );
}

/**
 * Create content retrieval error
 */
export function createContentRetrievalError(
  originalError: Error,
  context?: Record<string, any>
): ContentError {
  return new ContentError(
    `Failed to retrieve content: ${originalError.message}`,
    ErrorCategory.CONTENT_RETRIEVAL_FAILED,
    { originalError: originalError.message, ...context },
    'Ensure the page is fully loaded. Try waiting for specific elements before retrieving content.'
  );
}

/**
 * Create file operation error
 */
export function createFileWriteError(
  filePath: string,
  originalError: Error
): FileError {
  return new FileError(
    `Failed to write file ${filePath}: ${originalError.message}`,
    ErrorCategory.FILE_WRITE_ERROR,
    { filePath, originalError: originalError.message },
    'Check file permissions and ensure the directory exists.'
  );
}

/**
 * Create invalid file path error
 */
export function createInvalidFilePathError(
  filePath: string,
  reason: string
): FileError {
  return new FileError(
    `Invalid file path: ${filePath}. ${reason}`,
    ErrorCategory.INVALID_FILE_PATH,
    { filePath, reason },
    'Ensure the file path is absolute and uses the correct format for your operating system.'
  );
}

/**
 * Create validation error
 */
export function createValidationError(
  fieldName: string,
  value: any,
  expectedType: string
): ValidationError {
  return new ValidationError(
    `Validation failed for field '${fieldName}': expected ${expectedType}, got ${typeof value}`,
    ErrorCategory.INVALID_INPUT,
    { fieldName, value, expectedType },
    `Provide a valid ${expectedType} value for ${fieldName}.`
  );
}

/**
 * Create workflow violation error
 */
export function createWorkflowViolationError(
  toolName: string,
  currentState: string,
  requiredState: string
): ValidationError {
  return new ValidationError(
    `Workflow violation: Cannot execute '${toolName}' in current state '${currentState}'`,
    ErrorCategory.WORKFLOW_VIOLATION,
    { toolName, currentState, requiredState },
    `Execute the following steps first: ${requiredState}`
  );
}

/**
 * Create protocol error from puppeteer error
 */
export function createProtocolErrorFromPuppeteer(
  originalError: Error
): ProtocolError {
  const message = originalError.message.toLowerCase();
  
  let category = ErrorCategory.PROTOCOL_ERROR;
  let suggestedAction = 'Try refreshing the page or reinitializing the browser.';
  
  if (message.includes('frame') && message.includes('detached')) {
    category = ErrorCategory.FRAME_DETACHED;
    suggestedAction = 'The page frame was detached. Navigate to a new page or refresh.';
  } else if (message.includes('session closed')) {
    category = ErrorCategory.SESSION_CLOSED;
    suggestedAction = 'Browser session was closed. Reinitialize the browser using browser_init.';
  } else if (message.includes('target closed')) {
    category = ErrorCategory.TARGET_CLOSED;
    suggestedAction = 'Browser target was closed. Reinitialize the browser using browser_init.';
  }
  
  return new ProtocolError(
    originalError.message,
    category,
    { originalError: originalError.message },
    suggestedAction
  );
}

// ============================================================================
// ERROR CATEGORIZATION UTILITIES
// ============================================================================

/**
 * Categorize a generic error into appropriate MCP error
 */
export function categorizeError(error: unknown): MCPError {
  // Already an MCP error
  if (error instanceof MCPError) {
    return error;
  }
  
  // Convert to Error if not already
  const err = error instanceof Error ? error : new Error(String(error));
  const message = err.message.toLowerCase();
  
  // Browser errors
  if (message.includes('browser not initialized')) {
    return createBrowserNotInitializedError();
  }
  
  // Navigation errors
  if (message.includes('navigation') || message.includes('navigate')) {
    if (message.includes('timeout')) {
      return new NavigationError(err.message, ErrorCategory.NAVIGATION_TIMEOUT);
    }
    return new NavigationError(err.message, ErrorCategory.NAVIGATION_FAILED);
  }
  
  // Protocol errors
  if (message.includes('frame') && message.includes('detached')) {
    return createProtocolErrorFromPuppeteer(err);
  }
  if (message.includes('session closed') || message.includes('target closed')) {
    return createProtocolErrorFromPuppeteer(err);
  }
  if (message.includes('protocol error') || message.includes('protocol')) {
    return createProtocolErrorFromPuppeteer(err);
  }
  
  // Element errors
  if (message.includes('element') || message.includes('selector')) {
    if (message.includes('not found') || message.includes('no node')) {
      return new InteractionError(err.message, ErrorCategory.ELEMENT_NOT_FOUND);
    }
    if (message.includes('not visible') || message.includes('not interactable')) {
      return new InteractionError(err.message, ErrorCategory.ELEMENT_NOT_INTERACTABLE);
    }
  }
  
  // File errors
  if (message.includes('enoent') || message.includes('file not found')) {
    return new FileError(err.message, ErrorCategory.FILE_NOT_FOUND);
  }
  if (message.includes('eacces') || message.includes('permission')) {
    return new FileError(err.message, ErrorCategory.FILE_WRITE_ERROR);
  }
  
  // Network errors
  if (message.includes('network') || message.includes('econnrefused') || message.includes('enotfound')) {
    return new MCPError(
      err.message,
      ErrorCategory.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      true,
      { originalError: err.message },
      'Check network connectivity and firewall settings.'
    );
  }
  
  // Timeout errors
  if (message.includes('timeout')) {
    return new MCPError(
      err.message,
      ErrorCategory.TIMEOUT_ERROR,
      ErrorSeverity.MEDIUM,
      true,
      { originalError: err.message },
      'Try increasing timeout values or check if the operation is blocking.'
    );
  }
  
  // Default unknown error
  return new MCPError(
    err.message,
    ErrorCategory.UNKNOWN_ERROR,
    ErrorSeverity.MEDIUM,
    false,
    { originalError: err.message, stack: err.stack }
  );
}

// ============================================================================
// ERROR RECOVERY UTILITIES
// ============================================================================

/**
 * Determine if an error is recoverable
 */
export function isRecoverableError(error: unknown): boolean {
  if (error instanceof MCPError) {
    return error.isRecoverable;
  }
  
  const categorized = categorizeError(error);
  return categorized.isRecoverable;
}

/**
 * Get recovery strategy for an error
 */
export function getRecoveryStrategy(error: MCPError): string | null {
  if (!error.isRecoverable) {
    return null;
  }
  
  switch (error.category) {
    case ErrorCategory.BROWSER_NOT_INITIALIZED:
      return 'initialize_browser';
    
    case ErrorCategory.NAVIGATION_TIMEOUT:
    case ErrorCategory.NAVIGATION_FAILED:
      return 'retry_navigation';
    
    case ErrorCategory.ELEMENT_NOT_FOUND:
      return 'use_self_healing_locators';
    
    case ErrorCategory.FRAME_DETACHED:
      return 'refresh_page';
    
    case ErrorCategory.TIMEOUT_ERROR:
      return 'retry_with_increased_timeout';
    
    default:
      return 'retry_operation';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MCPError as default,
};
