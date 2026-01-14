/**
 * LSP-MCP Bridge - Connects LSP Server with MCP Server
 * Enables automatic LSP context enrichment for MCP tool calls
 */

import { createConnection, DiagnosticSeverity, TextDocuments, TextDocument, TextDocumentSyncKind, InitializeParams } from 'vscode-languageserver';
import {
  SharedEventBus,
  getSharedEventBus,
} from '../shared/event-bus.js';

// Tool definitions from LSP perspective
const TOOL_DEFINITIONS = {
  browser_init: {
    name: 'browser_init',
    description: 'Initialize browser with stealth mode',
    parameters: {
      type: 'object',
      properties: {
        headless: { type: 'boolean', description: 'Run browser in headless mode' },
        proxy: { type: 'string', description: 'Proxy URL' },
      },
    },
  },
  navigate: {
    name: 'navigate',
    description: 'Navigate to a URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
      },
      required: ['url'],
    },
  },
  get_content: {
    name: 'get_content',
    description: 'Extract page content (HTML/text)',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  click: {
    name: 'click',
    description: 'Click on an element',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or text to find element' },
      },
      required: ['selector'],
    },
  },
  type: {
    name: 'type',
    description: 'Type text into an input',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector or text to find element' },
        text: { type: 'string', description: 'Text to type' },
      },
      required: ['selector', 'text'],
    },
  },
  wait: {
    name: 'wait',
    description: 'Wait for conditions',
    parameters: {
      type: 'object',
      properties: {
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
    },
  },
  find_element: {
    name: 'find_element',
    description: 'Find elements using various selectors',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Selector to find' },
      },
      required: ['selector'],
    },
  },
  solve_captcha: {
    name: 'solve_captcha',
    description: 'Solve CAPTCHAs automatically',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  random_scroll: {
    name: 'random_scroll',
    description: 'Perform natural scrolling',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  save_content_as_markdown: {
    name: 'save_content_as_markdown',
    description: 'Save page content as Markdown',
    parameters: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'File path to save to' },
      },
      required: ['filePath'],
    },
  },
} as const;

// LSP diagnostic cache
interface DiagnosticCache {
  uri: string;
  diagnostics: Array<{
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    severity: number;
    message: string;
    source?: string;
  }>;
  timestamp: number;
}

/**
 * LSPBridge - Connects LSP functionality with MCP server
 */
export class LSPBridge {
  private connection: any;
  private eventBus: SharedEventBus;
  private diagnosticCache: Map<string, DiagnosticCache> = new Map();
  private activeMCPContext: Map<string, any> = new Map();

  constructor(eventBus?: SharedEventBus) {
    this.eventBus = eventBus || getSharedEventBus();
    this.setupLSPConnection();
    this.setupEventListeners();
  }

