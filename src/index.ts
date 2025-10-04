#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import logger
import { logger } from './utils/logger.js';

logger.debug('Process starting', {
  pid: process.pid,
  node: process.version,
  platform: process.platform,
  cwd: process.cwd(),
  args: process.argv
});

logger.debug('MCP SDK imports completed');

// Import extracted modules
logger.debug('Loading tool definitions...');
import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, SelectArgs, WaitArgs, SolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
logger.debug('Loading system utils...');
import { withErrorHandling } from './system-utils.js';
logger.debug('Loading browser manager...');
import { closeBrowser, forceKillAllChromeProcesses } from './browser-manager.js';
logger.debug('Loading core infrastructure...');
import { setupProcessCleanup, MCP_SERVER_CONFIG } from './core-infrastructure.js';

// Import handlers
logger.debug('Loading handlers...');
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSelect, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';

logger.debug('All modules loaded successfully');
logger.debug('Server info', SERVER_INFO);
logger.debug(`Available tools: ${TOOLS.length} tools loaded`);

// Initialize MCP server
logger.debug('Creating MCP server instance...');
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
logger.debug('MCP server instance created successfully');

// Register initialize handler (CRITICAL - missing handler can cause crash)
logger.debug('Registering initialize handler...');
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  logger.debug('Initialize request received', request);
  
  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;
  logger.debug(`Client protocol version: ${clientProtocolVersion}`);
  
  const response = {
    protocolVersion: clientProtocolVersion, // Match client version for compatibility
    capabilities: CAPABILITIES,
    serverInfo: SERVER_INFO,
  };
  logger.debug('Sending initialize response', response);
  
  return response;
});

// Register tool handlers
logger.debug('Registering tools handler...');
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Tools list requested');
  return { tools: TOOLS };
});

// Register resource handlers (placeholder)
logger.debug('Registering resources handler...');
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  logger.debug('Resources list requested');
  return { resources: [] };
});

// Register prompt handlers (placeholder)
logger.debug('Registering prompts handler...');
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  logger.debug('Prompts list requested');
  return { prompts: [] };
});

// Main tool call handler
logger.debug('Registering tool call handler...');
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.debug(`Tool call received: ${name}`, args);

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

      case TOOL_NAMES.SELECT:
        return await handleSelect(args as unknown as SelectArgs);

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

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Tool ${name} failed:`, errorMessage);
    
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
  logger.debug('Main function starting...');
  
  // Setup process cleanup handlers
  logger.debug('Setting up process cleanup handlers...');
  setupProcessCleanup(async () => {
    logger.debug('Process cleanup triggered');
    await closeBrowser();
    await forceKillAllChromeProcesses();
  });

  // Create and start the server transport
  logger.debug('Creating StdioServerTransport...');
  const transport = new StdioServerTransport();
  logger.debug('StdioServerTransport created successfully');
  
  await withErrorHandling(async () => {
    logger.debug('Attempting to connect server to transport...');
    await server.connect(transport);
    logger.debug('Server connected to transport successfully');
    
    logger.info('Brave Real Browser MCP Server started successfully');
    logger.info('Available tools: ' + TOOLS.map(t => t.name).join(', '));
    logger.info('Workflow validation: Active');
    logger.info('Content priority mode: Enabled (use get_content for better reliability)');
    
    logger.debug('Server is now ready and waiting for requests...');
    
  }, 'Failed to start MCP server');
  
  logger.debug('Main function completed - server should be running');
}

// Enhanced error handling
logger.debug('Setting up error handlers...');

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Process lifecycle events
process.on('exit', (code) => {
  logger.debug(`Process exiting with code: ${code}`);
});

process.on('beforeExit', (code) => {
  logger.debug(`Before exit event with code: ${code}`);
});

process.on('SIGTERM', () => {
  logger.debug('SIGTERM received');
});

process.on('SIGINT', () => {
  logger.debug('SIGINT received');
});

logger.debug('All error handlers registered');

// Start the server
logger.debug('Checking if module is main...');
logger.debug('Module detection', {
  importMetaUrl: import.meta.url,
  argv1: process.argv[1],
  argv0: process.argv[0]
});

// Enhanced main module detection for npx compatibility
const isMain = import.meta.url === `file://${process.argv[1]}` || 
               (process.argv[1] && process.argv[1].includes('brave-real-browser-mcp-server')) ||
               (process.argv[1] && process.argv[1].endsWith('.bin/brave-real-browser-mcp-server')) ||
               process.argv.some(arg => arg && arg.includes('brave-real-browser-mcp-server'));

logger.debug(`Enhanced main detection result: ${isMain}`);

if (isMain) {
  logger.debug('Module is main - starting server...');
  main().catch((error) => {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  });
} else {
  logger.debug('Module is not main - force starting for npx execution');
  main().catch((error) => {
    logger.error('Forced main function failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}
