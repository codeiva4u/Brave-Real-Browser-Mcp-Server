#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { logDebug } from './debug-logger.js';

// CRITICAL: Patch console.log immediately
const originalConsoleLog = console.log;
console.log = (...args) => {
  logDebug('Captured stdout log:', args);
  console.error(...args);
};

// Robust .env loading (Manual & Silent)
// Import unified handlers
import { handleUnifiedCaptcha } from './handlers/unified-captcha-handler.js';
import { handleSearchContent, handleFindElementAdvanced } from './handlers/unified-search-handler.js';
import { handleDeepAnalysis } from './handlers/deep-analysis-handler.js';
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');

// Manual .env parser to avoid stdout pollution from dotenv package
const loadEnvFile = (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/(^"|"$)/g, '').trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
    return true;
  } catch (e) {
    logDebug('Error loading .env file', e);
    return false;
  }
};

if (loadEnvFile(envPath)) {
  logDebug(`Loaded .env manually from: ${envPath}`);
} else {
  // Try CWD
  const cwdEnv = path.join(process.cwd(), '.env');
  if (loadEnvFile(cwdEnv)) {
    logDebug(`Loaded .env manually from CWD: ${cwdEnv}`);
  } else {
    logDebug(`Warning: No .env found at ${envPath} or CWD`);
  }
}

logDebug('Server Starting...', {
  cwd: process.cwd(),
  nodeVersion: process.version,
  projectRoot,
  bravePath: process.env.BRAVE_PATH || 'Not Set'
});

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
  logDebug('CRITICAL: Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  console.error('CRITICAL: Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logDebug('CRITICAL: Unhandled Rejection', reason);
  console.error('CRITICAL: Unhandled Rejection', reason);
});



import {
  TOOLS,
  SERVER_INFO,
  CAPABILITIES,
  TOOL_NAMES,
  NavigateArgs,
  ClickArgs,
  TypeArgs,
  WaitArgs,
  SolveCaptchaArgs,
  FindSelectorArgs,
  SaveContentAsMarkdownArgs,
} from "./tool-definitions.js";
import { withErrorHandling } from "./system-utils.js";
import { validateMCPResponse } from "./mcp-response-validator.js";
import { closeBrowser, forceKillAllBraveProcesses } from "./browser-manager.js";
import {
  setupProcessCleanup,
  MCP_SERVER_CONFIG,
} from "./core-infrastructure.js";


// Import handlers
import {
  handleBrowserInit,
  handleBrowserClose,
} from "./handlers/browser-handlers.js";
import { handleNavigate, handleWait } from "./handlers/navigation-handlers.js";
import {
  handleClick,
  handleType,
  handleSolveCaptcha,
  handleRandomScroll,
  handlePressKey,
} from "./handlers/interaction-handlers.js";
import {
  handleGetContent,
  handleFindSelector,
} from "./handlers/content-handlers.js";
import { handleSaveContentAsMarkdown } from "./handlers/file-handlers.js";
// Import new data extraction handlers
import {
  handleExtractJSON,
  handleScrapeMetaTags,
  handleExtractSchema,
} from "./handlers/data-extraction-handlers.js";
// Import multi-element handlers
import {
  handleBatchElementScraper,

  handleLinkHarvester,
  handleMediaExtractor,

} from "./handlers/multi-element-handlers.js";
// Import pagination handlers
import {
  handleBreadcrumbNavigator,
} from "./handlers/navigation-handlers.js";
// Import AI-powered handlers
import {
  handleSmartSelectorGenerator,
  handleContentClassification,
} from "./handlers/ai-powered-handlers.js";
// Import search & filter handlers
// Import visual tools handlers
// Import visual tools handlers
import {

  handleElementScreenshot,
  handleVideoRecording,

} from "./handlers/visual-tools-handlers.js";
// Import smart data extractors
import {

  handleNetworkRecorder,
  handleImageExtractorAdvanced,


  handleUrlRedirectTracer,
  handleApiFinder,
} from "./handlers/smart-data-extractors.js";
// Import dynamic session handlers
import {
  handleAjaxContentWaiter,
} from "./handlers/dynamic-session-handlers.js";
// Import monitoring & reporting handlers
import {
  handleProgressTracker,




} from "./handlers/monitoring-reporting-handlers.js";
// Import advanced extraction handlers (Ad-bypass & Obfuscation)
import {
  handleAdvancedVideoExtraction,

  handleMultiLayerRedirectTrace,
  handleAdProtectionDetector,
} from "./handlers/advanced-extraction-handlers.js";




