#!/usr/bin/env node

/**
 * Brave Real Browser MCP Server
 * Multi-transport support: STDIO, SSE (Server-Sent Events), and HTTP Streaming
 * With Auto-sync, Session Management, and Progress Notifications
 * 
 * Environment Variables:
 * - MCP_TRANSPORT: 'stdio' | 'sse' | 'http-stream' (default: 'stdio')
 * - MCP_PORT: HTTP server port (default: 3000)
 * - MCP_HOST: HTTP server host (default: 'localhost')
 * - MCP_PATH: MCP endpoint path (default: '/mcp')
 * - MCP_CORS: Enable CORS (default: 'true')
 * - MCP_SESSION_TIMEOUT: Session timeout in ms (default: 1800000)
 * - MCP_AUTO_SYNC: Enable auto-sync (default: 'true')
 * - MCP_PROGRESS: Enable progress notifications (default: 'true')
 * - DEBUG: Enable debug logging (default: 'false')
 */

// Only patch console for STDIO transport to avoid interference with HTTP transports
const transportType = process.env.MCP_TRANSPORT || 'stdio';
if (transportType === 'stdio') {
  // CRITICAL: Patch console.log and stdout to redirect to stderr
  // This ensures MCP stdio transport only receives valid JSON-RPC messages on stdout.
  await import('./patch-console.js');
}

// Debug logging - only enabled if DEBUG=true environment variable is set
const DEBUG_ENABLED = process.env.DEBUG === 'true';
const debug = (...args: unknown[]) => {
  if (DEBUG_ENABLED) {
    console.error('🔍 [DEBUG]', ...args);
  }
};

// Debug logging setup - Log process start (only if DEBUG=true)
debug(`Process starting - PID: ${process.pid}, Node: ${process.version}, Platform: ${process.platform}`);
debug(`Working directory: ${process.cwd()}`);
debug(`Command args: ${process.argv.join(' ')}`);
debug(`Transport type: ${transportType}`);


import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
  InitializeRequest,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

// Import transport modules
import {
  TransportFactory,
  createTransportFactory,
  parseTransportConfig,
  getSessionManager,
  getProgressNotifier,
  getSharedEventBus,
  getContextEnricher,
  getSSELSPStreamer,
  type TransportConfig,
  type MCPToolCalledEvent,
  type MCPToolCompletedEvent,
  type MCPToolFailedEvent,
} from './transport/index.js';

debug('MCP SDK imports completed successfully');

// Import extracted modules
debug('Loading tool definitions...');
import { TOOLS, SERVER_INFO, CAPABILITIES, EXTENDED_CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, WaitArgs, SolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
debug('Loading system utils...');
import { withErrorHandling } from './system-utils.js';
debug('Loading browser manager...');
import { closeBrowser, forceKillAllBraveProcesses } from './browser-manager.js';
debug('Loading core infrastructure...');
import { setupProcessCleanup, MCP_SERVER_CONFIG } from './core-infrastructure.js';

// Import handlers
debug('Loading handlers...');
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';

// Import advanced tools handlers
import {
  handleBreadcrumbNavigator,
  handleUrlRedirectTracer,
  handleMultiLayerRedirectTrace,
  handleSearchContent,
  handleFindElementAdvanced,
  handleExtractJson,
  handleScrapeMetaTags,
  handlePressKey,
  handleProgressTracker,
  handleDeepAnalysis,
  handleNetworkRecorder,
  handleApiFinder,
  handleAjaxContentWaiter,
  handleAdvancedVideoExtraction,
  handleMediaExtractor,
  handleElementScreenshot,
  handleLinkHarvester,
  handleImageExtractorAdvanced,
  handleSmartSelectorGenerator,
  handleBatchElementScraper,
  handleExtractSchema,
  handleSolveCaptchaAdvanced,
  // Streaming tools
  handleM3u8Parser,
  handleSubtitleExtractor,
  handleCookieManager,
  // Download tools
  handleFileDownloader,
  handleBulkDownloader,
  // Enhanced streaming/download tools
  handleIframeHandler,
  handleStreamExtractor,
  handleJsScrape,
} from './handlers/advanced-tools.js';

// State for video recording
const recorderState = new Map<string, any>();

debug('All modules loaded successfully');
debug(`Server info: ${JSON.stringify(SERVER_INFO)}`);
debug(`Available tools: ${TOOLS.length} tools loaded`);

// Initialize LSP integration
const eventBus = getSharedEventBus();
const contextEnricher = getContextEnricher(eventBus);
const sseLSPStreamer = getSSELSPStreamer(eventBus);

// Setup SSE LSP streamer with progress notifier
sseLSPStreamer.setProgressNotifier(getProgressNotifier());

debug('LSP integration initialized');

// Initialize MCP server
debug('Creating MCP server instance...');
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
debug('MCP server instance created successfully');

// Register initialize handler (CRITICAL - missing handler can cause crash)
debug('Registering initialize handler...');

server.setRequestHandler(InitializeRequestSchema, async (request: InitializeRequest) => {
  debug(`Initialize request received: ${JSON.stringify(request)}`);

  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;
  debug(`Client protocol version: ${clientProtocolVersion}`);

  // Log client info for debugging (LLM handles its own token limits)
  const clientInfo = request.params.clientInfo;
  if (clientInfo) {
    debug(`Client info: ${JSON.stringify(clientInfo)}`);
  }

  // Get current transport type
  const currentTransport = process.env.MCP_TRANSPORT || 'stdio';

  const response = {
    protocolVersion: clientProtocolVersion, // Match client version for compatibility
    capabilities: CAPABILITIES,
    serverInfo: {
      ...SERVER_INFO,
      // Include extended capabilities in server info for client awareness
      metadata: {
        transport: currentTransport,
        ...EXTENDED_CAPABILITIES,
      },
    },
  };
  debug(`Sending initialize response: ${JSON.stringify(response)}`);

  // Add a small delay to see if there are any immediate errors after response
  setTimeout(() => {
    debug('1 second after initialize response - server still alive');
  }, 1000);

  setTimeout(() => {
    debug('5 seconds after initialize response - server still alive');
  }, 5000);

  return response;
});

// Register tool handlers
debug('Registering tools handler...');
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debug('Tools list requested');
  return { tools: TOOLS };
});

