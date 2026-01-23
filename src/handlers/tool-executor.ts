/**
 * Tool Executor with Real-time Progress Notifications
 * Wraps tool handlers to send SSE progress updates during execution
 */

import { getProgressNotifier, ProgressTracker } from '../transport/progress-notifier.js';
import { getSessionManager } from '../transport/session-manager.js';

// Tool execution phases
export type ToolPhase = 'starting' | 'validating' | 'executing' | 'processing' | 'completing' | 'error';

// Progress update interface
export interface ToolProgressUpdate {
  toolName: string;
  phase: ToolPhase;
  progress: number;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Execute a tool with real-time progress notifications
 */
export async function executeWithProgress<T>(
  toolName: string,
  operation: (progress: ProgressReporter) => Promise<T>,
  options: {
    totalSteps?: number;
    sessionId?: string;
  } = {}
): Promise<T> {
  const notifier = getProgressNotifier();
  const progressToken = `tool-${toolName}-${Date.now()}`;
  const tracker = notifier.createTracker(progressToken);
  const totalSteps = options.totalSteps || 100;

  // Create progress reporter for the operation
  const progressReporter = new ProgressReporter(tracker, toolName, totalSteps);

  try {
    // Start tracking
    tracker.start(totalSteps, `🚀 Starting ${toolName}...`);
    progressReporter.report('starting', 5, `Initializing ${toolName}`);

    // Execute the operation
    const result = await operation(progressReporter);

    // Complete
    tracker.complete(`✅ ${toolName} completed successfully`);

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    tracker.fail(`❌ ${toolName} failed: ${errorMessage}`);
    throw error;
  }
}

/**
 * Progress Reporter - Used by tool handlers to report progress
 */
export class ProgressReporter {
  private tracker: ProgressTracker;
  private toolName: string;
  private totalSteps: number;
  private currentStep: number = 0;

  constructor(tracker: ProgressTracker, toolName: string, totalSteps: number) {
    this.tracker = tracker;
    this.toolName = toolName;
    this.totalSteps = totalSteps;
  }

  /**
   * Report progress with phase and message
   */
  report(phase: ToolPhase, progressPercent: number, message: string): void {
    const step = Math.round((progressPercent / 100) * this.totalSteps);
    this.currentStep = step;
    this.tracker.setProgress(step, `[${phase.toUpperCase()}] ${message}`);
  }

  /**
   * Increment progress by a step
   */
  step(message: string): void {
    this.currentStep++;
    this.tracker.step(message);
  }

  /**
   * Set progress percentage
   */
  setPercent(percent: number, message: string): void {
    this.tracker.setPercentage(percent, message);
  }

  /**
   * Report sub-operation progress
   */
  subProgress(operation: string, current: number, total: number): void {
    const baseProgress = this.currentStep;
    const subPercent = Math.round((current / total) * 10); // 10% for sub-operation
    this.tracker.setProgress(baseProgress + subPercent, `${operation}: ${current}/${total}`);
  }
}

/**
 * Tool progress wrapper decorator
 * Use this to wrap any tool handler function
 */
export function withToolProgress(toolName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    handler: T
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      return executeWithProgress(toolName, async (progress) => {
        progress.report('validating', 10, 'Validating arguments');
        
        // Execute original handler
        progress.report('executing', 20, 'Executing operation');
        const result = await handler(...args);
        
        progress.report('completing', 90, 'Finalizing');
        return result;
      });
    };
  };
}

/**
 * Create a progress-enabled version of common tool operations
 */
