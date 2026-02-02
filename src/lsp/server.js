/**
 * Brave Real Browser LSP Server
 * 
 * Supports both STDIO and TCP transports:
 * - STDIO: For direct IDE connections (npm run lsp)
 * - TCP: For running alongside MCP server (npm run dev)
 */
const net = require('net');
const { createConnection, TextDocuments, ProposedFeatures, TextDocumentSyncKind, MarkupKind } = require('vscode-languageserver/node');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { TOOLS } = require('../mcp/tools.js');
const { getCompletions } = require('./capabilities/autocomplete.js');
const { getHoverInfo } = require('./capabilities/hover.js');
const { getDiagnostics } = require('./capabilities/diagnostics.js');
const { getSnippets } = require('./capabilities/snippets.js');
const { getRefactorings } = require('./capabilities/refactoring.js');
const { simulateWorkflow } = require('./capabilities/simulation.js');
const { getLanguagePack } = require('./utils/i18n.js');

// Default settings
let settings = { 
  language: 'en', 
  maxDiagnostics: 100, 
  enableSnippets: true, 
  enableSimulation: true, 
  enableRefactoring: true 
};

// LSP port for TCP mode
const LSP_PORT = process.env.LSP_PORT || 7777;

/**
 * Setup LSP connection handlers
 */
function setupConnection(connection) {
  const documents = new TextDocuments(TextDocument);

  connection.onInitialize(() => ({
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: { resolveProvider: true, triggerCharacters: ['.', "'", '"', '(', '{', ' '] },
      hoverProvider: true,
      codeActionProvider: true,
      codeLensProvider: { resolveProvider: true },
      signatureHelpProvider: { triggerCharacters: ['(', ','] },
      documentSymbolProvider: true,
    },
  }));

  connection.onDidChangeConfiguration((change) => {
    if (change.settings?.braveRealBrowser) {
      settings = { ...settings, ...change.settings.braveRealBrowser };
    }
    documents.all().forEach((doc) => validateDocument(connection, doc));
  });

  connection.onCompletion((params) => {
    const doc = documents.get(params.textDocument.uri);
    return doc ? getCompletions(doc, params.position, TOOLS, getLanguagePack(settings.language), settings) : [];
  });

  connection.onCompletionResolve((item) => {
    const lang = getLanguagePack(settings.language);
    const tool = TOOLS.find(t => t.name === item.data?.toolName);
    if (tool && lang.tools[tool.name]) {
      const tl = lang.tools[tool.name];
      item.documentation = { 
        kind: MarkupKind.Markdown, 
        value: `### ${tool.emoji} ${tl.label}\n\n${tl.documentation}\n\n**Parameters:**\n${Object.entries(tl.parameters || {}).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n')}` 
      };
    }
    return item;
  });

  connection.onHover((params) => {
    const doc = documents.get(params.textDocument.uri);
    return doc ? getHoverInfo(doc, params.position, TOOLS, getLanguagePack(settings.language)) : null;
  });

  function validateDocument(conn, doc) {
    conn.sendDiagnostics({ 
      uri: doc.uri, 
      diagnostics: getDiagnostics(doc, TOOLS, getLanguagePack(settings.language), settings.maxDiagnostics) 
    });
  }

  documents.onDidChangeContent((change) => validateDocument(connection, change.document));

  connection.onCodeAction((params) => {
    const doc = documents.get(params.textDocument.uri);
    return doc ? getRefactorings(doc, params.range, params.context, TOOLS, getLanguagePack(settings.language)) : [];
  });

  connection.onCodeLens((params) => {
    const doc = documents.get(params.textDocument.uri);
    return doc ? simulateWorkflow(doc, TOOLS, getLanguagePack(settings.language)) : [];
  });

  connection.onCodeLensResolve((lens) => lens);

  connection.onRequest('braveRealBrowser/snippets', (params) => 
    getSnippets(params?.category, TOOLS, getLanguagePack(settings.language))
  );

  documents.listen(connection);
  connection.listen();
  
  return connection;
}

/**
 * Start LSP server in STDIO mode
 */
function startStdioServer() {
  const connection = createConnection(ProposedFeatures.all, process.stdin, process.stdout);
  setupConnection(connection);
  console.error('🦁 Brave Real Browser LSP Server started (STDIO)');
  return connection;
}

/**
 * Start LSP server in TCP mode
 */
function startTcpServer(port = LSP_PORT) {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => {
      console.error(`🔌 LSP client connected from ${socket.remoteAddress}`);
      
      const connection = createConnection(ProposedFeatures.all, socket, socket);
      setupConnection(connection);
      
      socket.on('close', () => {
        console.error('🔌 LSP client disconnected');
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️  LSP port ${port} already in use, trying ${port + 1}...`);
        server.close();
        startTcpServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.error(`🦁 Brave Real Browser LSP Server started (TCP: 127.0.0.1:${port})`);
      resolve({ server, port });
    });
  });
}

/**
 * Get transport mode from args or environment
 */
function getTransportMode() {
  if (process.argv.includes('--tcp')) return 'tcp';
  if (process.argv.includes('--stdio')) return 'stdio';
  if (process.env.LSP_TRANSPORT === 'tcp') return 'tcp';
  // Default: STDIO for direct invocation, TCP when embedded
  return process.env.LSP_EMBEDDED === 'true' ? 'tcp' : 'stdio';
}

// Export for programmatic use
module.exports = { 
  startStdioServer, 
  startTcpServer, 
  setupConnection,
  LSP_PORT 
};

// Auto-start if run directly
if (require.main === module) {
  const mode = getTransportMode();
  if (mode === 'tcp') {
    startTcpServer().catch(err => {
      console.error('❌ Failed to start LSP TCP server:', err.message);
      process.exit(1);
    });
  } else {
    startStdioServer();
  }
}
