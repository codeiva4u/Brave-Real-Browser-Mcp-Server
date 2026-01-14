/**
 * Brave Browser Automation LSP Server - Enhanced Version
 * Full IDE integration with all 33 MCP tools
 * Features: Autocomplete, Hover, Signature Help, Diagnostics
 */

// Use CommonJS require for vscode-languageserver compatibility
const {
  createConnection,
  TextDocuments,
  TextDocumentSyncKind,
  DiagnosticSeverity,
  CompletionItemKind,
  CodeActionKind,
} = require('vscode-languageserver');
const { TextDocument } = require('vscode-languageserver-textdocument');

// Full tool definitions for all 33 MCP tools
const TOOL_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  category: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: any;
    enum?: string[];
  }>;
  examples?: string[];
}> = {
  // Browser Management
  browser_init: {
    name: 'browser_init',
    description: 'Initialize a new Brave browser instance with anti-detection features, built-in uBlock Origin, and Stealth mode',
    category: 'Browser Management',
    parameters: [
      { name: 'headless', type: 'boolean', description: 'Run browser in headless mode', required: false, default: false },
      { name: 'proxy', type: 'string', description: 'Proxy server URL (format: protocol://host:port)', required: false },
      { name: 'disableXvfb', type: 'boolean', description: 'Disable Xvfb (X Virtual Framebuffer)', required: false, default: false },
      { name: 'ignoreAllFlags', type: 'boolean', description: 'Ignore all browser flags', required: false, default: true },
    ],
    examples: ['await browser_init({ headless: false });'],
  },
  browser_close: {
    name: 'browser_close',
    description: 'Close the browser instance',
    category: 'Browser Management',
    parameters: [
      { name: 'force', type: 'boolean', description: 'Force close', required: false, default: false },
    ],
  },
  // Navigation
  navigate: {
    name: 'navigate',
    description: 'Navigate to a URL',
    category: 'Navigation',
    parameters: [
      { name: 'url', type: 'string', description: 'The URL to navigate to', required: true },
      { name: 'waitUntil', type: 'string', description: 'When to consider navigation complete', required: false, enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] },
    ],
    examples: ['await navigate({ url: "https://example.com" });'],
  },
  wait: {
    name: 'wait',
    description: 'Wait for various conditions',
    category: 'Navigation',
    parameters: [
      { name: 'type', type: 'string', description: 'Type of wait condition', required: true, enum: ['selector', 'navigation', 'timeout'] },
      { name: 'value', type: 'string', description: 'Selector to wait for or timeout in ms', required: true },
      { name: 'timeout', type: 'number', description: 'Maximum wait time in ms', required: false, default: 30000 },
    ],
  },
  // Content
  get_content: {
    name: 'get_content',
    description: '**Recommended** method to get page content (HTML or text) - More reliable than screenshots',
    category: 'Content',
    parameters: [
      { name: 'type', type: 'string', description: 'Type of content to retrieve', required: false, enum: ['html', 'text'], default: 'html' },
      { name: 'selector', type: 'string', description: 'CSS selector to get content from specific element', required: false },
    ],
    examples: ['await get_content({ type: "text" });'],
  },
  find_element: {
    name: 'find_element',
    description: 'Find elements using text, CSS selector, XPath, attributes, or AI-powered description',
    category: 'Content',
    parameters: [
      { name: 'text', type: 'string', description: 'Text content to search for', required: false },
      { name: 'selector', type: 'string', description: 'CSS selector', required: false },
      { name: 'xpath', type: 'string', description: 'XPath expression', required: false },
      { name: 'description', type: 'string', description: 'Natural language description (AI-powered)', required: false },
      { name: 'exact', type: 'boolean', description: 'Exact text match', required: false, default: false },
    ],
  },
  save_content_as_markdown: {
    name: 'save_content_as_markdown',
    description: 'Extract page content and save it as a formatted markdown file',
    category: 'Content',
    parameters: [
      { name: 'filePath', type: 'string', description: 'Absolute path where the markdown file should be saved', required: true },
      { name: 'contentType', type: 'string', description: 'Type of content to extract', required: false, enum: ['text', 'html'], default: 'text' },
      { name: 'selector', type: 'string', description: 'CSS selector to extract from', required: false },
    ],
  },
  // Interaction
  click: {
    name: 'click',
    description: 'Click on an element',
    category: 'Interaction',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS selector of element to click', required: true },
      { name: 'waitForNavigation', type: 'boolean', description: 'Wait for navigation after click', required: false, default: false },
    ],
    examples: ['await click({ selector: "button.submit" });'],
  },
  type: {
    name: 'type',
    description: 'Type text into an input field',
    category: 'Interaction',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS selector of input element', required: true },
      { name: 'text', type: 'string', description: 'Text to type', required: true },
      { name: 'delay', type: 'number', description: 'Delay between keystrokes in ms', required: false, default: 100 },
    ],
    examples: ['await type({ selector: "#email", text: "user@example.com" });'],
  },
  press_key: {
    name: 'press_key',
    description: 'Simulate keyboard key presses with optional modifiers',
    category: 'Interaction',
    parameters: [
      { name: 'key', type: 'string', description: 'Key to press (e.g., "Enter", "Tab", "Escape")', required: true },
      { name: 'modifiers', type: 'array', description: 'Modifier keys (Control, Shift, Alt, Meta)', required: false },
      { name: 'count', type: 'number', description: 'Number of times to press', required: false, default: 1 },
    ],
  },
  random_scroll: {
    name: 'random_scroll',
    description: 'Perform random scrolling with natural timing',
    category: 'Interaction',
    parameters: [
      { name: 'steps', type: 'number', description: 'Number of scroll steps', required: false, default: 10 },
    ],
  },
  solve_captcha: {
    name: 'solve_captcha',
    description: 'Attempt to solve CAPTCHAs (if supported)',
    category: 'Interaction',
    parameters: [
      { name: 'type', type: 'string', description: 'Type of captcha to solve', required: true, enum: ['recaptcha', 'hCaptcha', 'turnstile'] },
    ],
    examples: ['await solve_captcha({ type: "turnstile" });'],
  },
  // Media
  media_extractor: {
    name: 'media_extractor',
    description: 'Extract media (audio/video) from page with quality options and ad-bypass',
    category: 'Media',
    parameters: [
      { name: 'mediaType', type: 'string', description: 'Type of media to extract', required: false, enum: ['video', 'audio', 'all'], default: 'all' },
      { name: 'includeEmbedded', type: 'boolean', description: 'Include embedded iframes', required: false, default: true },
      { name: 'quality', type: 'string', description: 'Preferred quality (highest, lowest, 1080p, 720p)', required: false },
    ],
  },
  m3u8_parser: {
    name: 'm3u8_parser',
    description: 'Parse and extract HLS/m3u8 streaming URLs with quality options',
    category: 'Media',
    parameters: [
      { name: 'url', type: 'string', description: 'URL of the page or m3u8 file', required: false },
      { name: 'extractAll', type: 'boolean', description: 'Extract all quality variants', required: false, default: true },
      { name: 'preferQuality', type: 'string', description: 'Preferred quality', required: false, default: 'best' },
    ],
  },
  stream_extractor: {
    name: 'stream_extractor',
    description: 'Master tool: Extract direct download/stream URLs with automatic redirect following',
    category: 'Media',
    parameters: [
      { name: 'url', type: 'string', description: 'Source page URL to extract from', required: false },
      { name: 'maxRedirects', type: 'number', description: 'Maximum redirects to follow', required: false, default: 10 },
      { name: 'waitForCountdown', type: 'boolean', description: 'Wait for countdown timers', required: false, default: true },
    ],
  },
  // Advanced Tools
  search_content: {
    name: 'search_content',
    description: 'Search text or Regex patterns in page content',
    category: 'Advanced',
    parameters: [
      { name: 'pattern', type: 'string', description: 'Search pattern (text or regex)', required: true },
      { name: 'isRegex', type: 'boolean', description: 'Treat pattern as regex', required: false, default: false },
    ],
  },
  extract_json: {
    name: 'extract_json',
    description: 'Extract embedded JSON/API data from page (LD+JSON, __NEXT_DATA__, etc.)',
    category: 'Advanced',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS selector for script tags', required: false },
      { name: 'variableName', type: 'string', description: 'Window variable name to extract', required: false },
    ],
  },
  scrape_meta_tags: {
    name: 'scrape_meta_tags',
    description: 'Extract SEO and Open Graph meta tags from page',
    category: 'Advanced',
    parameters: [
      { name: 'includeOG', type: 'boolean', description: 'Include Open Graph tags', required: false, default: true },
      { name: 'includeTwitter', type: 'boolean', description: 'Include Twitter cards', required: false, default: true },
    ],
  },
  deep_analysis: {
    name: 'deep_analysis',
    description: 'Comprehensive analysis: Console logs, Network traffic, DOM stats',
    category: 'Advanced',
    parameters: [
      { name: 'includeConsole', type: 'boolean', description: 'Include console logs', required: false, default: true },
      { name: 'includeNetwork', type: 'boolean', description: 'Include network requests', required: false, default: true },
      { name: 'duration', type: 'number', description: 'Recording duration in ms', required: false, default: 5000 },
    ],
  },
  network_recorder: {
    name: 'network_recorder',
    description: 'Record full network traffic including headers and body',
    category: 'Advanced',
    parameters: [
      { name: 'duration', type: 'number', description: 'Recording duration in ms', required: false, default: 10000 },
      { name: 'filterUrl', type: 'string', description: 'Filter requests by URL pattern', required: false },
    ],
  },
  api_finder: {
    name: 'api_finder',
    description: 'Discover hidden API endpoints by monitoring network traffic',
    category: 'Advanced',
    parameters: [
      { name: 'patterns', type: 'array', description: 'URL patterns to match', required: false },
      { name: 'includeInternal', type: 'boolean', description: 'Include internal XHR/fetch', required: false, default: true },
    ],
  },
  ajax_content_waiter: {
    name: 'ajax_content_waiter',
    description: 'Wait for dynamic AJAX/JavaScript content to load',
    category: 'Advanced',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS selector to wait for', required: false },
      { name: 'timeout', type: 'number', description: 'Maximum wait time in ms', required: false, default: 30000 },
      { name: 'expectedContent', type: 'string', description: 'Expected text content to wait for', required: false },
    ],
  },
  link_harvester: {
    name: 'link_harvester',
    description: 'Harvest all links from page with filtering options',
    category: 'Advanced',
    parameters: [
      { name: 'filter', type: 'string', description: 'Filter links by URL or text pattern', required: false },
      { name: 'includeExternal', type: 'boolean', description: 'Include external links', required: false, default: true },
      { name: 'maxLinks', type: 'number', description: 'Maximum links to return', required: false },
    ],
  },
  batch_element_scraper: {
    name: 'batch_element_scraper',
    description: 'Efficiently scrape lists of similar elements',
    category: 'Advanced',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS selector for elements to scrape', required: true },
      { name: 'attributes', type: 'array', description: 'Attributes to extract', required: false },
      { name: 'limit', type: 'number', description: 'Maximum elements to scrape', required: false, default: 100 },
    ],
  },
  extract_schema: {
    name: 'extract_schema',
    description: 'Extract Schema.org structured data (JSON-LD and Microdata)',
    category: 'Advanced',
    parameters: [
      { name: 'schemaTypes', type: 'array', description: 'Schema types to extract (e.g., Product, Article)', required: false },
    ],
  },
  element_screenshot: {
    name: 'element_screenshot',
    description: 'Capture screenshot of a specific element',
    category: 'Advanced',
    parameters: [
      { name: 'selector', type: 'string', description: 'CSS selector of element to capture', required: true },
      { name: 'path', type: 'string', description: 'File path to save screenshot', required: false },
      { name: 'format', type: 'string', description: 'Image format', required: false, enum: ['png', 'jpeg', 'webp'], default: 'png' },
    ],
  },
  breadcrumb_navigator: {
    name: 'breadcrumb_navigator',
    description: 'Navigate using site breadcrumbs - find and click breadcrumb links',
    category: 'Advanced',
    parameters: [
      { name: 'targetIndex', type: 'number', description: 'Index of breadcrumb to click (0-based)', required: false },
      { name: 'targetText', type: 'string', description: 'Text of breadcrumb to click', required: false },
    ],
  },
  redirect_tracer: {
    name: 'redirect_tracer',
    description: 'Trace URL redirects including standard, JavaScript, and meta refresh redirects',
    category: 'Advanced',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to trace redirects for', required: true },
      { name: 'maxRedirects', type: 'number', description: 'Maximum redirects to follow', required: false, default: 10 },
    ],
  },
  progress_tracker: {
    name: 'progress_tracker',
    description: 'Track automation progress for multi-step tasks',
    category: 'Advanced',
    parameters: [
      { name: 'taskName', type: 'string', description: 'Name of the task', required: true },
      { name: 'currentStep', type: 'number', description: 'Current step number', required: true },
      { name: 'totalSteps', type: 'number', description: 'Total number of steps', required: true },
    ],
  },
  cookie_manager: {
    name: 'cookie_manager',
    description: 'Manage browser cookies for premium accounts and sessions',
    category: 'Advanced',
    parameters: [
      { name: 'action', type: 'string', description: 'Cookie action to perform', required: true, enum: ['get', 'set', 'delete', 'export', 'import', 'clear'] },
      { name: 'domain', type: 'string', description: 'Domain to filter cookies', required: false },
    ],
  },
  file_downloader: {
    name: 'file_downloader',
    description: 'Download a file from URL directly to disk with progress tracking',
    category: 'Advanced',
    parameters: [
      { name: 'url', type: 'string', description: 'URL of the file to download', required: true },
      { name: 'savePath', type: 'string', description: 'Absolute path where to save the file', required: true },
      { name: 'overwrite', type: 'boolean', description: 'Overwrite existing file', required: false, default: false },
    ],
  },
  iframe_handler: {
    name: 'iframe_handler',
    description: 'Extract content from nested iframes including embedded video players',
    category: 'Advanced',
    parameters: [
      { name: 'action', type: 'string', description: 'Action to perform on iframes', required: false, enum: ['list', 'enter', 'extract', 'exitAll'] },
      { name: 'selector', type: 'string', description: 'CSS selector of target iframe', required: false },
    ],
  },
  popup_handler: {
    name: 'popup_handler',
    description: 'Handle popups, new tabs, and ad overlays during navigation',
    category: 'Advanced',
    parameters: [
      { name: 'action', type: 'string', description: 'Popup handling action', required: false, enum: ['block', 'allow', 'close', 'switch', 'list', 'closeAll'] },
      { name: 'autoCloseAds', type: 'boolean', description: 'Automatically close detected ad popups', required: false, default: true },
    ],
  },
};

