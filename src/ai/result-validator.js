/**
 * Advanced Result Validator
 * 
 * Validates tool results even when success: true
 * Detects issues that tools don't catch:
 * - Empty results
 * - Partial success
 * - Unexpected page state
 * - Missing expected elements
 * - Performance issues
 * - Goal not achieved
 */

/**
 * Validation result structure
 */
class ValidationResult {
  constructor() {
    this.isValid = true;
    this.score = 100;  // 0-100 score
    this.issues = [];
    this.warnings = [];
    this.hindiMessage = null;
  }

  addIssue(type, message, severity = 'warning', deduction = 10) {
    this.issues.push({ type, message, severity });
    this.score = Math.max(0, this.score - deduction);
    if (severity === 'error') {
      this.isValid = false;
    }
  }

  addWarning(message) {
    this.warnings.push(message);
  }
}

/**
 * Tool-specific validation rules
 */
const VALIDATION_RULES = {
  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION TOOLS
  // ═══════════════════════════════════════════════════════════════
  navigate: {
    checks: [
      {
        name: 'url_changed',
        validate: (result, params, context) => {
          if (context.previousUrl === result.url) {
            return { valid: false, message: 'URL change नहीं हुआ', severity: 'warning', deduction: 20 };
          }
          return { valid: true };
        }
      },
      {
        name: 'title_exists',
        validate: (result) => {
          if (!result.title || result.title.trim() === '') {
            return { valid: false, message: 'Page title empty है', severity: 'warning', deduction: 10 };
          }
          return { valid: true };
        }
      },
      {
        name: 'error_page',
        validate: (result) => {
          const errorTitles = ['404', 'not found', 'error', '403', '500', 'forbidden'];
          if (result.title && errorTitles.some(e => result.title.toLowerCase().includes(e))) {
            return { valid: false, message: 'Error page पर navigate हुआ', severity: 'error', deduction: 50 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues) => {
      return `⚠️ Navigation Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // CONTENT EXTRACTION TOOLS
  // ═══════════════════════════════════════════════════════════════
  get_content: {
    checks: [
      {
        name: 'content_empty',
        validate: (result) => {
          if (!result.content || result.content.trim() === '') {
            return { valid: false, message: 'Content empty है', severity: 'error', deduction: 80 };
          }
          return { valid: true };
        }
      },
      {
        name: 'content_too_short',
        validate: (result) => {
          if (result.content && result.content.length < 50) {
            return { valid: false, message: 'Content बहुत छोटा है (< 50 chars)', severity: 'warning', deduction: 20 };
          }
          return { valid: true };
        }
      },
      {
        name: 'only_whitespace',
        validate: (result) => {
          if (result.content && result.content.trim().length === 0) {
            return { valid: false, message: 'Content में सिर्फ whitespace है', severity: 'error', deduction: 70 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result) => {
      const contentLen = result.content?.length || 0;
      return `⚠️ Content समस्या:\n   Content length: ${contentLen} chars\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: Page load होने का wait करें या selector check करें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // CLICK TOOL
  // ═══════════════════════════════════════════════════════════════
  click: {
    checks: [
      {
        name: 'page_unchanged',
        validate: (result, params, context) => {
          // Check if page URL or content changed after click
          if (context.urlAfter === context.urlBefore && !context.domChanged) {
            return { valid: false, message: 'Click के बाद page में कोई change नहीं हुआ', severity: 'warning', deduction: 30 };
          }
          return { valid: true };
        }
      },
      {
        name: 'element_not_interactive',
        validate: (result, params, context) => {
          if (context.elementType && !['button', 'a', 'input', 'select'].includes(context.elementType)) {
            return { valid: false, message: `Click हुआ non-interactive element (${context.elementType}) पर`, severity: 'warning', deduction: 15 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result, params) => {
      return `⚠️ Click Issues:\n   Selector: ${params.selector}\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: सही button/link selector use करें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // TYPE TOOL
  // ═══════════════════════════════════════════════════════════════
  type: {
    checks: [
      {
        name: 'text_not_entered',
        validate: (result, params, context) => {
          if (context.inputValueAfter !== params.text) {
            return { valid: false, message: 'Text पूरा enter नहीं हुआ', severity: 'warning', deduction: 40 };
          }
          return { valid: true };
        }
      },
      {
        name: 'input_readonly',
        validate: (result, params, context) => {
          if (context.isReadonly) {
            return { valid: false, message: 'Input field readonly है', severity: 'error', deduction: 60 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result, params) => {
      return `⚠️ Type Issues:\n   Selector: ${params.selector}\n   Text: "${params.text?.substring(0, 20)}..."\n${issues.map(i => `   • ${i.message}`).join('\n')}`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // LINK HARVESTER
  // ═══════════════════════════════════════════════════════════════
  link_harvester: {
    checks: [
      {
        name: 'no_links',
        validate: (result) => {
          if (!result.links || result.links.length === 0) {
            return { valid: false, message: 'कोई link नहीं मिला', severity: 'warning', deduction: 50 };
          }
          return { valid: true };
        }
      },
      {
        name: 'few_links',
        validate: (result) => {
          if (result.links && result.links.length < 3) {
            return { valid: false, message: `सिर्फ ${result.links.length} links मिले (expected more)`, severity: 'warning', deduction: 20 };
          }
          return { valid: true };
        }
      },
      {
        name: 'broken_links',
        validate: (result) => {
          const brokenCount = result.links?.filter(l => !l.href || l.href === '#').length || 0;
          if (brokenCount > 0) {
            return { valid: false, message: `${brokenCount} broken/empty links मिले`, severity: 'warning', deduction: 15 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result) => {
      const linkCount = result.links?.length || 0;
      return `⚠️ Link Harvester Issues:\n   Total links found: ${linkCount}\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: Page fully load हो तब links extract करें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // EXTRACT JSON
  // ═══════════════════════════════════════════════════════════════
  extract_json: {
    checks: [
      {
        name: 'no_json',
        validate: (result) => {
          if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
            return { valid: false, message: 'कोई JSON data नहीं मिला', severity: 'warning', deduction: 50 };
          }
          return { valid: true };
        }
      },
      {
        name: 'empty_object',
        validate: (result) => {
          if (result.data && typeof result.data === 'object' && Object.keys(result.data).length === 0) {
            return { valid: false, message: 'JSON object empty है', severity: 'warning', deduction: 40 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result) => {
      return `⚠️ JSON Extraction Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: Page में JSON data check करें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // FIND ELEMENT
  // ═══════════════════════════════════════════════════════════════
  find_element: {
    checks: [
      {
        name: 'no_elements',
        validate: (result) => {
          if (!result.elements || result.elements.length === 0) {
            return { valid: false, message: 'कोई element नहीं मिला', severity: 'warning', deduction: 50 };
          }
          return { valid: true };
        }
      },
      {
        name: 'hidden_elements',
        validate: (result) => {
          const hiddenCount = result.elements?.filter(e => !e.visible).length || 0;
          if (hiddenCount > 0 && hiddenCount === result.elements?.length) {
            return { valid: false, message: 'सभी elements hidden हैं', severity: 'warning', deduction: 30 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result, params) => {
      return `⚠️ Find Element Issues:\n   Selector: ${params.selector || params.text || params.xpath}\n${issues.map(i => `   • ${i.message}`).join('\n')}`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // FORM AUTOMATOR
  // ═══════════════════════════════════════════════════════════════
  form_automator: {
    checks: [
      {
        name: 'form_not_found',
        validate: (result) => {
          if (!result.formFound) {
            return { valid: false, message: 'Form नहीं मिला', severity: 'error', deduction: 70 };
          }
          return { valid: true };
        }
      },
      {
        name: 'fields_not_filled',
        validate: (result, params) => {
          const expectedFields = Object.keys(params.data || {}).length;
          const filledFields = result.filledFields || 0;
          if (filledFields < expectedFields) {
            return { valid: false, message: `${expectedFields - filledFields} fields fill नहीं हुए`, severity: 'warning', deduction: 30 };
          }
          return { valid: true };
        }
      },
      {
        name: 'submit_failed',
        validate: (result, params) => {
          if (params.submit && !result.submitted) {
            return { valid: false, message: 'Form submit नहीं हुआ', severity: 'error', deduction: 50 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result) => {
      return `⚠️ Form Automation Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: Form fields के selectors verify करें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // EXECUTE JS
  // ═══════════════════════════════════════════════════════════════
  execute_js: {
    checks: [
      {
        name: 'undefined_result',
        validate: (result) => {
          if (result.result === undefined || result.result === null) {
            return { valid: false, message: 'JS execution ने undefined/null return किया', severity: 'warning', deduction: 20 };
          }
          return { valid: true };
        }
      },
      {
        name: 'error_in_result',
        validate: (result) => {
          if (typeof result.result === 'string' && result.result.toLowerCase().includes('error')) {
            return { valid: false, message: 'JS result में error हो सकता है', severity: 'warning', deduction: 25 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues) => {
      return `⚠️ JS Execution Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: JavaScript code check करें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // SCRAPE META TAGS
  // ═══════════════════════════════════════════════════════════════
  scrape_meta_tags: {
    checks: [
      {
        name: 'no_meta',
        validate: (result) => {
          const totalMeta = (result.meta?.length || 0) + (result.og?.length || 0) + (result.twitter?.length || 0);
          if (totalMeta === 0) {
            return { valid: false, message: 'कोई meta tags नहीं मिले', severity: 'warning', deduction: 40 };
          }
          return { valid: true };
        }
      },
      {
        name: 'missing_essential',
        validate: (result) => {
          const hasTitle = result.meta?.some(m => m.name === 'title' || m.property === 'og:title');
          const hasDescription = result.meta?.some(m => m.name === 'description' || m.property === 'og:description');
          if (!hasTitle && !hasDescription) {
            return { valid: false, message: 'Essential meta (title/description) missing', severity: 'warning', deduction: 25 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result) => {
      return `⚠️ Meta Tags Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // WAIT TOOL
  // ═══════════════════════════════════════════════════════════════
  wait: {
    checks: [
      {
        name: 'timeout_occurred',
        validate: (result) => {
          if (result.timedOut) {
            return { valid: false, message: 'Wait timeout हो गया, element नहीं मिला', severity: 'warning', deduction: 40 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result, params) => {
      return `⚠️ Wait Issues:\n   Waiting for: ${params.value}\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: Selector या timeout बढ़ाएं`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // NETWORK RECORDER
  // ═══════════════════════════════════════════════════════════════
  network_recorder: {
    checks: [
      {
        name: 'no_requests',
        validate: (result) => {
          if (result.action === 'get' && (!result.requests || result.requests.length === 0)) {
            return { valid: false, message: 'कोई network requests record नहीं हुईं', severity: 'warning', deduction: 30 };
          }
          return { valid: true };
        }
      },
      {
        name: 'failed_requests',
        validate: (result) => {
          const failedCount = result.requests?.filter(r => r.status >= 400).length || 0;
          if (failedCount > 0) {
            return { valid: false, message: `${failedCount} requests failed (4xx/5xx)`, severity: 'warning', deduction: 20 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result) => {
      return `⚠️ Network Recording Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // STREAM EXTRACTOR
  // ═══════════════════════════════════════════════════════════════
  stream_extractor: {
    checks: [
      {
        name: 'no_streams',
        validate: (result) => {
          if (!result.streams || result.streams.length === 0) {
            return { valid: false, message: 'कोई video/audio stream नहीं मिला', severity: 'warning', deduction: 50 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues) => {
      return `⚠️ Stream Extraction Issues:\n${issues.map(i => `   • ${i.message}`).join('\n')}\n   💡 सुझाव: Page पर video player load होने दें`;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // FILE DOWNLOADER
  // ═══════════════════════════════════════════════════════════════
  file_downloader: {
    checks: [
      {
        name: 'download_failed',
        validate: (result) => {
          if (!result.downloaded || !result.path) {
            return { valid: false, message: 'File download नहीं हुई', severity: 'error', deduction: 70 };
          }
          return { valid: true };
        }
      },
      {
        name: 'empty_file',
        validate: (result) => {
          if (result.size === 0) {
            return { valid: false, message: 'Downloaded file empty है (0 bytes)', severity: 'error', deduction: 60 };
          }
          return { valid: true };
        }
      }
    ],
    hindiTemplate: (issues, result, params) => {
      return `⚠️ Download Issues:\n   URL: ${params.url}\n${issues.map(i => `   • ${i.message}`).join('\n')}`;
    }
  }
};

/**
 * Universal checks that apply to all tools
 */
const UNIVERSAL_CHECKS = [
  {
    name: 'slow_execution',
    validate: (result, params, context) => {
      if (context.duration > 10000) {
        return { valid: false, message: `Execution बहुत slow (${Math.round(context.duration/1000)}s)`, severity: 'warning', deduction: 15 };
      }
      if (context.duration > 5000) {
        return { valid: false, message: `Execution slow (${Math.round(context.duration/1000)}s)`, severity: 'warning', deduction: 5 };
      }
      return { valid: true };
    }
  },
  {
    name: 'healed_selector',
    validate: (result) => {
      if (result._ai?.healed) {
        return { valid: false, message: 'Selector AI द्वारा heal किया गया - source code update करें', severity: 'warning', deduction: 10 };
      }
      return { valid: true };
    }
  }
];

/**
 * Result Validator Class
 */
class ResultValidator {
  constructor() {
    this.rules = VALIDATION_RULES;
    this.universalChecks = UNIVERSAL_CHECKS;
    this.validationHistory = [];
  }

  /**
   * Validate a tool result
   * @param {string} toolName - Name of the tool
   * @param {object} result - Tool result
   * @param {object} params - Tool parameters
   * @param {object} context - Execution context (duration, page state, etc.)
   * @returns {ValidationResult}
   */
  validate(toolName, result, params = {}, context = {}) {
    const validation = new ValidationResult();

    // Skip validation for failed tools (already handled by error system)
    if (result.success === false || result.error) {
      validation.addWarning('Tool failed - error handling system से message आएगा');
      return validation;
    }

    // Run universal checks
    for (const check of this.universalChecks) {
      try {
        const checkResult = check.validate(result, params, context);
        if (!checkResult.valid) {
          validation.addIssue(check.name, checkResult.message, checkResult.severity, checkResult.deduction);
        }
      } catch (e) {
        // Ignore check errors
      }
    }

    // Run tool-specific checks
    const toolRules = this.rules[toolName];
    if (toolRules && toolRules.checks) {
      for (const check of toolRules.checks) {
        try {
          const checkResult = check.validate(result, params, context);
          if (!checkResult.valid) {
            validation.addIssue(check.name, checkResult.message, checkResult.severity, checkResult.deduction);
          }
        } catch (e) {
          // Ignore check errors
        }
      }
    }

    // Generate Hindi message if there are issues
    if (validation.issues.length > 0) {
      validation.hindiMessage = this._generateHindiMessage(toolName, validation, result, params);
    }

    // Store in history for analysis
    this._recordValidation(toolName, validation, result, params);

    return validation;
  }

  /**
   * Generate Hindi message for validation issues
   */
  _generateHindiMessage(toolName, validation, result, params) {
    const toolRules = this.rules[toolName];
    
    // Score-based header
    let header = '';
    if (validation.score >= 90) {
      header = `✅ Tool लगभग सही काम किया (${validation.score}% success)`;
    } else if (validation.score >= 70) {
      header = `⚠️ Tool चला लेकिन कुछ issues हैं (${validation.score}% success)`;
    } else if (validation.score >= 50) {
      header = `🔶 Tool में significant issues हैं (${validation.score}% success)`;
    } else {
      header = `🔴 Tool expected result नहीं दे पाया (${validation.score}% success)`;
    }

    // Tool-specific message
    let details = '';
    if (toolRules && toolRules.hindiTemplate) {
      details = toolRules.hindiTemplate(validation.issues, result, params);
    } else {
      details = `Issues:\n${validation.issues.map(i => `   • ${i.message}`).join('\n')}`;
    }

    // Combine
    return `\n${header}\n\n📛 Tool: ${toolName}\n\n${details}\n\n📊 Quality Score: ${validation.score}/100\n`;
  }

  /**
   * Record validation for analysis
   */
  _recordValidation(toolName, validation, result, params) {
    this.validationHistory.push({
      timestamp: new Date().toISOString(),
      toolName,
      score: validation.score,
      issueCount: validation.issues.length,
      issues: validation.issues.map(i => i.type)
    });

    // Keep only last 100 validations
    if (this.validationHistory.length > 100) {
      this.validationHistory.shift();
    }
  }

  /**
   * Get validation statistics
   */
  getStats() {
    if (this.validationHistory.length === 0) {
      return { totalValidations: 0, averageScore: 0, commonIssues: [] };
    }

    const totalValidations = this.validationHistory.length;
    const averageScore = Math.round(
      this.validationHistory.reduce((sum, v) => sum + v.score, 0) / totalValidations
    );

    // Count common issues
    const issueCounts = {};
    this.validationHistory.forEach(v => {
      v.issues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    return { totalValidations, averageScore, commonIssues };
  }

  /**
   * Check if result needs warning even on success
   */
  needsWarning(validation) {
    return validation.score < 100 && validation.issues.length > 0;
  }
}

// Singleton instance
const resultValidator = new ResultValidator();

module.exports = {
  ResultValidator,
  resultValidator,
  ValidationResult,
  VALIDATION_RULES,
  UNIVERSAL_CHECKS
};
