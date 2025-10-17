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
// Import new data extraction handlers
import { 
  handleScrapeTable, 
  handleExtractList, 
  handleExtractJSON, 
  handleScrapeMetaTags, 
  handleExtractSchema 
} from './handlers/data-extraction-handlers.js';
// Import multi-element handlers
import {
  handleBatchElementScraper,
  handleNestedDataExtraction,
  handleAttributeHarvester,
  handleImageScraper,
  handleLinkHarvester,
  handleMediaExtractor,
  handlePDFLinkFinder
} from './handlers/multi-element-handlers.js';
// Import pagination handlers
import {
  handleAutoPagination,
  handleInfiniteScroll,
  handleMultiPageScraper,
  handleSitemapParser,
  handleBreadcrumbNavigator
} from './handlers/pagination-handlers.js';
// Import data processing handlers
import {
  handleSmartTextCleaner,
  handleHTMLToText,
  handlePriceParser,
  handleDateNormalizer,
  handleContactExtractor,
  handleSchemaValidator,
  handleRequiredFieldsChecker,
  handleDuplicateRemover
} from './handlers/data-processing-handlers.js';
// Import AI-powered handlers
import {
  handleSmartSelectorGenerator,
  handleContentClassification,
  handleSentimentAnalysis,
  handleSummaryGenerator,
  handleTranslationSupport
} from './handlers/ai-powered-handlers.js';
// Import search & filter handlers
import {
  handleKeywordSearch,
  handleRegexPatternMatcher,
  handleXPathSupport,
  handleAdvancedCSSSelectors,
  handleVisualElementFinder
} from './handlers/search-filter-handlers.js';
// Import data quality handlers
import {
  handleDataDeduplication,
  handleMissingDataHandler,
  handleDataTypeValidator,
  handleOutlierDetection,
  handleConsistencyChecker
} from './handlers/data-quality-handlers.js';
// Import captcha handlers
import {
  handleOCREngine,
  handleAudioCaptchaSolver,
  handlePuzzleCaptchaHandler
} from './handlers/captcha-handlers.js';
// Import visual tools handlers
import {
  handleFullPageScreenshot,
  handleElementScreenshot,
  handlePDFGeneration,
  handleVideoRecording,
  handleVisualComparison
} from './handlers/visual-tools-handlers.js';
// Import API integration handlers
import {
  handleRESTAPIEndpointFinder,
  handleWebhookSupport,
  handleAllWebsiteAPIFinder
} from './handlers/api-integration-handlers.js';
// Import smart data extractors
import {
  handleHtmlElementsExtractor,
  handleTagsFinder,
  handleLinksFinder,
  handleXpathLinks,
  handleAjaxExtractor,
  handleFetchXHR,
  handleNetworkRecorder,
  handleApiFinder,
  handleRegexPatternFinder,
  handleIframeExtractor,
  handleEmbedPageExtractor,
  handleImageExtractorAdvanced,
  handleVideoSourceExtractor,
  handleVideoPlayerExtractor,
  handleVideoPlayerHosterFinder,
  handleOriginalVideoHosterFinder,
  handleUrlRedirectTracer,
  handleUserAgentExtractor
} from './handlers/smart-data-extractors.js';
// Import dynamic session handlers
import {
  handleShadowDOMExtractor,
  handleCookieManager,
  handleSessionPersistence,
  handleFormAutoFill,
  handleAjaxContentWaiter,
  handleModalPopupHandler,
  handleLoginSessionManager
} from './handlers/dynamic-session-handlers.js';
// Import monitoring & reporting handlers
import {
  handleProgressTracker,
  handleErrorLogger,
  handleSuccessRateReporter,
  handleDataQualityMetrics,
  handlePerformanceMonitor,
  handleGetMonitoringSummary
} from './handlers/monitoring-reporting-handlers.js';
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
  handleVideoDownloadButtonFinders
} from './handlers/advanced-video-media-handlers.js';

