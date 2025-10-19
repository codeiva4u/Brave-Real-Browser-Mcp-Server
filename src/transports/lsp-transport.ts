import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentSyncKind,
  InitializeResult,
  TextDocumentPositionParams,
  ExecuteCommandParams,
  Connection,
} from 'vscode-languageserver/node.js';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { TOOLS, TOOL_NAMES } from '../tool-definitions.js';

// Import all handlers
import { handleBrowserInit, handleBrowserClose } from '../handlers/browser-handlers.js';
import { handleNavigate, handleWait } from '../handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from '../handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from '../handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from '../handlers/file-handlers.js';

export class LspTransport {
  private connection: Connection;
  private documents: TextDocuments<TextDocument>;
  private hasWorkspaceFolderCapability = false;

  constructor() {
    // Create a connection for the server using Node's IPC as a transport
    this.connection = createConnection(ProposedFeatures.all);
    
    // Create a simple text document manager
    this.documents = new TextDocuments(TextDocument);
    
    this.setupHandlers();
    
    // Make the text document manager listen on the connection
    this.documents.listen(this.connection);
  }

  private setupHandlers(): void {
    // Initialize
    this.connection.onInitialize((params: InitializeParams) => {
      const capabilities = params.capabilities;

      this.hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
      );

      const result: InitializeResult = {
        capabilities: {
          textDocumentSync: TextDocumentSyncKind.Incremental,
          completionProvider: {
            resolveProvider: true,
            triggerCharacters: ['.', ':'],
          },
          executeCommandProvider: {
            commands: TOOLS.map(tool => `browser.${tool.name}`),
          },
          hoverProvider: true,
          definitionProvider: true,
        },
      };

      if (this.hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
          workspaceFolders: {
            supported: true,
          },
        };
      }

      return result;
    });

    this.connection.onInitialized(() => {
      console.error('✅ [LSP] Server initialized');
      
      if (this.hasWorkspaceFolderCapability) {
        this.connection.workspace.onDidChangeWorkspaceFolders((_event) => {
          console.error('[LSP] Workspace folder change event received');
        });
      }
    });

    // Completion
    this.connection.onCompletion(
      (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
        return TOOLS.map(tool => ({
          label: tool.name,
          kind: CompletionItemKind.Function,
          data: tool.name,
          detail: tool.description,
          documentation: JSON.stringify(tool.inputSchema, null, 2),
        }));
      }
    );

    this.connection.onCompletionResolve(
      (item: CompletionItem): CompletionItem => {
        return item;
      }
    );

    // Execute command (actual browser automation)
    this.connection.onExecuteCommand(async (params: ExecuteCommandParams) => {
      const commandName = params.command.replace('browser.', '');
      const args = params.arguments?.[0] || {};

      console.error(`[LSP] Executing command: ${commandName}`);

      try {
        const result = await this.executeTool(commandName, args);
        this.connection.window.showInformationMessage(
          `✅ Command ${commandName} executed successfully`
        );
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.connection.window.showErrorMessage(
          `❌ Command ${commandName} failed: ${errorMessage}`
        );
        throw error;
      }
    });

    // Hover information
    this.connection.onHover((params: TextDocumentPositionParams) => {
      const document = this.documents.get(params.textDocument.uri);
      if (!document) return null;

      const position = params.position;
      const word = this.getWordAtPosition(document, position);
      
      const tool = TOOLS.find(t => t.name === word);
      if (tool) {
        return {
          contents: {
            kind: 'markdown',
            value: [
              `**${tool.name}**`,
              '',
              tool.description,
              '',
              '**Parameters:**',
              '```json',
              JSON.stringify(tool.inputSchema, null, 2),
              '```',
            ].join('\n'),
          },
        };
      }

      return null;
    });
  }

  private getWordAtPosition(document: TextDocument, position: any): string {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    let start = offset;
    let end = offset;
    
    // Find word boundaries
    while (start > 0 && /\w/.test(text[start - 1])) start--;
    while (end < text.length && /\w/.test(text[end])) end++;
    
    return text.substring(start, end);
  }

  private async executeTool(toolName: string, args: any): Promise<any> {
    switch (toolName) {
      case TOOL_NAMES.BROWSER_INIT:
        return await handleBrowserInit(args || {});
      case TOOL_NAMES.NAVIGATE:
        return await handleNavigate(args);
      case TOOL_NAMES.GET_CONTENT:
        return await handleGetContent(args || {});
      case TOOL_NAMES.CLICK:
        return await handleClick(args);
      case TOOL_NAMES.TYPE:
        return await handleType(args);
      case TOOL_NAMES.WAIT:
        return await handleWait(args);
      case TOOL_NAMES.BROWSER_CLOSE:
        return await handleBrowserClose();
      case TOOL_NAMES.SOLVE_CAPTCHA:
        return await handleSolveCaptcha(args);
      case TOOL_NAMES.RANDOM_SCROLL:
        return await handleRandomScroll();
      case TOOL_NAMES.FIND_SELECTOR:
        return await handleFindSelector(args);
      case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN:
        return await handleSaveContentAsMarkdown(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async start(): Promise<void> {
    console.error('🔍 [LSP] Starting Language Server...');
    this.connection.listen();
    console.error('✅ [LSP] Language Server started and listening');
  }

  async stop(): Promise<void> {
    console.error('[LSP] Stopping server...');
    this.connection.dispose();
  }
}
