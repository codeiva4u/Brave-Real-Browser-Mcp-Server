/**
 * Diagnostics Capability - Full Error/Warning Detection
 * 
 * Validates browser automation code and provides real-time feedback
 */
const { DiagnosticSeverity } = require('vscode-languageserver/node');

/**
 * Get diagnostics for document
 */
function getDiagnostics(document, tools, lang, maxDiagnostics = 100) {
  const text = document.getText();
  const lines = text.split('\n');
  const diagnostics = [];

  // State tracking
  let browserInitialized = false;
  let browserClosed = false;
  let currentPage = null;
  let networkRecording = false;

  // Tool categories
  const browserRequiredTools = [
    'navigate', 'get_content', 'wait', 'click', 'type', 'solve_captcha',
    'random_scroll', 'find_element', 'save_content_as_markdown', 'search_regex',
    'extract_json', 'scrape_meta_tags', 'press_key', 'deep_analysis',
    'network_recorder', 'link_harvester', 'cookie_manager', 'iframe_handler',
    'stream_extractor', 'js_scrape', 'execute_js', 'player_api_hook',
    'redirect_tracer', 'file_downloader'
  ];

  const pageRequiredTools = [
    'get_content', 'click', 'type', 'random_scroll', 'find_element',
    'save_content_as_markdown', 'search_regex', 'extract_json', 'scrape_meta_tags',
    'deep_analysis', 'link_harvester', 'iframe_handler', 'stream_extractor',
    'js_scrape', 'execute_js', 'player_api_hook', 'press_key'
  ];

  // Parse all tool calls with their parameters
  const toolCalls = parseAllToolCalls(text, lines, tools);

  for (const call of toolCalls) {
    if (diagnostics.length >= maxDiagnostics) break;

    const tool = tools.find(t => t.name === call.name);

    // 1. Unknown tool check
    if (!tool) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: call.range,
        message: `${lang.diagnostics?.unknownTool || 'Unknown tool'}: ${call.name}`,
        source: 'brave-real-browser',
        code: 'unknown-tool',
        data: { suggestions: findSimilarTools(call.name, tools) }
      });
      continue;
    }

    // 2. Browser state tracking
    if (call.name === 'browser_init') {
      if (browserInitialized && !browserClosed) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: call.range,
          message: 'Browser already initialized. Close it first or this will create multiple instances.',
          source: 'brave-real-browser',
          code: 'browser-already-init'
        });
      }
      browserInitialized = true;
      browserClosed = false;
    }

    if (call.name === 'browser_close') {
      if (!browserInitialized) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: call.range,
          message: 'Closing browser that was never initialized.',
          source: 'brave-real-browser',
          code: 'browser-not-init-close'
        });
      }
      browserClosed = true;
      currentPage = null;
    }

    if (call.name === 'navigate') {
      currentPage = call.params?.url || 'page';
    }

    // 3. Browser required check
    if (browserRequiredTools.includes(call.name) && !browserInitialized) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: call.range,
        message: lang.diagnostics?.browserNotInit || 'Browser not initialized. Call browser_init() first.',
        source: 'brave-real-browser',
        code: 'browser-not-init'
      });
    }

    // 4. Browser closed check
    if (browserRequiredTools.includes(call.name) && browserClosed) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: call.range,
        message: 'Browser already closed. Call browser_init() again to reopen.',
        source: 'brave-real-browser',
        code: 'browser-closed'
      });
    }

    // 5. Page required check (navigate must be called first)
    if (pageRequiredTools.includes(call.name) && !currentPage && browserInitialized) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: call.range,
        message: 'No page loaded. Call navigate() first to load a page.',
        source: 'brave-real-browser',
        code: 'no-page-loaded'
      });
    }

    // 6. Network recorder state
    if (call.name === 'network_recorder') {
      if (call.params?.action === 'start') {
        networkRecording = true;
      } else if (call.params?.action === 'stop') {
        if (!networkRecording) {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: call.range,
            message: 'Stopping network recording that was never started.',
            source: 'brave-real-browser',
            code: 'network-not-recording'
          });
        }
        networkRecording = false;
      }
    }

    // 7. Required parameters check
    if (tool.inputSchema?.required) {
      for (const reqParam of tool.inputSchema.required) {
        if (!call.params || call.params[reqParam] === undefined) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: call.range,
            message: `${lang.diagnostics?.missingRequired || 'Missing required parameter'}: ${reqParam}`,
            source: 'brave-real-browser',
            code: 'missing-required',
            data: { param: reqParam, tool: call.name }
          });
        }
      }
    }

    // 8. Parameter validation
    if (call.params && tool.inputSchema?.properties) {
      for (const [paramName, paramValue] of Object.entries(call.params)) {
        const schema = tool.inputSchema.properties[paramName];

        // Unknown parameter
        if (!schema) {
          diagnostics.push({
            severity: DiagnosticSeverity.Warning,
            range: call.range,
            message: `Unknown parameter: ${paramName}. Check spelling.`,
            source: 'brave-real-browser',
            code: 'unknown-param',
            data: { param: paramName, tool: call.name }
          });
          continue;
        }

        // Type validation
        const typeError = validateParamType(paramValue, schema, paramName);
        if (typeError) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: call.range,
            message: typeError,
            source: 'brave-real-browser',
            code: 'type-error'
          });
        }

        // Enum validation
        if (schema.enum && !schema.enum.includes(paramValue)) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: call.range,
            message: `Invalid value for ${paramName}: "${paramValue}". Allowed: ${schema.enum.join(', ')}`,
            source: 'brave-real-browser',
            code: 'invalid-enum'
          });
        }

        // URL validation
        if (paramName === 'url' && typeof paramValue === 'string') {
          const urlError = validateUrl(paramValue);
          if (urlError) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: call.range,
              message: urlError,
              source: 'brave-real-browser',
              code: 'invalid-url'
            });
          }
        }

        // Selector validation
        if (paramName === 'selector' && typeof paramValue === 'string') {
          const selectorError = validateSelector(paramValue);
          if (selectorError) {
            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: call.range,
              message: selectorError,
              source: 'brave-real-browser',
              code: 'invalid-selector'
            });
          }
        }

        // Timeout validation
        if (paramName === 'timeout' && typeof paramValue === 'number') {
          if (paramValue < 0) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: call.range,
              message: 'Timeout cannot be negative.',
              source: 'brave-real-browser',
              code: 'invalid-timeout'
            });
          } else if (paramValue > 300000) {
            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: call.range,
              message: 'Timeout exceeds 5 minutes. Consider a shorter value.',
              source: 'brave-real-browser',
              code: 'timeout-too-long'
            });
          }
        }

        // Delay validation
        if (paramName === 'delay' && typeof paramValue === 'number') {
          if (paramValue < 0) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: call.range,
              message: 'Delay cannot be negative.',
              source: 'brave-real-browser',
              code: 'invalid-delay'
            });
          } else if (paramValue > 10000) {
            diagnostics.push({
              severity: DiagnosticSeverity.Information,
              range: call.range,
              message: 'High delay value. This will slow down execution.',
              source: 'brave-real-browser',
              code: 'high-delay'
            });
          }
        }
      }
    }

    // 9. Tool-specific validations
    if (call.name === 'type' && call.params?.text === '') {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: call.range,
        message: 'Empty text being typed. Is this intentional?',
        source: 'brave-real-browser',
        code: 'empty-text'
      });
    }

    if (call.name === 'wait' && call.params?.type === 'timeout') {
      const waitValue = parseInt(call.params?.value);
      if (waitValue > 30000) {
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: call.range,
          message: 'Long wait time. Consider using selector wait instead.',
          source: 'brave-real-browser',
          code: 'long-wait'
        });
      }
    }

    if (call.name === 'execute_js' && call.params?.code) {
      const jsCode = call.params.code;
      if (jsCode.includes('eval(') || jsCode.includes('Function(')) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: call.range,
          message: 'Using eval() or Function() is a security risk.',
          source: 'brave-real-browser',
          code: 'security-risk'
        });
      }
    }

    if (call.name === 'file_downloader' && call.params?.directory) {
      const dir = call.params.directory;
      if (dir.includes('..') || dir.startsWith('/')) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: call.range,
          message: 'Suspicious download directory path. Ensure this is safe.',
          source: 'brave-real-browser',
          code: 'suspicious-path'
        });
      }
    }
  }

  // 10. Document-level checks
  if (browserInitialized && !browserClosed) {
    diagnostics.push({
      severity: DiagnosticSeverity.Information,
      range: { start: { line: lines.length - 1, character: 0 }, end: { line: lines.length - 1, character: 0 } },
      message: 'Browser not closed. Add browser_close() to cleanup resources.',
      source: 'brave-real-browser',
      code: 'missing-cleanup'
    });
  }

  if (networkRecording) {
    diagnostics.push({
      severity: DiagnosticSeverity.Information,
      range: { start: { line: lines.length - 1, character: 0 }, end: { line: lines.length - 1, character: 0 } },
      message: 'Network recording not stopped. Add network_recorder({ action: "stop" }).',
      source: 'brave-real-browser',
      code: 'network-not-stopped'
    });
  }

  // 11. Check for duplicate tool calls (potential bugs)
  const navigateCalls = toolCalls.filter(c => c.name === 'navigate');
  if (navigateCalls.length > 5) {
    diagnostics.push({
      severity: DiagnosticSeverity.Information,
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      message: `${navigateCalls.length} navigate calls detected. Consider using pagination or loop.`,
      source: 'brave-real-browser',
      code: 'many-navigates'
    });
  }

  return diagnostics.slice(0, maxDiagnostics);
}

