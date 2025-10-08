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
} from '@modelcontextprotocol/sdk/types.js';

console.error('🔍 [DEBUG] MCP SDK imports completed successfully');

// Import extracted modules
console.error('🔍 [DEBUG] Loading tool definitions...');
import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, WaitArgs, SolveCaptchaArgs, AutoSolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
console.error('🔍 [DEBUG] Loading system utils...');
import { withErrorHandling } from './system-utils.js';
console.error('🔍 [DEBUG] Loading browser manager...');
import { closeBrowser, forceKillAllChromeProcesses } from './browser-manager.js';
console.error('🔍 [DEBUG] Loading core infrastructure...');
import { setupProcessCleanup, MCP_SERVER_CONFIG } from './core-infrastructure.js';

// Import handlers
console.error('🔍 [DEBUG] Loading handlers...');
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';
import { handleSolveTextCaptcha, handleSolveAndFillCaptcha } from './handlers/captcha-solver-handlers.js';
import { autoSolveCaptcha } from './handlers/auto-captcha-detector.js';
import { getPageInstance } from './browser-manager.js';

console.error('🔍 [DEBUG] All modules loaded successfully');
console.error(`🔍 [DEBUG] Server info: ${JSON.stringify(SERVER_INFO)}`);
console.error(`🔍 [DEBUG] Available tools: ${TOOLS.length} tools loaded`);

// Wrapper function for solve_text_captcha
async function handleSolveTextCaptchaWrapper(args: any) {
  return await withErrorHandling(async () => {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Please call browser_init first.');
    }

    const { imageSelector, inputSelector, config } = args;

    if (!imageSelector) {
      throw new Error('imageSelector is required');
    }

    let result;
    if (inputSelector) {
      // Solve and auto-fill
      result = await handleSolveAndFillCaptcha(page, imageSelector, inputSelector, config || {});
    } else {
      // Just solve
      result = await handleSolveTextCaptcha(page, imageSelector, config || {});
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to solve CAPTCHA');
    }

    const confidenceEmoji = result.confidence >= 100 ? '🎉' : result.confidence >= 95 ? '🚀' : result.confidence >= 90 ? '✨' : '📊';
    const confidenceText = result.confidence >= 100 ? '100% (PERFECT!)' : `${result.confidence.toFixed(2)}%`;
    
    const message = inputSelector 
      ? `✅ CAPTCHA solved and filled successfully!\n\n📝 Recognized text: "${result.text}"\n${confidenceEmoji} Confidence: ${confidenceText}\n🎯 Filled in: ${inputSelector}`
      : `✅ CAPTCHA solved successfully!\n\n📝 Recognized text: "${result.text}"\n${confidenceEmoji} Confidence: ${confidenceText}\n\n💡 Tip: Provide inputSelector parameter to auto-fill the CAPTCHA field`;

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
  }, 'Failed to solve text CAPTCHA');
}

// Wrapper function for auto_solve_captcha
async function handleAutoSolveCaptcha(args: AutoSolveCaptchaArgs) {
  return await withErrorHandling(async () => {
    const page = getPageInstance();
    if (!page) {
      throw new Error('Browser not initialized. Please call browser_init first.');
    }

    const result = await autoSolveCaptcha(page, args.config);

    if (!result.solved) {
      if (result.error) {
        throw new Error(result.error);
      }
      return {
        content: [
          {
            type: 'text',
            text: 'ℹ️ No CAPTCHA detected on the current page.\n\n💡 This tool automatically scans for common CAPTCHA patterns. If you\'re sure there\'s a CAPTCHA, it might use uncommon selectors. Try using the solve_text_captcha tool with specific selectors instead.',
          },
        ],
      };
    }

    const confidenceEmoji = result.confidence! >= 100 ? '🎉' : result.confidence! >= 95 ? '🚀' : result.confidence! >= 90 ? '✨' : '📊';
    const confidenceText = result.confidence! >= 100 ? '100% (PERFECT!)' : `${result.confidence!.toFixed(2)}%`;

    const message = `✅ CAPTCHA automatically detected and solved!\n\n📝 Recognized text: "${result.text}"\n${confidenceEmoji} Confidence: ${confidenceText}\n✨ Auto-filled successfully\n\n🎯 This was done automatically without needing to specify selectors!`;

    return {
      content: [
        {
          type: 'text',
          text: message,
        },
      ],
    };
  }, 'Failed to auto-solve CAPTCHA');
}

// Initialize MCP server
console.error('🔍 [DEBUG] Creating MCP server instance...');
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
console.error('🔍 [DEBUG] MCP server instance created successfully');

// Register initialize handler (CRITICAL - missing handler can cause crash)
console.error('🔍 [DEBUG] Registering initialize handler...');
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  console.error(`🔍 [DEBUG] Initialize request received: ${JSON.stringify(request)}`);
  
  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;
  console.error(`🔍 [DEBUG] Client protocol version: ${clientProtocolVersion}`);
  
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
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`🔍 [DEBUG] Tool call received: ${name} with args: ${JSON.stringify(args)}`);

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

      case TOOL_NAMES.SOLVE_TEXT_CAPTCHA:
        return await handleSolveTextCaptchaWrapper(args || {});

      case TOOL_NAMES.AUTO_SOLVE_CAPTCHA:
        return await handleAutoSolveCaptcha(args as unknown as AutoSolveCaptchaArgs);

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
  console.error('🔍 [DEBUG] Main function starting...');
  
  // Setup process cleanup handlers
  console.error('🔍 [DEBUG] Setting up process cleanup handlers...');
  setupProcessCleanup(async () => {
    console.error('🔍 [DEBUG] Process cleanup triggered');
    await closeBrowser();
    await forceKillAllChromeProcesses();
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