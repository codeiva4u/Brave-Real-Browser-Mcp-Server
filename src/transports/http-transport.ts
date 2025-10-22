import express, { Express, Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TOOLS, TOOL_NAMES } from '../tool-definitions.js';

// Import all handlers
import { handleBrowserInit, handleBrowserClose } from '../handlers/browser-handlers.js';
import { handleNavigate, handleWait } from '../handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from '../handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from '../handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from '../handlers/file-handlers.js';

export interface HttpTransportConfig {
  port: number;
  host: string;
  enableWebSocket: boolean;
  corsOrigins?: string[];
}

export class HttpTransport {
  private app: Express;
  private server: HTTPServer | null = null;
  private wss: WebSocketServer | null = null;
  private config: HttpTransportConfig;

  constructor(config: Partial<HttpTransportConfig> = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || '0.0.0.0',
      enableWebSocket: config.enableWebSocket !== false,
      corsOrigins: config.corsOrigins || ['*'],
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', this.config.corsOrigins?.[0] || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.error(`📡 [HTTP] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // List all available tools
    this.app.get('/tools', (req, res) => {
      res.json({ tools: TOOLS });
    });

    // Execute tool - Generic endpoint
    this.app.post('/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const args = req.body;

      try {
        const result = await this.executeTool(toolName, args);
        res.json({ success: true, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, error: errorMessage });
      }
    });

    // Browser automation endpoints
    this.app.post('/browser/init', async (req, res) => {
      try {
        const result = await handleBrowserInit(req.body);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/navigate', async (req, res) => {
      try {
        const result = await handleNavigate(req.body);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/click', async (req, res) => {
      try {
        const result = await handleClick(req.body);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    this.app.post('/browser/type', async (req, res) => {
      try {
        const result = await handleType(req.body);
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
        const result = await handleBrowserClose();
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: any) => {
      console.error('❌ [HTTP] Error:', err);
      res.status(500).json({ success: false, error: err.message });
    });
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case TOOL_NAMES.BROWSER_INIT:
        return await handleBrowserInit(args || {});
      case TOOL_NAMES.NAVIGATE:
        return await handleNavigate(args);
      case TOOL_NAMES.GET_CONTENT:
        return await handleGetContent(args || {});
      case TOOL_NAMES.CLICK:
        return await handleClick(args);
      case TOOL_NAMES.TYPE:
        return await handleType(args);
      case TOOL_NAMES.WAIT:
        return await handleWait(args);
      case TOOL_NAMES.BROWSER_CLOSE:
        return await handleBrowserClose();
      case TOOL_NAMES.SOLVE_CAPTCHA:
        return await handleSolveCaptcha(args);
      case TOOL_NAMES.RANDOM_SCROLL:
        return await handleRandomScroll();
      case TOOL_NAMES.FIND_SELECTOR:
        return await handleFindSelector(args);
      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        return await handleSaveContentAsMarkdown(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private setupWebSocket(): void {
    if (!this.server || !this.config.enableWebSocket) return;

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.error('🔌 [WebSocket] Client connected');

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          const { id, tool, args } = data;

          const result = await this.executeTool(tool, args);
          
          ws.send(JSON.stringify({
            id,
            success: true,
            result,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          ws.send(JSON.stringify({
            success: false,
            error: errorMessage,
          }));
        }
      });

      ws.on('close', () => {
        console.error('🔌 [WebSocket] Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('❌ [WebSocket] Error:', error);
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = createServer(this.app);
      
      this.setupWebSocket();

      this.server.listen(this.config.port, this.config.host, () => {
        console.error(`✅ [HTTP] Server running on http://${this.config.host}:${this.config.port}`);
        if (this.config.enableWebSocket) {
          console.error(`✅ [WebSocket] Server running on ws://${this.config.host}:${this.config.port}`);
        }
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.wss) {
        this.wss.close();
      }
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
}
