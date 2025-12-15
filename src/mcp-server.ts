import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, PressKeyArgs, WaitArgs, SolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
import { validateMCPResponse } from './mcp-response-validator.js';

// Import handlers
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handlePressKey, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';
import {

  handleExtractList,
  handleExtractJSON,
  handleScrapeMetaTags,
  handleExtractSchema
} from './handlers/data-extraction-handlers.js';
import {
  handleBatchElementScraper,
  handleNestedDataExtraction,
  handleAttributeHarvester,
  handleLinkHarvester,
  handleMediaExtractor,
} from './handlers/multi-element-handlers.js';

import {
  handleMultiPageScraper,
  handleBreadcrumbNavigator,
  MultiPageScraperArgs,
  BreadcrumbNavigatorArgs
} from './handlers/advanced-scraping-handlers.js';

import {
  handleHtmlElementsExtractor,
  handleTagsFinder,
  handleLinksFinder,
  handleXpathLinks,
  handleShadowDomExtractor,
  handleIframeExtractor,
  handleEmbedPageExtractor,
  HtmlElementsExtractorArgs,
  TagsFinderArgs,
  LinksFinderArgs,
  XpathLinksArgs,
  ShadowDomExtractorArgs
} from './handlers/dom-handlers.js';

import {
  handleNetworkRecorder,
  handleAjaxExtractor,
  handleFetchXhr,
  handleApiFinder,
  NetworkRecorderArgs,
  AjaxExtractorArgs,
  FetchXhrArgs,
  ApiFinderArgs
} from './handlers/network-handlers.js';

import {
  handleHtmlToText,
  handleDuplicateRemover,
  HtmlToTextArgs,
  DuplicateRemoverArgs
} from './handlers/data-transform-handlers.js';

import {
  handleDataDeduplication,
  handleDataTypeValidator,
  handleOutlierDetection,
  handleConsistencyChecker
} from './handlers/data-quality-handlers.js';

import {
  handleSmartSelectorGenerator,
  handleContentClassification,
  handleSentimentAnalysis,
  handleSummaryGenerator,
  handleTranslationSupport,
  SmartSelectorGeneratorArgs,
  ContentClassificationArgs,
  SentimentAnalysisArgs,
  SummaryGeneratorArgs,
  TranslationSupportArgs
} from './handlers/ai-powered-handlers.js';

import {
  handleKeywordSearch,
  handleRegexPatternMatcher,
  handleXPathSupport,
  handleAdvancedCSSSelectors,
  handleVisualElementFinder,
  KeywordSearchArgs,
  RegexPatternMatcherArgs,
  XPathSupportArgs,
  AdvancedCSSSelectorsArgs,
  VisualElementFinderArgs
} from './handlers/search-filter-handlers.js';

import {
  handleVideoSourceExtractor,
  handleVideoPlayerFinder,
  handleStreamDetector,
  handleRedirectTracer,
  handleVideoDownloadLinkFinder,
  VideoSourceExtractorArgs,
  VideoPlayerFinderArgs,
  StreamDetectorArgs,
  RedirectTracerArgs,
  VideoDownloadLinkFinderArgs
} from './handlers/advanced-video-media-handlers.js';

import {
  handleOCREngine,
  handleAudioCaptchaSolver,
  handlePuzzleCaptchaHandler,
  OCREngineArgs,
  AudioCaptchaSolverArgs,
  PuzzleCaptchaHandlerArgs
} from './handlers/captcha-handlers.js';

import {
  handleAdvancedVideoExtraction,
  handleDeobfuscateJS,
  handleMultiLayerRedirectTrace,
  handleAdProtectionDetector
} from './handlers/advanced-extraction-handlers.js';