  /**
   * Setup LSP connection
   */
  private setupLSPConnection(): void {
    this.connection = createConnection(
      {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            triggerCharacters: ['.'],
            resolveProvider: false,
          },
          hoverProvider: true,
          definitionProvider: true,
          referencesProvider: true,
          diagnosticProvider: {
            interFileDependencies: false,
            workspaceDiagnostics: false,
          },
        },
      },
      {
        sendMessage: (msg: unknown) => {
          console.log('[LSP Bridge] Sending message:', msg);
        },
        onMessage: () => {
          // Handle incoming messages
        },
        onError: (err: Error) => {
          console.error('[LSP Bridge] Error:', err);
        },
        onClose: () => {
          console.log('[LSP Bridge] Connection closed');
        },
      }
    );

    // Handle initialization
    this.connection.onInitialize((params: InitializeParams) => {
      console.log('[LSP Bridge] Initialized with client:', params.clientInfo?.name);
      return {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            triggerCharacters: ['.'],
            resolveProvider: false,
          },
          hoverProvider: true,
          definitionProvider: true,
          referencesProvider: true,
          diagnosticProvider: {
            interFileDependencies: false,
            workspaceDiagnostics: false,
          },
        },
      };
    });

    // Provide completions
    this.connection.onCompletion((textDocumentPosition: any) => {
      const text = textDocumentPosition.textDocument.getText();
      const line = text.split('\n')[textDocumentPosition.position.line] || '';
      const completions: any[] = [];

      // Tool name completions
      for (const [name, def] of Object.entries(TOOL_DEFINITIONS)) {
        const desc = (def as any).description;
        if (name.startsWith(line.trim()) || line.trim() === '') {
          completions.push({
            label: name,
            kind: 3,
            detail: desc,
            documentation: desc,
            insertText: `${name}(`,
            data: { type: 'tool', name },
          });
        }
      }

      return completions;
    });

    // Handle hover
    this.connection.onHover(async (textDocumentPosition: any) => {
      const uri = textDocumentPosition.textDocument.uri;
      const position = textDocumentPosition.position;

      this.eventBus.publish({
        type: 'lsp:hoverRequested',
        data: {
          uri,
          position: { line: position.line, character: position.character },
          timestamp: Date.now(),
        },
      } as any);

      const text = textDocumentPosition.textDocument.getText();
      const line = text.split('\n')[textDocumentPosition.position.line] || '';
      const words = line.split('').filter((c: string) => /\w/.test(c));
      const word = words[textDocumentPosition.position.character] || '';

      let result: any = null;

      // Check if it's a tool name
      if (word && TOOL_DEFINITIONS[word as keyof typeof TOOL_DEFINITIONS]) {
        const toolDef = TOOL_DEFINITIONS[word as keyof typeof TOOL_DEFINITIONS];
        result = {
          contents: {
            kind: 'markdown',
            value: `**${word}**\n\n${(toolDef as any).description}\n\n\`\`\`json\n${JSON.stringify((toolDef as any).parameters, null, 2)}\n\`\`\``,
          },
        };

        this.eventBus.publish({
          type: 'lsp:hoverResult',
          data: {
            uri,
            position: { line: position.line, character: position.character },
            contents: result.contents,
            timestamp: Date.now(),
          },
        } as any);
      }

      return result;
    });

    // Handle definition requests
    this.connection.onDefinition(async (textDocumentPosition: any) => {
      const uri = textDocumentPosition.textDocument.uri;
      const position = textDocumentPosition.position;

      this.eventBus.publish({
        type: 'lsp:definitionRequested',
        data: {
          uri,
          position: { line: position.line, character: position.character },
          timestamp: Date.now(),
        },
      } as any);

      const text = textDocumentPosition.textDocument.getText();
      const line = text.split('\n')[textDocumentPosition.position.line] || '';
      const words = line.split('').filter((c: string) => /\w/.test(c));
      const word = words[textDocumentPosition.position.character] || '';

      let definitions: any[] = [];

      if (word && TOOL_DEFINITIONS[word as keyof typeof TOOL_DEFINITIONS]) {
        definitions = [
          {
            uri: 'mcp://tools/definitions',
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: word.length },
            },
          },
        ];

        this.eventBus.publish({
          type: 'lsp:definitionFound',
          data: {
            uri,
            position: { line: position.line, character: position.character },
            definitions,
            timestamp: Date.now(),
          },
        } as any);
      }

      return definitions;
    });

    // Handle references requests
    this.connection.onReferences(async (textDocumentPosition: any) => {
      const uri = textDocumentPosition.textDocument.uri;
      const position = textDocumentPosition.position;

      this.eventBus.publish({
        type: 'lsp:referencesRequested',
        data: {
          uri,
          position: { line: position.line, character: position.character },
          timestamp: Date.now(),
        },
      } as any);

      const references: any[] = [];

      this.eventBus.publish({
        type: 'lsp:referencesFound',
        data: {
          uri,
          position: { line: position.line, character: position.character },
          references,
          timestamp: Date.now(),
        },
      } as any);

      return references;
    });

    this.connection.listen();

    console.log('[LSP Bridge] LSP server listening');
  }

  /**
   * Setup event listeners for MCP integration
   */
  private setupEventListeners(): void {
    this.eventBus.subscribe('mcp:toolCalled' as any, async (event: any) => {
      if (event.data.toolName) {
        await this.enrichMCPContextWithLSP(event.data.toolName, event.data.args);
      }
    });

    this.eventBus.subscribe('mcp:toolCompleted' as any, async (event: any) => {
      await this.updateDiagnosticsAfterTool(event.data.toolName);
    });

    this.eventBus.subscribe('mcp:toolFailed' as any, async (event: any) => {
      await this.reportDiagnosticsForError(event.data.toolName, event.data.error);
    });
  }

  /**
   * Enrich MCP context with LSP information
   */
  private async enrichMCPContextWithLSP(toolName: string, args: Record<string, unknown>): Promise<void> {
    const toolDef = TOOL_DEFINITIONS[toolName as keyof typeof TOOL_DEFINITIONS];

    if (!toolDef) {
      this.activeMCPContext.set(toolName, {
        toolName,
        valid: false,
        error: 'Unknown tool',
      });
      return;
    }

    const context = {
      toolName,
      definition: toolDef,
      parameters: (toolDef as any).parameters,
      validatedArgs: this.validateArgs((toolDef as any).parameters, args),
      timestamp: Date.now(),
    };

    this.activeMCPContext.set(toolName, context);

    this.eventBus.publish({
      type: 'sync:lspContextUpdated',
      data: {
        context,
        timestamp: Date.now(),
      },
    } as any);
  }

  /**
   * Validate arguments against parameter definition
   */
  private validateArgs(parameters: any, args: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const required = parameters.required || [];

    for (const req of required) {
      if (!(req in args)) {
        errors.push(`Missing required parameter: ${req}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Update diagnostics after tool execution
   */
  private async updateDiagnosticsAfterTool(toolName: string): Promise<void> {
    const context = this.activeMCPContext.get(toolName);

    if (context) {
      console.log(`[LSP Bridge] Tool ${toolName} completed successfully`);
    }
  }

  /**
   * Report diagnostics for tool errors
   */
  private async reportDiagnosticsForError(toolName: string, error: string): Promise<void> {
    console.error(`[LSP Bridge] Tool ${toolName} failed: ${error}`);
  }

  /**
   * Get cached diagnostics for a URI
   */
  getDiagnostics(uri: string): DiagnosticCache | null {
    return this.diagnosticCache.get(uri) || null;
  }

  /**
   * Get active MCP context
   */
  getMCPContext(toolName?: string): any {
    if (toolName) {
      return this.activeMCPContext.get(toolName);
    }
    return Object.fromEntries(this.activeMCPContext);
  }

  /**
   * Start LSP server
   */
  start(): void {
    console.log('[LSP Bridge] LSP Bridge started');
  }

  /**
   * Stop the LSP server
   */
  stop(): void {
    this.connection.dispose();
    console.log('[LSP Bridge] LSP Bridge stopped');
  }
}

// Singleton instance
let lspBridgeInstance: LSPBridge | null = null;

export function getLSPBridge(eventBus?: SharedEventBus): LSPBridge {
  if (!lspBridgeInstance) {
    lspBridgeInstance = new LSPBridge(eventBus);
  }
  return lspBridgeInstance;
}

export function resetLSPBridge(): void {
  if (lspBridgeInstance) {
    lspBridgeInstance.stop();
    lspBridgeInstance = null;
  }
}
