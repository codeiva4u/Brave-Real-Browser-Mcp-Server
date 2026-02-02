#!/usr/bin/env node
/**
 * Brave Real Browser - Unified Entry Point
 * 
 * Usage:
 *   node src/index.js             - Start both MCP + LSP together (default)
 *   node src/index.js mcp         - Start MCP Server only
 *   node src/index.js lsp         - Start LSP Server only (STDIO)
 *   node src/index.js --help      - Show help
 * 
 * npm scripts:
 *   npm run dev                   - Start MCP + LSP together
 *   npm run mcp                   - Start MCP server only
 *   npm run lsp                   - Start LSP server only
 * 
 * Architecture:
 *   MCP Server → STDIO transport (for AI agents: Claude, Cursor, Copilot)
 *   LSP Server → TCP :7777 (for IDEs: VS Code, Neovim)
 */

const { TOOLS, TOOL_DISPLAY, CATEGORIES } = require('./shared/tools.js');

// ANSI colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

/**
 * Display help message
 */
function showHelp() {
  console.log(`
${colors.bright}${colors.cyan}🦁 Brave Real Browser - Unified Server${colors.reset}

${colors.bright}USAGE:${colors.reset}
  node src/index.js [mode] [options]

${colors.bright}MODES:${colors.reset}
  ${colors.green}(default)${colors.reset}     Start both MCP + LSP servers together
  ${colors.green}mcp${colors.reset}           Start MCP Server only (for AI agents)
  ${colors.green}lsp${colors.reset}           Start LSP Server only (for IDEs)

${colors.bright}OPTIONS:${colors.reset}
  ${colors.yellow}--help, -h${colors.reset}    Show this help message
  ${colors.yellow}--verbose, -v${colors.reset} Show detailed tool information
  ${colors.yellow}--list${colors.reset}        List all available tools

${colors.bright}EXAMPLES:${colors.reset}
  node src/index.js              # Start MCP + LSP together
  node src/index.js mcp          # Start MCP server only
  node src/index.js lsp          # Start LSP server only
  node src/index.js --list       # List all tools

${colors.bright}NPM SCRIPTS:${colors.reset}
  npm run dev                    # Start MCP + LSP together
  npm run mcp                    # Start MCP server only
  npm run lsp                    # Start LSP server only (STDIO)

${colors.bright}ARCHITECTURE:${colors.reset}
  ${colors.cyan}MCP Server${colors.reset} → STDIO transport → AI Agents (Claude, Cursor, Copilot)
  ${colors.cyan}LSP Server${colors.reset} → TCP :7777      → IDEs (VS Code, Neovim)

${colors.bright}TOOL CATEGORIES (${TOOLS.length} tools):${colors.reset}
${Object.entries(CATEGORIES).map(([key, cat]) => {
  const count = TOOLS.filter(t => t.category === key).length;
  return `  ${cat.emoji} ${colors.yellow}${cat.name.padEnd(15)}${colors.reset} ${colors.dim}(${count} tools)${colors.reset}`;
}).join('\n')}
  `);
}

/**
 * List all available tools
 */
function listTools() {
  console.log(`\n${colors.bright}${colors.cyan}🦁 Available Tools (${TOOLS.length}):${colors.reset}\n`);
  
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const tools = TOOLS.filter(t => t.category === key);
    if (tools.length === 0) continue;
    
    console.log(`${colors.bright}${cat.emoji} ${cat.name}${colors.reset} ${colors.dim}(${tools.length})${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}`);
    
    for (const tool of tools) {
      console.log(`  ${tool.emoji} ${colors.yellow}${tool.name.padEnd(25)}${colors.reset} ${colors.dim}${tool.description.substring(0, 40)}${colors.reset}`);
    }
    console.log('');
  }
}

/**
 * Start both MCP and LSP servers together
 */
async function startBothServers() {
  console.error('');
  console.error(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.bright}${colors.magenta}🦁 Brave Real Browser - Unified Server${colors.reset}                  ${colors.cyan}║${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.dim}MCP (AI Agents) + LSP (IDE Intelligence)${colors.reset}                 ${colors.cyan}║${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.error('');

  // Start LSP Server on TCP first (background)
  console.error(`${colors.bright}${colors.blue}📡 Starting LSP Server...${colors.reset}`);
  
  try {
    const { startTcpServer, LSP_PORT } = require('./lsp/server.js');
    const { port } = await startTcpServer();
    console.error(`${colors.bright}${colors.green}✅ LSP Server running on TCP :${port}${colors.reset}`);
    console.error(`${colors.dim}   IDEs can connect to: 127.0.0.1:${port}${colors.reset}`);
  } catch (err) {
    console.error(`${colors.yellow}⚠️  LSP Server failed: ${err.message}${colors.reset}`);
    console.error(`${colors.dim}   Continuing with MCP only...${colors.reset}`);
  }

  console.error('');
  
  // Start MCP Server on STDIO (foreground)
  console.error(`${colors.bright}${colors.blue}🚀 Starting MCP Server...${colors.reset}`);
  
  // Import and run MCP server
  require('./mcp/index.js');
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const hasHelp = args.includes('--help') || args.includes('-h');
  const hasList = args.includes('--list');
  const mode = args.find(a => ['mcp', 'lsp'].includes(a.toLowerCase()));
  
  if (hasHelp) {
    showHelp();
    process.exit(0);
  }
  
  if (hasList) {
    listTools();
    process.exit(0);
  }
  
  // Start appropriate server(s)
  if (mode?.toLowerCase() === 'lsp') {
    // Start LSP Server only (STDIO mode)
    require('./lsp/index.js');
  } else if (mode?.toLowerCase() === 'mcp') {
    // Start MCP Server only
    require('./mcp/index.js');
  } else {
    // Default: Start both servers together
    await startBothServers();
  }
}

// Export for programmatic use
module.exports = {
  TOOLS,
  TOOL_DISPLAY,
  CATEGORIES,
  startMCP: () => require('./mcp/index.js'),
  startLSP: () => require('./lsp/index.js'),
  startBoth: startBothServers,
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  });
}