/**
 * Parse all tool calls from document
 */
function parseAllToolCalls(text, lines, tools) {
  const calls = [];
  const toolNames = tools.map(t => t.name);
  const toolRegex = new RegExp(`(${toolNames.join('|')})\\s*\\(\\s*(\\{[^}]*\\})?`, 'g');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let match;

    while ((match = toolRegex.exec(line)) !== null) {
      const name = match[1];
      const paramsStr = match[2];

      calls.push({
        name,
        params: paramsStr ? parseParams(paramsStr) : null,
        line: lineNum,
        range: {
          start: { line: lineNum, character: match.index },
          end: { line: lineNum, character: match.index + match[0].length }
        }
      });
    }

    toolRegex.lastIndex = 0;
  }

  return calls;
}

/**
 * Parse parameters string to object
 */
function parseParams(paramsStr) {
  try {
    // Convert JS object syntax to JSON
    const jsonStr = paramsStr
      .replace(/'/g, '"')
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/,\s*}/g, '}')
      .replace(/\n/g, ' ');

    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

/**
 * Validate parameter type
 */
function validateParamType(value, schema, paramName) {
  const expectedType = schema.type;
  const actualType = typeof value;

  if (expectedType === 'string' && actualType !== 'string') {
    return `Parameter ${paramName}: Expected string, got ${actualType}`;
  }
  if (expectedType === 'number' && actualType !== 'number') {
    return `Parameter ${paramName}: Expected number, got ${actualType}`;
  }
  if (expectedType === 'boolean' && actualType !== 'boolean') {
    return `Parameter ${paramName}: Expected boolean, got ${actualType}`;
  }
  if (expectedType === 'array' && !Array.isArray(value)) {
    return `Parameter ${paramName}: Expected array, got ${actualType}`;
  }
  if (expectedType === 'object' && (actualType !== 'object' || value === null || Array.isArray(value))) {
    return `Parameter ${paramName}: Expected object, got ${actualType}`;
  }

  return null;
}

/**
 * Validate URL format
 */
function validateUrl(url) {
  if (!url || url.trim() === '') {
    return 'URL cannot be empty';
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must use http or https protocol';
    }
  } catch (e) {
    return 'Invalid URL format. Example: https://example.com';
  }

  return null;
}

