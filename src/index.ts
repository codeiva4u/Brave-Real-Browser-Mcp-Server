#!/usr/bin/env node

// Debug logging setup - Log process start
import 'dotenv/config';
console.error(
  `🔍 [DEBUG] Process starting - PID: ${process.pid}, Node: ${process.version}, Platform: ${process.platform}`,
);
console.error(`🔍 [DEBUG] Working directory: ${process.cwd()}`);
console.error(`🔍 [DEBUG] Command args: ${process.argv.join(" ")}`);


import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

console.error("🔍 [DEBUG] MCP SDK imports completed successfully");

// Import extracted modules
console.error("🔍 [DEBUG] Loading tool definitions...");
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
console.error("🔍 [DEBUG] Loading system utils...");
import { withErrorHandling } from "./system-utils.js";
import { validateMCPResponse } from "./mcp-response-validator.js";
console.error("🔍 [DEBUG] Loading browser manager...");
import { closeBrowser, forceKillAllBraveProcesses } from "./browser-manager.js";
console.error("🔍 [DEBUG] Loading core infrastructure...");
import {
  setupProcessCleanup,
  MCP_SERVER_CONFIG,
} from "./core-infrastructure.js";


// Import handlers
console.error("🔍 [DEBUG] Loading handlers...");
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
} from "./handlers/interaction-handlers.js";
import {
  handleGetContent,
  handleFindSelector,
} from "./handlers/content-handlers.js";
import { handleSaveContentAsMarkdown } from "./handlers/file-handlers.js";
// Import new data extraction handlers
import {
  handleExtractList,
  handleExtractJSON,
  handleScrapeMetaTags,
  handleExtractSchema,
} from "./handlers/data-extraction-handlers.js";
// Import multi-element handlers
import {
  handleBatchElementScraper,
  handleNestedDataExtraction,
  handleAttributeHarvester,
  handleLinkHarvester,
  handleMediaExtractor,

} from "./handlers/multi-element-handlers.js";
// Import pagination handlers
import {

  handleMultiPageScraper,
  handleBreadcrumbNavigator,
} from "./handlers/pagination-handlers.js";
// Import data processing handlers
import {
  handleHTMLToText,
  handleDuplicateRemover,
} from "./handlers/data-processing-handlers.js";
// Import AI-powered handlers
import {
  handleSmartSelectorGenerator,
  handleContentClassification,

} from "./handlers/ai-powered-handlers.js";
// Import search & filter handlers
import {
  handleKeywordSearch,
  handleRegexPatternMatcher,
  handleXPathSupport,
  handleAdvancedCSSSelectors,
  handleVisualElementFinder,
} from "./handlers/search-filter-handlers.js";
// Import data quality handlers
import {
  handleDataDeduplication,
  handleDataTypeValidator,
  handleOutlierDetection,
} from "./handlers/data-quality-handlers.js";
// Import captcha handlers
import {
  handleOCREngine,
  handleAudioCaptchaSolver,
  handlePuzzleCaptchaHandler,
} from "./handlers/captcha-handlers.js";
// Import visual tools handlers
import {
  handleFullPageScreenshot,
  handleElementScreenshot,

  handleVideoRecording,
  handleVisualComparison,
} from "./handlers/visual-tools-handlers.js";
// Import smart data extractors
import {
  handleHtmlElementsExtractor,
  handleTagsFinder,
  handleLinksFinder,
  handleXpathLinks,
  handleAjaxExtractor,
  handleFetchXHR,
  handleNetworkRecorder,
  handleRegexPatternFinder,
  handleIframeExtractor,
  handleEmbedPageExtractor,
  handleImageExtractorAdvanced,
  handleVideoSourceExtractor,
  handleVideoPlayerExtractor,
  handleVideoPlayerHosterFinder,
  handleOriginalVideoHosterFinder,
  handleUrlRedirectTracer,
  handleUserAgentExtractor,
} from "./handlers/smart-data-extractors.js";
// Import dynamic session handlers
import {
  handleShadowDOMExtractor,
  handleCookieManager,
  handleFormAutoFill,
  handleAjaxContentWaiter,
} from "./handlers/dynamic-session-handlers.js";
// Import monitoring & reporting handlers
import {
  handleProgressTracker,


  handleDataQualityMetrics,

} from "./handlers/monitoring-reporting-handlers.js";
// Import advanced video & media handlers
import {
  handleVideoLinkFinder,
  handleVideoDownloadPage,
  handleVideoDownloadButton,
  handleVideoPlayPushSource,
  handleVideoPlayButtonClick,
  handleUrlRedirectTraceEndpoints,
  handleNetworkRecordingFinder,
  handleNetworkRecordingExtractors,
  handleVideoLinksFinders,
  handleVideosSelectors,
  handleLinkProcessExtracts,
  handleVideoLinkFindersExtracts,
  handleVideoDownloadButtonFinders,
} from "./handlers/advanced-video-media-handlers.js";
// Import advanced extraction handlers (Ad-bypass & Obfuscation)
import {
  handleAdvancedVideoExtraction,
  handleDeobfuscateJS,
  handleMultiLayerRedirectTrace,
  handleAdProtectionDetector,
} from "./handlers/advanced-extraction-handlers.js";