// Register resource handlers (placeholder)
debug('Registering resources handler...');
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  debug('Resources list requested');
  return { resources: [] };
});

// Register prompt handlers (placeholder)
debug('Registering prompts handler...');
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  debug('Prompts list requested');
  return { prompts: [] };
});

// Main tool call handler
debug('Registering tool call handler...');
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  debug(`Tool call received: ${name} with args: ${JSON.stringify(args)}`);

  // Publish MCP tool called event to event bus
  eventBus.publish({
    type: 'mcp:toolCalled',
    data: {
      toolName: name,
      args: args || {},
      timestamp: Date.now(),
    },
  } as any);

  // Get page from browser manager for advanced tools
  const { getPageInstance } = await import('./browser-manager.js');
  const page = getPageInstance();

  try {
    switch (name) {
      case TOOL_NAMES.BROWSER_INIT:
        return await handleBrowserInit(args || {});

      case TOOL_NAMES.NAVIGATE:
        return await handleNavigate(args as unknown as NavigateArgs);

      case TOOL_NAMES.GET_CONTENT:
        return await handleGetContent(args || {});

      case TOOL_NAMES.CLICK:
        return await handleClick(args as unknown as ClickArgs);

      case TOOL_NAMES.TYPE:
        return await handleType(args as unknown as TypeArgs);

      case TOOL_NAMES.WAIT:
        return await handleWait(args as unknown as WaitArgs);

      case TOOL_NAMES.BROWSER_CLOSE:
        return await handleBrowserClose();

      case TOOL_NAMES.SOLVE_CAPTCHA:
        return await handleSolveCaptcha(args as unknown as SolveCaptchaArgs);

      case TOOL_NAMES.RANDOM_SCROLL:
        return await handleRandomScroll();

      case TOOL_NAMES.FIND_ELEMENT:
        return await handleFindSelector(args as unknown as FindSelectorArgs);

      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        return await handleSaveContentAsMarkdown(args as unknown as SaveContentAsMarkdownArgs);

      // Advanced Tools
      case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleBreadcrumbNavigator(page, args || {})) }] };

      case TOOL_NAMES.REDIRECT_TRACER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleUrlRedirectTracer(page, args as any)) }] };

      case TOOL_NAMES.SEARCH_CONTENT:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleSearchContent(page, args as any)) }] };



      case TOOL_NAMES.EXTRACT_JSON:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleExtractJson(page, args || {})) }] };

      case TOOL_NAMES.SCRAPE_META_TAGS:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleScrapeMetaTags(page, args || {})) }] };

      case TOOL_NAMES.PRESS_KEY:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handlePressKey(page, args as any)) }] };

      case TOOL_NAMES.PROGRESS_TRACKER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleProgressTracker(page, args as any)) }] };

      case TOOL_NAMES.DEEP_ANALYSIS:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleDeepAnalysis(page, args || {})) }] };

      case TOOL_NAMES.NETWORK_RECORDER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleNetworkRecorder(page, args || {})) }] };

      case TOOL_NAMES.API_FINDER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleApiFinder(page, args || {})) }] };

      case TOOL_NAMES.AJAX_CONTENT_WAITER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleAjaxContentWaiter(page, args || {})) }] };


      // MEDIA_EXTRACTOR case REMOVED - merged into STREAM_EXTRACTOR

      case TOOL_NAMES.ELEMENT_SCREENSHOT:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleElementScreenshot(page, args as any)) }] };

      case TOOL_NAMES.LINK_HARVESTER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleLinkHarvester(page, args || {})) }] };

      case TOOL_NAMES.BATCH_ELEMENT_SCRAPER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleBatchElementScraper(page, args as any)) }] };

      case TOOL_NAMES.EXTRACT_SCHEMA:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleExtractSchema(page, args || {})) }] };


      // M3U8_PARSER case REMOVED - merged into STREAM_EXTRACTOR




      case TOOL_NAMES.COOKIE_MANAGER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleCookieManager(page, args as any)) }] };

      // File Download Tools
      case TOOL_NAMES.FILE_DOWNLOADER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleFileDownloader(page, args as any)) }] };

      // Enhanced streaming/download tools
      case TOOL_NAMES.IFRAME_HANDLER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleIframeHandler(page, args as any)) }] };

      case TOOL_NAMES.STREAM_EXTRACTOR:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleStreamExtractor(page, args as any)) }] };

      case TOOL_NAMES.JS_SCRAPE:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleJsScrape(page, args as any)) }] };


      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug(`Tool ${name} failed:`, errorMessage);

    // Publish MCP tool failed event
    eventBus.publish({
      type: 'mcp:toolFailed',
      data: {
        toolName: name,
        error: errorMessage,
        stackTrace: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now(),
      },
    } as any);

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

