/**
 * Error Collector Module - Self-Healing System
 * 
 * Captures, categorizes, and stores all tool errors for analysis.
 * Provides error history and patterns for the self-healing system.
 * 
 * Features:
 * - Capture errors with full context (tool, params, stack trace)
 * - Categorize errors by type (selector, network, timeout, etc.)
 * - Store error history for pattern learning
 * - Provide error statistics and trends
 */

const fs = require('fs');
const path = require('path');

/**
 * Error categories for classification
 */
const ERROR_CATEGORIES = {
  SELECTOR_NOT_FOUND: 'selector_not_found',
  SELECTOR_INVALID: 'selector_invalid',
  ELEMENT_NOT_CLICKABLE: 'element_not_clickable',
  ELEMENT_NOT_VISIBLE: 'element_not_visible',
  TIMEOUT: 'timeout',
  NAVIGATION_FAILED: 'navigation_failed',
  NETWORK_ERROR: 'network_error',
  BROWSER_NOT_INITIALIZED: 'browser_not_initialized',
  CAPTCHA_FAILED: 'captcha_failed',
  JAVASCRIPT_ERROR: 'javascript_error',
  PERMISSION_DENIED: 'permission_denied',
  FILE_NOT_FOUND: 'file_not_found',
  UNKNOWN: 'unknown'
};

/**
 * Error patterns for automatic categorization
 */
const ERROR_PATTERNS = [
  { pattern: /not found|no element|cannot find/i, category: ERROR_CATEGORIES.SELECTOR_NOT_FOUND },
  { pattern: /invalid selector|syntax error in selector/i, category: ERROR_CATEGORIES.SELECTOR_INVALID },
  { pattern: /not clickable|click intercepted|not an element/i, category: ERROR_CATEGORIES.ELEMENT_NOT_CLICKABLE },
  { pattern: /not visible|hidden|display.*none/i, category: ERROR_CATEGORIES.ELEMENT_NOT_VISIBLE },
  { pattern: /timeout|timed out|exceeded/i, category: ERROR_CATEGORIES.TIMEOUT },
  { pattern: /navigation|goto|navigate/i, category: ERROR_CATEGORIES.NAVIGATION_FAILED },
  { pattern: /network|fetch|request failed|ERR_/i, category: ERROR_CATEGORIES.NETWORK_ERROR },
  { pattern: /browser not initialized|call browser_init/i, category: ERROR_CATEGORIES.BROWSER_NOT_INITIALIZED },
  { pattern: /captcha|turnstile|recaptcha/i, category: ERROR_CATEGORIES.CAPTCHA_FAILED },
  { pattern: /javascript|evaluate|execution context/i, category: ERROR_CATEGORIES.JAVASCRIPT_ERROR },
  { pattern: /permission|access denied|forbidden/i, category: ERROR_CATEGORIES.PERMISSION_DENIED },
  { pattern: /ENOENT|file not found|no such file/i, category: ERROR_CATEGORIES.FILE_NOT_FOUND }
];

/**
 * ErrorCollector Class - Captures and manages all tool errors
 */
class ErrorCollector {
  constructor(options = {}) {
    this.options = {
      maxErrors: options.maxErrors || 1000,
      persistPath: options.persistPath || path.join(__dirname, '../../data/errors.json'),
      autoPersist: options.autoPersist !== false,
      ...options
    };
    
    // Error storage
    this.errors = [];
    this.errorsByTool = new Map();
    this.errorsByCategory = new Map();
    
    // Statistics
    this.stats = {
      totalErrors: 0,
      totalCaptured: 0,
      errorsByHour: {},
      fixesApplied: 0,
      fixesSuccessful: 0
    };
    
    // Load persisted errors if exists
    this._loadPersistedErrors();
  }

  /**
   * Capture an error with full context
   * 
   * @param {string} toolName - Name of the tool that failed
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context (params, page state, etc.)
   * @returns {Object} Captured error record
   */
  capture(toolName, error, context = {}) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    // Categorize the error
    const category = this._categorizeError(errorMessage);
    
    // Extract code location from stack trace
    const codeLocation = this._extractCodeLocation(errorStack);
    
