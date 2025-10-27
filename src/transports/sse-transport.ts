import express, { Express, Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { TOOLS } from '../tool-definitions.js';
import { executeToolByName } from '../index.js';

// Import specific handlers for direct endpoints (for backward compatibility)
import { handleBrowserInit, handleBrowserClose } from '../handlers/browser-handlers.js';
import { handleNavigate } from '../handlers/navigation-handlers.js';
import { handleClick, handleType } from '../handlers/interaction-handlers.js';
import { handleGetContent } from '../handlers/content-handlers.js';

export interface SseTransportConfig {
  port: number;
  host: string;
  corsOrigins?: string[];
  heartbeatInterval?: number;
}

interface SseClient {
  id: string;
  response: Response;
  lastActivity: number;
}

export class SseTransport {
  private app: Express;
  private server: HTTPServer | null = null;
  private config: SseTransportConfig;
  private clients: Map<string, SseClient> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<SseTransportConfig> = {}) {
    this.config = {
      port: config.port || 3001,
      host: config.host || '0.0.0.0',
      corsOrigins: config.corsOrigins || ['*'],
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS with SSE-specific headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', this.config.corsOrigins?.[0] || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
      res.header('Access-Control-Expose-Headers', 'Content-Type, Cache-Control');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.error(`📡 [SSE] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        protocol: 'SSE',
        clients: this.clients.size,
      });
    });

    // List all available tools
    this.app.get('/tools', (req, res) => {
      res.json({ tools: TOOLS });
    });

    // SSE event stream endpoint
    this.app.get('/events', (req, res) => {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add client to active connections
      this.clients.set(clientId, {
        id: clientId,
        response: res,
        lastActivity: Date.now(),
      });

      console.error(`📡 [SSE] Client connected: ${clientId} (Total: ${this.clients.size})`);

      // Send initial connection message
      this.sendEvent(res, 'connected', {
        clientId,
        message: 'Connected to Brave Browser MCP Server',
        timestamp: new Date().toISOString(),
      });

      // Handle client disconnect
      req.on('close', () => {
        this.clients.delete(clientId);
        console.error(`📡 [SSE] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
      });
    });

    // Execute tool via POST with SSE response
    this.app.post('/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const args = req.body;
      const clientId = req.headers['x-client-id'] as string;

      try {
        // Send start event to SSE clients
        this.broadcastEvent('tool_start', {
          tool: toolName,
          timestamp: new Date().toISOString(),
        });

        const result = await this.executeTool(toolName, args);

        // Send success event to SSE clients
        this.broadcastEvent('tool_success', {
          tool: toolName,
          timestamp: new Date().toISOString(),
        });

        res.json({ success: true, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Send error event to SSE clients
        this.broadcastEvent('tool_error', {
          tool: toolName,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });

        // Return errors in MCP format (status 200 with isError flag)
        res.json({ 
          success: true, 
          result: {
            isError: true,
            content: [{
              type: 'text',
              text: errorMessage
            }]
          }
        });
      }
    });

    // Browser automation endpoints with SSE notifications
    this.app.post('/browser/init', async (req, res) => {
      try {
        this.broadcastEvent('browser_init_start', { timestamp: new Date().toISOString() });
        const result = await handleBrowserInit(req.body);
        this.broadcastEvent('browser_init_success', { timestamp: new Date().toISOString() });
        res.json({ success: true, result });
      } catch (error) {
        this.broadcastEvent('browser_init_error', { 
          error: (error as Error).message,
          timestamp: new Date().toISOString() 
        });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/navigate', async (req, res) => {
      try {
        this.broadcastEvent('browser_navigate_start', { 
          url: req.body.url,
          timestamp: new Date().toISOString() 
        });
        const result = await handleNavigate(req.body);
        this.broadcastEvent('browser_navigate_success', { 
          url: req.body.url,
          timestamp: new Date().toISOString() 
        });
        res.json({ success: true, result });
      } catch (error) {
        this.broadcastEvent('browser_navigate_error', { 
          error: (error as Error).message,
          timestamp: new Date().toISOString() 
        });
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/click', async (req, res) => {
      try {
        const result = await handleClick(req.body);
        this.broadcastEvent('browser_action', { 
          action: 'click',
          selector: req.body.selector,
          timestamp: new Date().toISOString() 
        });
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/type', async (req, res) => {
      try {
        const result = await handleType(req.body);
        this.broadcastEvent('browser_action', { 
          action: 'type',
          selector: req.body.selector,
          timestamp: new Date().toISOString() 
        });
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/get-content', async (req, res) => {
      try {
        const result = await handleGetContent(req.body);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/close', async (req, res) => {
      try {
        this.broadcastEvent('browser_close', { timestamp: new Date().toISOString() });
        const result = await handleBrowserClose();
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('❌ [SSE] Error:', err);
      res.status(500).json({ success: false, error: err.message });
    });
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    // Use universal tool executor from index.ts (supports all 110 tools)
    return await executeToolByName(toolName, args);
  }

  private sendEvent(res: Response, eventType: string, data: any): void {
    const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(eventData);
  }

  private broadcastEvent(eventType: string, data: any): void {
    const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    
    this.clients.forEach((client, clientId) => {
      try {
        client.response.write(eventData);
        client.lastActivity = Date.now();
      } catch (error) {
        console.error(`❌ [SSE] Failed to send to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      this.clients.forEach((client, clientId) => {
        try {
          // Send heartbeat
          client.response.write(': heartbeat\n\n');
          
          // Check for stale connections (no activity for 2 minutes)
          if (now - client.lastActivity > 120000) {
            console.error(`📡 [SSE] Removing stale client: ${clientId}`);
            client.response.end();
            this.clients.delete(clientId);
          }
        } catch (error) {
          console.error(`❌ [SSE] Heartbeat failed for client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      });
    }, this.config.heartbeatInterval!);
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(this.app);

      this.server.listen(this.config.port, this.config.host, () => {
        console.error(`✅ [SSE] Server running on http://${this.config.host}:${this.config.port}`);
        console.error(`📡 [SSE] Event stream available at http://${this.config.host}:${this.config.port}/events`);
        console.error(`💡 [SSE] Real-time browser automation events enabled`);
        
        this.startHeartbeat();
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop heartbeat
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      // Close all SSE connections
      this.clients.forEach((client, clientId) => {
        try {
          client.response.end();
        } catch (error) {
          console.error(`❌ [SSE] Error closing client ${clientId}:`, error);
        }
      });
      this.clients.clear();

      // Close server
      if (this.server) {
        this.server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Public method to broadcast custom events
  public broadcast(eventType: string, data: any): void {
    this.broadcastEvent(eventType, data);
  }

  // Get connected clients count
  public getClientsCount(): number {
    return this.clients.size;
  }
}