console.error('🔍 [DEBUG] All modules loaded successfully');
console.error(`🔍 [DEBUG] Server info: ${JSON.stringify(SERVER_INFO)}`);
console.error(`🔍 [DEBUG] Available tools: ${TOOLS.length} tools loaded`);

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

      case TOOL_NAMES.RANDOM_SCROLL:
        return await handleRandomScroll();

      case TOOL_NAMES.FIND_SELECTOR:
        return await handleFindSelector(args as unknown as FindSelectorArgs);

      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        return await handleSaveContentAsMarkdown(args as unknown as SaveContentAsMarkdownArgs);

      // Smart Data Extractors
      case TOOL_NAMES.SCRAPE_TABLE:
        return await handleScrapeTable(args || {});

      case TOOL_NAMES.EXTRACT_LIST:
        return await handleExtractList(args || {});

      case TOOL_NAMES.EXTRACT_JSON:
        return await handleExtractJSON(args || {});

      case TOOL_NAMES.SCRAPE_META_TAGS:
        return await handleScrapeMetaTags(args || {});

      case TOOL_NAMES.EXTRACT_SCHEMA:
        return await handleExtractSchema(args || {});

      // Multi-Element Extractors
      case TOOL_NAMES.BATCH_ELEMENT_SCRAPER:
        return await handleBatchElementScraper(args as any);

      case TOOL_NAMES.NESTED_DATA_EXTRACTION:
        return await handleNestedDataExtraction(args as any);

      case TOOL_NAMES.ATTRIBUTE_HARVESTER:
        return await handleAttributeHarvester(args as any);

      // Content Type Specific
      case TOOL_NAMES.IMAGE_SCRAPER:
        return await handleImageScraper(args || {});

      case TOOL_NAMES.LINK_HARVESTER:
        return await handleLinkHarvester(args || {});

      case TOOL_NAMES.MEDIA_EXTRACTOR:
        return await handleMediaExtractor(args || {});

      case TOOL_NAMES.PDF_LINK_FINDER:
        return await handlePDFLinkFinder(args || {});

      // Pagination Tools
      case TOOL_NAMES.AUTO_PAGINATION:
        return await handleAutoPagination(args || {});

      case TOOL_NAMES.INFINITE_SCROLL:
        return await handleInfiniteScroll(args || {});

      case TOOL_NAMES.MULTI_PAGE_SCRAPER:
        return await handleMultiPageScraper(args as any);

      case TOOL_NAMES.SITEMAP_PARSER:
        return await handleSitemapParser(args || {});

      case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
        return await handleBreadcrumbNavigator(args || {});

      // Data Processing Tools
      case TOOL_NAMES.SMART_TEXT_CLEANER:
        return await handleSmartTextCleaner(args as any);

      case TOOL_NAMES.HTML_TO_TEXT:
        return await handleHTMLToText(args as any);

      case TOOL_NAMES.PRICE_PARSER:
        return await handlePriceParser(args as any);

      case TOOL_NAMES.DATE_NORMALIZER:
        return await handleDateNormalizer(args as any);

      case TOOL_NAMES.CONTACT_EXTRACTOR:
        return await handleContactExtractor(args as any);

      // Data Validation Tools
      case TOOL_NAMES.SCHEMA_VALIDATOR:
        return await handleSchemaValidator(args as any);

      case TOOL_NAMES.REQUIRED_FIELDS_CHECKER:
        return await handleRequiredFieldsChecker(args as any);

      case TOOL_NAMES.DUPLICATE_REMOVER:
        return await handleDuplicateRemover(args as any);

      // AI-Powered Features
      case TOOL_NAMES.SMART_SELECTOR_GENERATOR:
        return await handleSmartSelectorGenerator(args as any);

      case TOOL_NAMES.CONTENT_CLASSIFICATION:
        return await handleContentClassification(args as any);

      case TOOL_NAMES.SENTIMENT_ANALYSIS:
        return await handleSentimentAnalysis(args as any);

      case TOOL_NAMES.SUMMARY_GENERATOR:
        return await handleSummaryGenerator(args as any);

      case TOOL_NAMES.TRANSLATION_SUPPORT:
        return await handleTranslationSupport(args as any);

      // Search & Filter Tools
      case TOOL_NAMES.KEYWORD_SEARCH:
        return await handleKeywordSearch(args as any);

      case TOOL_NAMES.REGEX_PATTERN_MATCHER:
        return await handleRegexPatternMatcher(args as any);

      case TOOL_NAMES.XPATH_SUPPORT:
        return await handleXPathSupport(args as any);

      case TOOL_NAMES.ADVANCED_CSS_SELECTORS:
        return await handleAdvancedCSSSelectors(args as any);

      case TOOL_NAMES.VISUAL_ELEMENT_FINDER:
        return await handleVisualElementFinder(args as any);

      // Data Quality & Validation
      case TOOL_NAMES.DATA_DEDUPLICATION:
        return await handleDataDeduplication(args as any);

      case TOOL_NAMES.MISSING_DATA_HANDLER:
        return await handleMissingDataHandler(args as any);

      case TOOL_NAMES.DATA_TYPE_VALIDATOR:
        return await handleDataTypeValidator(args as any);

      case TOOL_NAMES.OUTLIER_DETECTION:
        return await handleOutlierDetection(args as any);

      case TOOL_NAMES.CONSISTENCY_CHECKER:
        return await handleConsistencyChecker(args as any);

      // Advanced Captcha Handling
      case TOOL_NAMES.OCR_ENGINE:
        return await handleOCREngine(args as any);

      case TOOL_NAMES.AUDIO_CAPTCHA_SOLVER:
        return await handleAudioCaptchaSolver(args as any);

      case TOOL_NAMES.PUZZLE_CAPTCHA_HANDLER:
        return await handlePuzzleCaptchaHandler(args as any);

      // Screenshot & Visual Tools
      case TOOL_NAMES.FULL_PAGE_SCREENSHOT:
        return await handleFullPageScreenshot(args as any);

      case TOOL_NAMES.ELEMENT_SCREENSHOT:
        return await handleElementScreenshot(args as any);

      case TOOL_NAMES.PDF_GENERATION:
        return await handlePDFGeneration(args as any);

      case TOOL_NAMES.VIDEO_RECORDING:
        return await handleVideoRecording(args as any);

      case TOOL_NAMES.VISUAL_COMPARISON:
        return await handleVisualComparison(args as any);

      // Website API Integration
      case TOOL_NAMES.REST_API_ENDPOINT_FINDER:
        return await handleRESTAPIEndpointFinder(args as any);

      case TOOL_NAMES.WEBHOOK_SUPPORT:
        return await handleWebhookSupport(args as any);

      case TOOL_NAMES.ALL_WEBSITE_API_FINDER:
        return await handleAllWebsiteAPIFinder(args as any);

      // Smart Data Extractors (Advanced)
      case 'html_elements_extractor':
        return await handleHtmlElementsExtractor(args || {});

      case 'tags_finder':
        return await handleTagsFinder(args || {});

      case 'links_finder':
        return await handleLinksFinder(args || {});

      case 'xpath_links':
        return await handleXpathLinks(args || {});

      case 'ajax_extractor':
        return await handleAjaxExtractor(args || {});

      case 'fetch_xhr':
        return await handleFetchXHR(args || {});

      case 'network_recorder':
        return await handleNetworkRecorder(args || {});

      case 'api_finder':
        return await handleApiFinder(args || {});

      case 'regex_pattern_finder':
        return await handleRegexPatternFinder(args as any);

      case 'iframe_extractor':
        return await handleIframeExtractor(args || {});

      case 'embed_page_extractor':
        return await handleEmbedPageExtractor(args || {});

      case 'image_extractor_advanced':
        return await handleImageExtractorAdvanced(args || {});

      case 'video_source_extractor':
        return await handleVideoSourceExtractor(args || {});

      case 'video_player_extractor':
        return await handleVideoPlayerExtractor(args || {});

      case 'video_player_hoster_finder':
        return await handleVideoPlayerHosterFinder(args || {});

      case 'original_video_hoster_finder':
        return await handleOriginalVideoHosterFinder(args || {});

      case 'url_redirect_tracer':
        return await handleUrlRedirectTracer(args as any);

      case 'user_agent_extractor':
        return await handleUserAgentExtractor(args || {});

      // Dynamic Content & Session Handling
      case 'shadow_dom_extractor':
        return await handleShadowDOMExtractor(args || {});

      case 'cookie_manager':
        return await handleCookieManager(args as any);

      case 'session_persistence':
        return await handleSessionPersistence(args as any);

      case 'form_auto_fill':
        return await handleFormAutoFill(args as any);

      case 'ajax_content_waiter':
        return await handleAjaxContentWaiter(args as any);

      case 'modal_popup_handler':
        return await handleModalPopupHandler(args as any);

      case 'login_session_manager':
        return await handleLoginSessionManager(args as any);

      // Monitoring & Reporting
      case 'progress_tracker':
        return await handleProgressTracker(args || {});

      case 'error_logger':
        return await handleErrorLogger(args || {});

      case 'success_rate_reporter':
        return await handleSuccessRateReporter(args || {});

      case 'data_quality_metrics':
        return await handleDataQualityMetrics(args || {});

      case 'performance_monitor':
        return await handlePerformanceMonitor(args || {});

      case 'monitoring_summary':
        return await handleGetMonitoringSummary(args || {});

      // Advanced Video & Media Download Tools
      case 'video_link_finder':
        return await handleVideoLinkFinder(args || {});

      case 'video_download_page':
        return await handleVideoDownloadPage(args || {});

      case 'video_download_button':
        return await handleVideoDownloadButton(args as any);

      case 'video_play_push_source':
        return await handleVideoPlayPushSource(args || {});

      case 'video_play_button_click':
        return await handleVideoPlayButtonClick(args || {});

      case 'url_redirect_trace_endpoints':
        return await handleUrlRedirectTraceEndpoints(args as any);

      case 'network_recording_finder':
        return await handleNetworkRecordingFinder(args || {});

      case 'network_recording_extractors':
        return await handleNetworkRecordingExtractors(args || {});

      case 'video_links_finders':
        return await handleVideoLinksFinders(args || {});

      case 'videos_selectors':
        return await handleVideosSelectors(args || {});

      case 'link_process_extracts':
        return await handleLinkProcessExtracts(args || {});

      case 'video_link_finders_extracts':
        return await handleVideoLinkFindersExtracts(args || {});

      case 'video_download_button_finders':
        return await handleVideoDownloadButtonFinders(args || {});

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