console.error("🔍 [DEBUG] All modules loaded successfully");
console.error(`🔍 [DEBUG] Server info: ${JSON.stringify(SERVER_INFO)}`);
console.error(`🔍 [DEBUG] Available tools: ${TOOLS.length} tools loaded`);

// Initialize MCP server
console.error("🔍 [DEBUG] Creating MCP server instance...");
const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });
console.error("🔍 [DEBUG] MCP server instance created successfully");

// Register initialize handler (CRITICAL - missing handler can cause crash)
console.error("🔍 [DEBUG] Registering initialize handler...");
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  console.error(
    `🔍 [DEBUG] Initialize request received: ${JSON.stringify(request)}`,
  );

  // Use the client's protocol version to ensure compatibility
  const clientProtocolVersion = request.params.protocolVersion;
  console.error(`🔍 [DEBUG] Client protocol version: ${clientProtocolVersion}`);

  const response = {
    protocolVersion: clientProtocolVersion, // Match client version for compatibility
    capabilities: CAPABILITIES,
    serverInfo: SERVER_INFO,
  };
  console.error(
    `🔍 [DEBUG] Sending initialize response: ${JSON.stringify(response)}`,
  );

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
console.error("🔍 [DEBUG] Registering tools handler...");
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("🔍 [DEBUG] Tools list requested");
  return { tools: TOOLS };
});

// Register resource handlers (placeholder)
console.error("🔍 [DEBUG] Registering resources handler...");
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  console.error("🔍 [DEBUG] Resources list requested");
  return { resources: [] };
});

