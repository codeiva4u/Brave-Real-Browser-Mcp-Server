/**
 * Transport Factory - Multi-transport support for MCP Server
 * Supports STDIO, SSE (Server-Sent Events), and Streamable HTTP transports
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { IncomingMessage, ServerResponse, createServer } from 'http';
import { getSessionManager, SessionManager, SessionData } from './session-manager.js';
import { getProgressNotifier, ProgressNotifier } from './progress-notifier.js';
import { randomUUID } from 'crypto';

// Transport types
export type TransportType = 'stdio' | 'sse' | 'http-stream';

// Transport configuration
export interface TransportConfig {
  type: TransportType;
  port?: number;
  host?: string;
  path?: string;
  enableCors?: boolean;
  sessionTimeout?: number;
  enableAutoSync?: boolean;
  enableProgress?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: TransportConfig = {
  type: 'stdio',
  port: 3000,
  host: 'localhost',
  path: '/mcp',
  enableCors: true,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  enableAutoSync: true,
  enableProgress: true,
};

// Active transports tracking
interface ActiveTransport {
  type: TransportType;
  transport: StdioServerTransport | SSEServerTransport | StreamableHTTPServerTransport;
  sessionId?: string;
}

/**
 * TransportFactory - Creates and manages MCP transports
 */
export class TransportFactory {
  private config: TransportConfig;
  private sessionManager: SessionManager;
  private progressNotifier: ProgressNotifier;
  private activeTransports: Map<string, ActiveTransport> = new Map();
  private httpServer: ReturnType<typeof createServer> | null = null;
  private sseTransports: Map<string, SSEServerTransport> = new Map();

  constructor(config: Partial<TransportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionManager = getSessionManager({
      sessionTimeout: this.config.sessionTimeout,
      autoSyncEnabled: this.config.enableAutoSync,
    });
    this.progressNotifier = getProgressNotifier();
  }

  /**
   * Create and connect transport based on configuration
   */
  async createTransport(server: Server): Promise<{
    transport: StdioServerTransport | SSEServerTransport | StreamableHTTPServerTransport;
    sessionId: string;
  }> {
    const transportId = randomUUID();
    let session: SessionData;
    let transport: StdioServerTransport | SSEServerTransport | StreamableHTTPServerTransport;

    switch (this.config.type) {
      case 'stdio':
        transport = await this.createStdioTransport(server);
        session = this.sessionManager.createSession('stdio-client', { transportType: 'stdio' });
        break;

      case 'sse':
        throw new Error('SSE transport requires HTTP server. Use startSSEServer() instead.');

      case 'http-stream':
        throw new Error('HTTP Stream transport requires HTTP server. Use startHTTPStreamServer() instead.');

      default:
        throw new Error(`Unknown transport type: ${this.config.type}`);
    }

    this.activeTransports.set(transportId, {
      type: this.config.type,
      transport,
      sessionId: session.sessionId,
    });

    return { transport, sessionId: session.sessionId };
  }

