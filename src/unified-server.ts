#!/usr/bin/env node

/**
 * Brave Real Browser - Unified MCP+LSP+SSE Server
 * Single command starts all protocols as one ecosystem
 * 
 * Usage: npm run dev:unified
 * 
 * Endpoints:
 * - /mcp         → MCP over HTTP Stream
 * - /mcp/sse     → SSE streaming for real-time updates
 * - /mcp/message → SSE message handler
 * - /lsp/*       → LSP over HTTP (completion, hover, signature)
 * - /health      → Health check
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ListPromptsRequestSchema,
    InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';

// Import core modules
import { TOOLS, SERVER_INFO, CAPABILITIES, TOOL_NAMES } from './tool-definitions.js';
import { getSharedEventBus } from './shared/event-bus.js';
import { getProgressNotifier } from './transport/progress-notifier.js';
import { getSessionManager } from './transport/session-manager.js';
import { closeBrowser, forceKillAllBraveProcesses, getPageInstance } from './browser-manager.js';
import { setupProcessCleanup } from './core-infrastructure.js';

// Import handlers
import { handleBrowserInit, handleBrowserClose } from './handlers/browser-handlers.js';
import { handleNavigate, handleWait } from './handlers/navigation-handlers.js';
import { handleClick, handleType, handleSolveCaptcha, handleRandomScroll } from './handlers/interaction-handlers.js';
import { handleGetContent, handleFindSelector } from './handlers/content-handlers.js';
import { handleSaveContentAsMarkdown } from './handlers/file-handlers.js';
import * as advancedTools from './handlers/advanced-tools.js';

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = parseInt(process.env.MCP_PORT || '3000', 10);
const HOST = process.env.MCP_HOST || 'localhost';
const DEBUG = process.env.DEBUG === 'true';

const debug = (...args: unknown[]) => {
    if (DEBUG) console.error('🔍 [DEBUG]', ...args);
};

// ============================================================
// SHARED STATE
// ============================================================

const eventBus = getSharedEventBus();
const sessionManager = getSessionManager();
const progressNotifier = getProgressNotifier();
const sseTransports = new Map<string, SSEServerTransport>();

// LSP Tool definitions for HTTP LSP
const LSP_TOOLS = Object.fromEntries(
    TOOLS.map(t => [t.name, {
        description: t.description,
        parameters: t.inputSchema?.properties || {}
    }])
);

// ============================================================
// MCP SERVER SETUP
// ============================================================

const mcpServer = new Server(SERVER_INFO, { capabilities: CAPABILITIES });

// Register handlers
mcpServer.setRequestHandler(InitializeRequestSchema, async (request) => {
    debug('Initialize request received');
    return {
        protocolVersion: request.params.protocolVersion,
        capabilities: CAPABILITIES,
        serverInfo: { ...SERVER_INFO, metadata: { unified: true } },
    };
});

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: [] }));
mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [] }));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    debug(`Tool call: ${name}`);

    // Publish to event bus for auto-sync
    eventBus.publish({
        type: 'mcp:toolCalled',
        data: { toolName: name, args: args || {}, timestamp: Date.now() },
    } as any);

    const page = getPageInstance();

    try {
        let result: any;

        switch (name) {
            case TOOL_NAMES.BROWSER_INIT: result = await handleBrowserInit(args || {}); break;
            case TOOL_NAMES.NAVIGATE: result = await handleNavigate(args as any); break;
            case TOOL_NAMES.GET_CONTENT: result = await handleGetContent(args || {}); break;
            case TOOL_NAMES.CLICK: result = await handleClick(args as any); break;
            case TOOL_NAMES.TYPE: result = await handleType(args as any); break;
            case TOOL_NAMES.WAIT: result = await handleWait(args as any); break;
            case TOOL_NAMES.BROWSER_CLOSE: result = await handleBrowserClose(); break;
            case TOOL_NAMES.SOLVE_CAPTCHA: result = await handleSolveCaptcha(args as any); break;
            case TOOL_NAMES.RANDOM_SCROLL: result = await handleRandomScroll(); break;
            case TOOL_NAMES.FIND_ELEMENT: result = await handleFindSelector(args as any); break;
            case TOOL_NAMES.SAVE_CONTENT_AS_MARKDOWN: result = await handleSaveContentAsMarkdown(args as any); break;
            // Advanced tools
            case TOOL_NAMES.BREADCRUMB_NAVIGATOR:
                if (!page) throw new Error('Browser not initialized');
                result = { content: [{ type: 'text', text: JSON.stringify(await advancedTools.handleBreadcrumbNavigator(page, args || {})) }] };
                break;
            case TOOL_NAMES.REDIRECT_TRACER:
                if (!page) throw new Error('Browser not initialized');
                result = { content: [{ type: 'text', text: JSON.stringify(await advancedTools.handleUrlRedirectTracer(page, args as any)) }] };
                break;
            case TOOL_NAMES.SEARCH_CONTENT:
                if (!page) throw new Error('Browser not initialized');
                result = { content: [{ type: 'text', text: JSON.stringify(await advancedTools.handleSearchContent(page, args as any)) }] };
                break;
            // MEDIA_EXTRACTOR case REMOVED - merged into STREAM_EXTRACTOR
            case TOOL_NAMES.STREAM_EXTRACTOR:
                if (!page) throw new Error('Browser not initialized');
                result = { content: [{ type: 'text', text: JSON.stringify(await advancedTools.handleStreamExtractor(page, args as any)) }] };
                break;
            case TOOL_NAMES.COOKIE_MANAGER:
                if (!page) throw new Error('Browser not initialized');
                result = { content: [{ type: 'text', text: JSON.stringify(await advancedTools.handleCookieManager(page, args as any)) }] };
                break;
            case TOOL_NAMES.FILE_DOWNLOADER:
                if (!page) throw new Error('Browser not initialized');
                result = { content: [{ type: 'text', text: JSON.stringify(await advancedTools.handleFileDownloader(page, args as any)) }] };
                break;
            default:
                // Try to handle other advanced tools dynamically
                if (page) {
                    const handlerName = 'handle' + name.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
                    if ((advancedTools as any)[handlerName]) {
                        result = { content: [{ type: 'text', text: JSON.stringify(await (advancedTools as any)[handlerName](page, args || {})) }] };
                    } else {
                        throw new Error(`Unknown tool: ${name}`);
                    }
                } else {
                    throw new Error(`Unknown tool: ${name}`);
                }
        }

        // Publish completion
        eventBus.publish({
            type: 'mcp:toolCompleted',
            data: { toolName: name, result, timestamp: Date.now() },
        } as any);

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        eventBus.publish({
            type: 'mcp:toolFailed',
            data: { toolName: name, error: errorMessage, timestamp: Date.now() },
        } as any);
        return { content: [{ type: 'text', text: `❌ Error: ${errorMessage}` }], isError: true };
    }
});

// ============================================================
// HTTP SERVER WITH ALL ENDPOINTS
// ============================================================

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Id, Mcp-Session-Id');
    res.setHeader('Access-Control-Expose-Headers', 'X-Session-Id');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ========== HEALTH CHECK ==========
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            server: 'brave-real-browser-unified',
            version: SERVER_INFO.version,
            protocols: { mcp: true, lsp: true, sse: true },
            sessions: sessionManager.getStats(),
            eventBus: eventBus.getStats(),
        }));
        return;
    }

    // ========== SSE ENDPOINT ==========
    if (url.pathname === '/mcp/sse' && req.method === 'GET') {
        const sessionId = (req.headers['x-session-id'] as string) || randomUUID();
        const session = sessionManager.createSession('sse-client', { transportType: 'sse' });

        const transport = new SSEServerTransport('/mcp/message', res);
        sseTransports.set(session.sessionId, transport);

        res.setHeader('X-Session-Id', session.sessionId);
        await mcpServer.connect(transport);

        // Stream event bus events to SSE
        const unsubscribe = eventBus.subscribeAll((event) => {
            try {
                res.write(`event: sync\ndata: ${JSON.stringify(event)}\n\n`);
            } catch { /* connection closed */ }
        });

        req.on('close', () => {
            unsubscribe();
            sseTransports.delete(session.sessionId);
            sessionManager.destroySession(session.sessionId);
        });

        console.error(`🔗 SSE client connected: ${session.sessionId}`);
        return;
    }

    // ========== SSE MESSAGE ==========
    if (url.pathname === '/mcp/message' && req.method === 'POST') {
        const sessionId = req.headers['x-session-id'] as string;
        const transport = sseTransports.get(sessionId);

        if (!transport) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Session not found' }));
            return;
        }

        sessionManager.touch(sessionId);
        await transport.handlePostMessage(req, res);
        return;
    }

    // ========== MCP HTTP STREAM ==========
    if (url.pathname === '/mcp' && (req.method === 'POST' || req.method === 'GET')) {
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
        return;
    }

    // ========== LSP COMPLETION ==========
    if (url.pathname === '/lsp/completion' && req.method === 'POST') {
        const body = await parseBody(req);
        const { prefix = '', context = {} } = body;

        const completions = Object.entries(LSP_TOOLS)
            .filter(([name]) => name.toLowerCase().startsWith(prefix.toLowerCase()))
            .map(([name, def]) => ({
                label: name,
                kind: 'Function',
                detail: (def as any).description?.substring(0, 80),
                insertText: `${name}({})`,
            }));

        // Publish LSP event
        eventBus.publish({
            type: 'lsp:completionProvided' as any,
            data: { prefix, count: completions.length, timestamp: Date.now() },
        } as any);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ completions }));
        return;
    }

    // ========== LSP HOVER ==========
    if (url.pathname === '/lsp/hover' && req.method === 'POST') {
        const body = await parseBody(req);
        const { word = '' } = body;

        const tool = LSP_TOOLS[word];
        if (tool) {
            eventBus.publish({
                type: 'lsp:hoverResult',
                data: { word, found: true, timestamp: Date.now() },
            } as any);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                contents: {
                    kind: 'markdown',
                    value: `## ${word}\n\n${(tool as any).description}`,
                },
            }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ contents: null }));
        }
        return;
    }

    // ========== LSP SIGNATURE HELP ==========
    if (url.pathname === '/lsp/signature' && req.method === 'POST') {
        const body = await parseBody(req);
        const { toolName = '' } = body;

        const tool = LSP_TOOLS[toolName];
        if (tool) {
            const params = Object.entries((tool as any).parameters || {}).map(([name, schema]) => ({
                label: `${name}: ${(schema as any).type || 'any'}`,
                documentation: (schema as any).description || '',
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                signatures: [{
                    label: `${toolName}({ ... })`,
                    documentation: (tool as any).description,
                    parameters: params,
                }],
            }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ signatures: [] }));
        }
        return;
    }

    // ========== LSP DIAGNOSTICS ==========
    if (url.pathname === '/lsp/diagnostics' && req.method === 'POST') {
        const body = await parseBody(req);
        const { code = '' } = body;

        const diagnostics: any[] = [];

        // Check for common issues
        if (code.includes('navigate(') && !code.includes('browser_init(')) {
            diagnostics.push({
                severity: 'warning',
                message: 'browser_init() should be called before navigate()',
                code: 'workflow-order',
            });
        }

        // Check required parameters
        const toolCallPattern = /(\w+)\s*\(\s*\{([^}]*)\}\s*\)/g;
        let match;
        while ((match = toolCallPattern.exec(code)) !== null) {
            const toolName = match[1];
            const argsText = match[2];
            const tool = TOOLS.find(t => t.name === toolName);

            if (tool && tool.inputSchema?.required) {
                const providedParams = argsText.split(',').map(p => p.split(':')[0].trim());
                for (const req of tool.inputSchema.required) {
                    if (!providedParams.includes(req)) {
                        diagnostics.push({
                            severity: 'error',
                            message: `Missing required parameter '${req}' in ${toolName}()`,
                            code: 'missing-param',
                        });
                    }
                }
            }
        }

        eventBus.publish({
            type: 'lsp:diagnosticsUpdated',
            data: { count: diagnostics.length, timestamp: Date.now() },
        } as any);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ diagnostics }));
        return;
    }

    // ========== EVENT BUS STATS ==========
    if (url.pathname === '/events' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            stats: eventBus.getStats(),
            history: eventBus.getHistory().slice(-20),
        }));
        return;
    }

    // ========== TYPESCRIPT CODEBASE ANALYSIS ==========
    if (url.pathname === '/lsp/analyze' && req.method === 'POST') {
        const body = await parseBody(req);
        const { filePath = '', code = '' } = body;

        try {
            const analysis = await analyzeTypeScriptCode(filePath, code);

            eventBus.publish({
                type: 'lsp:codeAnalyzed' as any,
                data: { filePath, timestamp: Date.now() },
            } as any);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(analysis));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
        }
        return;
    }

    // ========== LSP DEFINITIONS ==========
    if (url.pathname === '/lsp/definition' && req.method === 'POST') {
        const body = await parseBody(req);
        const { symbol = '' } = body;

        // Find symbol in project
        const definitions = findDefinitions(symbol);

        eventBus.publish({
            type: 'lsp:definitionFound',
            data: { symbol, count: definitions.length, timestamp: Date.now() },
        } as any);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ definitions }));
        return;
    }

    // ========== LSP REFERENCES ==========
    if (url.pathname === '/lsp/references' && req.method === 'POST') {
        const body = await parseBody(req);
        const { symbol = '' } = body;

        // Find references in project
        const references = findReferences(symbol);

        eventBus.publish({
            type: 'lsp:referencesFound',
            data: { symbol, count: references.length, timestamp: Date.now() },
        } as any);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ references }));
        return;
    }

    // ========== 404 ==========
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch {
                resolve({});
            }
        });
    });
}

