/**
 * Hindi Suggester Module - Self-Healing System
 * 
 * Provides Hindi explanations and fix suggestions for errors.
 * Makes debugging accessible for Hindi-speaking developers.
 * 
 * Features:
 * - Error explanations in Hindi
 * - Step-by-step fix suggestions
 * - Code change recommendations with before/after
 * - Confidence scoring for suggestions
 */

const fs = require('fs');
const path = require('path');
const { ERROR_CATEGORIES } = require('./error-collector');

/**
 * Hindi translations for error categories
 */
const HINDI_ERROR_EXPLANATIONS = {
  [ERROR_CATEGORIES.SELECTOR_NOT_FOUND]: {
    title: 'Element नहीं मिला',
    explanation: 'यह एरर तब आता है जब दिया गया CSS selector या XPath page में कोई element नहीं ढूंढ पाता। Element या तो exist नहीं करता, अभी load नहीं हुआ, या selector गलत है।',
    commonCauses: [
      'Page पूरी तरह load नहीं हुआ',
      'Element dynamically generate होता है',
      'Selector spelling या syntax गलत है',
      'Element किसी iframe में है'
    ]
  },
  [ERROR_CATEGORIES.SELECTOR_INVALID]: {
    title: 'Selector अमान्य है',
    explanation: 'CSS selector का syntax गलत है। Special characters को escape करना भूल गए हैं या bracket/quote सही से close नहीं किया।',
    commonCauses: [
      'Special characters बिना escape के use किए',
      'Bracket या quotes सही से close नहीं किए',
      'Invalid pseudo-selector use किया'
    ]
  },
  [ERROR_CATEGORIES.ELEMENT_NOT_CLICKABLE]: {
    title: 'Element पर click नहीं हो रहा',
    explanation: 'Element मिल गया लेकिन उस पर click नहीं हो पा रहा। कोई दूसरा element उसे cover कर रहा है, या element disabled है।',
    commonCauses: [
      'कोई overlay या popup element को cover कर रहा है',
      'Element disabled state में है',
      'Element viewport में नहीं है (scroll करना होगा)',
      'Animation अभी पूरा नहीं हुआ'
    ]
  },
  [ERROR_CATEGORIES.ELEMENT_NOT_VISIBLE]: {
    title: 'Element दिख नहीं रहा',
    explanation: 'Element DOM में exist करता है लेकिन visible नहीं है। CSS display:none, visibility:hidden, या opacity:0 हो सकता है।',
    commonCauses: [
      'Element hidden है (display: none)',
      'Element की opacity 0 है',
      'Element viewport के बाहर है',
      'Parent element hidden है'
    ]
  },
  [ERROR_CATEGORIES.TIMEOUT]: {
    title: 'समय समाप्त (Timeout)',
    explanation: 'Operation तय समय में पूरा नहीं हुआ। Network धीमा है, server response देने में समय ले रहा है, या element load होने में देर हो रही है।',
    commonCauses: [
      'धीमा internet connection',
      'Server overloaded है',
      'Page बहुत heavy है',
      'Element कभी load ही नहीं होता'
    ]
  },
  [ERROR_CATEGORIES.NAVIGATION_FAILED]: {
    title: 'Navigation विफल',
    explanation: 'Page पर जाने में error आया। URL गलत है, server down है, या redirect loop में फंस गया।',
    commonCauses: [
      'URL गलत या invalid है',
      'Server unavailable है',
      'SSL/TLS certificate issue',
      'Too many redirects'
    ]
  },
  [ERROR_CATEGORIES.NETWORK_ERROR]: {
    title: 'Network समस्या',
    explanation: 'Network request fail हो गई। Internet connection issue, CORS block, या server ने reject कर दिया।',
    commonCauses: [
      'Internet connection नहीं है',
      'CORS policy block कर रही है',
      'Firewall या proxy block कर रहा है',
      'DNS resolution failed'
    ]
  },
  [ERROR_CATEGORIES.BROWSER_NOT_INITIALIZED]: {
    title: 'Browser शुरू नहीं हुआ',
    explanation: 'Browser instance अभी तक initialize नहीं हुआ। browser_init tool पहले call करना होगा।',
    commonCauses: [
      'browser_init call करना भूल गए',
      'Browser crash हो गया',
      'पिछला session properly close नहीं हुआ'
    ]
  },
  [ERROR_CATEGORIES.CAPTCHA_FAILED]: {
    title: 'Captcha हल नहीं हुआ',
    explanation: 'Captcha solve करने में समस्या आई। Captcha type support नहीं होता या timeout हो गया।',
    commonCauses: [
      'Captcha timeout हो गया',
      'Unsupported captcha type',
      'Page structure बदल गया'
    ]
  },
  [ERROR_CATEGORIES.JAVASCRIPT_ERROR]: {
    title: 'JavaScript Error',
    explanation: 'Page पर JavaScript execute करने में error आया। Code syntax गलत है या undefined variable use किया।',
    commonCauses: [
      'Syntax error in JavaScript code',
      'Undefined variable या function',
      'Page context अलग है',
      'Security restriction'
    ]
  },
  [ERROR_CATEGORIES.PERMISSION_DENIED]: {
    title: 'Permission नहीं है',
    explanation: 'इस action के लिए permission नहीं है। File access, camera, या location permission deny हो गई।',
    commonCauses: [
      'File system access denied',
      'Browser permission blocked',
      'Cross-origin restriction'
    ]
  },
  [ERROR_CATEGORIES.FILE_NOT_FOUND]: {
    title: 'File नहीं मिली',
    explanation: 'दी गई path पर file exist नहीं करती। Path गलत है या file delete हो गई।',
    commonCauses: [
      'File path गलत है',
      'File move या delete हो गई',
      'Directory exist नहीं करती'
    ]
  },
  [ERROR_CATEGORIES.UNKNOWN]: {
    title: 'अज्ञात Error',
    explanation: 'यह error हमारे known patterns में नहीं आता। Error message देखकर समझने की कोशिश करें।',
    commonCauses: [
      'नया प्रकार का error',
      'Edge case या race condition',
      'External library की समस्या'
    ]
  }
};

