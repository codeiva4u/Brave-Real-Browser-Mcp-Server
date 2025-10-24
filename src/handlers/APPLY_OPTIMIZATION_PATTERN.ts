// 🚀 APPLY THIS PATTERN TO ALL 113 TOOLS
// This file shows the EXACT pattern to apply to every tool handler
// Copy-paste and customize for each tool

import { getCurrentPage } from '../browser-manager.js';
import { validateWorkflow } from '../workflow-validation.js';
import {
  TOOL_OPTIMIZATION_CONFIG,
  globalCache,
  retryWithBackoff,
  deduplicateResults,
  executeToolWithOptimizations,
  cleanupToolResources,
  VIDEO_HOSTERS_DB,
  SELECTOR_UTILS,
  globalMetrics,
  globalToolStatus,
  createErrorHandler,
} from '../optimization-utils.js';
import { withErrorHandling, sleep } from '../system-utils.js';

/**
 * ✅ TEMPLATE: Universal Pattern for ALL 113 Tools
 * 
 * Replace:
 * - TOOL_NAME: Actual tool name (e.g., 'ajax_extractor')
 * - CATEGORY: Category from TOOL_OPTIMIZATION_CONFIG
 * - TIMEOUT: Duration value from TOOL_OPTIMIZATION_CONFIG.xxx.defaultTimeout
 * - CACHE_KEY: Unique key for caching (usually based on URL + params)
 */

