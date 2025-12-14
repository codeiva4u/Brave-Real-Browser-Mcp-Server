// Optimization Utilities for All MCP Tools
// @ts-nocheck

import { sleep } from './system-utils.js';

/**
 * Tool Optimization Configuration
 * Centralized defaults for all 113 tools
 */
export const TOOL_OPTIMIZATION_CONFIG = {
  // Network Monitoring Tools (9 tools)
  networkMonitoring: {
    defaultDuration: 10000,
    maxDuration: 30000,
    monitoringTimeout: 15000,
    retryAttempts: 3,
    retryDelay: 2000,
  },

  // Video Extraction Tools (30+ tools)
  videoExtraction: {
    iframeDepthLimit: 5,
    defaultTimeout: 12000,
    hosterPatterns: [
      'vidcloud',
      'vidsrc',
      'filemoon',
      'streamtape',
      'doodstream',
      'mixdrop',
      'upstream',
      'streamwish',
      'vidmoly',
      'vidlox',
      'mystream',
      'cloudemb',
      'embedsrc',
      'upns.online',
      'voe.sx',
      'streamlare',
      'dailymotion',
      'youtube',
      'vimeo',
      'twitch',
    ],
    videoSelectors: [
      'video',
      'iframe[src*="player"]',
      'iframe[src*="embed"]',
      'div[class*="player"]',
      'div[id*="player"]',
      '[data-video-url]',
      '[data-src*=".mp4"]',
      '[data-src*=".m3u8"]',
      '[data-src*=".mkv"]',
      '[data-src*=".webm"]',
    ],
    downloadButtonSelectors: [
      'a[download]',
      'button[download]',
      'a[href*="download"]',
      'button[data-download]',
      'a[href*=".mp4"]',
      'a[href*=".mkv"]',
      'a[href*=".webm"]',
      'a[class*="download"]',
      '.download-btn',
      '.btn-download',
      '[class*="download"]',
      '[id*="download"]',
    ],
  },

  // Data Extraction Tools (40+ tools)
  dataExtraction: {
    deepScanEnabled: true,
    recursiveSearchDepth: 5,
    deduplicationEnabled: true,
    cachingEnabled: true,
    cacheTTL: 300000, // 5 minutes
    defaultTimeout: 10000,
  },

  // Redirect Tracing
  redirectTracing: {
    maxRedirects: 15,
    redirectTimeout: 30000,
    followIframes: true,
    maxDepth: 5,
  },

  // Global Settings
  global: {
    defaultTimeout: 10000,
    retryAttempts: 3,
    retryDelay: 2000,
    enableErrorLogging: true,
    enableCaching: true,
    enableDeduplication: true,
  },
};

/**
 * Result Deduplication - Remove duplicate entries
 */
export function deduplicateResults(
  results: any[],
  uniqueKey: string = 'url'
): any[] {
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = item[uniqueKey] || JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Deep Deduplication - For complex objects
 */
export function deepDeduplicateResults(results: any[]): any[] {
  const seen = new Set<string>();
  return results.filter((item) => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Result Caching with TTL
 */
export class ResultCache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();

  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Global cache instance for all tools
 */
export const globalCache = new ResultCache();

/**
 * Retry with Exponential Backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Enhanced Error Handler for Tools
 */
export function createErrorHandler(toolName: string) {
  return {
    handle(error: any, context: string = ''): any {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${toolName}] Error in ${context}: ${message}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ ${toolName} Error: ${message}`,
          },
        ],
        isError: true,
        toolName,
        context,
      };
    },
  };
}

/**
 * Tool Execution Wrapper with Timeout and Retry
 */
export async function executeToolWithOptimizations<T>(
  toolName: string,
  toolFn: () => Promise<T>,
  options: {
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    cacheKey?: string;
    shouldCache?: boolean;
  } = {}
): Promise<T> {
  const {
    timeout = TOOL_OPTIMIZATION_CONFIG.global.defaultTimeout,
    retryAttempts = TOOL_OPTIMIZATION_CONFIG.global.retryAttempts,
    retryDelay = TOOL_OPTIMIZATION_CONFIG.global.retryDelay,
    cacheKey,
    shouldCache = TOOL_OPTIMIZATION_CONFIG.global.enableCaching,
  } = options;

  // Check cache first
  if (cacheKey && shouldCache) {
    const cached = globalCache.get(cacheKey);
    if (cached) {
      console.log(`[${toolName}] Cache hit for key: ${cacheKey}`);
      return cached;
    }
  }

  try {
    // Execute with timeout
    const result = await Promise.race([
      toolFn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${toolName} timeout after ${timeout}ms`)), timeout)
      ),
    ]);

    // Cache result if enabled
    if (cacheKey && shouldCache) {
      globalCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    // Retry on failure for network tools
    if (retryAttempts > 0) {
      console.log(
        `[${toolName}] Retrying after error: ${error instanceof Error ? error.message : String(error)}`
      );
      return retryWithBackoff(toolFn, retryAttempts, retryDelay);
    }

    throw error;
  }
}

