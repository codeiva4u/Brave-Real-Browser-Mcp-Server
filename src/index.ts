#!/usr/bin/env node

// Debug logging setup - Log process start
console.error(`🔍 [DEBUG] Process starting - PID: ${process.pid}, Node: ${process.version}, Platform: ${process.platform}`);
console.error(`🔍 [DEBUG] Working directory: ${process.cwd()}`);
console.error(`🔍 [DEBUG] Command args: ${process.argv.join(' ')}`);

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

console.error('🔍 [DEBUG] MCP SDK imports completed successfully');

// Import extracted modules
console.error('🔍 [DEBUG] Loading tool definitions...');
import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, WaitArgs, SolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
console.error('🔍 [DEBUG] Loading system utils...');
import { withErrorHandling } from './system-utils.js';
console.error('🔍 [DEBUG] Loading browser manager...');
import { closeBrowser, forceKillAllBraveProcesses } from './browser-manager.js';
console.error('🔍 [DEBUG] Loading core infrastructure...');
import { setupProcessCleanup, MCP_SERVER_CONFIG } from './core-infrastructure.js';

// Import handlers
console.error('🔍 [DEBUG] Loading handlers...');
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
  handleAdProtectionDetector,
  handleAjaxContentWaiter,
  handleAdvancedVideoExtraction,
  handleMediaExtractor,
  handleElementScreenshot,
  handleVideoRecording,
  handleLinkHarvester,
  handleImageExtractorAdvanced,
  handleSmartSelectorGenerator,
  handleContentClassification,
  handleBatchElementScraper,
  handleExtractSchema,
  handleSolveCaptchaAdvanced,
} from './handlers/advanced-tools.js';

// State for video recording
const recorderState = new Map<string, any>();

console.error('🔍 [DEBUG] All modules loaded successfully');
console.error(`🔍 [DEBUG] Server info: ${JSON.stringify(SERVER_INFO)}`);
console.error(`🔍 [DEBUG] Available tools: ${TOOLS.length} tools loaded`);

// Initialize MCP server
console.error('🔍 [DEBUG] Creating MCP server instance...');
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
console.error('🔍 [DEBUG] MCP server instance created successfully');

// Register initialize handler (CRITICAL - missing handler can cause crash)
console.error('🔍 [DEBUG] Registering initialize handler...');

server.setRequestHandler(InitializeRequestSchema, async (request: InitializeRequest) => {
  console.error(`🔍 [DEBUG] Initialize request received: ${JSON.stringify(request)}`);

  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;
  console.error(`🔍 [DEBUG] Client protocol version: ${clientProtocolVersion}`);

  // Log client info for debugging (LLM handles its own token limits)
  const clientInfo = request.params.clientInfo;
  if (clientInfo) {
    console.error(`🔍 [DEBUG] Client info: ${JSON.stringify(clientInfo)}`);
  }

  const response = {
    protocolVersion: clientProtocolVersion, // Match client version for compatibility
    capabilities: CAPABILITIES,
    serverInfo: SERVER_INFO,
  };
  console.error(`🔍 [DEBUG] Sending initialize response: ${JSON.stringify(response)}`);

  // Add a small delay to see if there are any immediate errors after response
  setTimeout(() => {
    console.error(`🔍 [DEBUG] 1 second after initialize response - server still alive`);
  }, 1000);

  setTimeout(() => {
    console.error(`🔍 [DEBUG] 5 seconds after initialize response - server still alive`);
  }, 5000);

  return response;
});

// Register tool handlers
console.error('🔍 [DEBUG] Registering tools handler...');
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('🔍 [DEBUG] Tools list requested');
  return { tools: TOOLS };
});

// Register resource handlers (placeholder)
console.error('🔍 [DEBUG] Registering resources handler...');
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  console.error('🔍 [DEBUG] Resources list requested');
  return { resources: [] };
});

// Register prompt handlers (placeholder)
console.error('🔍 [DEBUG] Registering prompts handler...');
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.error('🔍 [DEBUG] Prompts list requested');
  return { prompts: [] };
});

