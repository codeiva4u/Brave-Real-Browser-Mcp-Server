#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpTransport } from "./transports/http-transport.js";
import { LspTransport } from "./transports/lsp-transport.js";
import { SseTransport } from "./transports/sse-transport.js";
import { closeBrowser, forceKillAllBraveProcesses } from "./browser-manager.js";
import { setupProcessCleanup } from "./core-infrastructure.js";
import {
  UniversalIDEAdapter,
  ProtocolType,
  AIIDEType,
} from "./universal-ide-adapter.js";

export type ProtocolMode = "auto" | "mcp" | "http" | "lsp" | "sse" | "all";

export interface LauncherConfig {
  mode: ProtocolMode;
  httpPort?: number;
  httpHost?: string;
  ssePort?: number;
  sseHost?: string;
  enableWebSocket?: boolean;
  enableCors?: boolean;
  enableAutoDetection?: boolean;
}

export class MultiProtocolLauncher {
  private config: LauncherConfig;
  private httpTransport?: HttpTransport;
  private lspTransport?: LspTransport;
  private sseTransport?: SseTransport;
  private mcpServer?: Server;
  private universalAdapter?: UniversalIDEAdapter;

  constructor(config: Partial<LauncherConfig> = {}) {
    this.config = {
      mode: config.mode || "auto",
      httpPort: config.httpPort || 3000,
      httpHost: config.httpHost || "0.0.0.0",
      ssePort: config.ssePort || 3001,
      sseHost: config.sseHost || "0.0.0.0",
      enableWebSocket: config.enableWebSocket !== false,
      enableCors: config.enableCors !== false,
      enableAutoDetection: config.enableAutoDetection !== false,
    };
  }

  async start(): Promise<void> {
    console.error("🚀 Multi-Protocol Brave Browser Server Starting...");
    console.error(`📡 Mode: ${this.config.mode.toUpperCase()}`);

    // Initialize Universal IDE Adapter if auto-detection is enabled
    if (this.config.enableAutoDetection && this.config.mode === "auto") {
      console.error("🔍 Initializing Universal IDE Adapter...");
      this.universalAdapter = new UniversalIDEAdapter({
        enableAutoDetection: true,
        fallbackToHttp: true,
        httpPort: this.config.httpPort,
        logDetectionDetails: true,
      });

      const detectionResult = await this.universalAdapter.initialize();

      // Override mode based on detection
      if (
        detectionResult.protocol === ProtocolType.MCP ||
        detectionResult.protocol === ProtocolType.STDIO
      ) {
        this.config.mode = "mcp";
      } else if (detectionResult.protocol === ProtocolType.LSP) {
        this.config.mode = "lsp";
      } else if (
        detectionResult.protocol === ProtocolType.HTTP ||
        detectionResult.protocol === ProtocolType.WEBSOCKET
      ) {
        this.config.mode = "http";
      }

      console.error(`✅ Auto-detected mode: ${this.config.mode.toUpperCase()}`);
    }

    // Setup cleanup handlers
    setupProcessCleanup(async () => {
      await this.stop();
    });

    switch (this.config.mode) {
      case "auto":
        // Fallback to MCP if auto-detection didn't override
        await this.startMcp();
        break;
      case "mcp":
        await this.startMcp();
        break;
      case "http":
        await this.startHttp();
        break;
      case "lsp":
        await this.startLsp();
        break;
      case "sse":
        await this.startSse();
        break;
      case "all":
        await this.startAll();
        break;
      default:
        throw new Error(`Unknown mode: ${this.config.mode}`);
    }
  }

  private async startMcp(): Promise<void> {
    console.error("🔵 [MCP] Starting MCP server with STDIO transport...");

    if (this.universalAdapter?.getDetectionResult()) {
      const result = this.universalAdapter.getDetectionResult()!;
      console.error(`🎯 [MCP] Optimized for: ${result.capabilities.name}`);
    }

    // Import MCP server setup from index.ts
    const { createMcpServer } = await import("./mcp-server.js");
    this.mcpServer = await createMcpServer();

    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);

