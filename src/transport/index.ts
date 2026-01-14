/**
 * Transport Module - Export all transport-related functionality
 * Provides SSE, HTTP Streaming, Session Management, and Auto-sync
 */

// Session management
export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
  type SessionData,
  type SessionState,
  type BrowserSessionState,
  type SessionEvent,
  type SessionEventType,
  type SessionEventListener,
} from './session-manager.js';

// Progress notifications
export {
  ProgressNotifier,
  ProgressTracker,
  getProgressNotifier,
  resetProgressNotifier,
  withProgress,
  type ProgressUpdate,
  type ProgressHandler,
} from './progress-notifier.js';

// Transport factory
export {
  TransportFactory,
  createTransportFactory,
  parseTransportConfig,
  type TransportType,
  type TransportConfig,
} from './transport-factory.js';

// Shared event bus
export {
  SharedEventBus,
  getSharedEventBus,
  resetSharedEventBus,
  type EventType,
  type EventBusEvent,
  type EventListener,
  type MCPToolCalledEvent,
  type MCPToolCompletedEvent,
  type MCPToolFailedEvent,
  type LSPDefinitionFoundEvent,
  type LSPReferencesFoundEvent,
  type LSPDiagnosticsUpdatedEvent,
  type LSPHoverResultEvent,
  type SyncBrowserStateUpdatedEvent,
  type SSEProgressUpdateEvent,
} from '../shared/event-bus.js';

// Context enricher
export {
  ContextEnricher,
  getContextEnricher,
  resetContextEnricher,
  type EnrichedContext,
  type EnrichedMCPResponse,
} from '../shared/context-enricher.js';

// SSE LSP Streamer
export {
  SSELSPStreamer,
  getSSELSPStreamer,
  resetSSELSPStreamer,
  type SSELSPEvent,
} from '../shared/sse-lsp-streamer.js';