/**
 * Resource Cleanup for Tools
 */
export async function cleanupToolResources(page: any, context: any): Promise<void> {
  try {
    // Remove all event listeners
    if (page) {
      await page.removeAllListeners?.();
    }

    // Close unnecessary tabs
    if (context) {
      const pages = await context.pages?.();
      if (pages && pages.length > 1) {
        for (const p of pages.slice(1)) {
          await p.close?.();
        }
      }
    }

    // Clear cache periodically
    const cacheStats = globalCache.getStats();
    if (cacheStats.size > 100) {
      console.log('[Cleanup] Clearing cache - size exceeded 100 items');
      globalCache.clear();
    }
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
  }
}

/**
 * Video Hoster Detection Database
 */
export const VIDEO_HOSTERS_DB = {
  primary: [
    { name: 'vidcloud', patterns: ['vidcloud', 'vidnode'], embedPattern: '/embed/' },
    { name: 'vidsrc', patterns: ['vidsrc.to', 'vidsrc.me', 'vidsrc.xyz'] },
    { name: 'filemoon', patterns: ['filemoon.sx', 'filemoon.to'] },
    { name: 'streamtape', patterns: ['streamtape.com', 'streamtape.to'] },
    { name: 'doodstream', patterns: ['dood.', 'doodstream.'] },
    { name: 'mixdrop', patterns: ['mixdrop.co', 'mixdrop.to'] },
    { name: 'upstream', patterns: ['upstream.to', 'upstreamcdn'] },
    { name: 'streamwish', patterns: ['streamwish.to', 'streamwish.com'] },
  ],

  methods: {
    iframe: { depth: 5, timeout: 12000 },
    directLink: { patterns: ['.m3u8', '.mp4', '.mkv', '/stream/', '.webm'] },
    apiEndpoint: { patterns: ['/api/source', '/api/video', '/get-source', '/embed'] },
  },

  isKnownHoster(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    for (const hoster of this.primary) {
      if (hoster.patterns.some((p) => lowerUrl.includes(p))) {
        return true;
      }
    }
    return false;
  },

  getHosterName(url: string): string | null {
    const lowerUrl = url.toLowerCase();
    for (const hoster of this.primary) {
      if (hoster.patterns.some((p) => lowerUrl.includes(p))) {
        return hoster.name;
      }
    }
    return null;
  },
};

/**
 * Common Selector Utilities
 */
export const SELECTOR_UTILS = {
  // Link selectors
  linkSelectors: [
    'a[href]',
    'a[href^="http"]',
    'a[href^="/"]',
    '[data-href]',
    'button[onclick*="http"]',
  ],

  // Image selectors
  imageSelectors: [
    'img',
    'img[src]',
    'picture img',
    '[style*="background-image"]',
    'div[data-src*="image"]',
    'div[data-background*="image"]',
  ],

  // Video selectors: Already defined above
  videoSelectors: TOOL_OPTIMIZATION_CONFIG.videoExtraction.videoSelectors,

  // Download button selectors: Already defined above
  downloadSelectors: TOOL_OPTIMIZATION_CONFIG.videoExtraction.downloadButtonSelectors,

  // Form selectors
  formSelectors: ['form', 'input', 'textarea', 'select', 'button[type="submit"]'],

  // Table selectors
  tableSelectors: ['table', 'tbody tr', 'thead tr', '.table-row', '[role="table"]'],

  // Pagination selectors
  paginationSelectors: [
    'a[rel="next"]',
    'button[aria-label*="next"]',
    '.pagination a',
    '.next',
    'a[href*="page"]',
    'a[href*="offset"]',
  ],

  // Hidden element detection
  hiddenSelectors: [
    '[style*="display: none"]',
    '[style*="visibility: hidden"]',
    '[hidden]',
    '.hidden',
    '.d-none',
  ],

  // All selectors
  getAllSelectors() {
    return {
      links: this.linkSelectors,
      images: this.imageSelectors,
      videos: this.videoSelectors,
      downloads: this.downloadSelectors,
      forms: this.formSelectors,
      tables: this.tableSelectors,
      pagination: this.paginationSelectors,
      hidden: this.hiddenSelectors,
    };
  },
};