// Register prompt handlers (placeholder)
console.error("🔍 [DEBUG] Registering prompts handler...");
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  console.error("🔍 [DEBUG] Prompts list requested");
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

      case TOOL_NAMES.FIND_SELECTOR:
        result = await handleFindSelector(args as unknown as FindSelectorArgs);
        break;

      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        result = await handleSaveContentAsMarkdown(
          args as unknown as SaveContentAsMarkdownArgs,
        );
        break;

      // Smart Data Extractors
      case TOOL_NAMES.EXTRACT_LIST:
        result = await handleExtractList(args || {});
        break;

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

      case TOOL_NAMES.NESTED_DATA_EXTRACTION:
        result = await handleNestedDataExtraction(args as any);
        break;

      case TOOL_NAMES.ATTRIBUTE_HARVESTER:
        result = await handleAttributeHarvester(args as any);
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
      case TOOL_NAMES.MULTI_PAGE_SCRAPER:
        result = await handleMultiPageScraper(args as any);
        break;



      case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
        result = await handleBreadcrumbNavigator(args || {});
        break;

      // Data Processing Tools


      case TOOL_NAMES.HTML_TO_TEXT:
        result = await handleHTMLToText(args as any);
        break;







      case TOOL_NAMES.DUPLICATE_REMOVER:
        result = await handleDuplicateRemover(args as any);
        break;

      // AI-Powered Features
      case TOOL_NAMES.SMART_SELECTOR_GENERATOR:
        result = await handleSmartSelectorGenerator(args as any);
        break;

      case TOOL_NAMES.CONTENT_CLASSIFICATION:
        result = await handleContentClassification(args as any);
        break;







      // Search & Filter Tools
      case TOOL_NAMES.KEYWORD_SEARCH:
        result = await handleKeywordSearch(args as any);
        break;

      case TOOL_NAMES.REGEX_PATTERN_MATCHER:
        result = await handleRegexPatternMatcher(args as any);
        break;

      case TOOL_NAMES.XPATH_SUPPORT:
        result = await handleXPathSupport(args as any);
        break;

      case TOOL_NAMES.ADVANCED_CSS_SELECTORS:
        result = await handleAdvancedCSSSelectors(args as any);
        break;

      case TOOL_NAMES.VISUAL_ELEMENT_FINDER:
        result = await handleVisualElementFinder(args as any);
        break;

      // Data Quality & Validation
      case TOOL_NAMES.DATA_DEDUPLICATION:
        result = await handleDataDeduplication(args as any);
        break;



      case TOOL_NAMES.DATA_TYPE_VALIDATOR:
        result = await handleDataTypeValidator(args as any);
        break;

      case TOOL_NAMES.OUTLIER_DETECTION:
        result = await handleOutlierDetection(args as any);
        break;



      // Advanced Captcha Handling
      case TOOL_NAMES.OCR_ENGINE:
        result = await handleOCREngine(args as any);
        break;

      case TOOL_NAMES.AUDIO_CAPTCHA_SOLVER:
        result = await handleAudioCaptchaSolver(args as any);
        break;

      case TOOL_NAMES.PUZZLE_CAPTCHA_HANDLER:
        result = await handlePuzzleCaptchaHandler(args as any);
        break;

      // Screenshot & Visual Tools
      case TOOL_NAMES.FULL_PAGE_SCREENSHOT:
        result = await handleFullPageScreenshot(args as any);
        break;

      case TOOL_NAMES.ELEMENT_SCREENSHOT:
        result = await handleElementScreenshot(args as any);
        break;



      case TOOL_NAMES.VIDEO_RECORDING:
        result = await handleVideoRecording(args as any);
        break;

      case TOOL_NAMES.VISUAL_COMPARISON:
        result = await handleVisualComparison(args as any);
        break;


      // Smart Data Extractors (Advanced)
      case "html_elements_extractor":
        result = await handleHtmlElementsExtractor(args || {});
        break;

      case "tags_finder":
        result = await handleTagsFinder(args || {});
        break;

      case "links_finder":
        result = await handleLinksFinder(args || {});
        break;

      case "xpath_links":
        result = await handleXpathLinks(args || {});
        break;

      case "ajax_extractor":
        result = await handleAjaxExtractor(args || {});
        break;

      case "fetch_xhr":
        result = await handleFetchXHR(args || {});
        break;

      case "network_recorder":
        result = await handleNetworkRecorder(args || {});
        break;


      case "regex_pattern_finder":
        result = await handleRegexPatternFinder(args as any);
        break;

      case "iframe_extractor":
        result = await handleIframeExtractor(args || {});
        break;

      case "embed_page_extractor":
        result = await handleEmbedPageExtractor(args || {});
        break;

      case "image_extractor_advanced":
        result = await handleImageExtractorAdvanced(args || {});
        break;

      case "video_source_extractor":
        result = await handleVideoSourceExtractor(args || {});
        break;

      case "video_player_extractor":
        result = await handleVideoPlayerExtractor(args || {});
        break;

      case "video_player_hoster_finder":
        result = await handleVideoPlayerHosterFinder(args || {});
        break;

      case "original_video_hoster_finder":
        result = await handleOriginalVideoHosterFinder(args || {});
        break;

      case "url_redirect_tracer":
        result = await handleUrlRedirectTracer(args as any);
        break;

      case "user_agent_extractor":
        result = await handleUserAgentExtractor(args || {});
        break;

      // Dynamic Content & Session Handling
      case "shadow_dom_extractor":
        result = await handleShadowDOMExtractor(args || {});
        break;

      case "cookie_manager":
        result = await handleCookieManager(args as any);
        break;



      case "form_auto_fill":
        result = await handleFormAutoFill(args as any);
        break;

      case "ajax_content_waiter":
        result = await handleAjaxContentWaiter(args as any);
        break;





      // Monitoring & Reporting
      case "progress_tracker":
        result = await handleProgressTracker(args || {});
        break;





      case "data_quality_metrics":
        result = await handleDataQualityMetrics(args || {});
        break;





      // Advanced Video & Media Download Tools
      case "video_link_finder":
        result = await handleVideoLinkFinder(args || {});
        break;

      case "video_download_page":
        result = await handleVideoDownloadPage(args || {});
        break;

      case "video_download_button":
        result = await handleVideoDownloadButton(args as any);
        break;

      case "video_play_push_source":
        result = await handleVideoPlayPushSource(args || {});
        break;

      case "video_play_button_click":
        result = await handleVideoPlayButtonClick(args || {});
        break;

      case "url_redirect_trace_endpoints":
        result = await handleUrlRedirectTraceEndpoints(args as any);
        break;

      case "network_recording_finder":
        result = await handleNetworkRecordingFinder(args || {});
        break;

      case "network_recording_extractors":
        result = await handleNetworkRecordingExtractors(args || {});
        break;

      case "video_links_finders":
        result = await handleVideoLinksFinders(args || {});
        break;

      case "videos_selectors":
        result = await handleVideosSelectors(args || {});
        break;

      case "link_process_extracts":
        result = await handleLinkProcessExtracts(args || {});
        break;

      case "video_link_finders_extracts":
        result = await handleVideoLinkFindersExtracts(args || {});
        break;

      case "video_download_button_finders":
        result = await handleVideoDownloadButtonFinders(args || {});
        break;

      // Advanced Extraction Tools (Ad-Bypass & Obfuscation)
      case "advanced_video_extraction":
        result = await handleAdvancedVideoExtraction(args || {});
        break;

      case "deobfuscate_js":
        result = await handleDeobfuscateJS(args || {});
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
console.error("🔍 [DEBUG] Registering tool call handler...");
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(
    `🔍 [DEBUG] Tool call received: ${name} with args: ${JSON.stringify(args)}`,
  );

  return await executeToolByName(name, args);
});

