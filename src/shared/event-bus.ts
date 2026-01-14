/**
 * Shared Event Bus for MCP + LSP + SSE Integration
 * Enables real-time communication and state synchronization between MCP, LSP, and SSE components
 */

// Event types for the shared bus
export type EventType =
  // MCP Events
  | 'mcp:toolCalled'
  | 'mcp:toolCompleted'
  | 'mcp:toolFailed'
  | 'mcp:browserInitialized'
  | 'mcp:navigated'
  // LSP Events
  | 'lsp:definitionRequested'
  | 'lsp:definitionFound'
  | 'lsp:referencesRequested'
  | 'lsp:referencesFound'
  | 'lsp:diagnosticsUpdated'
  | 'lsp:hoverRequested'
  | 'lsp:hoverResult'
  // Sync Events
  | 'sync:stateChanged'
  | 'sync:browserStateUpdated'
  | 'sync:lspContextUpdated'
  | 'sync:sessionUpdated'
  // SSE Events
  | 'sse:clientConnected'
  | 'sse:clientDisconnected'
  | 'sse:progressUpdate'
  | 'sse:eventStream';

// Event payload types
export interface MCPToolCalledEvent {
  toolName: string;
  args: Record<string, unknown>;
  sessionId?: string;
  timestamp: number;
}

export interface MCPToolCompletedEvent {
  toolName: string;
  result: unknown;
  executionTime: number;
  sessionId?: string;
  timestamp: number;
}

export interface MCPToolFailedEvent {
  toolName: string;
  error: string;
  stackTrace?: string;
  sessionId?: string;
  timestamp: number;
}

export interface LSPDefinitionFoundEvent {
  uri: string;
  position: { line: number; character: number };
  definitions: Array<{
    uri: string;
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
  }>;
  timestamp: number;
}

export interface LSPReferencesFoundEvent {
  uri: string;
  position: { line: number; character: number };
  references: Array<{
    uri: string;
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
  }>;
  timestamp: number;
}

export interface LSPDiagnosticsUpdatedEvent {
  uri: string;
  diagnostics: Array<{
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    severity: number;
    message: string;
    source?: string;
    code?: string;
  }>;
  timestamp: number;
}

export interface LSPHoverResultEvent {
  uri: string;
  position: { line: number; character: number };
  contents: { kind: string; value: string }[];
  timestamp: number;
}

export interface SyncBrowserStateUpdatedEvent {
  currentUrl: string | null;
  cookies: Array<{ name: string; value: string; domain: string }>;
  localStorage: Record<string, string>;
  viewportSize: { width: number; height: number };
  timestamp: number;
}

export interface SSEProgressUpdateEvent {
  sessionId: string;
  progressToken: string | number;
  progress: number;
  total?: number;
  message?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

// Unified event type
export type EventBusEvent =
  | { type: 'mcp:toolCalled'; data: MCPToolCalledEvent }
  | { type: 'mcp:toolCompleted'; data: MCPToolCompletedEvent }
  | { type: 'mcp:toolFailed'; data: MCPToolFailedEvent }
  | { type: 'mcp:browserInitialized'; data: { sessionId: string; timestamp: number } }
  | { type: 'mcp:navigated'; data: { url: string; sessionId?: string; timestamp: number } }
  | { type: 'lsp:definitionRequested'; data: { uri: string; position: { line: number; character: number }; timestamp: number } }
  | { type: 'lsp:definitionFound'; data: LSPDefinitionFoundEvent }
  | { type: 'lsp:referencesRequested'; data: { uri: string; position: { line: number; character: number }; timestamp: number } }
  | { type: 'lsp:referencesFound'; data: LSPReferencesFoundEvent }
  | { type: 'lsp:diagnosticsUpdated'; data: LSPDiagnosticsUpdatedEvent }
  | { type: 'lsp:hoverRequested'; data: { uri: string; position: { line: number; character: number }; timestamp: number } }
  | { type: 'lsp:hoverResult'; data: LSPHoverResultEvent }
  | { type: 'sync:stateChanged'; data: { state: Record<string, unknown>; timestamp: number } }
  | { type: 'sync:browserStateUpdated'; data: SyncBrowserStateUpdatedEvent }
  | { type: 'sync:lspContextUpdated'; data: { context: Record<string, unknown>; timestamp: number } }
  | { type: 'sync:sessionUpdated'; data: { sessionId: string; state: Record<string, unknown>; timestamp: number } }
  | { type: 'sse:clientConnected'; data: { sessionId: string; timestamp: number } }
  | { type: 'sse:clientDisconnected'; data: { sessionId: string; timestamp: number } }
  | { type: 'sse:progressUpdate'; data: SSEProgressUpdateEvent }
  | { type: 'sse:eventStream'; data: { sessionId: string; event: Record<string, unknown>; timestamp: number } };

// Event listener type
export type EventListener<T = EventBusEvent> = (event: T) => void | Promise<void>;

/**
 * SharedEventBus - Central event hub for MCP, LSP, and SSE integration
 */
export class SharedEventBus {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();
  private eventHistory: EventBusEvent[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(eventType: EventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => this.unsubscribe(eventType, listener);
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(listener: EventListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: EventType, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: EventBusEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify type-specific listeners
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      }
    }

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error('Error in global event listener:', error);
      }
    }
  }

  /**
   * Get event history
   */
  getHistory(filterType?: EventType): EventBusEvent[] {
    if (filterType) {
      return this.eventHistory.filter(e => e.type === filterType);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalListeners: number;
    typeListeners: number;
    globalListeners: number;
    historySize: number;
  } {
    let typeListenerCount = 0;
    for (const listeners of this.listeners.values()) {
      typeListenerCount += listeners.size;
    }

    return {
      totalListeners: typeListenerCount + this.globalListeners.size,
      typeListeners: typeListenerCount,
      globalListeners: this.globalListeners.size,
      historySize: this.eventHistory.length,
    };
  }

  /**
   * Cleanup all listeners
   */
  shutdown(): void {
    this.listeners.clear();
    this.globalListeners.clear();
    this.eventHistory = [];
  }
}

// Singleton instance
let eventBusInstance: SharedEventBus | null = null;

export function getSharedEventBus(maxHistorySize?: number): SharedEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new SharedEventBus(maxHistorySize);
  }
  return eventBusInstance;
}

export function resetSharedEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.shutdown();
    eventBusInstance = null;
  }
}
