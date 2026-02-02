#!/usr/bin/env node
/**
 * Brave Real Browser LSP Server - Entry Point
 */
const colors = { reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m' };

function displayBanner() {
  console.error('');
  console.error(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.bright}${colors.magenta}🦁 Brave Real Browser LSP Server${colors.reset}                         ${colors.cyan}║${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}║${colors.reset}  ${colors.dim}Language Server Protocol for IDE Intelligence${colors.reset}              ${colors.cyan}║${colors.reset}`);
  console.error(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.error('');
  console.error(`${colors.bright}${colors.green}🎯 Capabilities:${colors.reset}`);
  const caps = [['✨ Autocomplete', 'Tool names, parameters, values'],['📖 Hover', 'Documentation on hover'],['⚠️  Diagnostics', 'Error & warning detection'],['📝 Snippets', 'Code templates & workflows'],['🔧 Refactoring', 'Quick fixes & code actions'],['🎬 Simulation', 'Workflow simulation in IDE'],['🌍 Multi-language', 'English & Hindi support']];
  for (const [n, d] of caps) console.error(`  ${colors.yellow}${n.padEnd(20)}${colors.reset}${colors.dim}${d}${colors.reset}`);
  console.error('');
  console.error(`${colors.bright}${colors.blue}🔗 Transport:${colors.reset} STDIO`);
  console.error(`${colors.bright}${colors.green}Starting LSP Server...${colors.reset}`);
  console.error('');
}

if (!process.stdin.isTTY) { require('./server.js'); } 
else { displayBanner(); require('./server.js'); }