// Main tool call handler
console.error('🔍 [DEBUG] Registering tool call handler...');
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;
  console.error(`🔍 [DEBUG] Tool call received: ${name} with args: ${JSON.stringify(args)}`);

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

      case TOOL_NAMES.FIND_SELECTOR:
        return await handleFindSelector(args as unknown as FindSelectorArgs);

      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        return await handleSaveContentAsMarkdown(args as unknown as SaveContentAsMarkdownArgs);

      // Advanced Tools
      case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleBreadcrumbNavigator(page, args || {})) }] };

      case TOOL_NAMES.URL_REDIRECT_TRACER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleUrlRedirectTracer(page, args as any)) }] };

      case TOOL_NAMES.MULTI_LAYER_REDIRECT_TRACE:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleMultiLayerRedirectTrace(page, args as any)) }] };

      case TOOL_NAMES.SEARCH_CONTENT:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleSearchContent(page, args as any)) }] };

      case TOOL_NAMES.FIND_ELEMENT_ADVANCED:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleFindElementAdvanced(page, args || {})) }] };

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

      case TOOL_NAMES.AD_PROTECTION_DETECTOR:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleAdProtectionDetector(page, args || {})) }] };

      case TOOL_NAMES.AJAX_CONTENT_WAITER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleAjaxContentWaiter(page, args || {})) }] };

      case TOOL_NAMES.ADVANCED_VIDEO_EXTRACTION:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleAdvancedVideoExtraction(page, args || {})) }] };

      case TOOL_NAMES.MEDIA_EXTRACTOR:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleMediaExtractor(page, args || {})) }] };

      case TOOL_NAMES.ELEMENT_SCREENSHOT:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleElementScreenshot(page, args as any)) }] };

      case TOOL_NAMES.VIDEO_RECORDING:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleVideoRecording(page, args as any, recorderState)) }] };

      case TOOL_NAMES.LINK_HARVESTER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleLinkHarvester(page, args || {})) }] };

      case TOOL_NAMES.IMAGE_EXTRACTOR_ADVANCED:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleImageExtractorAdvanced(page, args || {})) }] };

      case TOOL_NAMES.SMART_SELECTOR_GENERATOR:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleSmartSelectorGenerator(page, args as any)) }] };

      case TOOL_NAMES.CONTENT_CLASSIFICATION:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleContentClassification(page, args || {})) }] };

      case TOOL_NAMES.BATCH_ELEMENT_SCRAPER:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleBatchElementScraper(page, args as any)) }] };

      case TOOL_NAMES.EXTRACT_SCHEMA:
        if (!page) throw new Error('Browser not initialized. Call browser_init first.');
        return { content: [{ type: 'text', text: JSON.stringify(await handleExtractSchema(page, args || {})) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Tool ${name} failed:`, errorMessage);

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

// Main function to start the server
async function main(): Promise<void> {
  console.error('🔍 [DEBUG] Main function starting...');

  // Setup process cleanup handlers
  console.error('🔍 [DEBUG] Setting up process cleanup handlers...');
  setupProcessCleanup(async () => {
    console.error('🔍 [DEBUG] Process cleanup triggered');
    await closeBrowser();
    await forceKillAllBraveProcesses();
  });

  // Create and start the server transport
  console.error('🔍 [DEBUG] Creating StdioServerTransport...');
  const transport = new StdioServerTransport();
  console.error('🔍 [DEBUG] StdioServerTransport created successfully');

  await withErrorHandling(async () => {
    console.error('🔍 [DEBUG] Attempting to connect server to transport...');
    await server.connect(transport);
    console.error('🔍 [DEBUG] Server connected to transport successfully');

    console.error('🚀 Brave Real Browser MCP Server started successfully');
    console.error('📋 Available tools:', TOOLS.map(t => t.name).join(', '));
    console.error('🔧 Workflow validation: Active');
    console.error('💡 Content priority mode: Enabled (use get_content for better reliability)');

    console.error('🔍 [DEBUG] Server is now ready and waiting for requests...');

    // Keep the process alive by maintaining the connection
    console.error('🔍 [DEBUG] Maintaining process alive - server will wait for requests');

    // Add a heartbeat to confirm the process is still running
    const heartbeat = setInterval(() => {
      console.error(`🔍 [DEBUG] Heartbeat - Server alive at ${new Date().toISOString()}`);
    }, 30000); // Every 30 seconds

    // Cleanup heartbeat on process exit
    process.on('exit', () => {
      console.error('🔍 [DEBUG] Process exiting - clearing heartbeat');
      clearInterval(heartbeat);
    });

  }, 'Failed to start MCP server');

  console.error('🔍 [DEBUG] Main function completed - server should be running');
}

// Enhanced error handling with debug info
console.error('🔍 [DEBUG] Setting up error handlers...');

process.on('uncaughtException', (error) => {
  console.error(`🔍 [DEBUG] Uncaught exception at ${new Date().toISOString()}`);
  console.error('❌ Uncaught exception:', error);
  console.error(`🔍 [DEBUG] Stack trace:`, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`🔍 [DEBUG] Unhandled rejection at ${new Date().toISOString()}`);
  console.error('❌ Unhandled rejection:', reason);
  console.error(`🔍 [DEBUG] Promise:`, promise);
  process.exit(1);
});

// Process lifecycle debugging
process.on('exit', (code) => {
  console.error(`🔍 [DEBUG] Process exiting with code: ${code} at ${new Date().toISOString()}`);
});

process.on('beforeExit', (code) => {
  console.error(`🔍 [DEBUG] Before exit event with code: ${code} at ${new Date().toISOString()}`);
});

process.on('SIGTERM', () => {
  console.error(`🔍 [DEBUG] SIGTERM received at ${new Date().toISOString()}`);
});

process.on('SIGINT', () => {
  console.error(`🔍 [DEBUG] SIGINT received at ${new Date().toISOString()}`);
});

console.error('🔍 [DEBUG] All error handlers registered');

// Start the server
console.error('🔍 [DEBUG] Checking if module is main...');
console.error(`🔍 [DEBUG] import.meta.url: ${import.meta.url}`);
console.error(`🔍 [DEBUG] process.argv[1]: ${process.argv[1]}`);
console.error(`🔍 [DEBUG] process.argv[0]: ${process.argv[0]}`);

// Enhanced main module detection for npx compatibility
const isMain = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].includes('brave-real-browser-mcp-server') ||
  process.argv[1].endsWith('.bin/brave-real-browser-mcp-server') ||
  process.argv.some(arg => arg.includes('brave-real-browser-mcp-server'));

console.error(`🔍 [DEBUG] Enhanced main detection result: ${isMain}`);

if (isMain) {
  console.error('🔍 [DEBUG] Module is main - starting server...');
  main().catch((error) => {
    console.error(`🔍 [DEBUG] Main function failed at ${new Date().toISOString()}`);
    console.error('❌ Failed to start server:', error);
    console.error(`🔍 [DEBUG] Error stack:`, error.stack);
    process.exit(1);
  });
} else {
  console.error('🔍 [DEBUG] Module is not main - not starting server');
  console.error('🔍 [DEBUG] FORCE STARTING - This is likely an npx execution');
  main().catch((error) => {
    console.error(`🔍 [DEBUG] Forced main function failed at ${new Date().toISOString()}`);
    console.error('❌ Failed to start server:', error);
    console.error(`🔍 [DEBUG] Error stack:`, error.stack);
    process.exit(1);
  });
}