export async function createMcpServer(): Promise<Server> {
  const server = new Server(SERVER_INFO, { capabilities: CAPABILITIES });

  // Register initialize handler
  server.setRequestHandler(InitializeRequestSchema, async (request) => {
    const clientProtocolVersion = request.params.protocolVersion;
    return {
      protocolVersion: clientProtocolVersion,
      capabilities: CAPABILITIES,
      serverInfo: SERVER_INFO,
    };
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

  // Main tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

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

        case TOOL_NAMES.PRESS_KEY:
          result = await handlePressKey(args as unknown as PressKeyArgs);
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
          result = await handleSaveContentAsMarkdown(args as unknown as SaveContentAsMarkdownArgs);
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

        // Phase 1: Pagination & Navigation
        case TOOL_NAMES.MULTI_PAGE_SCRAPER:
          result = await handleMultiPageScraper(args as unknown as MultiPageScraperArgs);
          break;
        case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
          result = await handleBreadcrumbNavigator(args as unknown as BreadcrumbNavigatorArgs);
          break;

        // Phase 1: DOM & HTML
        case TOOL_NAMES.HTML_ELEMENTS_EXTRACTOR:
          result = await handleHtmlElementsExtractor(args as unknown as HtmlElementsExtractorArgs);
          break;
        case TOOL_NAMES.TAGS_FINDER:
          result = await handleTagsFinder(args as unknown as TagsFinderArgs);
          break;
        case TOOL_NAMES.LINKS_FINDER:
          result = await handleLinksFinder(args as unknown as LinksFinderArgs);
          break;
        case TOOL_NAMES.XPATH_LINKS:
          result = await handleXpathLinks(args as unknown as XpathLinksArgs);
          break;
        case TOOL_NAMES.SHADOW_DOM_EXTRACTOR:
          result = await handleShadowDomExtractor(args as unknown as ShadowDomExtractorArgs);
          break;
        case TOOL_NAMES.IFRAME_EXTRACTOR:
          result = await handleIframeExtractor();
          break;
        case TOOL_NAMES.EMBED_PAGE_EXTRACTOR:
          result = await handleEmbedPageExtractor();
          break;

        // Phase 1: Network Tools
        case TOOL_NAMES.NETWORK_RECORDER:
          result = await handleNetworkRecorder(args as unknown as NetworkRecorderArgs);
          break;
        case TOOL_NAMES.AJAX_EXTRACTOR:
          result = await handleAjaxExtractor(args as unknown as AjaxExtractorArgs);
          break;
        case TOOL_NAMES.FETCH_XHR:
          result = await handleFetchXhr(args as unknown as FetchXhrArgs);
          break;
        case TOOL_NAMES.API_FINDER:
          result = await handleApiFinder(args as unknown as ApiFinderArgs);
          break;

        // Phase 1: Data Transform
        case TOOL_NAMES.HTML_TO_TEXT:
          result = await handleHtmlToText(args as unknown as HtmlToTextArgs);
          break;
        case TOOL_NAMES.DUPLICATE_REMOVER:
          result = await handleDuplicateRemover(args as unknown as DuplicateRemoverArgs);
          break;

        // Phase 2: AI & Smart Features
        case TOOL_NAMES.SMART_SELECTOR_GENERATOR:
          result = await handleSmartSelectorGenerator(args as unknown as SmartSelectorGeneratorArgs);
          break;
        case TOOL_NAMES.CONTENT_CLASSIFICATION:
          result = await handleContentClassification(args as unknown as ContentClassificationArgs);
          break;
        case TOOL_NAMES.SENTIMENT_ANALYSIS:
          result = await handleSentimentAnalysis(args as unknown as SentimentAnalysisArgs);
          break;
        case TOOL_NAMES.SUMMARY_GENERATOR:
          result = await handleSummaryGenerator(args as unknown as SummaryGeneratorArgs);
          break;
        case TOOL_NAMES.TRANSLATION_SUPPORT:
          result = await handleTranslationSupport(args as unknown as TranslationSupportArgs);
          break;

        // Phase 2: Search & Filter
        case TOOL_NAMES.KEYWORD_SEARCH:
          result = await handleKeywordSearch(args as unknown as KeywordSearchArgs);
          break;
        case TOOL_NAMES.REGEX_PATTERN_MATCHER:
          result = await handleRegexPatternMatcher(args as unknown as RegexPatternMatcherArgs);
          break;
        case TOOL_NAMES.XPATH_SUPPORT:
          result = await handleXPathSupport(args as unknown as XPathSupportArgs);
          break;
        case TOOL_NAMES.ADVANCED_CSS_SELECTORS:
          result = await handleAdvancedCSSSelectors(args as unknown as AdvancedCSSSelectorsArgs);
          break;
        case TOOL_NAMES.VISUAL_ELEMENT_FINDER:
          result = await handleVisualElementFinder(args as unknown as VisualElementFinderArgs);
          break;

        // Phase 3: Media & Video
        case TOOL_NAMES.VIDEO_SOURCE_EXTRACTOR:
          result = await handleVideoSourceExtractor(args as unknown as VideoSourceExtractorArgs);
          break;
        case TOOL_NAMES.VIDEO_PLAYER_FINDER:
          result = await handleVideoPlayerFinder(args as unknown as VideoPlayerFinderArgs);
          break;
        case TOOL_NAMES.STREAM_DETECTOR:
          result = await handleStreamDetector(args as unknown as StreamDetectorArgs);
          break;
        case TOOL_NAMES.REDIRECT_TRACER:
          result = await handleRedirectTracer(args as unknown as RedirectTracerArgs);
          break;
        case TOOL_NAMES.VIDEO_DOWNLOAD_LINK_FINDER:
          result = await handleVideoDownloadLinkFinder(args as unknown as VideoDownloadLinkFinderArgs);
          break;

        // Phase 4: Captcha & Security
        case TOOL_NAMES.OCR_ENGINE:
          result = await handleOCREngine(args as unknown as OCREngineArgs);
          break;
        case TOOL_NAMES.AUDIO_CAPTCHA_SOLVER:
          result = await handleAudioCaptchaSolver(args as unknown as AudioCaptchaSolverArgs);
          break;
        case TOOL_NAMES.PUZZLE_CAPTCHA_HANDLER:
          result = await handlePuzzleCaptchaHandler(args as unknown as PuzzleCaptchaHandlerArgs);
          break;

        // Advanced Extraction (Security/Bypass)
        case "advanced_video_extraction":
          result = await handleAdvancedVideoExtraction(args);
          break;
        case "deobfuscate_js":
          result = await handleDeobfuscateJS(args);
          break;
        case "multi_layer_redirect_trace":
          result = await handleMultiLayerRedirectTrace(args);
          break;
        case "ad_protection_detector":
          result = await handleAdProtectionDetector(args);
          break;



        case "consistency_checker":
          result = await handleConsistencyChecker(args);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Validate MCP response format universally
      return validateMCPResponse(result, name) as any;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

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

  return server;
}