export const toolOperations = {
  /**
   * Navigation with progress
   */
  async navigate(
    page: any,
    url: string,
    options: { waitUntil?: string; timeout?: number } = {},
    progress: ProgressReporter
  ): Promise<void> {
    progress.report('executing', 20, `Navigating to ${url}`);
    
    await page.goto(url, {
      waitUntil: options.waitUntil || 'domcontentloaded',
      timeout: options.timeout || 60000,
    });
    
    progress.report('processing', 80, 'Page loaded, processing content');
  },

  /**
   * Click with progress
   */
  async click(
    page: any,
    selector: string,
    options: { waitForNavigation?: boolean } = {},
    progress: ProgressReporter
  ): Promise<void> {
    progress.report('executing', 20, `Finding element: ${selector}`);
    
    await page.waitForSelector(selector, { timeout: 30000 });
    progress.report('executing', 50, 'Element found, clicking');
    
    if (options.waitForNavigation) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
        page.click(selector),
      ]);
    } else {
      await page.click(selector);
    }
    
    progress.report('processing', 80, 'Click completed');
  },

  /**
   * Type with progress
   */
  async type(
    page: any,
    selector: string,
    text: string,
    options: { delay?: number } = {},
    progress: ProgressReporter
  ): Promise<void> {
    progress.report('executing', 20, `Finding input: ${selector}`);
    
    await page.waitForSelector(selector, { timeout: 30000 });
    progress.report('executing', 40, 'Clearing existing content');
    
    // Clear existing content
    await page.click(selector, { clickCount: 3 });
    
    progress.report('executing', 50, `Typing ${text.length} characters`);
    
    const delay = options.delay || 50;
    const totalChars = text.length;
    
    // Type with progress updates
    for (let i = 0; i < totalChars; i++) {
      await page.type(selector, text[i], { delay });
      
      // Update progress every 10 characters
      if (i % 10 === 0) {
        const typeProgress = 50 + Math.round((i / totalChars) * 30);
        progress.setPercent(typeProgress, `Typed ${i}/${totalChars} characters`);
      }
    }
    
    progress.report('processing', 85, 'Typing completed');
  },

  /**
   * Get content with progress
   */
  async getContent(
    page: any,
    options: { type?: 'html' | 'text'; selector?: string } = {},
    progress: ProgressReporter
  ): Promise<string> {
    progress.report('executing', 20, 'Extracting page content');
    
    let content: string;
    
    if (options.selector) {
      progress.report('executing', 40, `Finding element: ${options.selector}`);
      const element = await page.$(options.selector);
      
      if (!element) {
        throw new Error(`Element not found: ${options.selector}`);
      }
      
      progress.report('processing', 60, 'Extracting element content');
      content = options.type === 'text'
        ? await element.evaluate((el: any) => el.innerText)
        : await element.evaluate((el: any) => el.innerHTML);
    } else {
      progress.report('processing', 60, 'Extracting full page content');
      content = options.type === 'text'
        ? await page.evaluate(() => document.body.innerText)
        : await page.content();
    }
    
    progress.report('processing', 80, `Extracted ${content.length} characters`);
    return content;
  },

  /**
   * Wait with progress
   */
  async wait(
    page: any,
    type: 'selector' | 'timeout' | 'navigation',
    value: string,
    options: { timeout?: number } = {},
    progress: ProgressReporter
  ): Promise<void> {
    const timeout = options.timeout || 30000;
    
    switch (type) {
      case 'selector':
        progress.report('executing', 20, `Waiting for selector: ${value}`);
        await page.waitForSelector(value, { timeout });
        progress.report('processing', 80, 'Selector found');
        break;
        
      case 'timeout':
        const waitMs = parseInt(value, 10);
        progress.report('executing', 20, `Waiting ${waitMs}ms`);
        
        // Update progress during wait
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const percent = Math.min(80, 20 + Math.round((elapsed / waitMs) * 60));
          progress.setPercent(percent, `Waited ${elapsed}ms / ${waitMs}ms`);
        }, 500);
        
        await new Promise(resolve => setTimeout(resolve, waitMs));
        clearInterval(interval);
        
        progress.report('processing', 80, 'Wait completed');
        break;
        
      case 'navigation':
        progress.report('executing', 20, 'Waiting for navigation');
        await page.waitForNavigation({ waitUntil: value as any, timeout });
        progress.report('processing', 80, 'Navigation completed');
        break;
    }
  },

  /**
   * Screenshot with progress
   */
  async screenshot(
    page: any,
    options: { selector?: string; path?: string; fullPage?: boolean } = {},
    progress: ProgressReporter
  ): Promise<Buffer | string> {
    progress.report('executing', 20, 'Preparing screenshot');
    
    let result: Buffer | string;
    
    if (options.selector) {
      progress.report('executing', 40, `Finding element: ${options.selector}`);
      const element = await page.$(options.selector);
      
      if (!element) {
        throw new Error(`Element not found: ${options.selector}`);
      }
      
      progress.report('processing', 60, 'Capturing element screenshot');
      result = await element.screenshot({ path: options.path, encoding: options.path ? undefined : 'base64' });
    } else {
      progress.report('processing', 60, 'Capturing full page screenshot');
      result = await page.screenshot({
        path: options.path,
        fullPage: options.fullPage,
        encoding: options.path ? undefined : 'base64',
      });
    }
    
    progress.report('processing', 80, 'Screenshot captured');
    return result;
  },
};

/**
 * Batch operation with progress
 */
export async function executeBatchWithProgress<T, R>(
  toolName: string,
  items: T[],
  operation: (item: T, index: number, progress: ProgressReporter) => Promise<R>
): Promise<R[]> {
  return executeWithProgress(toolName, async (progress) => {
    const results: R[] = [];
    const total = items.length;
    
    for (let i = 0; i < total; i++) {
      const itemProgress = Math.round(((i + 1) / total) * 80) + 10;
      progress.report('executing', itemProgress, `Processing item ${i + 1}/${total}`);
      
      const result = await operation(items[i], i, progress);
      results.push(result);
    }
    
    return results;
  }, { totalSteps: items.length + 2 });
}