/**
 * Fix templates for common errors
 */
const FIX_TEMPLATES = {
  [ERROR_CATEGORIES.SELECTOR_NOT_FOUND]: [
    {
      condition: (error) => error.context.selector,
      title: 'waitForSelector जोड़ें',
      description: 'Element load होने का wait करें click या interact करने से पहले',
      confidence: 0.85,
      codeChange: {
        file: 'src/mcp/handlers.js',
        findPattern: (error) => `await page.$(${JSON.stringify(error.context.selector)})`,
        before: (error) => `await page.$(${JSON.stringify(error.context.selector)})`,
        after: (error) => `await page.waitForSelector(${JSON.stringify(error.context.selector)}, { visible: true, timeout: 5000 });\nawait page.$(${JSON.stringify(error.context.selector)})`
      }
    },
    {
      condition: (error) => error.context.selector && error.context.selector.includes('#'),
      title: 'ID selector verify करें',
      description: 'Check करें कि element ID page में exist करता है',
      confidence: 0.7,
      steps: [
        'Browser DevTools खोलें (F12)',
        'Console में type करें: document.querySelector("selector")',
        'अगर null आए तो selector गलत है'
      ]
    }
  ],
  [ERROR_CATEGORIES.ELEMENT_NOT_CLICKABLE]: [
    {
      condition: () => true,
      title: 'visible और clickable wait जोड़ें',
      description: 'Element visible होने और click ready होने तक wait करें',
      confidence: 0.9,
      codeChange: {
        file: 'src/mcp/handlers.js',
        findPattern: (error) => `await page.click(${JSON.stringify(error.context.selector)})`,
        before: (error) => `await page.click(${JSON.stringify(error.context.selector)})`,
        after: (error) => `await page.waitForSelector(${JSON.stringify(error.context.selector)}, { visible: true });\nawait page.evaluate(sel => {\n  const el = document.querySelector(sel);\n  el.scrollIntoView({ block: 'center' });\n}, ${JSON.stringify(error.context.selector)});\nawait new Promise(r => setTimeout(r, 300));\nawait page.click(${JSON.stringify(error.context.selector)})`
      }
    }
  ],
  [ERROR_CATEGORIES.TIMEOUT]: [
    {
      condition: () => true,
      title: 'Timeout बढ़ाएं',
      description: 'Default timeout को बढ़ाकर धीमे network को handle करें',
      confidence: 0.75,
      codeChange: {
        file: 'src/mcp/handlers.js',
        findPattern: () => 'timeout = 30000',
        before: () => 'timeout = 30000',
        after: () => 'timeout = 60000'
      }
    }
  ],
  [ERROR_CATEGORIES.BROWSER_NOT_INITIALIZED]: [
    {
      condition: () => true,
      title: 'browser_init पहले call करें',
      description: 'किसी भी browser operation से पहले browser initialize करें',
      confidence: 0.99,
      steps: [
        'browser_init tool call करें',
        'Wait करें जब तक browser ready न हो',
        'फिर अपना operation करें'
      ]
    }
  ]
};