/**
 * Validate CSS selector
 */
function validateSelector(selector) {
  if (!selector || selector.trim() === '') {
    return 'Selector cannot be empty';
  }

  // Check for common mistakes
  if (selector.includes('  ')) {
    return 'Selector contains multiple consecutive spaces';
  }

  if (/^[0-9]/.test(selector) && !selector.startsWith('[')) {
    return 'Selector cannot start with a number (unless in attribute selector)';
  }

  // Check balanced brackets
  const brackets = { '[': ']', '(': ')' };
  const stack = [];

  for (const char of selector) {
    if (char in brackets) {
      stack.push(brackets[char]);
    } else if (Object.values(brackets).includes(char)) {
      if (stack.pop() !== char) {
        return 'Unbalanced brackets in selector';
      }
    }
  }

  if (stack.length > 0) {
    return 'Unclosed bracket in selector';
  }

  // Check for empty attribute selector
  if (selector.includes('[]')) {
    return 'Empty attribute selector []';
  }

  return null;
}

/**
 * Find similar tool names for suggestions
 */
function findSimilarTools(name, tools) {
  const lowerName = name.toLowerCase();

  return tools
    .map(t => ({
      name: t.name,
      score: calculateSimilarity(lowerName, t.name.toLowerCase())
    }))
    .filter(t => t.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(t => t.name);
}

/**
 * Calculate string similarity (Levenshtein-based)
 */
function calculateSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // Quick check for common prefix
  if (longer.startsWith(shorter) || shorter.startsWith(longer.substring(0, 3))) {
    return 0.8;
  }

  // Levenshtein distance
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return (longer.length - costs[s2.length]) / longer.length;
}

module.exports = { getDiagnostics };