// Main function - now using multi-protocol launcher
// Main function
async function main(): Promise<void> {
  console.error("🔍 [DEBUG] Starting in STDIO mode...");

  setupProcessCleanup(async () => {
    await closeBrowser();
    await forceKillAllBraveProcesses();
  });

  const transport = new StdioServerTransport();

  await withErrorHandling(async () => {
    await server.connect(transport);
    console.error("🚀 Brave Real Browser MCP Server started successfully");
    console.error("📋 Available tools:", TOOLS.map((t) => t.name).join(", "));
  }, "Failed to start MCP server");
}

// Enhanced error handling with debug info
console.error("🔍 [DEBUG] Setting up error handlers...");

process.on("uncaughtException", (error) => {
  console.error(`🔍 [DEBUG] Uncaught exception at ${new Date().toISOString()}`);
  console.error("❌ Uncaught exception:", error);
  console.error(`🔍 [DEBUG] Stack trace:`, error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    `🔍 [DEBUG] Unhandled rejection at ${new Date().toISOString()}`,
  );
  console.error("❌ Unhandled rejection:", reason);
  console.error(`🔍 [DEBUG] Promise:`, promise);
  process.exit(1);
});

// Process lifecycle debugging
process.on("exit", (code) => {
  console.error(
    `🔍 [DEBUG] Process exiting with code: ${code} at ${new Date().toISOString()}`,
  );
});

process.on("beforeExit", (code) => {
  console.error(
    `🔍 [DEBUG] Before exit event with code: ${code} at ${new Date().toISOString()}`,
  );
});

process.on("SIGTERM", () => {
  console.error(`🔍 [DEBUG] SIGTERM received at ${new Date().toISOString()}`);
});

process.on("SIGINT", () => {
  console.error(`🔍 [DEBUG] SIGINT received at ${new Date().toISOString()}`);
});

console.error("🔍 [DEBUG] All error handlers registered");

// Start the server
main().catch((error) => {
  console.error(
    `🔍 [DEBUG] Main function failed at ${new Date().toISOString()}`,
  );
  console.error("❌ Failed to start server:", error);
  console.error(`🔍 [DEBUG] Error stack:`, error.stack);
  process.exit(1);
});