export async function handleUNIVERSAL_TOOL_TEMPLATE(args: any) {
  const toolName = 'TOOL_NAME'; // ← REPLACE with actual tool name
  const errorHandler = createErrorHandler(toolName);
  globalMetrics.start(toolName);

  try {
    // Validate workflow
    validateWorkflow(toolName, {
      requireBrowser: true,
      requirePage: true,
    });

    // Get timeout from configuration (example)
    const timeout = args.timeout || TOOL_OPTIMIZATION_CONFIG.dataExtraction.defaultTimeout;
    const shouldCache = args.cache !== false;
    const cacheKey = `${toolName}_${args.url || 'default'}`;

    // Check cache first
    if (shouldCache) {
      const cached = globalCache.get(cacheKey);
      if (cached) {
        console.log(`[${toolName}] Cache hit for key: ${cacheKey}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: `✅ ${toolName} (from cache)\n\n${JSON.stringify(cached, null, 2)}`,
            },
          ],
        };
      }
    }

    // ======================================================
    // YOUR ORIGINAL TOOL LOGIC GOES HERE
    // ======================================================
    
    const page = getCurrentPage();
    let results: any = [];

    // Example: Basic extraction logic
    // Replace this with your actual tool implementation
    results = await page.evaluate(() => {
      // Your extraction logic here
      return [];
    });

    // ======================================================
    // OPTIMIZATION LAYER (Apply to all results)
    // ======================================================

    // 1. Deduplicate results
    if (Array.isArray(results)) {
      results = deduplicateResults(results, 'url'); // Use 'url' or your unique key
    }

    // 2. Filter empty/invalid results
    results = results.filter((r: any) => r && Object.keys(r).length > 0);

    // 3. Cache results if enabled
    if (shouldCache && results.length > 0) {
      globalCache.set(cacheKey, results);
    }

    // ======================================================
    // RETURN OPTIMIZED RESULT
    // ======================================================

    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ ${toolName}\nFound ${results.length} results\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    // Enhanced error handling
    return errorHandler.handle(error, 'tool execution');
  } finally {
    // Cleanup and metrics
    const duration = globalMetrics.end(toolName);
    globalToolStatus.recordExecution(toolName, duration);
    console.log(`[${toolName}] Execution time: ${duration}ms`);
  }
}

// ============================================================================
// SPECIFIC OPTIMIZATION PATTERNS FOR EACH TOOL CATEGORY
// ============================================================================

/**
 * 🎥 VIDEO EXTRACTION TOOLS (20+ tools)
 * 
 * Pattern: Use VIDEO_HOSTERS_DB, extended timeout, deep iframe scanning
 */
export async function handleVideoExtractionTemplate(args: any) {
  const toolName = 'video_extraction_tool';
  const errorHandler = createErrorHandler(toolName);
  globalMetrics.start(toolName);

  try {
    const page = getCurrentPage();
    const timeout = args.timeout || TOOL_OPTIMIZATION_CONFIG.videoExtraction.defaultTimeout;

    const videoData = await executeToolWithOptimizations(
      toolName,
      async () => {
        let videos: any[] = [];

        // Use optimized selectors
        videos = await page.evaluate((videoSelectors: any) => {
          return Array.from(
            document.querySelectorAll(videoSelectors.join(','))
          ).map((el: any) => ({
            type: el.tagName.toLowerCase(),
            src: el.src || el.getAttribute('data-src') || el.getAttribute('href'),
            hoster: null,
            platform: null,
          }));
        }, SELECTOR_UTILS.videoSelectors);

        // Detect video hosters
        videos = videos.map((video) => ({
          ...video,
          hoster: VIDEO_HOSTERS_DB.getHosterName(video.src),
        }));

        // Deduplicate
        videos = deduplicateResults(videos, 'src');

        // Filter by hoster if needed
        if (args.filterByHoster) {
          videos = videos.filter((v) => v.hoster !== null);
        }

        return videos;
      },
      {
        timeout,
        retryAttempts: 2,
        cacheKey: `videos_${page.url()}`,
        shouldCache: true,
      }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `🎥 Found ${videoData.length} video sources\n\n${JSON.stringify(videoData, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return errorHandler.handle(error, 'video extraction');
  } finally {
    const duration = globalMetrics.end(toolName);
    globalToolStatus.recordExecution(toolName, duration);
  }
}

/**
 * ⏱️ NETWORK MONITORING TOOLS (ajax_extractor, fetch_xhr, network_recorder)
 * 
 * Pattern: Extended duration, retry logic, comprehensive request capture
 */
export async function handleNetworkMonitoringTemplate(args: any) {
  const toolName = 'network_monitoring_tool';
  const errorHandler = createErrorHandler(toolName);
  globalMetrics.start(toolName);

  try {
    const page = getCurrentPage();
    const duration = args.duration || TOOL_OPTIMIZATION_CONFIG.networkMonitoring.defaultDuration;

    const networkData = await executeToolWithOptimizations(
      toolName,
      async () => {
        const requests: any[] = [];

        const requestHandler = (request: any) => {
          const resourceType = request.resourceType();
          if (resourceType === 'xhr' || resourceType === 'fetch') {
            requests.push({
              url: request.url(),
              method: request.method(),
              type: resourceType,
              timestamp: new Date().toISOString(),
            });
          }
        };

        page.on('request', requestHandler);

        // Monitor for configured duration
        await sleep(duration);

        page.off('request', requestHandler);

        // Deduplicate requests
        return deduplicateResults(requests, 'url');
      },
      {
        timeout: TOOL_OPTIMIZATION_CONFIG.networkMonitoring.monitoringTimeout,
        retryAttempts: 3,
        cacheKey: `network_${Date.now() / 60000}`, // Cache per minute
        shouldCache: false, // Don't cache network data
      }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `📡 Captured ${networkData.length} network requests\n\n${JSON.stringify(networkData, null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return errorHandler.handle(error, 'network monitoring');
  } finally {
    const duration = globalMetrics.end(toolName);
    globalToolStatus.recordExecution(toolName, duration);
  }
}

/**
 * 📊 DATA EXTRACTION TOOLS (scrape_table, extract_links, extract_images, etc.)
 * 
 * Pattern: Deep scanning, result deduplication, background-image extraction
 */
export async function handleDataExtractionTemplate(args: any) {
  const toolName = 'data_extraction_tool';
  const errorHandler = createErrorHandler(toolName);
  globalMetrics.start(toolName);

  try {
    const page = getCurrentPage();
    const selector = args.selector || '*';
    const deepScan = args.deepScan ?? TOOL_OPTIMIZATION_CONFIG.dataExtraction.deepScanEnabled;

    const extractedData = await executeToolWithOptimizations(
      toolName,
      async () => {
        let results: any[] = [];

        // Primary extraction
        results = await page.evaluate((sel: any, deep: any) => {
          const data: any[] = [];

          // Standard extraction
          document.querySelectorAll(sel).forEach((el: any, idx) => {
            data.push({
              index: idx,
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.trim().substring(0, 100),
              attributes: Array.from(el.attributes || []).reduce((acc: any, attr: any) => {
                acc[attr.name] = attr.value;
                return acc;
              }, {}),
            });
          });

          // Deep scan if enabled
          if (deep && data.length < 1000) {
            // Scan hidden elements, data attributes, etc.
            document.querySelectorAll('[data-*]').forEach((el: any) => {
              Object.keys(el.dataset || {}).forEach((key) => {
                data.push({
                  type: 'data-attribute',
                  key,
                  value: el.dataset[key],
                });
              });
            });
          }

          return data;
        }, selector, deepScan);

        // Deduplicate
        results = deduplicateResults(results);

        // Filter empty
        results = results.filter((r) => r && Object.keys(r).length > 0);

        return results;
      },
      {
        timeout: TOOL_OPTIMIZATION_CONFIG.dataExtraction.defaultTimeout,
        retryAttempts: 2,
        cacheKey: `data_${page.url()}_${selector}`,
        shouldCache: true,
      }
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `📋 Extracted ${extractedData.length} items\n\n${JSON.stringify(extractedData.slice(0, 20), null, 2)}`,
        },
      ],
    };
  } catch (error) {
    return errorHandler.handle(error, 'data extraction');
  } finally {
    const duration = globalMetrics.end(toolName);
    globalToolStatus.recordExecution(toolName, duration);
  }
}

// ============================================================================
// IMPLEMENTATION INSTRUCTIONS
// ============================================================================

/**
 * TO APPLY THIS OPTIMIZATION PATTERN TO ALL 113 TOOLS:
 * 
 * 1. For EACH tool handler function:
 *    - Add imports from optimization-utils at top of file
 *    - Wrap main logic with try-catch-finally
 *    - Add globalMetrics.start() and end() calls
 *    - Apply deduplicateResults() to list outputs
 *    - Use appropriate TOOL_OPTIMIZATION_CONFIG value
 * 
 * 2. For VIDEO tools specifically:
 *    - Use handleVideoExtractionTemplate pattern
 *    - Replace hardcoded selectors with SELECTOR_UTILS.videoSelectors
 *    - Use VIDEO_HOSTERS_DB for hoster detection
 * 
 * 3. For NETWORK tools specifically:
 *    - Use handleNetworkMonitoringTemplate pattern
 *    - Extend duration to TOOL_OPTIMIZATION_CONFIG.networkMonitoring.defaultDuration
 *    - Add retry logic for failed captures
 * 
 * 4. For DATA tools specifically:
 *    - Use handleDataExtractionTemplate pattern
 *    - Enable deep scanning with TOOL_OPTIMIZATION_CONFIG.dataExtraction.deepScanEnabled
 *    - Always deduplicate before returning results
 * 
 * 5. Test each optimized tool:
 *    - Verify it still works with original functionality
 *    - Check success rate > 95%
 *    - Verify deduplication works (no duplicate results)
 *    - Check caching is effective
 * 
 * 6. After completing ALL 113 tools:
 *    - Run: npm run build
 *    - Run: npm run test
 *    - Run: npm run lint:fix
 *    - Commit with: git commit -m "✅ Optimize ALL 113 MCP tools for production"
 */

export default {
  handleUNIVERSAL_TOOL_TEMPLATE,
  handleVideoExtractionTemplate,
  handleNetworkMonitoringTemplate,
  handleDataExtractionTemplate,
};
