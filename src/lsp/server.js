/**
 * Brave Real Browser LSP Server
 */
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

const connection = createConnection(ProposedFeatures.all, process.stdin, process.stdout);
const documents = new TextDocuments(TextDocument);
let settings = { language: 'en', maxDiagnostics: 100, enableSnippets: true, enableSimulation: true, enableRefactoring: true };

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
  if (change.settings?.braveRealBrowser) settings = { ...settings, ...change.settings.braveRealBrowser };
  documents.all().forEach(validateDocument);
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
    item.documentation = { kind: MarkupKind.Markdown, value: `### ${tool.emoji} ${tl.label}\n\n${tl.documentation}\n\n**Parameters:**\n${Object.entries(tl.parameters || {}).map(([k, v]) => `- \`${k}\`: ${v}`).join('\n')}` };
  }
  return item;
});

connection.onHover((params) => {
  const doc = documents.get(params.textDocument.uri);
  return doc ? getHoverInfo(doc, params.position, TOOLS, getLanguagePack(settings.language)) : null;
});

function validateDocument(doc) {
  connection.sendDiagnostics({ uri: doc.uri, diagnostics: getDiagnostics(doc, TOOLS, getLanguagePack(settings.language), settings.maxDiagnostics) });
}

documents.onDidChangeContent((change) => validateDocument(change.document));

connection.onCodeAction((params) => {
  const doc = documents.get(params.textDocument.uri);
  return doc ? getRefactorings(doc, params.range, params.context, TOOLS, getLanguagePack(settings.language)) : [];
});

connection.onCodeLens((params) => {
  const doc = documents.get(params.textDocument.uri);
  return doc ? simulateWorkflow(doc, TOOLS, getLanguagePack(settings.language)) : [];
});

connection.onCodeLensResolve((lens) => lens);

connection.onRequest('braveRealBrowser/snippets', (params) => getSnippets(params?.category, TOOLS, getLanguagePack(settings.language)));

documents.listen(connection);
connection.listen();
console.error('🦁 Brave Real Browser LSP Server started');
