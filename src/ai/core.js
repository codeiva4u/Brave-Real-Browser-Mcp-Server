/**
 * AI Core Module - Foundation for all AI-powered features
 * 
 * Features:
 * - Smart element finding with multiple strategies
 * - Auto-healing selectors when they break
 * - Page understanding and structure analysis
 * - Natural language command parsing
 * - Error Detection + Hindi Reporting
 * - Advanced Result Validation (100% accuracy check)
 */

const ElementFinder = require('./element-finder');
const SelectorHealer = require('./selector-healer');
const PageAnalyzer = require('./page-analyzer');
const ActionParser = require('./action-parser');

// Error Detection Components
const { errorCollector, ERROR_CATEGORIES } = require('./error-collector');
const { hindiSuggester } = require('./hindi-suggester');
const { patternLearner } = require('./pattern-learner');

// Advanced Result Validation
const { resultValidator } = require('./result-validator');

/**
 * AI Core class - Central AI intelligence for the browser automation
 */
class AICore {
  constructor() {
    this.elementFinder = new ElementFinder();
    this.selectorHealer = new SelectorHealer();
    this.pageAnalyzer = new PageAnalyzer();
    this.actionParser = new ActionParser();
    
    // Error Detection Components
    this.errorCollector = errorCollector;
    this.hindiSuggester = hindiSuggester;
    this.patternLearner = patternLearner;
    
    // Advanced Result Validation
    this.resultValidator = resultValidator;
    
    // Cache for performance
    this.pageCache = new Map();
    this.selectorCache = new Map();
    
    // Configuration
    this.config = {
      defaultConfidence: 0.7,
      maxCacheAge: 30000,
      enableAutoHeal: true,
      enableSmartFind: true,
      enableSelfHealing: true,
      logLevel: 'info'
    };
  }