// ============================================================
// LSP SERVER
// ============================================================

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

// Track document diagnostics
const documentDiagnostics = new Map<string, any[]>();

connection.onInitialize(() => {
  console.error('🦁 Brave Browser LSP Server v2.22.0 starting...');
  console.error(`📋 Loaded ${Object.keys(TOOL_DEFINITIONS).length} tool definitions`);

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ['.', '(', '{', '"', "'", ' '],
        resolveProvider: true,
      },
      hoverProvider: true,
      signatureHelpProvider: {
        triggerCharacters: ['(', ','],
        retriggerCharacters: [','],
      },
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix],
      },
    },
  };
});

connection.onInitialized(() => {
  console.error('✅ Brave Browser LSP Server initialized with full IDE support');
});

// ============================================================
// COMPLETION (Autocomplete)
// ============================================================

connection.onCompletion((params: any) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const text = document.getText();
  const offset = document.offsetAt(params.position);
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
  const lineText = text.substring(lineStart, offset);

  const completions: any[] = [];

  // Tool name completions
  for (const [name, def] of Object.entries(TOOL_DEFINITIONS)) {
    if (name.toLowerCase().startsWith(lineText.trim().toLowerCase()) || lineText.trim() === '') {
      completions.push({
        label: name,
        kind: CompletionItemKind.Function,
        detail: `[${def.category}] ${def.description.substring(0, 60)}...`,
        documentation: {
          kind: 'markdown',
          value: formatToolDoc(def),
        },
        insertText: `${name}({$1})`,
        insertTextFormat: 2, // Snippet
        sortText: getSortPrefix(def.category) + name,
        data: { type: 'tool', name },
      });
    }
  }

  // Parameter completions (inside tool call)
  const toolMatch = lineText.match(/(\w+)\s*\(\s*\{([^}]*)$/);
  if (toolMatch) {
    const toolName = toolMatch[1];
    const def = TOOL_DEFINITIONS[toolName];
    if (def) {
      const existingParams = toolMatch[2].split(',').map(p => p.split(':')[0].trim());

      for (const param of def.parameters) {
        if (!existingParams.includes(param.name)) {
          completions.push({
            label: param.name,
            kind: CompletionItemKind.Property,
            detail: `${param.type}${param.required ? ' (required)' : ''}`,
            documentation: param.description,
            insertText: param.type === 'string'
              ? `${param.name}: "$1"`
              : param.type === 'boolean'
                ? `${param.name}: ${param.default ?? 'true'}`
                : `${param.name}: $1`,
            insertTextFormat: 2,
            sortText: param.required ? '0' + param.name : '1' + param.name,
          });
        }
      }
    }
  }

  return completions;
});

