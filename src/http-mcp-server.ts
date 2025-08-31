import express from 'express';
import { WebSocketServer } from 'ws';
import * as http from 'http';
import * as path from 'path';
import * as os from 'os';

// Import existing MCP server components
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool definitions and handlers
import { TOOLS, SERVER_INFO, CAPABILITIES } from './tool-definitions.js';
import { setupProcessCleanup } from './core-infrastructure.js';
import { closeBrowser, forceKillAllBraveProcesses } from './brave-browser-manager.js';

// Import all handlers
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';

console.error('🌐 HTTP/WebSocket MCP Server Initializing...');

export class HttpMcpServer {
  private app: express.Application;
  private httpServer!: http.Server;
  private wsServer!: WebSocketServer;
  private mcpServer: Server;
  private httpPort: number = 3000;
  private wsPort: number = 3001;

  constructor() {
    this.app = express();
    this.mcpServer = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
    this.setupMcpHandlers();
    this.setupExpressMiddleware();
    this.setupHttpRoutes();
  }

  private setupMcpHandlers() {
    console.error('🔧 Setting up MCP handlers...');

    // Initialize handler
    this.mcpServer.setRequestHandler(InitializeRequestSchema, async (request) => {
      console.error(`🔧 HTTP MCP Initialize request: ${JSON.stringify(request)}`);
      
      const clientProtocolVersion = request.params.protocolVersion;
      const response = {
        protocolVersion: clientProtocolVersion,
        capabilities: CAPABILITIES,
        serverInfo: SERVER_INFO,
      };
      
      console.error(`🔧 HTTP MCP Initialize response: ${JSON.stringify(response)}`);
      return response;
    });

    // List tools handler
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('🔧 HTTP MCP Tools list requested');
      return { tools: TOOLS };
    });

    // List resources handler
    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
      console.error('🔧 HTTP MCP Resources list requested');
      return { resources: [] };
    });

    // List prompts handler
    this.mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
      console.error('🔧 HTTP MCP Prompts list requested');
      return { prompts: [] };
    });

    // Tool call handler
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.error(`🔧 HTTP MCP Tool call: ${name} with args: ${JSON.stringify(args)}`);

      try {
        // Route tool calls to appropriate handlers
        switch (name) {
          case 'browser_init':
            return await handleBrowserInit(args || {});
          case 'navigate':
            return await handleNavigate(args as any);
          case 'get_content':
            return await handleGetContent(args || {});
          case 'click':
            return await handleClick(args as any);
          case 'type':
            return await handleType(args as any);
          case 'wait':
            return await handleWait(args as any);
          case 'browser_close':
            return await handleBrowserClose();
          case 'solve_captcha':
            return await handleSolveCaptcha(args as any);
          case 'random_scroll':
            return await handleRandomScroll();
          case 'find_selector':
            return await handleFindSelector(args as any);
          case 'save_content_as_markdown':
            return await handleSaveContentAsMarkdown(args as any);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`HTTP MCP Tool ${name} failed:`, errorMessage);
        
        return {
          content: [
            {
              type: 'text',
              text: `❌ Tool execution failed: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupExpressMiddleware() {
    console.error('🔧 Setting up Express middleware...');
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // JSON parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.error(`🌐 HTTP ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  private setupHttpRoutes() {
    console.error('🔧 Setting up HTTP routes...');

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: 'brave-puppeteer-mcp-server',
        version: '2.0.0',
        platform: os.platform(),
        arch: os.arch(),
        timestamp: new Date().toISOString()
      });
    });

    // Server info endpoint
    this.app.get('/info', (req, res) => {
      res.json({
        serverInfo: SERVER_INFO,
        capabilities: CAPABILITIES,
        tools: TOOLS.map(t => ({ name: t.name, description: t.description }))
      });
    });

    // MCP endpoint for HTTP-based communication
    this.app.post('/mcp', async (req, res) => {
      try {
        console.error(`🌐 HTTP MCP Request: ${JSON.stringify(req.body)}`);
        
        const mcpRequest = req.body;
        
        // Handle MCP request based on method
        let response;
        
        switch (mcpRequest.method) {
          case 'initialize':
            response = await this.handleInitialize(mcpRequest);
            break;
          case 'tools/list':
            response = await this.handleListTools(mcpRequest);
            break;
          case 'tools/call':
            response = await this.handleToolCall(mcpRequest);
            break;
          case 'resources/list':
            response = await this.handleListResources(mcpRequest);
            break;
          case 'prompts/list':
            response = await this.handleListPrompts(mcpRequest);
            break;
          default:
            throw new Error(`Unknown MCP method: ${mcpRequest.method}`);
        }
        
        console.error(`🌐 HTTP MCP Response: ${JSON.stringify(response)}`);
        res.json(response);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ HTTP MCP Error:`, errorMessage);
        
        res.status(500).json({
          error: {
            code: -32603,
            message: errorMessage
          }
        });
      }
    });

    // Tool execution endpoints
    this.app.post('/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const args = req.body;
      
      try {
        console.error(`🔧 Direct tool call: ${toolName} with args: ${JSON.stringify(args)}`);
        
        const response = await this.executeTool(toolName, args);
        res.json({ success: true, result: response });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Direct tool error:`, errorMessage);
        
        res.status(500).json({
          success: false,
          error: errorMessage
        });
      }
    });

    // Static file serving for documentation
    this.app.get('/', (req, res) => {
      res.json({
        message: '🦁 Brave Puppeteer Real Browser MCP Server',
        version: '2.0.0',
        endpoints: {
          health: '/health',
          info: '/info',
          mcp: '/mcp (POST)',
          tools: '/tools/:toolName (POST)',
          websocket: `ws://localhost:${this.wsPort}/mcp`
        },
        documentation: 'https://github.com/your-repo/brave-puppeteer-mcp-server'
      });
    });
  }

  private async handleInitialize(request: any) {
    const clientProtocolVersion = request.params?.protocolVersion || '2024-11-05';
    return {
      protocolVersion: clientProtocolVersion,
      capabilities: CAPABILITIES,
      serverInfo: SERVER_INFO,
    };
  }

  private async handleListTools(request: any) {
    return { tools: TOOLS };
  }

  private async handleListResources(request: any) {
    return { resources: [] };
  }

  private async handleListPrompts(request: any) {
    return { prompts: [] };
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;
    return await this.executeTool(name, args);
  }

  private async executeTool(name: string, args: any) {
    switch (name) {
      case 'browser_init':
        return await handleBrowserInit(args || {});
      case 'navigate':
        return await handleNavigate(args);
      case 'get_content':
        return await handleGetContent(args || {});
      case 'click':
        return await handleClick(args);
      case 'type':
        return await handleType(args);
      case 'wait':
        return await handleWait(args);
      case 'browser_close':
        return await handleBrowserClose();
      case 'solve_captcha':
        return await handleSolveCaptcha(args);
      case 'random_scroll':
        return await handleRandomScroll();
      case 'find_selector':
        return await handleFindSelector(args);
      case 'save_content_as_markdown':
        return await handleSaveContentAsMarkdown(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private setupWebSocketServer(host: string = 'localhost') {
    console.error('🔧 Setting up WebSocket server...');

    this.wsServer = new WebSocketServer({ 
      port: this.wsPort,
      host: host === 'localhost' ? undefined : host // undefined means all interfaces for Node.js ws
    });
    
    this.wsServer.on('connection', (ws) => {
      console.error('🔗 WebSocket client connected');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.error(`🔗 WebSocket received: ${JSON.stringify(message)}`);
          
          let response;
          
          switch (message.method) {
            case 'initialize':
              response = await this.handleInitialize(message);
              break;
            case 'tools/list':
              response = await this.handleListTools(message);
              break;
            case 'tools/call':
              response = await this.handleToolCall(message);
              break;
            case 'resources/list':
              response = await this.handleListResources(message);
              break;
            case 'prompts/list':
              response = await this.handleListPrompts(message);
              break;
            default:
              throw new Error(`Unknown WebSocket method: ${message.method}`);
          }
          
          const responseMessage = {
            jsonrpc: '2.0',
            id: message.id,
            result: response
          };
          
          console.error(`🔗 WebSocket sending: ${JSON.stringify(responseMessage)}`);
          ws.send(JSON.stringify(responseMessage));
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ WebSocket error:`, errorMessage);
          
          const errorResponse = {
            jsonrpc: '2.0',
            id: (JSON.parse(data.toString())).id,
            error: {
              code: -32603,
              message: errorMessage
            }
          };
          
          ws.send(JSON.stringify(errorResponse));
        }
      });

      ws.on('close', () => {
        console.error('🔗 WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: '🦁 Connected to Brave Puppeteer MCP Server',
        server: SERVER_INFO,
        capabilities: CAPABILITIES
      }));
    });

    console.error(`🔗 WebSocket server listening on port ${this.wsPort}`);
  }

  public async start(httpPort?: number, wsPort?: number) {
    if (httpPort) this.httpPort = httpPort;
    if (wsPort) this.wsPort = wsPort;

    // Get host from environment variables or default to localhost
    const httpHost = process.env.HTTP_HOST || 'localhost';
    const wsHost = process.env.WS_HOST || 'localhost';

    console.error(`🚀 Starting HTTP/WebSocket MCP Server...`);
    console.error(`🏠 HTTP Host: ${httpHost}:${this.httpPort}`);
    console.error(`🏠 WebSocket Host: ${wsHost}:${this.wsPort}`);
    
    // Setup process cleanup
    setupProcessCleanup(async () => {
      console.error('🛑 Process cleanup triggered');
      await closeBrowser();
      await forceKillAllBraveProcesses();
      this.httpServer?.close();
      this.wsServer?.close();
    });

    // Start HTTP server with host binding
    this.httpServer = this.app.listen(this.httpPort, httpHost, () => {
      console.error(`🌐 HTTP MCP Server running on http://${httpHost}:${this.httpPort}`);
      console.error(`📡 MCP endpoint: http://${httpHost}:${this.httpPort}/mcp`);
      console.error(`🔧 Tools endpoint: http://${httpHost}:${this.httpPort}/tools/:toolName`);
      console.error(`❤️ Health check: http://${httpHost}:${this.httpPort}/health`);
      
      if (httpHost === '0.0.0.0') {
        console.error(`🌍 Server accessible from any network interface`);
        console.error(`🔗 Local access: http://localhost:${this.httpPort}`);
        console.error(`🔗 Network access: http://<your-ip>:${this.httpPort}`);
      }
    });

    // Start WebSocket server with host binding
    this.setupWebSocketServer(wsHost);
    
    console.error('🎉 HTTP/WebSocket MCP Server started successfully!');
    console.error('📋 Available endpoints:');
    console.error(`  - HTTP MCP: http://${httpHost}:${this.httpPort}/mcp`);
    console.error(`  - WebSocket MCP: ws://${wsHost}:${this.wsPort}/mcp`);
    console.error(`  - Health Check: http://${httpHost}:${this.httpPort}/health`);
    console.error(`  - Server Info: http://${httpHost}:${this.httpPort}/info`);
    console.error('💡 All original features are available via HTTP and WebSocket!');
    
    if (httpHost === '0.0.0.0' || wsHost === '0.0.0.0') {
      console.error('🔐 Security Note: Server is accessible from any network interface.');
      console.error('   Only use this in trusted networks or for development purposes.');
    }
  }

  public async stop() {
    console.error('🛑 Stopping HTTP/WebSocket MCP Server...');
    
    if (this.httpServer) {
      this.httpServer.close();
    }
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    await closeBrowser();
    await forceKillAllBraveProcesses();
    
    console.error('🛑 Server stopped');
  }
}

// Export for use in main index.ts
export default HttpMcpServer;