  /**
   * Configure AI Core settings
   */
  configure(options = {}) {
    this.config = { ...this.config, ...options };
    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // SIMPLE SELF-HEALING SYSTEM
  // Hindi message + Auto Training
  // Detects: Failures, Partial failures, Performance issues
  // ═══════════════════════════════════════════════════════════════

  /**
   * Simple Self-Healing - Returns Hindi message for user
   * 
   * Detects:
   * 1. Tool fail (error)
   * 2. Tool ठीक से काम नहीं (success:false)
   * 3. Tool 100% perform नहीं (slow, partial)
   * 4. Tool handle नहीं कर पाया (empty, healed)
   */
  async selfHeal(toolName, error, context = {}) {
    if (!this.config.enableSelfHealing) {
      return null;
    }

    try {
      // Step 1: Capture error (for training)
      const errorRecord = this.errorCollector.capture(toolName, error, context);
      
      // Step 2: Check for similar past errors (training helps here)
      const patternMatch = this.patternLearner.getSuggestedFix(errorRecord);
      
      // Step 3: Generate simple Hindi message
      const suggestion = this.hindiSuggester.generate(errorRecord);
      
      // Step 4: Build simple Hindi message for user
      const hindiMessage = this._buildHindiMessage(toolName, errorRecord, suggestion, patternMatch);
      
      // Step 5: Auto-learn from this error
      this._autoLearnFromError(errorRecord, suggestion);

      return {
        hindiMessage,
        errorId: errorRecord.id,
        category: errorRecord.category,
        location: suggestion.location
      };

    } catch (e) {
      this.log('error', `Self-healing failed: ${e.message}`);
      return null;
    }
  }

  /**
   * Detect performance/quality issues (not just errors)
   * Call this even when tool succeeds
   */
  detectIssues(toolName, result, context = {}) {
    const issues = [];
    
    // Issue 1: Slow performance
    if (context.duration && context.duration > 10000) {
      issues.push({
        type: 'slow_performance',
        message: `Tool ${toolName} बहुत धीमा चल रहा है (${Math.round(context.duration/1000)}s)`,
        suggestion: 'Network या selector optimization की जरूरत है'
      });
    }
    
    // Issue 2: Selector was healed (original had problem)
    if (result._ai?.healed) {
      issues.push({
        type: 'selector_healed',
        message: `Selector "${result._ai.originalSelector}" सही नहीं था, AI ने fix किया`,
        suggestion: `Source code में selector को "${result._ai.healedSelector}" से replace करें`
      });
    }
    
    // Issue 3: Empty or minimal results
    if (result.success && result.content !== undefined) {
      if (!result.content || result.content.length === 0) {
        issues.push({
          type: 'empty_result',
          message: 'Content खाली मिला',
          suggestion: 'Selector या page loading check करें'
        });
      } else if (result.content.length < 100) {
        issues.push({
          type: 'minimal_result',
          message: `बहुत कम content मिला (${result.content.length} chars)`,
          suggestion: 'Selector more specific करें या wait time बढ़ाएं'
        });
      }
    }
    
    // Issue 4: No elements found
    if (result.success && result.found !== undefined && result.found === 0) {
      issues.push({
        type: 'no_elements',
        message: 'कोई element नहीं मिला',
        suggestion: 'Selector verify करें, page structure बदल गई हो सकती है'
      });
    }
    
    // Issue 5: Partial extraction (links, streams, etc.)
    if (result.success && result.count !== undefined && result.count === 0) {
      issues.push({
        type: 'empty_extraction',
        message: 'कोई data extract नहीं हुआ',
        suggestion: 'Page में expected content नहीं है या extraction logic update करना होगा'
      });
    }
    
    return issues;
  }

  /**
   * Build Hindi message for issues (not errors, but quality problems)
   */
  buildIssueMessage(toolName, issues) {
    if (!issues || issues.length === 0) {
      return null;
    }
    
    const lines = [];
    
    lines.push(`\n⚠️ चेतावनी: ${toolName} में समस्याएं मिलीं`);
    lines.push('');
    
    issues.forEach((issue, i) => {
      lines.push(`${i + 1}. 🔸 ${issue.message}`);
      lines.push(`   💡 सुझाव: ${issue.suggestion}`);
      lines.push('');
    });
    
    lines.push('⚠️ कृपया source code में यह fix करें!');
    
    return lines.join('\n');
  }

  /**
   * Build simple Hindi message for user
   */
  _buildHindiMessage(toolName, errorRecord, suggestion, patternMatch) {
    const lines = [];
    
    lines.push(`\n🔴 समस्या: ${suggestion.hindi.title}`);
    lines.push(`📛 Tool: ${toolName}`);
    lines.push(`❌ Error: ${errorRecord.message}`);
    lines.push('');
    lines.push(`📋 कारण: ${suggestion.hindi.explanation}`);
    lines.push('');
    
    if (suggestion.hindi.commonCauses && suggestion.hindi.commonCauses.length > 0) {
      lines.push('🔍 संभावित कारण:');
      suggestion.hindi.commonCauses.slice(0, 3).forEach(cause => {
        lines.push(`   • ${cause}`);
      });
      lines.push('');
    }
    
    if (suggestion.location) {
      lines.push(`📍 Location: ${suggestion.location.displayPath}`);
      lines.push('');
    }
    
    if (suggestion.recommended) {
      lines.push(`💡 सुझाव: ${suggestion.recommended.title}`);
      lines.push(`   ${suggestion.recommended.description}`);
      lines.push('');
      
      if (suggestion.recommended.codeChange) {
        lines.push('📝 Code बदलाव:');
        lines.push('   पहले (Before):');
        lines.push(`   ${suggestion.recommended.codeChange.before}`);
        lines.push('   बाद (After):');
        lines.push(`   ${suggestion.recommended.codeChange.after}`);
        lines.push('');
      }
      
      if (suggestion.recommended.steps) {
        lines.push('📋 Steps:');
        suggestion.recommended.steps.forEach((step, i) => {
          lines.push(`   ${i + 1}. ${step}`);
        });
        lines.push('');
      }
    }
    
    if (patternMatch) {
      lines.push(`🧠 Training: इस तरह की ${Math.round(patternMatch.confidence * 100)}% similar error पहले भी आई थी`);
    }
    
    lines.push('⚠️ कृपया source code में यह fix करें!');
    
    return lines.join('\n');
  }

  /**
   * Learn from EVERY tool execution (success or failure)
   * This enables continuous training
   */
  learnFromExecution(toolName, params, result, context = {}) {
    const { duration = 0 } = context;
    
    // Create execution record
    const executionRecord = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      toolName,
      params: this._sanitizeParams(params),
      success: result.success,
      duration,
      healed: result._ai?.healed || false,
      hasIssues: !!(result._issues?.length || result.hindiMessage)
    };
    
    if (result.success) {
      // ═══════════════════════════════════════════════════════════════
      // SUCCESS: Learn what works
      // ═══════════════════════════════════════════════════════════════
      
      // If healed, learn the correct selector
      if (result._ai?.healed) {
        this.patternLearner.learn({
          toolName,
          category: 'selector_correction',
          message: `Selector corrected: ${result._ai.originalSelector} → ${result._ai.healedSelector}`,
          context: { 
            originalSelector: result._ai.originalSelector,
            correctSelector: result._ai.healedSelector
          }
        }, {
          type: 'selector_fix',
          before: result._ai.originalSelector,
          after: result._ai.healedSelector,
          confidence: 0.9
        });
        
        this.log('debug', `🧠 Learned: Selector fix for ${toolName}`);
      }
      
      // Learn successful patterns (for future reference)
      if (params.selector) {
        this.patternLearner.learn({
          toolName,
          category: 'success',
          message: `Successful execution with selector: ${params.selector}`,
          context: { selector: params.selector, url: context.url }
        }, {
          type: 'working_selector',
          selector: params.selector,
          confidence: 0.8
        });
      }
      
    } else {
      // ═══════════════════════════════════════════════════════════════
      // FAILURE: Learn what doesn't work and why
      // ═══════════════════════════════════════════════════════════════
      
      // Already captured by selfHeal(), but reinforce learning
      if (params.selector) {
        this.patternLearner.learn({
          toolName,
          category: 'failure',
          message: result.error || 'Unknown error',
          context: { selector: params.selector, url: context.url }
        }, {
          type: 'broken_selector',
          selector: params.selector,
          error: result.error,
          confidence: 0.85
        });
      }
    }
    
    // Track execution for statistics
    this._trackExecution(executionRecord);
    
    return executionRecord;
  }