/**
 * HindiSuggester Class - Generates Hindi suggestions for errors
 */
class HindiSuggester {
  constructor(options = {}) {
    this.options = {
      includeCodeChanges: options.includeCodeChanges !== false,
      maxSuggestions: options.maxSuggestions || 3,
      ...options
    };
  }

  /**
   * Generate Hindi suggestion for an error
   * 
   * @param {Object} errorRecord - Error record from ErrorCollector
   * @returns {Object} Hindi suggestion with analysis and fixes
   */
  generate(errorRecord) {
    const category = errorRecord.category;
    const explanation = HINDI_ERROR_EXPLANATIONS[category] || HINDI_ERROR_EXPLANATIONS[ERROR_CATEGORIES.UNKNOWN];
    
    // Get applicable fixes
    const fixes = this._getApplicableFixes(errorRecord);
    
    // Build suggestion object
    const suggestion = {
      errorId: errorRecord.id,
      timestamp: new Date().toISOString(),
      
      // Hindi explanation
      hindi: {
        title: explanation.title,
        explanation: explanation.explanation,
        commonCauses: explanation.commonCauses
      },
      
      // Tool info
      tool: {
        name: errorRecord.toolName,
        category: category
      },
      
      // Location info
      location: errorRecord.codeLocation ? {
        file: errorRecord.codeLocation.file,
        line: errorRecord.codeLocation.line,
        displayPath: this._formatPath(errorRecord.codeLocation.file, errorRecord.codeLocation.line)
      } : null,
      
      // Fix suggestions
      fixes: fixes,
      
      // Best fix recommendation
      recommended: fixes.length > 0 ? fixes[0] : null,
      
      // Confidence
      confidence: fixes.length > 0 ? fixes[0].confidence : 0,
      
      // Can auto-fix?
      canAutoFix: fixes.some(f => f.codeChange && f.confidence >= 0.8)
    };
    
    return suggestion;
  }

  /**
   * Format suggestion as a visual report (for display)
   * 
   * @param {Object} suggestion - Suggestion object
   * @returns {string} Formatted report string
   */
  formatReport(suggestion) {
    const lines = [];
    const width = 70;
    
    // Header
    lines.push('┌' + '─'.repeat(width) + '┐');
    lines.push('│' + this._center('🔍 ERROR DIAGNOSTIC REPORT', width) + '│');
    lines.push('├' + '─'.repeat(width) + '┤');
    
    // Tool info
    lines.push('│' + this._pad(`  📛 Tool: ${suggestion.tool.name}`, width) + '│');
    lines.push('│' + this._pad(`  ⏰ Time: ${new Date(suggestion.timestamp).toLocaleString('hi-IN')}`, width) + '│');
    lines.push('│' + this._pad(`  🏷️  Category: ${suggestion.tool.category}`, width) + '│');
    lines.push('│' + ' '.repeat(width) + '│');
    
    // Hindi explanation
    lines.push('│' + this._pad(`  🔍 समस्या: ${suggestion.hindi.title}`, width) + '│');
    lines.push('│' + ' '.repeat(width) + '│');
    
    // Wrap explanation text
    const expLines = this._wrapText(suggestion.hindi.explanation, width - 6);
    for (const line of expLines) {
      lines.push('│' + this._pad(`  ${line}`, width) + '│');
    }
    lines.push('│' + ' '.repeat(width) + '│');
    
    // Common causes
    lines.push('│' + this._pad('  📋 संभावित कारण:', width) + '│');
    for (const cause of suggestion.hindi.commonCauses.slice(0, 3)) {
      lines.push('│' + this._pad(`    • ${cause}`, width) + '│');
    }
    lines.push('│' + ' '.repeat(width) + '│');
    
    // Location
    if (suggestion.location) {
      lines.push('│' + this._pad(`  📍 स्थान: ${suggestion.location.displayPath}`, width) + '│');
      lines.push('│' + ' '.repeat(width) + '│');
    }
    
    // Recommended fix
    if (suggestion.recommended) {
      lines.push('├' + '─'.repeat(width) + '┤');
      lines.push('│' + this._pad(`  💡 सुझाव: ${suggestion.recommended.title}`, width) + '│');
      
      const descLines = this._wrapText(suggestion.recommended.description, width - 6);
      for (const line of descLines) {
        lines.push('│' + this._pad(`  ${line}`, width) + '│');
      }
      
      // Code change
      if (suggestion.recommended.codeChange) {
        lines.push('│' + ' '.repeat(width) + '│');
        lines.push('│' + this._pad('  📝 Code बदलाव:', width) + '│');
        lines.push('│' + this._pad('  ─────────────', width) + '│');
        
        lines.push('│' + this._pad('  पहले (Before):', width) + '│');
        lines.push('│' + this._pad('  ```javascript', width) + '│');
        const beforeLines = suggestion.recommended.codeChange.before.split('\n');
        for (const line of beforeLines.slice(0, 3)) {
          lines.push('│' + this._pad(`  ${line}`, width) + '│');
        }
        lines.push('│' + this._pad('  ```', width) + '│');
        
        lines.push('│' + ' '.repeat(width) + '│');
        
        lines.push('│' + this._pad('  बाद (After):', width) + '│');
        lines.push('│' + this._pad('  ```javascript', width) + '│');
        const afterLines = suggestion.recommended.codeChange.after.split('\n');
        for (const line of afterLines.slice(0, 5)) {
          lines.push('│' + this._pad(`  ${line}`, width) + '│');
        }
        lines.push('│' + this._pad('  ```', width) + '│');
      }
      
      // Steps
      if (suggestion.recommended.steps) {
        lines.push('│' + ' '.repeat(width) + '│');
        lines.push('│' + this._pad('  📋 Steps:', width) + '│');
        for (let i = 0; i < suggestion.recommended.steps.length; i++) {
          lines.push('│' + this._pad(`    ${i + 1}. ${suggestion.recommended.steps[i]}`, width) + '│');
        }
      }
    }
    
    // Footer
    lines.push('│' + ' '.repeat(width) + '│');
    lines.push('│' + this._pad(`  🔧 Auto-Fix: ${suggestion.canAutoFix ? 'Available' : 'Not Available'}`, width) + '│');
    lines.push('│' + this._pad(`  📊 Confidence: ${Math.round(suggestion.confidence * 100)}%`, width) + '│');
    lines.push('└' + '─'.repeat(width) + '┘');
    
    return lines.join('\n');
  }