// Initialize MCP server
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });

// Register initialize handler (CRITICAL - missing handler can cause crash)

server.setRequestHandler(InitializeRequestSchema, async (request) => {


  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;


  const response = {
    protocolVersion: clientProtocolVersion, // Match client version for compatibility
    capabilities: CAPABILITIES,
    serverInfo: SERVER_INFO,
  };


  // Add a small delay to see if there are any immediate errors after response
  setTimeout(() => {
    console.error(
      `🔍 [DEBUG] 1 second after initialize response - server still alive`,
    );
  }, 1000);

  setTimeout(() => {
    console.error(
      `🔍 [DEBUG] 5 seconds after initialize response - server still alive`,
    );
  }, 5000);

  return response;
});

// Register tool handlers

server.setRequestHandler(ListToolsRequestSchema, async () => {

  return { tools: TOOLS };
});

// Register resource handlers (placeholder)

server.setRequestHandler(ListResourcesRequestSchema, async () => {

  return { resources: [] };
});

// Register prompt handlers (placeholder)

server.setRequestHandler(ListPromptsRequestSchema, async () => {

  return { prompts: [] };
});

// Tool execution function - exported for use in transports
export async function executeToolByName(name: string, args: any): Promise<any> {
  try {
    let result: any;
    switch (name) {
      case TOOL_NAMES.BROWSER_INIT:
        result = await handleBrowserInit(args || {});
        break;

      case TOOL_NAMES.NAVIGATE:
        result = await handleNavigate(args as unknown as NavigateArgs);
        break;

      case TOOL_NAMES.GET_CONTENT:
        result = await handleGetContent(args || {});
        break;

      case TOOL_NAMES.CLICK:
        result = await handleClick(args as unknown as ClickArgs);
        break;

      case TOOL_NAMES.TYPE:
        result = await handleType(args as unknown as TypeArgs);
        break;

      case TOOL_NAMES.WAIT:
        result = await handleWait(args as unknown as WaitArgs);
        break;

      case TOOL_NAMES.BROWSER_CLOSE:
        result = await handleBrowserClose();
        break;

      case TOOL_NAMES.SOLVE_CAPTCHA:
        result = await handleSolveCaptcha(args as unknown as SolveCaptchaArgs);
        break;

      case TOOL_NAMES.RANDOM_SCROLL:
        result = await handleRandomScroll();
        break;

      case TOOL_NAMES.PRESS_KEY:
        result = await handlePressKey(args as any);
        break;

      case TOOL_NAMES.FIND_SELECTOR:
        result = await handleFindSelector(args as unknown as FindSelectorArgs);
        break;

      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        result = await handleSaveContentAsMarkdown(
          args as unknown as SaveContentAsMarkdownArgs,
        );
        break;

      // Smart Data Extractors


      // DOM & HTML Extraction


      case TOOL_NAMES.EXTRACT_JSON:
        result = await handleExtractJSON(args || {});
        break;

      case TOOL_NAMES.SCRAPE_META_TAGS:
        result = await handleScrapeMetaTags(args || {});
        break;

      case TOOL_NAMES.EXTRACT_SCHEMA:
        result = await handleExtractSchema(args || {});
        break;

      // Multi-Element Extractors
      case TOOL_NAMES.BATCH_ELEMENT_SCRAPER:
        result = await handleBatchElementScraper(args as any);
        break;





      // Content Type Specific
      case TOOL_NAMES.LINK_HARVESTER:
        result = await handleLinkHarvester(args || {});
        break;

      case TOOL_NAMES.MEDIA_EXTRACTOR:
        result = await handleMediaExtractor(args || {});
        break;



      // Pagination Tools




      // Pagination Tools
      // Pagination Tools



      case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
        result = await handleBreadcrumbNavigator(args || {});
        break;

      // Data Processing Tools


      // Data Processing Tools









      // AI-Powered Features
      case TOOL_NAMES.SMART_SELECTOR_GENERATOR:
        result = await handleSmartSelectorGenerator(args as any);
        break;

      case TOOL_NAMES.CONTENT_CLASSIFICATION:
        result = await handleContentClassification(args as any);
        break;







      // Search & Filter Tools
      // --- Search & Filter (Consolidated) ---
      case TOOL_NAMES.SEARCH_CONTENT:
        return await handleSearchContent(args);
      case TOOL_NAMES.FIND_ELEMENT_ADVANCED:
        return await handleFindElementAdvanced(args);

      // --- Deep Analysis ---
      case TOOL_NAMES.DEEP_ANALYSIS:
        return await handleDeepAnalysis(args);

      // --- Advanced Captcha Handling (Consolidated) ---
      case TOOL_NAMES.SOLVE_CAPTCHA:
        return await handleUnifiedCaptcha({ strategy: 'auto', ...args });

      // Screenshot & Visual Tools


      case TOOL_NAMES.ELEMENT_SCREENSHOT:
        result = await handleElementScreenshot(args as any);
        break;



      case TOOL_NAMES.VIDEO_RECORDING:
        result = await handleVideoRecording(args as any);
        break;




      // Smart Data Extractors (Advanced)






      case "network_recorder":
        result = await handleNetworkRecorder(args || {});
        break;

      case "api_finder":
        result = await handleApiFinder(args || {});
        break;






      case "image_extractor_advanced":
        result = await handleImageExtractorAdvanced(args || {});
        break;





      case "url_redirect_tracer":
        result = await handleUrlRedirectTracer(args as any);
        break;



      // Dynamic Content & Session Handling








      case "ajax_content_waiter":
        result = await handleAjaxContentWaiter(args as any);
        break;





      // Monitoring & Reporting
      case "progress_tracker":
        result = await handleProgressTracker(args || {});
        break;











      // Advanced Video & Media Download Tools














      // Advanced Extraction Tools (Ad-Bypass & Obfuscation)
      case "advanced_video_extraction":
        result = await handleAdvancedVideoExtraction(args || {});
        break;



      case "multi_layer_redirect_trace":
        result = await handleMultiLayerRedirectTrace(args as any);
        break;

      case "ad_protection_detector":
        result = await handleAdProtectionDetector(args || {});
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    // Validate MCP response format universally
    return validateMCPResponse(result, name) as any;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Tool ${name} failed:`, errorMessage);

    // For workflow validation errors, throw them so MCP SDK handles them properly
    if (
      errorMessage.includes("cannot be executed in current state") ||
      errorMessage.includes("Cannot search for selectors") ||
      errorMessage.includes("Next Steps:")
    ) {
      throw error;
    }

    // For other errors, return formatted response
    return {
      content: [
        {
          type: "text",
          text: `❌ Tool execution failed: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

// Main tool call handler

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;


  return await executeToolByName(name, args);
});

// Main function - now using multi-protocol launcher
// Main function
async function main(): Promise<void> {


  setupProcessCleanup(async () => {
    await closeBrowser();
    await forceKillAllBraveProcesses();
  });

  const transport = new StdioServerTransport();

  await withErrorHandling(async () => {
    await server.connect(transport);
  }, "Failed to start MCP server");
}

// Enhanced error handling with debug info


process.on("uncaughtException", (error) => {
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  process.exit(1);
});

// Process lifecycle debugging
process.on("exit", (code) => {

});

process.on("beforeExit", (code) => {

});

process.on("SIGTERM", () => {

});

process.on("SIGINT", () => {

});



// Start the server
main().catch((error) => {
  process.exit(1);
});