  /**
   * Sanitize params for storage (remove sensitive data)
   */
  _sanitizeParams(params) {
    if (!params) return {};
    
    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    // Remove internal params
    delete sanitized._page;
    delete sanitized._browser;
    
    return sanitized;
  }

  /**
   * Track execution statistics
   */
  _trackExecution(record) {
    if (!this._executionStats) {
      this._executionStats = {
        total: 0,
        success: 0,
        failed: 0,
        healed: 0,
        byTool: {}
      };
    }
    
    this._executionStats.total++;
    if (record.success) this._executionStats.success++;
    else this._executionStats.failed++;
    if (record.healed) this._executionStats.healed++;
    
    // By tool
    if (!this._executionStats.byTool[record.toolName]) {
      this._executionStats.byTool[record.toolName] = { success: 0, failed: 0 };
    }
    if (record.success) {
      this._executionStats.byTool[record.toolName].success++;
    } else {
      this._executionStats.byTool[record.toolName].failed++;
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats() {
    return this._executionStats || { total: 0, success: 0, failed: 0, healed: 0, byTool: {} };
  }

  /**
   * Auto-learn from errors
   */
  _autoLearnFromError(errorRecord, suggestion) {
    if (suggestion.recommended) {
      this.patternLearner.learn(errorRecord, {
        type: 'error_suggestion',
        title: suggestion.recommended.title,
        description: suggestion.recommended.description,
        confidence: suggestion.confidence || 0.7
      });
      
      this.log('debug', `🧠 Learned from error: ${errorRecord.category}`);
    }
  }

  /**
   * Get training statistics
   */
  getTrainingStats() {
    return {
      errors: this.errorCollector.getStats(),
      patterns: this.patternLearner.getStats()
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED RESULT VALIDATION
  // Validates tool results even when success: true
  // Checks if result matches expected outcome
  // ═══════════════════════════════════════════════════════════════

  /**
   * Validate a tool result for 100% accuracy
   * Even if tool returns success: true, this checks if the result
   * actually matches what was expected
   * 
   * @param {string} toolName - Name of the tool
   * @param {object} result - Tool result
   * @param {object} params - Tool parameters
   * @param {object} context - Execution context
   * @returns {object} Validation result with score and Hindi message
   */
  validateResult(toolName, result, params = {}, context = {}) {
    try {
      const validation = this.resultValidator.validate(toolName, result, params, context);
      
      // If there are issues, add validation warning to result
      if (this.resultValidator.needsWarning(validation)) {
        this.log('warn', `Validation issues for ${toolName}: Score ${validation.score}/100`);
        
        // Track low-quality results
        if (validation.score < 70) {
          this.patternLearner.learn({
            toolName,
            category: 'low_quality_result',
            message: `Result quality: ${validation.score}%`,
            context: { params, issues: validation.issues.map(i => i.type) }
          }, {
            type: 'quality_issue',
            score: validation.score,
            confidence: 0.8
          });
        }
      }
      
      return validation;
    } catch (e) {
      this.log('error', `Validation error for ${toolName}: ${e.message}`);
      return {
        isValid: true,
        score: 100,
        issues: [],
        hindiMessage: null
      };
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return this.resultValidator.getStats();
  }

  // ═══════════════════════════════════════════════════════════════
  // ORIGINAL AI FEATURES
  // ═══════════════════════════════════════════════════════════════

  async smartFind(page, query, options = {}) {
    const {
      strategy = 'auto',
      context = null,
      confidence = this.config.defaultConfidence,
      returnMultiple = false
    } = options;

    this.log('debug', `SmartFind: "${query}" with strategy: ${strategy}`);

    const results = await this.elementFinder.find(page, query, {
      strategy,
      context,
      confidence,
      returnMultiple
    });

    this.log('info', `SmartFind found ${results.length} elements with confidence >= ${confidence}`);
    
    return results;
  }

  async smartClick(page, selector, options = {}) {
    const { humanLike = true, autoHeal = this.config.enableAutoHeal } = options;

    try {
      const element = await page.$(selector);
      if (element) {
        if (humanLike) {
          try {
            const { createCursor } = require('ghost-cursor');
            const cursor = createCursor(page);
            await cursor.click(selector);
          } catch {
            await element.click();
          }
        } else {
          await element.click();
        }
        return { success: true, selector, healed: false };
      }
    } catch (e) {
      this.log('warn', `Original selector failed: ${selector}`);
    }

    if (autoHeal) {
      this.log('info', `Attempting to heal selector: ${selector}`);
      const healed = await this.healAndExecute(page, selector, 'click', options);
      if (healed.success) {
        return { ...healed, healed: true };
      }
    }

    return { success: false, error: `Element not found: ${selector}` };
  }

  async smartType(page, selector, text, options = {}) {
    const { delay = 50, clear = false, autoHeal = this.config.enableAutoHeal } = options;

    try {
      const element = await page.$(selector);
      if (element) {
        if (clear) {
          await element.click({ clickCount: 3 });
          await page.keyboard.press('Backspace');
        }
        await element.type(text, { delay });
        return { success: true, selector, healed: false };
      }
    } catch (e) {
      this.log('warn', `Original selector failed: ${selector}`);
    }

    if (autoHeal) {
      const healed = await this.healAndExecute(page, selector, 'type', { text, ...options });
      if (healed.success) {
        return { ...healed, healed: true };
      }
    }

    return { success: false, error: `Element not found: ${selector}` };
  }

  async healAndExecute(page, brokenSelector, action, options = {}) {
    const alternatives = await this.selectorHealer.heal(page, brokenSelector, {
      maxAlternatives: 5
    });

    for (const alt of alternatives) {
      try {
        const element = await page.$(alt.selector);
        if (element) {
          this.log('info', `Healed selector: ${brokenSelector} -> ${alt.selector} (confidence: ${alt.confidence})`);
          
          this.selectorCache.set(brokenSelector, {
            healed: alt.selector,
            timestamp: Date.now()
          });

          if (action === 'click') {
            await element.click();
          } else if (action === 'type') {
            if (options.clear) {
              await element.click({ clickCount: 3 });
              await page.keyboard.press('Backspace');
            }
            await element.type(options.text, { delay: options.delay || 50 });
          }

          return { success: true, selector: alt.selector, originalSelector: brokenSelector };
        }
      } catch (e) {
        continue;
      }
    }

    return { success: false, error: 'Could not heal selector' };
  }

  async understandPage(page, options = {}) {
    const cacheKey = page.url();
    const cached = this.pageCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.config.maxCacheAge) {
      this.log('debug', 'Using cached page analysis');
      return cached.analysis;
    }

    const analysis = await this.pageAnalyzer.analyze(page, options);
    
    this.pageCache.set(cacheKey, {
      analysis,
      timestamp: Date.now()
    });

    return analysis;
  }

  async executeCommand(page, command, options = {}) {
    const { context = {}, dryRun = false, humanLike = true } = options;

    this.log('info', `Parsing command: "${command}"`);

    const parsed = await this.actionParser.parse(command, context);

    if (dryRun) {
      return { success: true, dryRun: true, parsed };
    }

    return await this.executeAction(page, parsed, { humanLike });
  }

  async executeAction(page, action, options = {}) {
    const { humanLike = true } = options;

    switch (action.type) {
      case 'click':
        return await this.smartClick(page, action.target, { humanLike });
      
      case 'type':
        return await this.smartType(page, action.target, action.text, { humanLike });
      
      case 'navigate':
        await page.goto(action.url, { waitUntil: 'networkidle2' });
        return { success: true, url: action.url };
      
      case 'scroll':
        await page.evaluate((direction, amount) => {
          window.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
        }, action.direction || 'down', action.amount || 300);
        return { success: true, direction: action.direction };
      
      case 'wait':
        await new Promise(r => setTimeout(r, action.duration || 1000));
        return { success: true, waited: action.duration };
      
      case 'find':
        const results = await this.smartFind(page, action.query);
        return { success: true, found: results.length, elements: results };
      
      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  }

  wrapHandler(handler, handlerName) {
    const aiCore = this;
    
    return async function aiEnhancedHandler(params = {}) {
      const startTime = Date.now();
      const useAI = params._useAI !== false;
      const autoHeal = params._autoHeal !== false && aiCore.config.enableAutoHeal;
      
      try {
        const result = await handler(params);
        
        if (result.success) {
          return {
            ...result,
            _ai: { used: false, duration: Date.now() - startTime }
          };
        }
        
        if (autoHeal && result.error?.includes('not found')) {
          aiCore.log('info', `AI attempting recovery for ${handlerName}`);
          
          const selector = params.selector || params.target;
          if (selector) {
            const healed = await aiCore.selectorHealer.heal(
              params._page,
              selector,
              { maxAlternatives: 3 }
            );
            
            if (healed.length > 0) {
              const retryParams = { ...params, selector: healed[0].selector };
              const retryResult = await handler(retryParams);
              
              return {
                ...retryResult,
                _ai: {
                  used: true,
                  healed: true,
                  originalSelector: selector,
                  healedSelector: healed[0].selector,
                  duration: Date.now() - startTime
                }
              };
            }
          }
        }
        
        return {
          ...result,
          _ai: { used: useAI, duration: Date.now() - startTime }
        };
        
      } catch (error) {
        aiCore.log('error', `Handler ${handlerName} failed: ${error.message}`);
        return {
          success: false,
          error: error.message,
          _ai: { used: useAI, duration: Date.now() - startTime }
        };
      }
    };
  }

  clearCache() {
    this.pageCache.clear();
    this.selectorCache.clear();
    this.log('info', 'AI caches cleared');
  }

  log(level, message) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const msgLevel = levels.indexOf(level);
    
    if (msgLevel >= configLevel) {
      const emoji = { debug: '🔍', info: '🤖', warn: '⚠️', error: '❌' }[level];
      console.error(`${emoji} [AI] ${message}`);
    }
  }
}

// Singleton instance
const aiCore = new AICore();

module.exports = {
  AICore,
  aiCore,
  
  // Quick access functions
  smartFind: (page, query, options) => aiCore.smartFind(page, query, options),
  smartClick: (page, selector, options) => aiCore.smartClick(page, selector, options),
  smartType: (page, selector, text, options) => aiCore.smartType(page, selector, text, options),
  understandPage: (page, options) => aiCore.understandPage(page, options),
  executeCommand: (page, command, options) => aiCore.executeCommand(page, command, options),
  wrapHandler: (handler, name) => aiCore.wrapHandler(handler, name),
  configure: (options) => aiCore.configure(options),
  
  // Simple Self-Healing exports
  selfHeal: (tool, error, context) => aiCore.selfHeal(tool, error, context),
  detectIssues: (tool, result, context) => aiCore.detectIssues(tool, result, context),
  buildIssueMessage: (tool, issues) => aiCore.buildIssueMessage(tool, issues),
  learnFromExecution: (tool, params, result, context) => aiCore.learnFromExecution(tool, params, result, context),
  getTrainingStats: () => aiCore.getTrainingStats(),
  getExecutionStats: () => aiCore.getExecutionStats(),
  
  // Component access
  errorCollector: aiCore.errorCollector,
  hindiSuggester: aiCore.hindiSuggester,
  patternLearner: aiCore.patternLearner,
  
  // Constants
  ERROR_CATEGORIES
};
