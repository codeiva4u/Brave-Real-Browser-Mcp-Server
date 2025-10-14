// Video extraction handlers for MCP tools
import { VideoSource, VideoFormat, ExtractionResult, ExtractionContext, ExtractionStrategy } from '../video-extraction/types.js';
import { htmlElementsFinder, videoSelectors } from '../video-extraction/dom-extractors.js';
import { networkRecorder, requestChainTracer } from '../video-extraction/network-extractors.js';
import { validateWorkflow, recordExecution } from '../workflow-validation.js';
import { withErrorHandling } from '../system-utils.js';
import { getBrowser, getPage } from '../browser-manager.js';

// Wrapper function for workflow validation
async function withVideoExtractionWorkflowValidation<T>(
  toolName: string,
  operation: () => Promise<T>
): Promise<T> {
  // Validate workflow state
  const workflowResult = validateWorkflow(toolName);
  if (!workflowResult.isValid) {
    throw new Error(`Workflow validation failed for ${toolName}: ${workflowResult.errorMessage}`);
  }

  try {
    const result = await operation();
    recordExecution(toolName, {}, true);
    return result;
  } catch (error) {
    recordExecution(toolName, {}, false, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// HTML Elements Video Extractor
export async function handleHtmlElementsExtraction(args: {
  extractVideoTags?: boolean;
  extractIframes?: boolean;
  extractEmbeds?: boolean;
  extractMetaTags?: boolean;
  extractDataAttributes?: boolean;
}): Promise<{ content: ExtractionResult }> {
  return withVideoExtractionWorkflowValidation('html_elements_extraction', async () => {
    return withErrorHandling(async () => {
      const startTime = Date.now();
      const allSources: VideoSource[] = [];
      const errors: any[] = [];
      const warnings: string[] = [];
      
      try {
        // Initialize HTML elements finder
        await htmlElementsFinder.initialize();
        
        // Extract from video tags
        if (args.extractVideoTags !== false) {
          try {
            const videoTagSources = await htmlElementsFinder.findVideoTags();
            allSources.push(...videoTagSources);
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.DOM_ANALYSIS,
              message: 'Failed to extract video tags',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Extract from iframes
        if (args.extractIframes !== false) {
          try {
            const iframeSources = await htmlElementsFinder.findIframeSources();
            allSources.push(...iframeSources);
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.DOM_ANALYSIS,
              message: 'Failed to extract iframe sources',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Extract from embeds
        if (args.extractEmbeds !== false) {
          try {
            const embedSources = await htmlElementsFinder.findEmbedSources();
            allSources.push(...embedSources);
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.DOM_ANALYSIS,
              message: 'Failed to extract embed sources',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Extract from meta tags
        if (args.extractMetaTags !== false) {
          try {
            const metaSources = await htmlElementsFinder.findMetaVideoSources();
            allSources.push(...metaSources);
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.DOM_ANALYSIS,
              message: 'Failed to extract meta tag sources',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Extract from data attributes
        if (args.extractDataAttributes !== false) {
          try {
            const dataSources = await htmlElementsFinder.findDataAttributesSources();
            allSources.push(...dataSources);
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.DOM_ANALYSIS,
              message: 'Failed to extract data attribute sources',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Get current page info for metadata
        const page = getPage();
        const pageUrl = page ? await page.url() : 'unknown';
        const pageTitle = page ? await page.title() : undefined;
        
        // Deduplicate sources
        const uniqueSources = deduplicateSources(allSources);
        
        const result: ExtractionResult = {
          sources: uniqueSources,
          metadata: {
            title: pageTitle,
            extractionTime: Date.now() - startTime,
            strategiesUsed: [ExtractionStrategy.DOM_ANALYSIS],
            hostersFound: [...new Set(uniqueSources.map(s => s.hoster).filter(Boolean))] as string[]
          },
          errors,
          warnings
        };
        
        return {
          content: result
        };
        
      } catch (error) {
        throw new Error(`HTML elements extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 'handleHtmlElementsExtraction');
  });
}

// Network Recording Video Extractor
export async function handleNetworkVideoExtraction(args: {
  interceptRequests?: boolean;
  captureResponses?: boolean;
  filterResourceTypes?: string[];
  maxRecords?: number;
  recordingDuration?: number;
}): Promise<{ content: ExtractionResult }> {
  return withVideoExtractionWorkflowValidation('network_video_extraction', async () => {
    return withErrorHandling(async () => {
      const startTime = Date.now();
      const errors: any[] = [];
      const warnings: string[] = [];
      
      try {
        // Start network recording
        await networkRecorder.startRecording({
          interceptRequests: args.interceptRequests || false,
          captureResponses: args.captureResponses || true,
          filterResourceTypes: args.filterResourceTypes,
          maxRecords: args.maxRecords || 1000
        });
        
        // Record for specified duration or default 10 seconds
        const duration = args.recordingDuration || 10000;
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Stop recording and get video sources
        const requests = await networkRecorder.stopRecording();
        const videoSources = await networkRecorder.getVideoRequests();
        
        // Get API endpoints that might contain video data
        const apiEndpoints = await networkRecorder.getAPIEndpoints();
        if (apiEndpoints.length > 0) {
          warnings.push(`Found ${apiEndpoints.length} API endpoints that might contain video data`);
        }
        
        // Extract tokens for authentication
        const tokens = await networkRecorder.extractTokensFromRequests();
        if (tokens.authTokens.length > 0) {
          warnings.push(`Found ${tokens.authTokens.length} authentication tokens`);
        }
        
        // Get current page info for metadata
        const page = getPage();
        const pageUrl = page ? await page.url() : 'unknown';
        const pageTitle = page ? await page.title() : undefined;
        
        const result: ExtractionResult = {
          sources: videoSources,
          metadata: {
            title: pageTitle,
            extractionTime: Date.now() - startTime,
            strategiesUsed: [ExtractionStrategy.NETWORK_RECORDING],
            hostersFound: [...new Set(videoSources.map(s => s.hoster).filter(Boolean))] as string[]
          },
          errors,
          warnings
        };
        
        return {
          content: result
        };
        
      } catch (error) {
        throw new Error(`Network video extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 'handleNetworkVideoExtraction');
  });
}

// Video Selectors Generator
export async function handleVideoSelectorGeneration(args: {}): Promise<{ content: Record<string, string[]> }> {
  return withVideoExtractionWorkflowValidation('video_selector_generation', async () => {
    return withErrorHandling(async () => {
      try {
        await videoSelectors.initialize();
        const selectors = await videoSelectors.generateVideoSelectors();
        
        return {
          content: selectors
        };
        
      } catch (error) {
        throw new Error(`Video selector generation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 'handleVideoSelectorGeneration');
  });
}

// Comprehensive Video Extraction (combines all strategies)
export async function handleComprehensiveVideoExtraction(args: {
  enableDOMAnalysis?: boolean;
  enableNetworkRecording?: boolean;
  recordingDuration?: number;
  maxSources?: number;
  filterFormats?: VideoFormat[];
}): Promise<{ content: ExtractionResult }> {
  return withVideoExtractionWorkflowValidation('comprehensive_video_extraction', async () => {
    return withErrorHandling(async () => {
      const startTime = Date.now();
      const allSources: VideoSource[] = [];
      const errors: any[] = [];
      const warnings: string[] = [];
      const strategiesUsed: ExtractionStrategy[] = [];
      
      try {
        // DOM Analysis
        if (args.enableDOMAnalysis !== false) {
          try {
            const domResult = await handleHtmlElementsExtraction({
              extractVideoTags: true,
              extractIframes: true,
              extractEmbeds: true,
              extractMetaTags: true,
              extractDataAttributes: true
            });
            
            allSources.push(...domResult.content.sources);
            errors.push(...domResult.content.errors);
            warnings.push(...domResult.content.warnings);
            strategiesUsed.push(ExtractionStrategy.DOM_ANALYSIS);
            
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.DOM_ANALYSIS,
              message: 'DOM analysis failed',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Network Recording
        if (args.enableNetworkRecording !== false) {
          try {
            const networkResult = await handleNetworkVideoExtraction({
              interceptRequests: false,
              captureResponses: true,
              recordingDuration: args.recordingDuration || 10000
            });
            
            allSources.push(...networkResult.content.sources);
            errors.push(...networkResult.content.errors);
            warnings.push(...networkResult.content.warnings);
            strategiesUsed.push(ExtractionStrategy.NETWORK_RECORDING);
            
          } catch (error) {
            errors.push({
              strategy: ExtractionStrategy.NETWORK_RECORDING,
              message: 'Network recording failed',
              details: error,
              isFatal: false
            });
          }
        }
        
        // Filter by formats if specified
        let filteredSources = allSources;
        if (args.filterFormats && args.filterFormats.length > 0) {
          filteredSources = allSources.filter(source => 
            args.filterFormats!.includes(source.format)
          );
          
          if (filteredSources.length < allSources.length) {
            warnings.push(`Filtered ${allSources.length - filteredSources.length} sources by format`);
          }
        }
        
        // Deduplicate and limit sources
        let uniqueSources = deduplicateSources(filteredSources);
        
        if (args.maxSources && uniqueSources.length > args.maxSources) {
          // Sort by confidence and keep top sources
          uniqueSources = uniqueSources
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, args.maxSources);
          warnings.push(`Limited results to top ${args.maxSources} sources by confidence`);
        }
        
        // Get current page info for metadata
        const page = getPage();
        const pageUrl = page ? await page.url() : 'unknown';
        const pageTitle = page ? await page.title() : undefined;
        
        const result: ExtractionResult = {
          sources: uniqueSources,
          metadata: {
            title: pageTitle,
            extractionTime: Date.now() - startTime,
            strategiesUsed,
            hostersFound: [...new Set(uniqueSources.map(s => s.hoster).filter(Boolean))] as string[]
          },
          errors,
          warnings
        };
        
        return {
          content: result
        };
        
      } catch (error) {
        throw new Error(`Comprehensive video extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 'handleComprehensiveVideoExtraction');
  });
}

// URL Redirect Tracer
export async function handleURLRedirectTrace(args: {
  targetUrl?: string;
  recordingDuration?: number;
}): Promise<{ content: { redirectChains: Record<string, string[]>; finalUrls: Record<string, string> } }> {
  return withVideoExtractionWorkflowValidation('url_redirect_trace', async () => {
    return withErrorHandling(async () => {
      try {
        // Start recording to capture redirects
        await networkRecorder.startRecording({
          interceptRequests: false,
          captureResponses: true
        });
        
        // Record for specified duration
        const duration = args.recordingDuration || 5000;
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Stop recording
        await networkRecorder.stopRecording();
        
        // Get redirect information
        const finalUrls = await requestChainTracer.getFinalUrls();
        
        let redirectChains: Record<string, string[]> = {};
        
        if (args.targetUrl) {
          const chainForTarget = await requestChainTracer.traceRedirects(args.targetUrl);
          redirectChains[args.targetUrl] = chainForTarget;
        } else {
          // Get redirect chains for all URLs
          for (const [originalUrl] of Object.entries(finalUrls)) {
            const chain = await requestChainTracer.traceRedirects(originalUrl);
            if (chain.length > 1) {
              redirectChains[originalUrl] = chain;
            }
          }
        }
        
        return {
          content: {
            redirectChains,
            finalUrls
          }
        };
        
      } catch (error) {
        throw new Error(`URL redirect trace failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }, 'handleURLRedirectTrace');
  });
}

// Helper function to deduplicate video sources
function deduplicateSources(sources: VideoSource[]): VideoSource[] {
  const seen = new Set<string>();
  const unique: VideoSource[] = [];
  
  for (const source of sources) {
    // Create a key based on URL and format
    const key = `${source.url}|${source.format}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(source);
    }
  }
  
  return unique;
}

// Export all handlers
export {
  withVideoExtractionWorkflowValidation
};