  /**
   * Create STDIO transport
   */
  private async createStdioTransport(server: Server): Promise<StdioServerTransport> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return transport;
  }

  /**
   * Start SSE server for streaming
   */
  async startSSEServer(
    server: Server,
    callbacks?: {
      onConnect?: (sessionId: string) => void;
      onDisconnect?: (sessionId: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    const { port, host, path, enableCors } = this.config;

    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS handling
      if (enableCors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
        res.setHeader('Access-Control-Expose-Headers', 'X-Session-Id');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }
      }

      const url = new URL(req.url || '/', `http://${host}:${port}`);

      // SSE endpoint for receiving events
      if (url.pathname === `${path}/sse` && req.method === 'GET') {
        await this.handleSSEConnection(server, req, res, callbacks);
        return;
      }

      // POST endpoint for sending messages
      if (url.pathname === `${path}/message` && req.method === 'POST') {
        await this.handleSSEMessage(req, res);
        return;
      }

      // Session endpoint
      if (url.pathname === `${path}/session`) {
        await this.handleSessionRequest(req, res);
        return;
      }

      // Health check
      if (url.pathname === `${path}/health`) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          transport: 'sse',
          sessions: this.sessionManager.getStats(),
        }));
        return;
      }

      // 404 for other paths
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    return new Promise((resolve, reject) => {
      this.httpServer!.listen(port, host, () => {
        console.error(`SSE MCP Server listening on http://${host}:${port}${path}`);
        console.error(`  - SSE endpoint: http://${host}:${port}${path}/sse`);
        console.error(`  - Message endpoint: http://${host}:${port}${path}/message`);
        console.error(`  - Session endpoint: http://${host}:${port}${path}/session`);
        console.error(`  - Health endpoint: http://${host}:${port}${path}/health`);
        resolve();
      });

      this.httpServer!.on('error', (error) => {
        callbacks?.onError?.(error);
        reject(error);
      });
    });
  }

  /**
   * Handle SSE connection
   */
  private async handleSSEConnection(
    server: Server,
    req: IncomingMessage,
    res: ServerResponse,
    callbacks?: {
      onConnect?: (sessionId: string) => void;
      onDisconnect?: (sessionId: string) => void;
    }
  ): Promise<void> {
    // Check for existing session
    const existingSessionId = req.headers['x-session-id'] as string;
    let session: SessionData;

    if (existingSessionId) {
      const existingSession = this.sessionManager.reconnect(existingSessionId);
      if (existingSession) {
        session = existingSession;
      } else {
        session = this.sessionManager.createSession('sse-client', { transportType: 'sse' });
      }
    } else {
      session = this.sessionManager.createSession('sse-client', { transportType: 'sse' });
    }

    // Create SSE transport
    const transport = new SSEServerTransport(`${this.config.path}/message`, res);
    
    // Store transport
    this.sseTransports.set(session.sessionId, transport);

    // Set session ID header
    res.setHeader('X-Session-Id', session.sessionId);

    // Connect server to transport
    await server.connect(transport);

    // Setup progress notifications for this session
    if (this.config.enableProgress) {
      this.setupProgressNotifications(session.sessionId, res);
    }

    callbacks?.onConnect?.(session.sessionId);

    // Handle disconnect
    req.on('close', () => {
      this.sessionManager.disconnectSession(session.sessionId);
      this.sseTransports.delete(session.sessionId);
      callbacks?.onDisconnect?.(session.sessionId);
    });
  }

  /**
   * Handle SSE message
   */
  private async handleSSEMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing X-Session-Id header' }));
      return;
    }

    const transport = this.sseTransports.get(sessionId);
    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }

    // Update session activity
    this.sessionManager.touch(sessionId);

    // Let transport handle the message
    await transport.handlePostMessage(req, res);
  }

  /**
   * Handle session requests
   */
  private async handleSessionRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'GET') {
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        // Return all sessions (for admin purposes)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          stats: this.sessionManager.getStats(),
        }));
        return;
      }

      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        session: {
          sessionId: session.sessionId,
          state: session.state,
          createdAt: session.createdAt,
          lastActivityAt: session.lastActivityAt,
          hasBrowserState: session.browserState !== null,
        },
      }));
      return;
    }

    if (req.method === 'DELETE') {
      const sessionId = req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing X-Session-Id header' }));
        return;
      }

      const deleted = this.sessionManager.destroySession(sessionId);
      this.sseTransports.delete(sessionId);
      
      res.writeHead(deleted ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ deleted }));
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  /**
   * Start HTTP Streamable server
   */
  async startHTTPStreamServer(
    server: Server,
    callbacks?: {
      onRequest?: (sessionId: string, method: string) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    const { port, host, path, enableCors } = this.config;

    // Create the streamable HTTP transport
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    // Connect to MCP server
    await server.connect(transport);

    this.httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS handling
      if (enableCors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
        res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }
      }

      const url = new URL(req.url || '/', `http://${host}:${port}`);

      // MCP endpoint
      if (url.pathname === path || url.pathname === `${path}/`) {
        const sessionId = req.headers['mcp-session-id'] as string || randomUUID();
        callbacks?.onRequest?.(sessionId, req.method || 'UNKNOWN');

        try {
          await transport.handleRequest(req, res);
        } catch (error) {
          callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        }
        return;
      }

      // Health check
      if (url.pathname === `${path}/health`) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          transport: 'http-stream',
          sessions: this.sessionManager.getStats(),
        }));
        return;
      }

      // 404 for other paths
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    return new Promise((resolve, reject) => {
      this.httpServer!.listen(port, host, () => {
        console.error(`HTTP Stream MCP Server listening on http://${host}:${port}${path}`);
        console.error(`  - MCP endpoint: http://${host}:${port}${path}`);
        console.error(`  - Health endpoint: http://${host}:${port}${path}/health`);
        resolve();
      });

      this.httpServer!.on('error', (error) => {
        callbacks?.onError?.(error);
        reject(error);
      });
    });
  }

  /**
   * Setup progress notifications for SSE
   */
  private setupProgressNotifications(sessionId: string, res: ServerResponse): void {
    const unsubscribe = this.progressNotifier.subscribeAll((update) => {
      // Send progress as SSE event
      const data = JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/progress',
        params: update,
      });
      
      try {
        res.write(`event: progress\ndata: ${data}\n\n`);
      } catch {
        // Connection might be closed
        unsubscribe();
      }
    });

    // Cleanup on disconnect
    this.sessionManager.subscribe((event) => {
      if (event.sessionId === sessionId && 
          (event.type === 'session:destroyed' || event.type === 'session:expired')) {
        unsubscribe();
      }
    });
  }

  /**
   * Stop HTTP server
   */
  async stopServer(): Promise<void> {
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(() => {
          this.httpServer = null;
          resolve();
        });
      });
    }
  }

  /**
   * Get session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get progress notifier
   */
  getProgressNotifier(): ProgressNotifier {
    return this.progressNotifier;
  }

  /**
   * Get active transport count
   */
  getActiveTransportCount(): number {
    return this.activeTransports.size + this.sseTransports.size;
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    await this.stopServer();
    this.activeTransports.clear();
    this.sseTransports.clear();
    this.sessionManager.shutdown();
    this.progressNotifier.cleanup();
  }
}

/**
 * Parse transport configuration from environment variables
 */
export function parseTransportConfig(): TransportConfig {
  const type = (process.env.MCP_TRANSPORT || 'stdio') as TransportType;
  
  return {
    type,
    port: parseInt(process.env.MCP_PORT || '3000', 10),
    host: process.env.MCP_HOST || 'localhost',
    path: process.env.MCP_PATH || '/mcp',
    enableCors: process.env.MCP_CORS !== 'false',
    sessionTimeout: parseInt(process.env.MCP_SESSION_TIMEOUT || '1800000', 10),
    enableAutoSync: process.env.MCP_AUTO_SYNC !== 'false',
    enableProgress: process.env.MCP_PROGRESS !== 'false',
  };
}

/**
 * Create transport factory with environment config
 */
export function createTransportFactory(overrides?: Partial<TransportConfig>): TransportFactory {
  const config = { ...parseTransportConfig(), ...overrides };
  return new TransportFactory(config);
}