  /**
   * Get simple Hindi message for quick display
   */
  getQuickMessage(errorRecord) {
    const explanation = HINDI_ERROR_EXPLANATIONS[errorRecord.category] || HINDI_ERROR_EXPLANATIONS[ERROR_CATEGORIES.UNKNOWN];
    return `❌ ${explanation.title}: ${errorRecord.message.substring(0, 100)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────────────────────────

  /**
   * Get applicable fixes for an error
   */
  _getApplicableFixes(errorRecord) {
    const templates = FIX_TEMPLATES[errorRecord.category] || [];
    const fixes = [];
    
    for (const template of templates) {
      if (template.condition(errorRecord)) {
        const fix = {
          title: template.title,
          description: template.description,
          confidence: template.confidence
        };
        
        // Process code change if exists
        if (template.codeChange && this.options.includeCodeChanges) {
          fix.codeChange = {
            file: template.codeChange.file,
            before: typeof template.codeChange.before === 'function' 
              ? template.codeChange.before(errorRecord)
              : template.codeChange.before,
            after: typeof template.codeChange.after === 'function'
              ? template.codeChange.after(errorRecord)
              : template.codeChange.after
          };
        }
        
        // Add steps if exists
        if (template.steps) {
          fix.steps = template.steps;
        }
        
        fixes.push(fix);
      }
    }
    
    // Sort by confidence
    return fixes
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.options.maxSuggestions);
  }

  /**
   * Format file path for display
   */
  _formatPath(filePath, line) {
    if (!filePath) return 'Unknown';
    
    // Get relative path
    const parts = filePath.replace(/\\/g, '/').split('/');
    const relevantParts = parts.slice(-3);
    return `${relevantParts.join('/')}:${line}`;
  }

  /**
   * Center text in given width
   */
  _center(text, width) {
    const padding = Math.max(0, width - text.length);
    const left = Math.floor(padding / 2);
    const right = padding - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  }

  /**
   * Pad text to width
   */
  _pad(text, width) {
    if (text.length >= width) {
      return text.substring(0, width);
    }
    return text + ' '.repeat(width - text.length);
  }

  /**
   * Wrap text to fit width
   */
  _wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxWidth) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }
}

// Singleton instance
const hindiSuggester = new HindiSuggester();

module.exports = {
  HindiSuggester,
  hindiSuggester,
  HINDI_ERROR_EXPLANATIONS,
  FIX_TEMPLATES,
  // Quick access
  generateSuggestion: (error) => hindiSuggester.generate(error),
  formatReport: (suggestion) => hindiSuggester.formatReport(suggestion)
};
