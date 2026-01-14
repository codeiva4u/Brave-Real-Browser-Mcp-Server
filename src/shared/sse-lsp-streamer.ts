/**
 * SSE LSP Streamer - Streams LSP updates via SSE
 * Enables real-time LSP context updates through Server-Sent Events
 */

import { SharedEventBus, getSharedEventBus, type EventBusEvent } from './event-bus.js';
import type { ProgressNotifier } from '../transport/progress-notifier.js';

// Stream event format
export interface SSELSPEvent {
  type: 'lsp' | 'context' | 'diagnostics' | 'suggestion';
  timestamp: number;
  data: {
    toolName?: string;
    definitions?: any;
    references?: any;
    diagnostics?: any;
    suggestions?: string[];
    context?: any;
  };
  [key: string]: unknown; // Index signature for Record<string, unknown>
}

/**
 * SSELSPStreamer - Streams LSP updates via SSE
 */
export class SSELSPStreamer {
  private eventBus: SharedEventBus;
  private progressNotifier: ProgressNotifier | null = null;
  private enabled: boolean = true;
  private activeStreams: Map<string, Set<string>> = new Map();

  constructor(eventBus?: SharedEventBus) {
    this.eventBus = eventBus || getSharedEventBus();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for LSP events
   */
  private setupEventListeners(): void {
    // Stream LSP definition results
    this.eventBus.subscribe('lsp:definitionFound' as any, (event: any) => {
      this.streamLSPEvent({
        type: 'lsp',
        timestamp: Date.now(),
        data: {
          definitions: event.data,
        },
      });
    });

    // Stream LSP reference results
    this.eventBus.subscribe('lsp:referencesFound' as any, (event: any) => {
      this.streamLSPEvent({
        type: 'lsp',
        timestamp: Date.now(),
        data: {
          references: event.data,
        },
      });
    });

    // Stream LSP diagnostics updates
    this.eventBus.subscribe('lsp:diagnosticsUpdated' as any, (event: any) => {
      this.streamLSPEvent({
        type: 'diagnostics',
        timestamp: Date.now(),
        data: {
          diagnostics: event.data,
        },
      });
    });

    // Stream LSP context updates
    this.eventBus.subscribe('sync:lspContextUpdated' as any, (event: any) => {
      this.streamLSPEvent({
        type: 'context',
        timestamp: Date.now(),
        data: {
          context: event.data,
        },
      });
    });

    // Stream tool completion with suggestions
    this.eventBus.subscribe('mcp:toolCompleted' as any, (event: any) => {
      this.streamSuggestionsForTool(event.data.toolName);
    });
  }

  /**
   * Set progress notifier for SSE streaming
   */
  setProgressNotifier(notifier: ProgressNotifier): void {
    this.progressNotifier = notifier;
  }

  /**
   * Enable or disable streaming
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Register a stream for a session
   */
  registerStream(sessionId: string): void {
    if (!this.activeStreams.has(sessionId)) {
      this.activeStreams.set(sessionId, new Set());
    }
  }

  /**
   * Unregister a stream for a session
   */
  unregisterStream(sessionId: string): void {
    this.activeStreams.delete(sessionId);
  }

  /**
   * Stream LSP event via SSE
   */
  private streamLSPEvent(event: SSELSPEvent): void {
    if (!this.enabled) {
      return;
    }

    // If progress notifier is available, use it for SSE streaming
    if (this.progressNotifier) {
      const progressToken = `lsp-update-${Date.now()}`;

      // Send as progress update
      this.progressNotifier.startOperation(progressToken, '📊 LSP Update');
      this.progressNotifier.updateProgress(progressToken, 100, {
        message: `LSP Update: ${event.type}`,
        metadata: event,
      });
      this.progressNotifier.completeOperation(progressToken);
    }
  }

  /**
   * Stream suggestions for a tool
   */
  private streamSuggestionsForTool(toolName: string): void {
    if (!this.enabled) {
      return;
    }

    const suggestions = this.generateSuggestionsForTool(toolName);

    this.streamLSPEvent({
      type: 'suggestion',
      timestamp: Date.now(),
      data: {
        toolName,
        suggestions,
      },
    });
  }

  /**
   * Generate suggestions for a tool
   */
  private generateSuggestionsForTool(toolName: string): string[] {
    const suggestions: string[] = [];

    // Navigate-related suggestions
    if (toolName === 'navigate') {
      suggestions.push('get_content: Extract page content after navigation');
      suggestions.push('find_element: Locate specific elements on the page');
      suggestions.push('wait: Wait for dynamic content to load');
      suggestions.push('Type check for page load: Use wait with DOM selectors');
    }

    // Click-related suggestions
    if (toolName === 'click') {
      suggestions.push('wait: Wait for element to be clickable');
      suggestions.push('get_content: Check page state after click');
      suggestions.push('find_element: If click failed, try finding element with different selector');
    }

    // Type-related suggestions
    if (toolName === 'type') {
      suggestions.push('press_key: Submit form with Enter key');
      suggestions.push('wait: Wait for form submission to complete');
      suggestions.push('find_element: Verify input field before typing');
    }

    // Get content-related suggestions
    if (toolName === 'get_content') {
      suggestions.push('find_element: Locate specific elements for targeted extraction');
      suggestions.push('save_content_as_markdown: Save content to a markdown file');
      suggestions.push('search_content: Search for specific patterns in content');
    }

    // Find element-related suggestions
    if (toolName === 'find_element') {
      suggestions.push('click: Interact with found element');
      suggestions.push('get_content: Get content of the element');
      suggestions.push('type: Type into the element if it is an input field');
    }

    return suggestions;
  }

  /**
   * Format SSE event for client consumption
   */
  formatSSEEvent(event: SSELSPEvent): string {
    return JSON.stringify({
      event: 'lsp-update',
      data: event,
    });
  }

  /**
   * Get active streams
   */
  getActiveStreams(): string[] {
    return Array.from(this.activeStreams.keys());
  }

  /**
   * Get stream statistics
   */
  getStats(): {
    activeStreams: number;
    enabled: boolean;
    eventsStreamed: number;
  } {
    return {
      activeStreams: this.activeStreams.size,
      enabled: this.enabled,
      eventsStreamed: 0,
    };
  }

  /**
   * Cleanup
   */
  shutdown(): void {
    this.activeStreams.clear();
  }
}

// Singleton instance
let sseLSPStreamerInstance: SSELSPStreamer | null = null;

export function getSSELSPStreamer(eventBus?: SharedEventBus): SSELSPStreamer {
  if (!sseLSPStreamerInstance) {
    sseLSPStreamerInstance = new SSELSPStreamer(eventBus);
  }
  return sseLSPStreamerInstance;
}

export function resetSSELSPStreamer(): void {
  if (sseLSPStreamerInstance) {
    sseLSPStreamerInstance.shutdown();
    sseLSPStreamerInstance = null;
  }
}