// ============================================================
// ERROR AUTO-RECOVERY SYSTEM
// ============================================================

export interface RecoveryStrategy {
  errorPattern: RegExp | string;      // Pattern to match error messages
  action: 'retry' | 'refresh' | 'restart_browser' | 'skip' | 'fallback';
  maxRetries?: number;                 // Max retries for this error type
  delay?: number;                      // Delay before retry (ms)
  fallbackFn?: () => Promise<any>;     // Fallback function if all else fails
}

export interface ErrorRecoveryConfig {
  enabled: boolean;
  maxGlobalRetries: number;           // Max total retries across all errors
  defaultDelay: number;               // Default delay between retries
  strategies: RecoveryStrategy[];     // Error-specific recovery strategies
  onRecovery?: (error: Error, action: string, attempt: number) => void;
}

// Default recovery strategies for common browser automation errors
const defaultRecoveryStrategies: RecoveryStrategy[] = [
  // Network errors - retry with delay
  { errorPattern: /net::ERR_|ECONNREFUSED|ETIMEDOUT|socket hang up/i, action: 'retry', maxRetries: 3, delay: 2000 },
  
  // Navigation errors - refresh and retry
  { errorPattern: /Navigation timeout|navigation.*timed out/i, action: 'refresh', maxRetries: 2, delay: 1000 },
  
  // Frame/Context errors - restart browser
  { errorPattern: /frame was detached|Execution context was destroyed|Target closed/i, action: 'restart_browser', maxRetries: 1 },
  
  // Session errors - restart browser
  { errorPattern: /Session closed|Protocol error|Session timed out/i, action: 'restart_browser', maxRetries: 1 },
  
  // Element not found - retry with delay
  { errorPattern: /Element.*not found|waiting for selector|failed to find/i, action: 'retry', maxRetries: 3, delay: 1000 },
  
  // Rate limiting - wait and retry
  { errorPattern: /rate limit|too many requests|429/i, action: 'retry', maxRetries: 3, delay: 5000 },
  
  // Cloudflare/Bot detection - skip (handled separately)
  { errorPattern: /cloudflare|captcha|bot detected|access denied/i, action: 'skip', maxRetries: 0 },
];

// Global error recovery configuration
let errorRecoveryConfig: ErrorRecoveryConfig = {
  enabled: true,
  maxGlobalRetries: 5,
  defaultDelay: 1000,
  strategies: defaultRecoveryStrategies
};

/**
 * Configure error recovery
 */
export function configureErrorRecovery(config: Partial<ErrorRecoveryConfig>) {
  errorRecoveryConfig = { ...errorRecoveryConfig, ...config };
  if (config.strategies) {
    errorRecoveryConfig.strategies = [...config.strategies, ...defaultRecoveryStrategies];
  }
}

/**
 * Add a custom recovery strategy
 */
export function addRecoveryStrategy(strategy: RecoveryStrategy) {
  errorRecoveryConfig.strategies.unshift(strategy); // Add at beginning for priority
}

/**
 * Get matching recovery strategy for an error
 */
function getRecoveryStrategy(error: Error): RecoveryStrategy | null {
  const errorMessage = error.message || String(error);
  
  for (const strategy of errorRecoveryConfig.strategies) {
    const pattern = typeof strategy.errorPattern === 'string' 
      ? new RegExp(strategy.errorPattern, 'i')
      : strategy.errorPattern;
    
    if (pattern.test(errorMessage)) {
      return strategy;
    }
  }
  
  return null;
}

/**
 * Error recovery state tracker
 */
interface RecoveryState {
  globalRetries: number;
  errorCounts: Map<string, number>;
  lastRecoveryTime: number;
}

const recoveryState: RecoveryState = {
  globalRetries: 0,
  errorCounts: new Map(),
  lastRecoveryTime: 0
};

/**
 * Reset recovery state (call after successful operation)
 */
export function resetRecoveryState() {
  recoveryState.globalRetries = 0;
  recoveryState.errorCounts.clear();
}

/**
 * Execute with auto-recovery
 */
