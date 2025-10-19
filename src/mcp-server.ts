import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES, NavigateArgs, ClickArgs, TypeArgs, WaitArgs, SolveCaptchaArgs, FindSelectorArgs, SaveContentAsMarkdownArgs } from './tool-definitions.js';
import { validateMCPResponse } from './mcp-response-validator.js';

// Import handlers
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';
import { 
  handleScrapeTable, 
  handleExtractList, 
  handleExtractJSON, 
  handleScrapeMetaTags, 
  handleExtractSchema 
} from './handlers/data-extraction-handlers.js';
import {
  handleBatchElementScraper,
  handleNestedDataExtraction,
  handleAttributeHarvester,
  handleImageScraper,
  handleLinkHarvester,
  handleMediaExtractor,
  handlePDFLinkFinder
} from './handlers/multi-element-handlers.js';

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
        case TOOL_NAMES.SCRAPE_TABLE:
          result = await handleScrapeTable(args || {});
          break;

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
        case TOOL_NAMES.IMAGE_SCRAPER:
          result = await handleImageScraper(args || {});
          break;

        case TOOL_NAMES.LINK_HARVESTER:
          result = await handleLinkHarvester(args || {});
          break;

        case TOOL_NAMES.MEDIA_EXTRACTOR:
          result = await handleMediaExtractor(args || {});
          break;

        case TOOL_NAMES.PDF_LINK_FINDER:
          result = await handlePDFLinkFinder(args || {});
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