connection.onCompletionResolve((item: any) => {
  if (item.data?.type === 'tool') {
    const def = TOOL_DEFINITIONS[item.data.name];
    if (def) {
      item.documentation = {
        kind: 'markdown',
        value: formatToolDoc(def),
      };
    }
  }
  return item;
});

// ============================================================
// HOVER
// ============================================================

connection.onHover((params: any) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const text = document.getText();
  const offset = document.offsetAt(params.position);

  // Find word at position
  const wordStart = text.substring(0, offset).search(/\w+$/);
  if (wordStart < 0) return null;
  const wordEnd = offset + text.substring(offset).search(/[^\w]|$/);
  const word = text.substring(wordStart, wordEnd);

  const def = TOOL_DEFINITIONS[word];
  if (def) {
    return {
      contents: {
        kind: 'markdown',
        value: formatToolDoc(def),
      },
    };
  }

  return null;
});

// ============================================================
// SIGNATURE HELP
// ============================================================

connection.onSignatureHelp((params: any) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const text = document.getText();
  const offset = document.offsetAt(params.position);
  const textBefore = text.substring(0, offset);

  // Find the current function call
  const match = textBefore.match(/(\w+)\s*\(\s*\{?[^)]*$/);
  if (!match) return null;

  const toolName = match[1];
  const def = TOOL_DEFINITIONS[toolName];
  if (!def) return null;

  // Build signature
  const paramStrings = def.parameters.map(p =>
    `${p.name}${p.required ? '' : '?'}: ${p.type}`
  );

  return {
    signatures: [{
      label: `${toolName}({ ${paramStrings.join(', ')} })`,
      documentation: {
        kind: 'markdown',
        value: def.description,
      },
      parameters: def.parameters.map(p => ({
        label: `${p.name}${p.required ? '' : '?'}: ${p.type}`,
        documentation: {
          kind: 'markdown',
          value: `**${p.name}** (${p.type}${p.required ? ', required' : ''})\n\n${p.description}`,
        },
      })),
    }],
    activeSignature: 0,
    activeParameter: 0,
  };
});