/**
 * Performance Metrics Collection
 */
export class PerformanceMetrics {
  private metrics = new Map<string, { start: number; end?: number; duration?: number }>();

  start(toolName: string): void {
    this.metrics.set(toolName, { start: Date.now() });
  }

  end(toolName: string): number {
    const metric = this.metrics.get(toolName);
    if (metric) {
      metric.end = Date.now();
      metric.duration = metric.end - metric.start;
      return metric.duration;
    }
    return 0;
  }

  getMetrics(toolName: string): any | null {
    return this.metrics.get(toolName) || null;
  }

  getAllMetrics(): Map<string, any> {
    return this.metrics;
  }

  getAverageDuration(): number {
    let totalDuration = 0;
    let count = 0;

    for (const metric of this.metrics.values()) {
      if (metric.duration) {
        totalDuration += metric.duration;
        count++;
      }
    }

    return count > 0 ? totalDuration / count : 0;
  }

  reset(): void {
    this.metrics.clear();
  }
}

/**
 * Global metrics instance
 */
export const globalMetrics = new PerformanceMetrics();

/**
 * Tool Status Tracker
 */
export interface ToolStatus {
  name: string;
  category: string;
  status: 'optimized' | 'pending' | 'failed';
  optimizations: string[];
  performanceGain?: number;
  lastExecutionTime?: number;
}

export class ToolStatusTracker {
  private tools = new Map<string, ToolStatus>();

  register(
    toolName: string,
    category: string,
    optimizations: string[] = []
  ): void {
    this.tools.set(toolName, {
      name: toolName,
      category,
      status: 'pending',
      optimizations,
    });
  }

  updateStatus(
    toolName: string,
    status: 'optimized' | 'pending' | 'failed',
    performanceGain?: number
  ): void {
    const tool = this.tools.get(toolName);
    if (tool) {
      tool.status = status;
      if (performanceGain !== undefined) {
        tool.performanceGain = performanceGain;
      }
    }
  }

  recordExecution(toolName: string, duration: number): void {
    const tool = this.tools.get(toolName);
    if (tool) {
      tool.lastExecutionTime = duration;
    }
  }

  getStatus(toolName: string): ToolStatus | null {
    return this.tools.get(toolName) || null;
  }

  getAllStatus(): ToolStatus[] {
    return Array.from(this.tools.values());
  }

  getSummary(): {
    total: number;
    optimized: number;
    pending: number;
    failed: number;
    byCategory: Map<string, number>;
  } {
    let optimized = 0;
    let pending = 0;
    let failed = 0;
    const byCategory = new Map<string, number>();

    for (const tool of this.tools.values()) {
      if (tool.status === 'optimized') optimized++;
      else if (tool.status === 'pending') pending++;
      else if (tool.status === 'failed') failed++;

      const count = byCategory.get(tool.category) || 0;
      byCategory.set(tool.category, count + 1);
    }

    return {
      total: this.tools.size,
      optimized,
      pending,
      failed,
      byCategory,
    };
  }
}

/**
 * Global tool status tracker
 */
export const globalToolStatus = new ToolStatusTracker();

export default {
  TOOL_OPTIMIZATION_CONFIG,
  deduplicateResults,
  deepDeduplicateResults,
  ResultCache,
  globalCache,
  retryWithBackoff,
  createErrorHandler,
  executeToolWithOptimizations,
  cleanupToolResources,
  VIDEO_HOSTERS_DB,
  SELECTOR_UTILS,
  PerformanceMetrics,
  globalMetrics,
  ToolStatusTracker,
  globalToolStatus,
};