    console.error("✅ [MCP] Server started successfully");
    console.error(
      "💡 [MCP] Compatible with: Claude Desktop, Cursor, Windsurf, Cline, Warp, Roo Coder",
    );
  }

  private async startHttp(): Promise<void> {
    console.error("🟢 [HTTP] Starting HTTP/WebSocket server...");

    if (this.universalAdapter?.getDetectionResult()) {
      const result = this.universalAdapter.getDetectionResult()!;
      console.error(`🎯 [HTTP] Optimized for: ${result.capabilities.name}`);
    }

    this.httpTransport = new HttpTransport({
      port: this.config.httpPort!,
      host: this.config.httpHost!,
      enableWebSocket: this.config.enableWebSocket!,
    });

    await this.httpTransport.start();
    console.error("💡 [HTTP] Universal mode - works with ALL AI IDEs");
  }

  private async startLsp(): Promise<void> {
    console.error("🟣 [LSP] Starting Language Server Protocol...");

    if (this.universalAdapter?.getDetectionResult()) {
      const result = this.universalAdapter.getDetectionResult()!;
      console.error(`🎯 [LSP] Optimized for: ${result.capabilities.name}`);
    }

    this.lspTransport = new LspTransport();
    await this.lspTransport.start();
    console.error(
      "💡 [LSP] Compatible with: Zed Editor, VSCode, Neovim, Emacs, Sublime Text",
    );
  }

  private async startSse(): Promise<void> {
    console.error("🟠 [SSE] Starting Server-Sent Events transport...");

    if (this.universalAdapter?.getDetectionResult()) {
      const result = this.universalAdapter.getDetectionResult()!;
      console.error(`🎯 [SSE] Optimized for: ${result.capabilities.name}`);
    }

    this.sseTransport = new SseTransport({
      port: this.config.ssePort!,
      host: this.config.sseHost!,
    });

    await this.sseTransport.start();
    console.error(
      "💡 [SSE] Real-time streaming - works with web apps and modern clients",
    );
  }

  private async startAll(): Promise<void> {
    console.error("🌈 Starting all protocols...");

    // Start HTTP in background
    if (!this.httpTransport) {
      this.httpTransport = new HttpTransport({
        port: this.config.httpPort!,
        host: this.config.httpHost!,
        enableWebSocket: this.config.enableWebSocket!,
      });
      await this.httpTransport.start();
    }

    // Note: LSP and MCP use stdio/IPC, so they can't run simultaneously
    // In 'all' mode, we prioritize HTTP/WebSocket for universal access
    console.error(
      '⚠️  [Note] MCP and LSP use stdio, so only HTTP/WebSocket is active in "all" mode',
    );
    console.error(
      "💡 Use separate instances for MCP or LSP: --mode=mcp or --mode=lsp",
    );
  }

  async stop(): Promise<void> {
    console.error("🛑 Stopping servers...");

    await closeBrowser();
    await forceKillAllBraveProcesses();

    if (this.httpTransport) {
      await this.httpTransport.stop();
    }

    if (this.lspTransport) {
      await this.lspTransport.stop();
    }

    if (this.sseTransport) {
      await this.sseTransport.stop();
    }

    console.error("✅ All servers stopped");
  }
}

// Parse CLI arguments
export function parseArgs(): LauncherConfig {
  const args = process.argv.slice(2);
  const config: Partial<LauncherConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--mode" || arg === "-m") {
      const mode = args[++i] as ProtocolMode;
      if (["auto", "mcp", "http", "lsp", "sse", "all"].includes(mode)) {
        config.mode = mode;
      } else {
        console.error(
          `❌ Invalid mode: ${mode}. Use: auto, mcp, http, lsp, sse, or all`,
        );
        process.exit(1);
      }
    } else if (arg === "--port" || arg === "-p") {
      config.httpPort = parseInt(args[++i]);
    } else if (arg === "--sse-port") {
      config.ssePort = parseInt(args[++i]);
    } else if (arg === "--host" || arg === "-h") {
      config.httpHost = args[++i];
    } else if (arg === "--no-websocket") {
      config.enableWebSocket = false;
    } else if (arg === "--no-auto-detect") {
      config.enableAutoDetection = false;
    } else if (arg === "--list-ides") {
      UniversalIDEAdapter.printSupportedIDEs();
      process.exit(0);
    } else if (arg === "--help") {
      console.log(`
Brave Real Browser MCP Server - Universal AI IDE Support

Usage: brave-real-browser-mcp-server [options]

Options:
  --mode, -m <mode>       Protocol mode: auto, mcp, http, lsp, sse, or all (default: auto)
  --port, -p <port>       HTTP server port (default: 3000)
  --sse-port <port>       SSE server port (default: 3001)
  --host, -h <host>       HTTP/SSE server host (default: 0.0.0.0)
  --no-websocket          Disable WebSocket support in HTTP mode
  --no-auto-detect        Disable automatic IDE detection
  --list-ides             Show list of all supported AI IDEs
  --help                  Show this help message

Supported AI IDEs (with auto-detection):
  ✓ Claude Desktop         ✓ Cursor AI              ✓ Windsurf
  ✓ Cline (VSCode)         ✓ Roo Coder             ✓ Zed Editor
  ✓ Continue.dev           ✓ Qoder AI              ✓ Warp Terminal
  ✓ GitHub Copilot         ✓ Amazon CodeWhisperer  ✓ Tabnine
  ✓ Cody (Sourcegraph)     ✓ Aider                 ✓ Pieces for Developers
  ✓ VSCode (Generic)       ✓ Any LSP-compatible editor

Examples:
  # Auto mode (automatically detects your IDE and uses optimal protocol)
  brave-real-browser-mcp-server --mode auto

  # Or simply run without arguments (auto is default)
  brave-real-browser-mcp-server

  # MCP mode (for Claude Desktop, Cursor, Windsurf, Cline, Warp, Roo Coder)
  brave-real-browser-mcp-server --mode mcp

  # HTTP/WebSocket mode (universal - works with ALL IDEs)
  brave-real-browser-mcp-server --mode http --port 3000

  # LSP mode (for Zed, VSCode, Neovim, Emacs, Sublime Text)
  brave-real-browser-mcp-server --mode lsp

  # SSE mode (for real-time streaming, web apps)
  brave-real-browser-mcp-server --mode sse --sse-port 3001

  # All protocols (HTTP only, MCP/LSP/SSE need separate instances)
  brave-real-browser-mcp-server --mode all

  # Show all supported IDEs
  brave-real-browser-mcp-server --list-ides
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
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}