// Helper function to enrich tool response with LSP context
async function enrichResponseWithLSP(
  toolName: string,
  response: any
): Promise<any> {
  try {
    const enriched = await contextEnricher.enrichMCPResponse(
      toolName,
      response,
      {}
    );

    // Add LSP context as additional information
    if (enriched.additionalData.suggestions && enriched.additionalData.suggestions.length > 0) {
      const originalText = response.content?.[0]?.text || '';
      const context = contextEnricher.formatEnrichedContext(enriched.enrichedContext);

      return {
        ...response,
        content: [
          {
            type: 'text',
            text: `${originalText}\n\n---\n📊 **LSP Context**\n${context}`,
          },
        ],
      };
    }

    return response;
  } catch (error) {
    // If enrichment fails, return original response
    return response;
  }
}

// Main function to start the server
async function main(): Promise<void> {
  debug('Main function starting...');

  const config = parseTransportConfig();
  debug(`Transport configuration: ${JSON.stringify(config)}`);

  // Setup process cleanup handlers
  debug('Setting up process cleanup handlers...');
  setupProcessCleanup(async () => {
    debug('Process cleanup triggered');
    await closeBrowser();
    await forceKillAllBraveProcesses();
  });

  // Create transport factory
  const transportFactory = createTransportFactory(config);

  // Start appropriate transport based on configuration
  switch (config.type) {
    case 'stdio':
      await startStdioTransport();
      break;

    case 'sse':
      await startSSETransport(transportFactory);
      break;

    case 'http-stream':
      await startHTTPStreamTransport(transportFactory);
      break;

    default:
      throw new Error(`Unknown transport type: ${config.type}`);
  }

  debug('Main function completed - server should be running');
}

// STDIO Transport (original behavior)
async function startStdioTransport(): Promise<void> {
  debug('Creating StdioServerTransport...');
  const transport = new StdioServerTransport();
  debug('StdioServerTransport created successfully');

  await withErrorHandling(async () => {
    debug('Attempting to connect server to transport...');
    await server.connect(transport);
    debug('Server connected to transport successfully');

    // Startup messages
    console.error('🚀 Brave Real Browser MCP Server started successfully');
    console.error('📡 Transport: STDIO');
    console.error('📋 Available tools:', TOOLS.map(t => t.name).join(', '));
    console.error('🔧 Workflow validation: Active');
    console.error('💡 Content priority mode: Enabled (use get_content for better reliability)');

    debug('Server is now ready and waiting for requests...');

    // Keep the process alive by maintaining the connection
    debug('Maintaining process alive - server will wait for requests');

    // Add a heartbeat to confirm the process is still running
    const heartbeat = setInterval(() => {
      debug(`Heartbeat - Server alive at ${new Date().toISOString()}`);
    }, 30000); // Every 30 seconds

    // Cleanup heartbeat on process exit
    process.on('exit', () => {
      debug('Process exiting - clearing heartbeat');
      clearInterval(heartbeat);
    });

  }, 'Failed to start MCP server');
}