    // Create error record
    const errorRecord = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      toolName,
      category,
      message: errorMessage,
      stack: errorStack,
      codeLocation,
      context: {
        params: this._sanitizeParams(context.params || {}),
        url: context.url || null,
        selector: context.selector || context.params?.selector || null,
        pageTitle: context.pageTitle || null,
        userAgent: context.userAgent || null
      },
      analysis: null,     // Will be filled by HindiSuggester
      suggestion: null,   // Will be filled by HindiSuggester
      fix: null,          // Will be filled by AutoFixer
      resolved: false
    };
    
    // Store error
    this._storeError(errorRecord);
    
    // Update statistics
    this._updateStats(errorRecord);
    
    // Auto-persist if enabled
    if (this.options.autoPersist) {
      this._persistErrors();
    }
    
    console.error(`📥 [ErrorCollector] Captured: ${toolName} - ${category} - ${errorMessage.substring(0, 100)}`);
    
    return errorRecord;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Get errors by tool name
   */
  getErrorsByTool(toolName) {
    return this.errorsByTool.get(toolName) || [];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category) {
    return this.errorsByCategory.get(category) || [];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors() {
    return this.errors.filter(e => !e.resolved);
  }

  /**
   * Get error by ID
   */
  getErrorById(id) {
    return this.errors.find(e => e.id === id);
  }

  /**
   * Mark error as resolved
   */
  markResolved(id, fixInfo = {}) {
    const error = this.getErrorById(id);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date().toISOString();
      error.fix = fixInfo;
      
      this.stats.fixesApplied++;
      if (fixInfo.success) {
        this.stats.fixesSuccessful++;
      }
      
      if (this.options.autoPersist) {
        this._persistErrors();
      }
      
      return true;
    }
    return false;
  }

  /**
   * Update error with analysis
   */
  updateAnalysis(id, analysis) {
    const error = this.getErrorById(id);
    if (error) {
      error.analysis = analysis;
      if (this.options.autoPersist) {
        this._persistErrors();
      }
      return true;
    }
    return false;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      errorsByTool: Object.fromEntries(
        Array.from(this.errorsByTool.entries()).map(([k, v]) => [k, v.length])
      ),
      errorsByCategory: Object.fromEntries(
        Array.from(this.errorsByCategory.entries()).map(([k, v]) => [k, v.length])
      ),
      unresolvedCount: this.getUnresolvedErrors().length,
      resolutionRate: this.stats.fixesApplied > 0 
        ? ((this.stats.fixesSuccessful / this.stats.fixesApplied) * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Find similar errors for pattern learning
   */
  findSimilarErrors(errorRecord, threshold = 0.7) {
    const similar = [];
    
    for (const stored of this.errors) {
      if (stored.id === errorRecord.id) continue;
      
      const similarity = this._calculateSimilarity(errorRecord, stored);
      if (similarity >= threshold) {
        similar.push({
          error: stored,
          similarity,
          wasResolved: stored.resolved,
          fix: stored.fix
        });
      }
    }
    
    // Sort by similarity (highest first)
    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = [];
    this.errorsByTool.clear();
    this.errorsByCategory.clear();
    this.stats = {
      totalErrors: 0,
      totalCaptured: 0,
      errorsByHour: {},
      fixesApplied: 0,
      fixesSuccessful: 0
    };
    
    if (this.options.autoPersist) {
      this._persistErrors();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Categorize error based on message patterns
   */
  _categorizeError(message) {
    for (const { pattern, category } of ERROR_PATTERNS) {
      if (pattern.test(message)) {
        return category;
      }
    }
    return ERROR_CATEGORIES.UNKNOWN;
  }

  /**
   * Extract code location from stack trace
   */
  _extractCodeLocation(stack) {
    if (!stack) return null;
    
    const lines = stack.split('\n');
    
    // Find first line that's in our source code (not node_modules)
    for (const line of lines) {
      const match = line.match(/at\s+.*?\s+\((.+):(\d+):(\d+)\)/);
      if (match && !match[1].includes('node_modules')) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          raw: line.trim()
        };
      }
      
      // Alternative format: at /path/file.js:line:column
      const altMatch = line.match(/at\s+(.+):(\d+):(\d+)/);
      if (altMatch && !altMatch[1].includes('node_modules')) {
        return {
          file: altMatch[1],
          line: parseInt(altMatch[2]),
          column: parseInt(altMatch[3]),
          raw: line.trim()
        };
      }
    }
    
    return null;
  }

  /**
   * Sanitize params (remove sensitive data)
   */
  _sanitizeParams(params) {
    const sanitized = { ...params };
    
    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    
    for (const field of sensitiveFields) {
      for (const key of Object.keys(sanitized)) {
        if (key.toLowerCase().includes(field)) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }
    
    return sanitized;
  }

  /**
   * Generate unique error ID
   */
  _generateId() {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Store error in collections
   */
  _storeError(errorRecord) {
    // Add to main list
    this.errors.push(errorRecord);
    
    // Limit size
    if (this.errors.length > this.options.maxErrors) {
      this.errors.shift();
    }
    
    // Add to tool-specific map
    if (!this.errorsByTool.has(errorRecord.toolName)) {
      this.errorsByTool.set(errorRecord.toolName, []);
    }
    this.errorsByTool.get(errorRecord.toolName).push(errorRecord);
    
    // Add to category-specific map
    if (!this.errorsByCategory.has(errorRecord.category)) {
      this.errorsByCategory.set(errorRecord.category, []);
    }
    this.errorsByCategory.get(errorRecord.category).push(errorRecord);
  }

  /**
   * Update statistics
   */
  _updateStats(errorRecord) {
    this.stats.totalErrors++;
    this.stats.totalCaptured++;
    
    // Track by hour
    const hour = new Date().toISOString().substring(0, 13);
    this.stats.errorsByHour[hour] = (this.stats.errorsByHour[hour] || 0) + 1;
  }

  /**
   * Calculate similarity between two errors
   */
  _calculateSimilarity(error1, error2) {
    let score = 0;
    let weights = 0;
    
    // Same tool (weight: 3)
    if (error1.toolName === error2.toolName) {
      score += 3;
    }
    weights += 3;
    
    // Same category (weight: 3)
    if (error1.category === error2.category) {
      score += 3;
    }
    weights += 3;
    
    // Same selector (weight: 2)
    if (error1.context.selector && error1.context.selector === error2.context.selector) {
      score += 2;
    }
    weights += 2;
    
    // Similar message (weight: 2)
    const msg1 = error1.message.toLowerCase();
    const msg2 = error2.message.toLowerCase();
    const words1 = msg1.split(/\s+/);
    const words2 = msg2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const messageSimilarity = commonWords / Math.max(words1.length, words2.length);
    score += messageSimilarity * 2;
    weights += 2;
    
    return score / weights;
  }

  /**
   * Persist errors to file
   */
  _persistErrors() {
    try {
      const dir = path.dirname(this.options.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = {
        errors: this.errors.slice(-500), // Keep last 500 errors
        stats: this.stats,
        savedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(this.options.persistPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('⚠️ [ErrorCollector] Failed to persist errors:', e.message);
    }
  }

  /**
   * Load persisted errors from file
   */
  _loadPersistedErrors() {
    try {
      if (fs.existsSync(this.options.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.options.persistPath, 'utf8'));
        
        if (data.errors && Array.isArray(data.errors)) {
          for (const error of data.errors) {
            this._storeError(error);
          }
        }
        
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
        
        console.error(`📂 [ErrorCollector] Loaded ${data.errors?.length || 0} persisted errors`);
      }
    } catch (e) {
      console.error('⚠️ [ErrorCollector] Failed to load persisted errors:', e.message);
    }
  }
}

// Singleton instance
const errorCollector = new ErrorCollector();

module.exports = {
  ErrorCollector,
  errorCollector,
  ERROR_CATEGORIES,
  ERROR_PATTERNS,
  // Quick access functions
  captureError: (tool, error, context) => errorCollector.capture(tool, error, context),
  getErrors: () => errorCollector.getErrors(),
  getRecentErrors: (count) => errorCollector.getRecentErrors(count),
  getStats: () => errorCollector.getStats()
};
