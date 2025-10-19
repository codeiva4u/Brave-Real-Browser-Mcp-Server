#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { HttpTransport } from './transports/http-transport.js';
import { LspTransport } from './transports/lsp-transport.js';
import { closeBrowser, forceKillAllBraveProcesses } from './browser-manager.js';
import { setupProcessCleanup } from './core-infrastructure.js';

export type ProtocolMode = 'mcp' | 'http' | 'lsp' | 'all';

export interface LauncherConfig {
  mode: ProtocolMode;
  httpPort?: number;
  httpHost?: string;
  enableWebSocket?: boolean;
  enableCors?: boolean;
}

export class MultiProtocolLauncher {
  private config: LauncherConfig;
  private httpTransport?: HttpTransport;
  private lspTransport?: LspTransport;
  private mcpServer?: Server;

  constructor(config: Partial<LauncherConfig> = {}) {
    this.config = {
      mode: config.mode || 'mcp',
      httpPort: config.httpPort || 3000,
      httpHost: config.httpHost || '0.0.0.0',
      enableWebSocket: config.enableWebSocket !== false,
      enableCors: config.enableCors !== false,
    };
  }

  async start(): Promise<void> {
    console.error('🚀 Multi-Protocol Brave Browser Server Starting...');
    console.error(`📡 Mode: ${this.config.mode.toUpperCase()}`);

    // Setup cleanup handlers
    setupProcessCleanup(async () => {
      await this.stop();
    });

    switch (this.config.mode) {
      case 'mcp':
        await this.startMcp();
        break;
      case 'http':
        await this.startHttp();
        break;
      case 'lsp':
        await this.startLsp();
        break;
      case 'all':
        await this.startAll();
        break;
      default:
        throw new Error(`Unknown mode: ${this.config.mode}`);
    }
  }

  private async startMcp(): Promise<void> {
    console.error('🔵 [MCP] Starting MCP server...');
    
    // Import MCP server setup from index.ts
    const { createMcpServer } = await import('./mcp-server.js');
    this.mcpServer = await createMcpServer();
    
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    
    console.error('✅ [MCP] Server started successfully');
  }

  private async startHttp(): Promise<void> {
    console.error('🟢 [HTTP] Starting HTTP/WebSocket server...');
    
    this.httpTransport = new HttpTransport({
      port: this.config.httpPort,
      host: this.config.httpHost,
      enableWebSocket: this.config.enableWebSocket,
    });
    
    await this.httpTransport.start();
  }

  private async startLsp(): Promise<void> {
    console.error('🟣 [LSP] Starting Language Server...');
    
    this.lspTransport = new LspTransport();
    await this.lspTransport.start();
  }

  private async startAll(): Promise<void> {
    console.error('🌈 Starting all protocols...');
    
    // Start HTTP in background
    if (!this.httpTransport) {
      this.httpTransport = new HttpTransport({
        port: this.config.httpPort,
        host: this.config.httpHost,
        enableWebSocket: this.config.enableWebSocket,
      });
      await this.httpTransport.start();
    }

    // Note: LSP and MCP use stdio/IPC, so they can't run simultaneously
    // In 'all' mode, we prioritize HTTP/WebSocket for universal access
    console.error('⚠️  [Note] MCP and LSP use stdio, so only HTTP/WebSocket is active in "all" mode');
    console.error('💡 Use separate instances for MCP or LSP: --mode=mcp or --mode=lsp');
  }

  async stop(): Promise<void> {
    console.error('🛑 Stopping servers...');
    
    await closeBrowser();
    await forceKillAllBraveProcesses();
    
    if (this.httpTransport) {
      await this.httpTransport.stop();
    }
    
    if (this.lspTransport) {
      await this.lspTransport.stop();
    }
    
    console.error('✅ All servers stopped');
  }
}

// Parse CLI arguments
export function parseArgs(): LauncherConfig {
  const args = process.argv.slice(2);
  const config: Partial<LauncherConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--mode' || arg === '-m') {
      const mode = args[++i] as ProtocolMode;
      if (['mcp', 'http', 'lsp', 'all'].includes(mode)) {
        config.mode = mode;
      } else {
        console.error(`❌ Invalid mode: ${mode}. Use: mcp, http, lsp, or all`);
        process.exit(1);
      }
    } else if (arg === '--port' || arg === '-p') {
      config.httpPort = parseInt(args[++i]);
    } else if (arg === '--host' || arg === '-h') {
      config.httpHost = args[++i];
    } else if (arg === '--no-websocket') {
      config.enableWebSocket = false;
    } else if (arg === '--help') {
      console.log(`
Brave Real Browser MCP Server - Multi-Protocol Support

Usage: brave-real-browser-mcp-server [options]

Options:
  --mode, -m <mode>       Protocol mode: mcp, http, lsp, or all (default: mcp)
  --port, -p <port>       HTTP server port (default: 3000)
  --host, -h <host>       HTTP server host (default: 0.0.0.0)
  --no-websocket          Disable WebSocket support in HTTP mode
  --help                  Show this help message

Examples:
  # MCP mode (for Claude Desktop, Cursor, Warp)
  brave-real-browser-mcp-server --mode mcp

  # HTTP/WebSocket mode (for any HTTP client)
  brave-real-browser-mcp-server --mode http --port 3000

  # LSP mode (for Zed, VSCode, etc.)
  brave-real-browser-mcp-server --mode lsp

  # All protocols (HTTP only, MCP/LSP need separate instances)
  brave-real-browser-mcp-server --mode all
      `);
      process.exit(0);
    }
  }

  return config as LauncherConfig;
}

// Main entry point
export async function main() {
  const config = parseArgs();
  const launcher = new MultiProtocolLauncher(config);

  try {
    await launcher.start();
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
