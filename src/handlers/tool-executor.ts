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