// ============================================================
// TYPESCRIPT CODEBASE ANALYSIS - ADVANCED COMPILER API
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import { getTypeScriptAnalyzer } from './lsp/typescript-analyzer.js';

// Initialize advanced TypeScript analyzer
const tsAnalyzer = getTypeScriptAnalyzer(process.cwd());

/**
 * Analyze TypeScript code using Compiler API
 */
async function analyzeTypeScriptCode(filePath: string, code: string): Promise<any> {
    return tsAnalyzer.analyzeFile(filePath, code);
}

/**
 * Find definitions using TypeScript Compiler API
 */
function findDefinitions(symbol: string): any[] {
    return tsAnalyzer.findDefinitions(symbol);
}

/**
 * Find references using TypeScript Compiler API
 */
function findReferences(symbol: string): any[] {
    return tsAnalyzer.findReferences(symbol);
}

// ============================================================
// STARTUP
// ============================================================

async function main() {
    // Setup cleanup
    setupProcessCleanup(async () => {
        await closeBrowser();
        await forceKillAllBraveProcesses();
        httpServer.close();
    });

    // Check transport mode
    const transportMode = process.env.MCP_TRANSPORT || 'unified';

    if (transportMode === 'stdio') {
        // STDIO only mode for desktop AI apps
        const transport = new StdioServerTransport();
        await mcpServer.connect(transport);
        console.error('🦁 Brave Real Browser MCP Server (STDIO mode)');
        console.error(`📋 ${TOOLS.length} tools available`);
    } else {
        // Unified HTTP mode
        httpServer.listen(PORT, HOST, () => {
            console.error('');
            console.error('🦁 Brave Real Browser - Unified Server v' + SERVER_INFO.version);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error(`📡 HTTP Server: http://${HOST}:${PORT}`);
            console.error('');

            // Show all 33 MCP tools with emojis
            console.error('🛠️  Available MCP Tools:');
            console.error('');
            console.error('   Browser Management:');
            console.error('   🚀 browser_init          - Initialize Brave browser');
            console.error('   🔴 browser_close         - Close browser instance');
            console.error('');
            console.error('   Navigation:');
            console.error('   🌐 navigate              - Navigate to URL');
            console.error('   ⏳ wait                  - Wait for conditions');
            console.error('');
            console.error('   Content:');
            console.error('   📄 get_content           - Get page content (HTML/text)');
            console.error('   🔍 find_element          - Find elements by selector/text/AI');
            console.error('   💾 save_content_as_markdown - Save page as markdown');
            console.error('');
            console.error('   Interaction:');
            console.error('   🖱️  click                 - Click on element');
            console.error('   ⌨️  type                  - Type text into input');
            console.error('   🔑 press_key             - Press keyboard keys');
            console.error('   📜 random_scroll         - Natural scrolling');
            console.error('   🤖 solve_captcha         - Solve CAPTCHAs');
            console.error('');
            console.error('   Media & Streaming:');
            console.error('   🎬 stream_extractor      - Master: Extract video/audio/m3u8/mp4');
            console.error('   🖼️  iframe_handler        - Handle nested iframes (deep_scrape)');
            console.error('');
            console.error('   Advanced Tools:');
            console.error('   🔎 search_content        - Search patterns in page');
            console.error('   📊 extract_json          - Extract embedded JSON');
            console.error('   🏷️  scrape_meta_tags      - Extract meta/OG tags');
            console.error('   📈 deep_analysis         - Full page analysis');
            console.error('   📡 network_recorder      - Record network traffic');
            console.error('   🔌 api_finder            - Discover hidden APIs');
            console.error('   ⏱️  ajax_content_waiter   - Wait for dynamic content');
            console.error('   🔗 link_harvester        - Harvest all links');
            console.error('   📋 batch_element_scraper - Batch scrape elements');
            console.error('   🏗️  extract_schema        - Extract Schema.org data');
            console.error('   📸 element_screenshot    - Screenshot element');
            console.error('   🧭 breadcrumb_navigator  - Navigate breadcrumbs');
            console.error('   ↪️  redirect_tracer       - Trace URL redirects');
            console.error('   📊 progress_tracker      - Track task progress');
            console.error('   🍪 cookie_manager        - Manage cookies');
            console.error('   📥 file_downloader       - Download files');
            console.error('   🖼️  iframe_handler        - Handle iframes');
            console.error('');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('');
            console.error('   API Endpoints:');
            console.error('   ├── MCP:  POST /mcp, GET /mcp/sse, POST /mcp/message');
            console.error('   ├── LSP:  /lsp/completion, /lsp/hover, /lsp/analyze');
            console.error('   └── Other: /health, /events');
            console.error('');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error(`🔗 SharedEventBus: Auto-syncing MCP ↔ LSP ↔ SSE`);
            console.error(`📋 Total: ${TOOLS.length} MCP tools | TypeScript Analyzer Active`);
            console.error('');
            console.error('✅ Ready! All protocols unified and auto-synced.');
            console.error('');
        });
    }
}

main().catch(err => {
    console.error('❌ Failed to start:', err);
    process.exit(1);
});
