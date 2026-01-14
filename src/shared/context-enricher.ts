/**
 * Context Enricher - Enriches MCP tool calls with LSP data
 * Automatically adds definitions, references, and diagnostics context to MCP responses
 */

import {
  SharedEventBus,
  getSharedEventBus,
  type LSPDefinitionFoundEvent,
  type LSPReferencesFoundEvent,
  type LSPDiagnosticsUpdatedEvent,
} from '../shared/event-bus.js';

// Enriched context structure
export interface EnrichedContext {
  toolName: string;
  lspDefinitions?: LSPDefinitionFoundEvent;
  lspReferences?: LSPReferencesFoundEvent;
  lspDiagnostics?: LSPDiagnosticsUpdatedEvent;
  browserState?: {
    currentUrl: string | null;
    viewportSize: { width: number; height: number } | null;
  };
  lspContext?: any;
  timestamp: number;
}

// MCP response enrichment
export interface EnrichedMCPResponse {
  originalContent: any;
  enrichedContext: EnrichedContext;
  additionalData: {
    lspContext?: EnrichedContext;
    suggestions?: string[];
    warnings?: string[];
  };
}

/**
 * ContextEnricher - Enriches MCP tool calls with LSP context
 */
export class ContextEnricher {
  private eventBus: SharedEventBus;
  private contextCache: Map<string, EnrichedContext> = new Map();
  private enabled: boolean = true;

