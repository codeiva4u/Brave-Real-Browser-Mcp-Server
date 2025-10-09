#!/usr/bin/env node

// Debug logging flag - only enable if DEBUG_MCP env var is set
const DEBUG = process.env.DEBUG_MCP === 'true';
const debug = (...args: any[]) => DEBUG && console.error(...args);

debug(`🔍 [DEBUG] Process starting - PID: ${process.pid}, Node: ${process.version}, Platform: ${process.platform}`);
debug(`🔍 [DEBUG] Working directory: ${process.cwd()}`);
debug(`🔍 [DEBUG] Command args: ${process.argv.join(' ')}`);

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

debug('🔍 [DEBUG] MCP SDK imports completed successfully');

// Import extracted modules
debug('🔍 [DEBUG] Loading tool definitions...');
import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, WaitArgs, SolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
debug('🔍 [DEBUG] Loading system utils...');
import { withErrorHandling } from './system-utils.js';
debug('🔍 [DEBUG] Loading browser manager...');
import { closeBrowser, forceKillAllChromeProcesses } from './browser-manager.js';
debug('🔍 [DEBUG] Loading core infrastructure...');
import { setupProcessCleanup, MCP_SERVER_CONFIG } from './core-infrastructure.js';

// Import handlers
debug('🔍 [DEBUG] Loading handlers...');
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';
import {
  handleExtractTables,
  handleExtractLists,
  handleExtractJSON,
  handleExtractMetaTags,
  handleExtractSchemaOrg,
  handleBatchExtractElements,
  handleExtractProducts,
  handleExtractArticles,
  handleExtractImages,
  handleExtractLinks,
  handleExtractMedia,
  handleExtractDownloadableFiles,
  handleExtractSocialMedia,
  handleAutoPaginate,
  handleInfiniteScrollHandler,
  handleExtractBreadcrumbs,
  handleExtractPaginationInfo,
  handleParseSitemap,
  handleExtractContactInfo,
  handleHarvestAttributes
} from './handlers/advanced-scraping-handlers.js';

debug('🔍 [DEBUG] All modules loaded successfully');
debug(`🔍 [DEBUG] Server info: ${JSON.stringify(SERVER_INFO)}`);
debug(`🔍 [DEBUG] Available tools: ${TOOLS.length} tools loaded`);

// Initialize MCP server
debug('🔍 [DEBUG] Creating MCP server instance...');
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
debug('🔍 [DEBUG] MCP server instance created successfully');

// Register initialize handler (CRITICAL - missing handler can cause crash)
debug('🔍 [DEBUG] Registering initialize handler...');
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  debug(`🔍 [DEBUG] Initialize request received: ${JSON.stringify(request)}`);
  
  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;
  debug(`🔍 [DEBUG] Client protocol version: ${clientProtocolVersion}`);
  
  const response = {
    protocolVersion: clientProtocolVersion, // Match client version for compatibility
    capabilities: CAPABILITIES,
    serverInfo: SERVER_INFO,
  };
  debug(`🔍 [DEBUG] Sending initialize response: ${JSON.stringify(response)}`);
  
  return response;
});

// Register tool handlers
debug('🔍 [DEBUG] Registering tools handler...');
server.setRequestHandler(ListToolsRequestSchema, async () => {
  debug('🔍 [DEBUG] Tools list requested');
  return { tools: TOOLS };
});

// Register resource handlers (placeholder)
debug('🔍 [DEBUG] Registering resources handler...');
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  debug('🔍 [DEBUG] Resources list requested');
  return { resources: [] };
});

// Register prompt handlers (placeholder)
debug('🔍 [DEBUG] Registering prompts handler...');
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  debug('🔍 [DEBUG] Prompts list requested');
  return { prompts: [] };
});

