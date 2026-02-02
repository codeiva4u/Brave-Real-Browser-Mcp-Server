#!/usr/bin/env node
/**
 * Brave Real Browser - Unified Entry Point
 * 
 * Usage:
 *   node src/index.js mcp        - Start MCP Server (default)
 *   node src/index.js lsp        - Start LSP Server
 *   node src/index.js --help     - Show help
 * 
 * npm scripts:
 *   npm run dev                  - Start MCP server
 *   npm run mcp                  - Start MCP server
 *   npm run lsp                  - Start LSP server
 * 
 * For AI Assistants (MCP):
 *   Claude Desktop, Cursor, Copilot, etc.
 * 
 * For IDEs (LSP):
 *   VS Code, Neovim, Sublime Text, etc.
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
  ${colors.green}mcp${colors.reset}           Start MCP Server for AI agents (default)
  ${colors.green}lsp${colors.reset}           Start LSP Server for IDE intelligence

${colors.bright}OPTIONS:${colors.reset}
  ${colors.yellow}--help, -h${colors.reset}    Show this help message
  ${colors.yellow}--verbose, -v${colors.reset} Show detailed tool information
  ${colors.yellow}--list${colors.reset}        List all available tools

${colors.bright}EXAMPLES:${colors.reset}
  node src/index.js mcp          # Start MCP server
  node src/index.js lsp          # Start LSP server
  node src/index.js --list       # List all tools

${colors.bright}NPM SCRIPTS:${colors.reset}
  npm run dev                    # Start MCP server
  npm run mcp                    # Start MCP server
  npm run lsp                    # Start LSP server

${colors.bright}TOOL CATEGORIES (${TOOLS.length} tools):${colors.reset}
${Object.entries(CATEGORIES).map(([key, cat]) => {
  const count = TOOLS.filter(t => t.category === key).length;
  return `  ${cat.emoji} ${colors.yellow}${cat.name.padEnd(15)}${colors.reset} ${colors.dim}(${count} tools)${colors.reset}`;
}).join('\n')}

${colors.dim}MCP: For AI assistants (Claude, Cursor, Copilot)
LSP: For IDE code intelligence (VS Code, Neovim)${colors.reset}
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
      const required = tool.inputSchema?.required || [];
      console.log(`  ${tool.emoji} ${colors.yellow}${tool.name.padEnd(25)}${colors.reset} ${colors.dim}${tool.description.substring(0, 40)}${colors.reset}`);
    }
    console.log('');
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const hasHelp = args.includes('--help') || args.includes('-h');
  const hasList = args.includes('--list');
  const mode = args.find(a => ['mcp', 'lsp'].includes(a.toLowerCase())) || 'mcp';
  
  if (hasHelp) {
    showHelp();
    process.exit(0);
  }
  
  if (hasList) {
    listTools();
    process.exit(0);
  }
  
  // Start appropriate server
  if (mode.toLowerCase() === 'lsp') {
    // Start LSP Server
    require('./lsp/index.js');
  } else {
    // Start MCP Server (default)
    require('./mcp/index.js');
  }
}

// Export for programmatic use
module.exports = {
  TOOLS,
  TOOL_DISPLAY,
  CATEGORIES,
  startMCP: () => require('./mcp/index.js'),
  startLSP: () => require('./lsp/index.js'),
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  });
}