  constructor(eventBus?: SharedEventBus) {
    this.eventBus = eventBus || getSharedEventBus();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for LSP context
   */
  private setupEventListeners(): void {
    this.eventBus.subscribe('lsp:definitionFound' as any, (event: any) => {
      this.cacheLSPContext('definition', event.data);
    });

    this.eventBus.subscribe('lsp:referencesFound' as any, (event: any) => {
      this.cacheLSPContext('references', event.data);
    });

    this.eventBus.subscribe('lsp:diagnosticsUpdated' as any, (event: any) => {
      this.cacheLSPContext('diagnostics', event.data);
    });

    this.eventBus.subscribe('sync:browserStateUpdated' as any, (event: any) => {
      this.cacheBrowserState(event.data);
    });
  }

  /**
   * Enable or disable context enrichment
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Cache LSP context
   */
  private cacheLSPContext(type: string, data: any): void {
    const cacheKey = `${type}_${Date.now()}`;
    this.contextCache.set(cacheKey, {
      toolName: data.toolName || 'unknown',
      [type === 'definition' ? 'lspDefinitions' : type === 'references' ? 'lspReferences' : 'lspDiagnostics']: data,
      timestamp: Date.now(),
    });
  }

  /**
   * Cache browser state
   */
  private cacheBrowserState(data: any): void {
    const cacheKey = `browser_${Date.now()}`;
    this.contextCache.set(cacheKey, {
      toolName: 'browser',
      browserState: data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached context
   */
  private getCachedContext(toolName: string): EnrichedContext | null {
    for (const [key, context] of this.contextCache.entries()) {
      if (context.toolName === toolName && Date.now() - context.timestamp < 5000) {
        return context;
      }
    }
    return null;
  }

  /**
   * Enrich MCP tool call with LSP context
   */
  async enrichToolCall(toolName: string, args: Record<string, unknown>): Promise<EnrichedContext> {
    if (!this.enabled) {
      return {
        toolName,
        timestamp: Date.now(),
      } as EnrichedContext;
    }

    // Try to get cached context first
    const cached = this.getCachedContext(toolName);
    if (cached) {
      return cached;
    }

    const enrichedContext: EnrichedContext = {
      toolName,
      lspDefinitions: undefined,
      lspReferences: undefined,
      lspDiagnostics: undefined,
      browserState: undefined,
      timestamp: Date.now(),
    };

    return enrichedContext;
  }

  /**
   * Enrich MCP response with context
   */
  async enrichMCPResponse(
    toolName: string,
    originalContent: any,
    args: Record<string, unknown>
  ): Promise<EnrichedMCPResponse> {
    const enrichedContext = await this.enrichToolCall(toolName, args);

    const additionalData: EnrichedMCPResponse['additionalData'] = {
      lspContext: enrichedContext,
      suggestions: [],
      warnings: [],
    };

    // Add suggestions based on tool and context
    if (toolName === 'get_content' && enrichedContext.lspContext) {
      additionalData.suggestions?.push('Consider using find_element for specific content extraction');
    }

    if (toolName === 'navigate' && enrichedContext.browserState) {
      additionalData.suggestions?.push('Use get_content after navigation to extract page data');
    }

    return {
      originalContent,
      enrichedContext,
      additionalData,
    };
  }

  /**
   * Format enriched context for display
   */
  formatEnrichedContext(context: EnrichedContext): string {
    const parts: string[] = [];

    parts.push(`## LSP Context for ${context.toolName}`);

    if (context.lspDefinitions) {
      parts.push('\n### Definitions');
      parts.push(`Found ${context.lspDefinitions.definitions.length} definition(s)`);
    }

    if (context.lspReferences) {
      parts.push('\n### References');
      parts.push(`Found ${context.lspReferences.references.length} reference(s)`);
    }

    if (context.lspDiagnostics) {
      parts.push('\n### Diagnostics');
      const errors = context.lspDiagnostics.diagnostics.filter(d => d.severity === 1);
      const warnings = context.lspDiagnostics.diagnostics.filter(d => d.severity === 2);
      if (errors.length > 0) parts.push(`Errors: ${errors.length}`);
      if (warnings.length > 0) parts.push(`Warnings: ${warnings.length}`);
    }

    if (context.browserState) {
      parts.push('\n### Browser State');
      if (context.browserState.currentUrl) {
        parts.push(`Current URL: ${context.browserState.currentUrl}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Generate tool suggestions based on context
   */
  generateSuggestions(toolName: string, enrichedContext: EnrichedContext): string[] {
    const suggestions: string[] = [];

    // Navigate-related suggestions
    if (toolName === 'navigate') {
      suggestions.push('get_content: Extract page content after navigation');
      suggestions.push('find_element: Locate specific elements on the page');
      suggestions.push('wait: Wait for dynamic content to load');
    }

    // Click-related suggestions
    if (toolName === 'click') {
      suggestions.push('wait: Wait for element to appear');
      suggestions.push('get_content: Check page state after interaction');
    }

    // Type-related suggestions
    if (toolName === 'type') {
      suggestions.push('press_key: Submit form with Enter key');
      suggestions.push('wait: Wait for form submission to complete');
    }

    // Get content-related suggestions
    if (toolName === 'get_content') {
      suggestions.push('find_element: Locate specific elements for extraction');
      suggestions.push('save_content_as_markdown: Save content to file');
    }

    return suggestions;
  }

  /**
   * Clear context cache
   */
  clearCache(toolName?: string): void {
    if (toolName) {
      for (const [key, context] of this.contextCache.entries()) {
        if (context.toolName === toolName) {
          this.contextCache.delete(key);
        }
      }
    } else {
      this.contextCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    byToolName: Record<string, number>;
  } {
    const byToolName: Record<string, number> = {};

    for (const context of this.contextCache.values()) {
      byToolName[context.toolName] = (byToolName[context.toolName] || 0) + 1;
    }

    return {
      size: this.contextCache.size,
      byToolName,
    };
  }

  /**
   * Cleanup
   */
  shutdown(): void {
    this.contextCache.clear();
  }
}

// Singleton instance
let contextEnricherInstance: ContextEnricher | null = null;

export function getContextEnricher(eventBus?: SharedEventBus): ContextEnricher {
  if (!contextEnricherInstance) {
    contextEnricherInstance = new ContextEnricher(eventBus);
  }
  return contextEnricherInstance;
}

export function resetContextEnricher(): void {
  if (contextEnricherInstance) {
    contextEnricherInstance.shutdown();
    contextEnricherInstance = null;
  }
}