export async function executeWithRecovery<T>(
  operation: () => Promise<T>,
  options: {
    toolName: string;
    page?: any;
    getBrowser?: () => any;
    restartBrowser?: () => Promise<any>;
    onProgress?: (message: string) => void;
  }
): Promise<{ success: boolean; result?: T; error?: Error; recoveryAttempts: number }> {
  if (!errorRecoveryConfig.enabled) {
    try {
      const result = await operation();
      return { success: true, result, recoveryAttempts: 0 };
    } catch (error) {
      return { success: false, error: error as Error, recoveryAttempts: 0 };
    }
  }

  let lastError: Error | null = null;
  let attempts = 0;
  
  while (recoveryState.globalRetries < errorRecoveryConfig.maxGlobalRetries) {
    try {
      const result = await operation();
      
      // Success - reset relevant counters
      if (attempts > 0) {
        options.onProgress?.(`✅ Recovery successful after ${attempts} attempts`);
      }
      
      return { success: true, result, recoveryAttempts: attempts };
      
    } catch (error) {
      lastError = error as Error;
      const strategy = getRecoveryStrategy(lastError);
      
      if (!strategy) {
        // No recovery strategy for this error
        options.onProgress?.(`❌ No recovery strategy for: ${lastError.message}`);
        return { success: false, error: lastError, recoveryAttempts: attempts };
      }
      
      // Check error-specific retry count
      const errorKey = strategy.errorPattern.toString();
      const errorCount = recoveryState.errorCounts.get(errorKey) || 0;
      
      if (errorCount >= (strategy.maxRetries || 3)) {
        options.onProgress?.(`❌ Max retries (${strategy.maxRetries}) reached for: ${errorKey}`);
        return { success: false, error: lastError, recoveryAttempts: attempts };
      }
      
      // Increment counters
      recoveryState.globalRetries++;
      recoveryState.errorCounts.set(errorKey, errorCount + 1);
      attempts++;
      
      // Execute recovery action
      const delay = strategy.delay || errorRecoveryConfig.defaultDelay;
      
      options.onProgress?.(`🔄 Recovery attempt ${attempts}: ${strategy.action} (${lastError.message.substring(0, 50)}...)`);
      
      // Notify callback
      errorRecoveryConfig.onRecovery?.(lastError, strategy.action, attempts);
      
      switch (strategy.action) {
        case 'retry':
          // Simple retry after delay
          await new Promise(r => setTimeout(r, delay));
          break;
          
        case 'refresh':
          // Refresh the page and retry
          if (options.page) {
            try {
              await options.page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
              await new Promise(r => setTimeout(r, delay));
            } catch (e) {
              // Refresh failed, continue anyway
            }
          }
          break;
          
        case 'restart_browser':
          // Restart the browser
          if (options.restartBrowser) {
            try {
              options.onProgress?.('🔄 Restarting browser...');
              await options.restartBrowser();
              await new Promise(r => setTimeout(r, delay));
            } catch (e) {
              options.onProgress?.(`⚠️ Browser restart failed: ${(e as Error).message}`);
            }
          }
          break;
          
        case 'fallback':
          // Try fallback function
          if (strategy.fallbackFn) {
            try {
              const fallbackResult = await strategy.fallbackFn();
              return { success: true, result: fallbackResult, recoveryAttempts: attempts };
            } catch (e) {
              // Fallback failed, continue with retry
            }
          }
          break;
          
        case 'skip':
          // Skip this operation entirely
          options.onProgress?.(`⏭️ Skipping operation due to: ${lastError.message}`);
          return { success: false, error: lastError, recoveryAttempts: attempts };
      }
      
      recoveryState.lastRecoveryTime = Date.now();
    }
  }
  
  // Max global retries reached
  options.onProgress?.(`❌ Max global retries (${errorRecoveryConfig.maxGlobalRetries}) reached`);
  return { success: false, error: lastError || new Error('Max retries reached'), recoveryAttempts: attempts };
}

/**
 * Decorator to add auto-recovery to any async function
 */
export function withAutoRecovery(toolName: string, options: { maxRetries?: number } = {}) {
  return function <T extends (...args: any[]) => Promise<any>>(
    handler: T
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async function (...args: Parameters<T>): Promise<ReturnType<T>> {
      // Check if first arg is a page object
      const page = args[0]?.goto ? args[0] : undefined;
      
      const result = await executeWithRecovery(
        () => handler(...args),
        {
          toolName,
          page,
          onProgress: (msg) => console.log(`[${toolName}] ${msg}`)
        }
      );
      
      if (!result.success) {
        throw result.error;
      }
      
      return result.result;
    };
  };
}

/**
 * Get current recovery statistics
 */
export function getRecoveryStats() {
  return {
    enabled: errorRecoveryConfig.enabled,
    globalRetries: recoveryState.globalRetries,
    maxGlobalRetries: errorRecoveryConfig.maxGlobalRetries,
    errorCounts: Object.fromEntries(recoveryState.errorCounts),
    lastRecoveryTime: recoveryState.lastRecoveryTime,
    strategiesCount: errorRecoveryConfig.strategies.length
  };
}
