/**
 * Pattern Learner Module - Self-Healing System
 * 
 * Learns from error patterns and successful fixes to improve
 * future error resolution. Uses pattern matching and similarity
 * scoring to suggest fixes based on past experiences.
 * 
 * Features:
 * - Store error patterns with successful fixes
 * - Find similar past errors
 * - Calculate fix confidence based on history
 * - Improve suggestions over time
 */

const fs = require('fs');
const path = require('path');

/**
 * Pattern matching strategies
 */
const MATCH_STRATEGIES = {
  EXACT: 'exact',
  FUZZY: 'fuzzy',
  SEMANTIC: 'semantic',
  STRUCTURAL: 'structural'
};

/**
 * PatternLearner Class - Learns from error patterns
 */
class PatternLearner {
  constructor(options = {}) {
    this.options = {
      patternsPath: options.patternsPath || path.join(__dirname, '../../data/patterns.json'),
      minConfidence: options.minConfidence || 0.6,
      maxPatterns: options.maxPatterns || 500,
      autoPersist: options.autoPersist !== false,
      ...options
    };
    
    // Pattern storage
    this.patterns = [];
    
    // Pattern index for fast lookup
    this.patternIndex = {
      byTool: new Map(),
      byCategory: new Map(),
      bySelector: new Map()
    };
    
    // Statistics
    this.stats = {
      totalPatterns: 0,
      successfulMatches: 0,
      failedMatches: 0,
      learnedFixes: 0
    };
    
    // Load persisted patterns
    this._loadPatterns();
  }

  /**
   * Learn from a resolved error
   * 
   * @param {Object} errorRecord - Original error
   * @param {Object} fixInfo - Information about the successful fix
   * @returns {Object} Created pattern
   */
  learn(errorRecord, fixInfo) {
    // Extract pattern features
    const pattern = {
      id: this._generateId(),
      createdAt: new Date().toISOString(),
      
      // Error signature
      signature: {
        toolName: errorRecord.toolName,
        category: errorRecord.category,
        messagePattern: this._extractMessagePattern(errorRecord.message),
        selectorPattern: this._extractSelectorPattern(errorRecord.context?.selector),
        codeLocation: errorRecord.codeLocation
      },
      
      // Original error info
      originalError: {
        message: errorRecord.message,
        selector: errorRecord.context?.selector,
        url: errorRecord.context?.url
      },
      
      // Successful fix
      fix: {
        type: fixInfo.type || 'code_change',
        before: fixInfo.before,
        after: fixInfo.after,
        file: fixInfo.file,
        description: fixInfo.description
      },
      
      // Learning metrics
      metrics: {
        timesMatched: 0,
        timesSuccessful: 0,
        lastUsed: null,
        confidence: fixInfo.confidence || 0.8
      }
    };
    
    // Store pattern
    this._storePattern(pattern);
    
    // Persist
    if (this.options.autoPersist) {
      this._persistPatterns();
    }
    
    this.stats.learnedFixes++;
    
    console.error(`📚 [PatternLearner] Learned new pattern: ${pattern.signature.toolName} - ${pattern.signature.category}`);
    
    return pattern;
  }

  /**
   * Find similar patterns for an error
   * 
   * @param {Object} errorRecord - Error to match
   * @param {Object} options - Match options
   * @returns {Array} Matching patterns sorted by relevance
   */
  findSimilar(errorRecord, options = {}) {
    const {
      maxResults = 5,
      minConfidence = this.options.minConfidence,
      strategy = MATCH_STRATEGIES.FUZZY
    } = options;
    
    const matches = [];
    
    // Get candidate patterns
    const candidates = this._getCandidates(errorRecord);
    
    for (const pattern of candidates) {
      const similarity = this._calculateSimilarity(errorRecord, pattern, strategy);
      
      if (similarity >= minConfidence) {
        matches.push({
          pattern,
          similarity,
          confidence: similarity * pattern.metrics.confidence,
          successRate: pattern.metrics.timesSuccessful / Math.max(pattern.metrics.timesMatched, 1)
        });
      }
    }
    
    // Sort by combined score (similarity * success rate * base confidence)
    matches.sort((a, b) => {
      const scoreA = a.similarity * a.confidence * (a.successRate || 0.5);
      const scoreB = b.similarity * b.confidence * (b.successRate || 0.5);
      return scoreB - scoreA;
    });
    
    const results = matches.slice(0, maxResults);
    
    if (results.length > 0) {
      this.stats.successfulMatches++;
    } else {
      this.stats.failedMatches++;
    }
    
    return results;
  }

