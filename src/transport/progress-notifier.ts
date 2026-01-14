/**
 * Progress Notifier for Streaming Updates
 * Provides real-time progress notifications during long-running operations
 */

// Progress update structure
export interface ProgressUpdate {
  progressToken: string | number;
  progress: number;
  total?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

// Progress notification handler type
export type ProgressHandler = (update: ProgressUpdate) => void | Promise<void>;

/**
 * ProgressNotifier - Manages progress notifications for MCP operations
 */
export class ProgressNotifier {
  private handlers: Map<string | number, Set<ProgressHandler>> = new Map();
  private globalHandlers: Set<ProgressHandler> = new Set();
  private activeOperations: Map<string | number, ProgressUpdate> = new Map();

  /**
   * Subscribe to progress updates for a specific token
   */
  subscribe(progressToken: string | number, handler: ProgressHandler): () => void {
    if (!this.handlers.has(progressToken)) {
      this.handlers.set(progressToken, new Set());
    }
    this.handlers.get(progressToken)!.add(handler);

    return () => {
      const tokenHandlers = this.handlers.get(progressToken);
      if (tokenHandlers) {
        tokenHandlers.delete(handler);
        if (tokenHandlers.size === 0) {
          this.handlers.delete(progressToken);
        }
      }
    };
  }

  /**
   * Subscribe to all progress updates
   */
  subscribeAll(handler: ProgressHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  /**
   * Start a new progress operation
   */
  startOperation(progressToken: string | number, message?: string): void {
    const update: ProgressUpdate = {
      progressToken,
      progress: 0,
      total: 100,
      message: message || 'Starting operation...',
    };
    
    this.activeOperations.set(progressToken, update);
    this.notify(update);
  }

  /**
   * Update progress for an operation
   */
  updateProgress(
    progressToken: string | number,
    progress: number,
    options?: {
      total?: number;
      message?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    const existing = this.activeOperations.get(progressToken);
    
    const update: ProgressUpdate = {
      progressToken,
      progress,
      total: options?.total ?? existing?.total ?? 100,
      message: options?.message ?? existing?.message,
      metadata: options?.metadata ?? existing?.metadata,
    };

    this.activeOperations.set(progressToken, update);
    this.notify(update);
  }

  /**
   * Complete an operation
   */
  completeOperation(progressToken: string | number, message?: string): void {
    const existing = this.activeOperations.get(progressToken);
    
    const update: ProgressUpdate = {
      progressToken,
      progress: existing?.total ?? 100,
      total: existing?.total ?? 100,
      message: message || 'Operation completed',
    };

    this.notify(update);
    this.activeOperations.delete(progressToken);
  }

  /**
   * Fail an operation
   */
  failOperation(progressToken: string | number, error: string): void {
    const update: ProgressUpdate = {
      progressToken,
      progress: -1,
      message: `Error: ${error}`,
      metadata: { error: true },
    };

    this.notify(update);
    this.activeOperations.delete(progressToken);
  }

  /**
   * Get current progress for an operation
   */
  getProgress(progressToken: string | number): ProgressUpdate | null {
    return this.activeOperations.get(progressToken) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): ProgressUpdate[] {
    return Array.from(this.activeOperations.values());
  }

  /**
   * Create a progress tracker for a specific operation
   */
  createTracker(progressToken: string | number): ProgressTracker {
    return new ProgressTracker(this, progressToken);
  }

  /**
   * Cleanup all handlers and operations
   */
  cleanup(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
    this.activeOperations.clear();
  }

  // Private methods

  private async notify(update: ProgressUpdate): Promise<void> {
    // Notify token-specific handlers
    const tokenHandlers = this.handlers.get(update.progressToken);
    if (tokenHandlers) {
      for (const handler of tokenHandlers) {
        try {
          await handler(update);
        } catch (error) {
          console.error('Progress handler error:', error);
        }
      }
    }

    // Notify global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(update);
      } catch (error) {
        console.error('Global progress handler error:', error);
      }
    }
  }
}

/**
 * ProgressTracker - Convenient wrapper for tracking a single operation
 */
export class ProgressTracker {
  private notifier: ProgressNotifier;
  private progressToken: string | number;
  private currentProgress: number = 0;
  private totalSteps: number = 100;

  constructor(notifier: ProgressNotifier, progressToken: string | number) {
    this.notifier = notifier;
    this.progressToken = progressToken;
  }

  /**
   * Start tracking
   */
  start(totalSteps: number = 100, message?: string): void {
    this.totalSteps = totalSteps;
    this.currentProgress = 0;
    this.notifier.startOperation(this.progressToken, message);
  }

  /**
   * Increment progress by a step
   */
  step(message?: string): void {
    this.currentProgress++;
    this.notifier.updateProgress(this.progressToken, this.currentProgress, {
      total: this.totalSteps,
      message,
    });
  }

  /**
   * Set progress to a specific value
   */
  setProgress(progress: number, message?: string): void {
    this.currentProgress = progress;
    this.notifier.updateProgress(this.progressToken, progress, {
      total: this.totalSteps,
      message,
    });
  }

  /**
   * Set progress as percentage
   */
  setPercentage(percentage: number, message?: string): void {
    const progress = Math.round((percentage / 100) * this.totalSteps);
    this.setProgress(progress, message);
  }

  /**
   * Complete the operation
   */
  complete(message?: string): void {
    this.notifier.completeOperation(this.progressToken, message);
  }

  /**
   * Fail the operation
   */
  fail(error: string): void {
    this.notifier.failOperation(this.progressToken, error);
  }
}

// Singleton instance
let progressNotifierInstance: ProgressNotifier | null = null;

export function getProgressNotifier(): ProgressNotifier {
  if (!progressNotifierInstance) {
    progressNotifierInstance = new ProgressNotifier();
  }
  return progressNotifierInstance;
}

export function resetProgressNotifier(): void {
  if (progressNotifierInstance) {
    progressNotifierInstance.cleanup();
    progressNotifierInstance = null;
  }
}

/**
 * Decorator for adding progress tracking to async functions
 */
export function withProgress<T extends (...args: any[]) => Promise<any>>(
  progressToken: string | number,
  steps?: number
): (target: T) => T {
  return (target: T): T => {
    const wrapped = async function (this: any, ...args: any[]): Promise<any> {
      const tracker = getProgressNotifier().createTracker(progressToken);
      tracker.start(steps || 100);

      try {
        const result = await target.apply(this, args);
        tracker.complete();
        return result;
      } catch (error) {
        tracker.fail(error instanceof Error ? error.message : String(error));
        throw error;
      }
    };

    return wrapped as T;
  };
}