// ============================================================
// DIAGNOSTICS
// ============================================================

documents.onDidChangeContent((change: any) => {
  validateDocument(change.document);
});

function validateDocument(document: any): void {
  const text = document.getText();
  const diagnostics: any[] = [];

  // Pattern to find tool calls
  const toolCallPattern = /(\w+)\s*\(\s*\{([^}]*)\}\s*\)/g;
  let match;

  while ((match = toolCallPattern.exec(text)) !== null) {
    const toolName = match[1];
    const argsText = match[2];
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);

    const def = TOOL_DEFINITIONS[toolName];
    if (!def) continue;

    // Check required parameters
    const providedParams = argsText.split(',')
      .map((p: string) => p.split(':')[0].trim())
      .filter((p: string) => p.length > 0);

    for (const param of def.parameters) {
      if (param.required && !providedParams.includes(param.name)) {
        diagnostics.push({
          range: { start: startPos, end: endPos },
          message: `Missing required parameter '${param.name}' in ${toolName}()`,
          severity: DiagnosticSeverity.Error,
          source: 'brave-lsp',
          code: 'missing-param',
        });
      }
    }
  }

  // Workflow validation
  const hasBrowserInit = /browser_init\s*\(/.test(text);
  const hasNavigate = /navigate\s*\(/.test(text);

  if (!hasBrowserInit && hasNavigate) {
    const navMatch = text.match(/navigate\s*\(/);
    if (navMatch && navMatch.index !== undefined) {
      const pos = document.positionAt(navMatch.index);
      diagnostics.push({
        range: { start: pos, end: { line: pos.line, character: pos.character + 8 } },
        message: 'browser_init() should be called before navigate()',
        severity: DiagnosticSeverity.Warning,
        source: 'brave-lsp',
        code: 'workflow-order',
      });
    }
  }

  documentDiagnostics.set(document.uri, diagnostics);
  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

// ============================================================
// CODE ACTIONS
// ============================================================

connection.onCodeAction((params: any) => {
  const actions: any[] = [];

  for (const diagnostic of params.context.diagnostics) {
    if (diagnostic.code === 'workflow-order') {
      actions.push({
        title: 'Add browser_init() at the beginning',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
          changes: {
            [params.textDocument.uri]: [{
              range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
              newText: 'await browser_init({ headless: false });\n\n',
            }],
          },
        },
      });
    }
  }

  return actions;
});

// ============================================================
// HELPERS
// ============================================================

function formatToolDoc(def: any): string {
  const parts: string[] = [];

  parts.push(`## ${def.name}`);
  parts.push(`**Category:** ${def.category}\n`);
  parts.push(def.description);

  if (def.parameters.length > 0) {
    parts.push('\n### Parameters\n');
    for (const param of def.parameters) {
      const requiredTag = param.required ? ' *(required)*' : '';
      const defaultTag = param.default !== undefined ? ` (default: \`${JSON.stringify(param.default)}\`)` : '';
      const enumTag = param.enum ? `\n  - Options: ${param.enum.map((e: string) => `\`${e}\``).join(', ')}` : '';
      parts.push(`- **${param.name}**: \`${param.type}\`${requiredTag}${defaultTag}${enumTag}`);
      if (param.description) {
        parts.push(`  - ${param.description}`);
      }
    }
  }

  if (def.examples && def.examples.length > 0) {
    parts.push('\n### Examples\n');
    parts.push('```javascript');
    parts.push(def.examples.join('\n'));
    parts.push('```');
  }

  return parts.join('\n');
}

function getSortPrefix(category: string): string {
  switch (category) {
    case 'Browser Management': return '0';
    case 'Navigation': return '1';
    case 'Interaction': return '2';
    case 'Content': return '3';
    case 'Media': return '4';
    default: return '9';
  }
}

// ============================================================
// START SERVER
// ============================================================

documents.listen(connection);
connection.listen();

console.error('🦁 Brave Browser LSP Server Listening');
console.error(`📋 ${Object.keys(TOOL_DEFINITIONS).length} tools available for autocomplete`);