  /**
   * Get best fix suggestion based on patterns
   * 
   * @param {Object} errorRecord - Error to fix
   * @returns {Object|null} Best fix suggestion
   */
  getSuggestedFix(errorRecord) {
    const matches = this.findSimilar(errorRecord, { maxResults: 1 });
    
    if (matches.length === 0) {
      return null;
    }
    
    const best = matches[0];
    
    return {
      fix: best.pattern.fix,
      confidence: best.confidence,
      similarity: best.similarity,
      basedOn: {
        patternId: best.pattern.id,
        originalError: best.pattern.originalError,
        successRate: best.successRate
      }
    };
  }

  /**
   * Record pattern usage result
   * 
   * @param {string} patternId - Pattern ID
   * @param {boolean} successful - Whether fix was successful
   */
  recordUsage(patternId, successful) {
    const pattern = this.getPatternById(patternId);
    
    if (pattern) {
      pattern.metrics.timesMatched++;
      if (successful) {
        pattern.metrics.timesSuccessful++;
      }
      pattern.metrics.lastUsed = new Date().toISOString();
      
      // Adjust confidence based on success rate
      const successRate = pattern.metrics.timesSuccessful / pattern.metrics.timesMatched;
      pattern.metrics.confidence = 0.5 * pattern.metrics.confidence + 0.5 * successRate;
      
      if (this.options.autoPersist) {
        this._persistPatterns();
      }
    }
  }

  /**
   * Get all patterns
   */
  getPatterns() {
    return [...this.patterns];
  }

  /**
   * Get pattern by ID
   */
  getPatternById(id) {
    return this.patterns.find(p => p.id === id);
  }