// SSE Transport (Server-Sent Events for streaming)
async function startSSETransport(transportFactory: TransportFactory): Promise<void> {
  debug('Starting SSE Transport...');

  await withErrorHandling(async () => {
    await transportFactory.startSSEServer(server, {
      onConnect: (sessionId) => {
        debug(`SSE client connected: ${sessionId}`);
        console.error(`🔗 Client connected: ${sessionId}`);
      },
      onDisconnect: (sessionId) => {
        debug(`SSE client disconnected: ${sessionId}`);
        console.error(`🔌 Client disconnected: ${sessionId}`);
      },
      onError: (error) => {
        debug(`SSE error: ${error.message}`);
        console.error(`❌ SSE Error: ${error.message}`);
      },
    });

    // Startup messages
    console.error('🚀 Brave Real Browser MCP Server started successfully');
    console.error('📡 Transport: SSE (Server-Sent Events)');
    console.error('📋 Available tools:', TOOLS.map(t => t.name).join(', '));
    console.error('🔧 Workflow validation: Active');
    console.error('🔄 Auto-sync: Enabled');
    console.error('📊 Progress notifications: Enabled');
    console.error('💡 Content priority mode: Enabled');

    // Keep the process alive
    const heartbeat = setInterval(() => {
      debug(`Heartbeat - SSE Server alive at ${new Date().toISOString()}`);
    }, 30000);

    process.on('exit', () => {
      debug('Process exiting - clearing heartbeat and stopping SSE server');
      clearInterval(heartbeat);
      transportFactory.cleanup();
    });

  }, 'Failed to start SSE MCP server');
}

// HTTP Stream Transport (LSP compatible)
async function startHTTPStreamTransport(transportFactory: TransportFactory): Promise<void> {
  debug('Starting HTTP Stream Transport...');

  await withErrorHandling(async () => {
    await transportFactory.startHTTPStreamServer(server, {
      onRequest: (sessionId, method) => {
        debug(`HTTP request: ${method} from session ${sessionId}`);
      },
      onError: (error) => {
        debug(`HTTP Stream error: ${error.message}`);
        console.error(`❌ HTTP Stream Error: ${error.message}`);
      },
    });

    // Startup messages
    console.error('🚀 Brave Real Browser MCP Server started successfully');
    console.error('📡 Transport: HTTP Streamable (LSP Compatible)');
    console.error('📋 Available tools:', TOOLS.map(t => t.name).join(', '));
    console.error('🔧 Workflow validation: Active');
    console.error('🔄 Auto-sync: Enabled');
    console.error('📊 Progress notifications: Enabled');
    console.error('💡 Content priority mode: Enabled');

    // Keep the process alive
    const heartbeat = setInterval(() => {
      debug(`Heartbeat - HTTP Stream Server alive at ${new Date().toISOString()}`);
    }, 30000);

    process.on('exit', () => {
      debug('Process exiting - clearing heartbeat and stopping HTTP Stream server');
      clearInterval(heartbeat);
      transportFactory.cleanup();
    });

  }, 'Failed to start HTTP Stream MCP server');
}

// Enhanced error handling with debug info
debug('Setting up error handlers...');

process.on('uncaughtException', (error) => {
  debug(`Uncaught exception at ${new Date().toISOString()}`);
  debug('❌ Uncaught exception:', error);
  debug(`Stack trace:`, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  debug(`Unhandled rejection at ${new Date().toISOString()}`);
  debug('❌ Unhandled rejection:', reason);
  debug(`Promise:`, promise);
  process.exit(1);
});

// Process lifecycle debugging
process.on('exit', (code) => {
  debug(`Process exiting with code: ${code} at ${new Date().toISOString()}`);
});

process.on('beforeExit', (code) => {
  debug(`Before exit event with code: ${code} at ${new Date().toISOString()}`);
});

process.on('SIGTERM', () => {
  debug(`SIGTERM received at ${new Date().toISOString()}`);
});

process.on('SIGINT', () => {
  debug(`SIGINT received at ${new Date().toISOString()}`);
});

debug('All error handlers registered');

// Start the server
debug('Checking if module is main...');
debug(`import.meta.url: ${import.meta.url}`);
debug(`process.argv[1]: ${process.argv[1]}`);
debug(`process.argv[0]: ${process.argv[0]}`);

// Enhanced main module detection for npx compatibility
const isMain = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].includes('brave-real-browser-mcp-server') ||
  process.argv[1].endsWith('.bin/brave-real-browser-mcp-server') ||
  process.argv.some(arg => arg.includes('brave-real-browser-mcp-server'));

debug(`Enhanced main detection result: ${isMain}`);

if (isMain) {
  debug('Module is main - starting server...');
  main().catch((error) => {
    debug(`Main function failed at ${new Date().toISOString()}`);
    debug('❌ Failed to start server:', error);
    debug(`Error stack:`, error.stack);
    process.exit(1);
  });
} else {
  debug('Module is not main - not starting server');
  debug('FORCE STARTING - This is likely an npx execution');
  main().catch((error) => {
    debug(`Forced main function failed at ${new Date().toISOString()}`);
    debug('❌ Failed to start server:', error);
    debug(`Error stack:`, error.stack);
    process.exit(1);
  });
}