// Main tool call handler
debug('🔍 [DEBUG] Registering tool call handler...');
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  debug(`🔍 [DEBUG] Tool call received: ${name} with args: ${JSON.stringify(args)}`);

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

      // Smart Data Extractors
      case TOOL_NAMES.EXTRACT_TABLES:
        return await handleExtractTables(args || {});

      case TOOL_NAMES.EXTRACT_LISTS:
        return await handleExtractLists(args || {});

      case TOOL_NAMES.EXTRACT_JSON:
        return await handleExtractJSON();

      case TOOL_NAMES.EXTRACT_META_TAGS:
        return await handleExtractMetaTags();

      case TOOL_NAMES.EXTRACT_SCHEMA_ORG:
        return await handleExtractSchemaOrg();

      // Multi-Element Extractors
      case TOOL_NAMES.BATCH_EXTRACT_ELEMENTS:
        return await handleBatchExtractElements(args as any);

      case TOOL_NAMES.EXTRACT_PRODUCTS:
        return await handleExtractProducts(args as any);

      case TOOL_NAMES.EXTRACT_ARTICLES:
        return await handleExtractArticles(args as any);

      // Content Type Extractors
      case TOOL_NAMES.EXTRACT_IMAGES:
        return await handleExtractImages(args || {});

      case TOOL_NAMES.EXTRACT_LINKS:
        return await handleExtractLinks(args || {});

      case TOOL_NAMES.EXTRACT_MEDIA:
        return await handleExtractMedia();

      case TOOL_NAMES.EXTRACT_DOWNLOADABLE_FILES:
        return await handleExtractDownloadableFiles();

      case TOOL_NAMES.EXTRACT_SOCIAL_MEDIA:
        return await handleExtractSocialMedia();

      // Pagination & Navigation
      case TOOL_NAMES.AUTO_PAGINATE:
        return await handleAutoPaginate(args || {});

      case TOOL_NAMES.INFINITE_SCROLL:
        return await handleInfiniteScrollHandler(args || {});

      case TOOL_NAMES.EXTRACT_BREADCRUMBS:
        return await handleExtractBreadcrumbs();

      // Note: EXTRACT_PAGINATION_INFO and PARSE_SITEMAP not in TOOL_NAMES, skip for now
      case 'extract_pagination_info':
        return await handleExtractPaginationInfo();

      case 'parse_sitemap':
        return await handleParseSitemap(args as any);

      // Data Processing
      case TOOL_NAMES.EXTRACT_CONTACT_INFO:
        return await handleExtractContactInfo();

      case TOOL_NAMES.HARVEST_ATTRIBUTES:
        return await handleHarvestAttributes(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Tool ${name} failed:`, errorMessage);
    
    // For workflow validation errors, throw them so MCP SDK handles them properly
    if (errorMessage.includes('cannot be executed in current state') || 
        errorMessage.includes('Cannot search for selectors') ||
        errorMessage.includes('Next Steps:')) {
      throw error;
    }
    
    // For other errors, return formatted response
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
  debug('🔍 [DEBUG] Main function starting...');
  
  // Setup process cleanup handlers
  debug('🔍 [DEBUG] Setting up process cleanup handlers...');
  setupProcessCleanup(async () => {
    debug('🔍 [DEBUG] Process cleanup triggered');
    await closeBrowser();
    await forceKillAllChromeProcesses();
  });

  // Create and start the server transport
  debug('🔍 [DEBUG] Creating StdioServerTransport...');
  const transport = new StdioServerTransport();
  debug('🔍 [DEBUG] StdioServerTransport created successfully');
  
  await withErrorHandling(async () => {
    debug('🔍 [DEBUG] Attempting to connect server to transport...');
    await server.connect(transport);
    debug('🔍 [DEBUG] Server connected to transport successfully');
    
    console.error('🚀 Brave Real Browser MCP Server started successfully');
    debug('📋 Available tools:', TOOLS.map(t => t.name).join(', '));
    debug('🔧 Workflow validation: Active');
    debug('💡 Content priority mode: Enabled (use get_content for better reliability)');
    
    debug('🔍 [DEBUG] Server is now ready and waiting for requests...');
    
    // Keep the process alive by maintaining the connection
    debug('🔍 [DEBUG] Maintaining process alive - server will wait for requests');
    
    // Add a heartbeat to confirm the process is still running (only in debug mode)
    if (DEBUG) {
      const heartbeat = setInterval(() => {
        debug(`🔍 [DEBUG] Heartbeat - Server alive at ${new Date().toISOString()}`);
      }, 30000); // Every 30 seconds
      
      // Cleanup heartbeat on process exit
      process.on('exit', () => {
        debug('🔍 [DEBUG] Process exiting - clearing heartbeat');
        clearInterval(heartbeat);
      });
    }
    
  }, 'Failed to start MCP server');
  
  debug('🔍 [DEBUG] Main function completed - server should be running');
}

// Enhanced error handling with debug info
debug('🔍 [DEBUG] Setting up error handlers...');

process.on('uncaughtException', (error) => {
  debug(`🔍 [DEBUG] Uncaught exception at ${new Date().toISOString()}`);
  console.error('❌ Uncaught exception:', error);
  debug(`🔍 [DEBUG] Stack trace:`, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  debug(`🔍 [DEBUG] Unhandled rejection at ${new Date().toISOString()}`);
  console.error('❌ Unhandled rejection:', reason);
  debug(`🔍 [DEBUG] Promise:`, promise);
  process.exit(1);
});

// Process lifecycle debugging
process.on('exit', (code) => {
  debug(`🔍 [DEBUG] Process exiting with code: ${code} at ${new Date().toISOString()}`);
});

process.on('beforeExit', (code) => {
  debug(`🔍 [DEBUG] Before exit event with code: ${code} at ${new Date().toISOString()}`);
});

process.on('SIGTERM', () => {
  debug(`🔍 [DEBUG] SIGTERM received at ${new Date().toISOString()}`);
});

process.on('SIGINT', () => {
  debug(`🔍 [DEBUG] SIGINT received at ${new Date().toISOString()}`);
});

debug('🔍 [DEBUG] All error handlers registered');

// Start the server
debug('🔍 [DEBUG] Checking if module is main...');
debug(`🔍 [DEBUG] import.meta.url: ${import.meta.url}`);
debug(`🔍 [DEBUG] process.argv[1]: ${process.argv[1]}`);
debug(`🔍 [DEBUG] process.argv[0]: ${process.argv[0]}`);

// Enhanced main module detection for npx compatibility
const isMain = import.meta.url === `file://${process.argv[1]}` || 
               process.argv[1].includes('brave-real-browser-mcp-server') ||
               process.argv[1].endsWith('.bin/brave-real-browser-mcp-server') ||
               process.argv.some(arg => arg.includes('brave-real-browser-mcp-server'));

debug(`🔍 [DEBUG] Enhanced main detection result: ${isMain}`);

if (isMain) {
  debug('🔍 [DEBUG] Module is main - starting server...');
  main().catch((error) => {
    debug(`🔍 [DEBUG] Main function failed at ${new Date().toISOString()}`);
    console.error('❌ Failed to start server:', error);
    debug(`🔍 [DEBUG] Error stack:`, error.stack);
    process.exit(1);
  });
} else {
  debug('🔍 [DEBUG] Module is not main - not starting server');
  debug('🔍 [DEBUG] FORCE STARTING - This is likely an npx execution');
  main().catch((error) => {
    debug(`🔍 [DEBUG] Forced main function failed at ${new Date().toISOString()}`);
    console.error('❌ Failed to start server:', error);
    debug(`🔍 [DEBUG] Error stack:`, error.stack);
    process.exit(1);
  });
}