  /**
   * Get patterns by tool
   */
  getPatternsByTool(toolName) {
    return this.patternIndex.byTool.get(toolName) || [];
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category) {
    return this.patternIndex.byCategory.get(category) || [];
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalPatterns: this.patterns.length,
      patternsByTool: Object.fromEntries(
        Array.from(this.patternIndex.byTool.entries()).map(([k, v]) => [k, v.length])
      ),
      patternsByCategory: Object.fromEntries(
        Array.from(this.patternIndex.byCategory.entries()).map(([k, v]) => [k, v.length])
      ),
      matchRate: this.stats.successfulMatches + this.stats.failedMatches > 0
        ? ((this.stats.successfulMatches / (this.stats.successfulMatches + this.stats.failedMatches)) * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Clear all patterns
   */
  clear() {
    this.patterns = [];
    this.patternIndex.byTool.clear();
    this.patternIndex.byCategory.clear();
    this.patternIndex.bySelector.clear();
    
    if (this.options.autoPersist) {
      this._persistPatterns();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Extract pattern from error message
   */
  _extractMessagePattern(message) {
    if (!message) return null;
    
    // Remove specific values, keep structure
    let pattern = message
      // Remove quoted strings
      .replace(/"[^"]*"/g, '"<STRING>"')
      .replace(/'[^']*'/g, "'<STRING>'")
      // Remove numbers
      .replace(/\b\d+\b/g, '<NUM>')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '<URL>')
      // Remove file paths
      .replace(/[\/\\][\w\/\\.-]+\.\w+/g, '<PATH>')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    return pattern;
  }

  /**
   * Extract pattern from selector
   */
  _extractSelectorPattern(selector) {
    if (!selector) return null;
    
    // Remove specific IDs and class names, keep structure
    let pattern = selector
      // Remove ID values but keep #
      .replace(/#[a-zA-Z][\w-]*/g, '#<ID>')
      // Remove class values but keep .
      .replace(/\.[a-zA-Z][\w-]*/g, '.<CLASS>')
      // Remove attribute values
      .replace(/\[[^\]]*="[^"]*"\]/g, '[<ATTR>="<VAL>"]')
      // Remove nth-child numbers
      .replace(/:nth-child\(\d+\)/g, ':nth-child(<N>)');
    
    return pattern;
  }

  /**
   * Store pattern in collections
   */
  _storePattern(pattern) {
    // Add to main list
    this.patterns.push(pattern);
    
    // Limit size
    if (this.patterns.length > this.options.maxPatterns) {
      // Remove oldest, least successful patterns
      this.patterns.sort((a, b) => {
        const scoreA = a.metrics.confidence * (a.metrics.timesMatched || 1);
        const scoreB = b.metrics.confidence * (b.metrics.timesMatched || 1);
        return scoreB - scoreA;
      });
      this.patterns = this.patterns.slice(0, this.options.maxPatterns);
      
      // Rebuild indices
      this._rebuildIndices();
    } else {
      // Just add to indices
      this._addToIndices(pattern);
    }
    
    this.stats.totalPatterns = this.patterns.length;
  }

  /**
   * Add pattern to indices
   */
  _addToIndices(pattern) {
    // By tool
    const toolName = pattern.signature.toolName;
    if (!this.patternIndex.byTool.has(toolName)) {
      this.patternIndex.byTool.set(toolName, []);
    }
    this.patternIndex.byTool.get(toolName).push(pattern);
    
    // By category
    const category = pattern.signature.category;
    if (!this.patternIndex.byCategory.has(category)) {
      this.patternIndex.byCategory.set(category, []);
    }
    this.patternIndex.byCategory.get(category).push(pattern);
    
    // By selector pattern
    const selectorPattern = pattern.signature.selectorPattern;
    if (selectorPattern) {
      if (!this.patternIndex.bySelector.has(selectorPattern)) {
        this.patternIndex.bySelector.set(selectorPattern, []);
      }
      this.patternIndex.bySelector.get(selectorPattern).push(pattern);
    }
  }

  /**
   * Rebuild all indices
   */
  _rebuildIndices() {
    this.patternIndex.byTool.clear();
    this.patternIndex.byCategory.clear();
    this.patternIndex.bySelector.clear();
    
    for (const pattern of this.patterns) {
      this._addToIndices(pattern);
    }
  }

  /**
   * Get candidate patterns for matching
   */
  _getCandidates(errorRecord) {
    const candidates = new Set();
    
    // Get by tool name
    const byTool = this.patternIndex.byTool.get(errorRecord.toolName) || [];
    byTool.forEach(p => candidates.add(p));
    
    // Get by category
    const byCategory = this.patternIndex.byCategory.get(errorRecord.category) || [];
    byCategory.forEach(p => candidates.add(p));
    
    // Get by selector pattern
    const selectorPattern = this._extractSelectorPattern(errorRecord.context?.selector);
    if (selectorPattern) {
      const bySelector = this.patternIndex.bySelector.get(selectorPattern) || [];
      bySelector.forEach(p => candidates.add(p));
    }
    
    return Array.from(candidates);
  }

  /**
   * Calculate similarity between error and pattern
   */
  _calculateSimilarity(errorRecord, pattern, strategy) {
    let score = 0;
    let weights = 0;
    
    // Tool name match (weight: 3)
    if (errorRecord.toolName === pattern.signature.toolName) {
      score += 3;
    }
    weights += 3;
    
    // Category match (weight: 3)
    if (errorRecord.category === pattern.signature.category) {
      score += 3;
    }
    weights += 3;
    
    // Message pattern match (weight: 2)
    const errorMsgPattern = this._extractMessagePattern(errorRecord.message);
    if (errorMsgPattern === pattern.signature.messagePattern) {
      score += 2;
    } else if (strategy === MATCH_STRATEGIES.FUZZY) {
      // Fuzzy match
      const msgSimilarity = this._stringSimilarity(
        errorMsgPattern || '',
        pattern.signature.messagePattern || ''
      );
      score += msgSimilarity * 2;
    }
    weights += 2;
    
    // Selector pattern match (weight: 2)
    const errorSelPattern = this._extractSelectorPattern(errorRecord.context?.selector);
    if (errorSelPattern && errorSelPattern === pattern.signature.selectorPattern) {
      score += 2;
    } else if (errorSelPattern && pattern.signature.selectorPattern && strategy === MATCH_STRATEGIES.FUZZY) {
      const selSimilarity = this._stringSimilarity(
        errorSelPattern,
        pattern.signature.selectorPattern
      );
      score += selSimilarity * 2;
    }
    weights += 2;
    
    return score / weights;
  }

  /**
   * Calculate string similarity (Jaccard similarity on words)
   */
  _stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Generate unique pattern ID
   */
  _generateId() {
    return `pat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Persist patterns to file
   */
  _persistPatterns() {
    try {
      const dir = path.dirname(this.options.patternsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = {
        patterns: this.patterns,
        stats: this.stats,
        savedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(this.options.patternsPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('⚠️ [PatternLearner] Failed to persist patterns:', e.message);
    }
  }

  /**
   * Load patterns from file
   */
  _loadPatterns() {
    try {
      if (fs.existsSync(this.options.patternsPath)) {
        const data = JSON.parse(fs.readFileSync(this.options.patternsPath, 'utf8'));
        
        if (data.patterns && Array.isArray(data.patterns)) {
          for (const pattern of data.patterns) {
            this.patterns.push(pattern);
            this._addToIndices(pattern);
          }
        }
        
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
        
        console.error(`📂 [PatternLearner] Loaded ${this.patterns.length} patterns`);
      }
    } catch (e) {
      console.error('⚠️ [PatternLearner] Failed to load patterns:', e.message);
    }
  }
}

// Singleton instance
const patternLearner = new PatternLearner();

module.exports = {
  PatternLearner,
  patternLearner,
  MATCH_STRATEGIES,
  // Quick access
  learn: (error, fix) => patternLearner.learn(error, fix),
  findSimilar: (error, options) => patternLearner.findSimilar(error, options),
  getSuggestedFix: (error) => patternLearner.getSuggestedFix(error),
  getPatternStats: () => patternLearner.getStats()
};
