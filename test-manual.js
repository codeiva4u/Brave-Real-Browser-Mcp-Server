/**
 * Manual Browser Testing Script
 * 
 * ब्राउजर stable रहेगा और close नहीं होगा
 * Use: node test-manual.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting Manual Browser Test (Stable Mode)');
console.log('📌 Browser will remain open until you press Ctrl+C\n');

// Start MCP server
const serverProcess = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

console.log('✅ MCP Server started');
console.log('🌐 Browser initialization ready\n');
console.log('📝 Test commands (run in separate terminal):');
console.log('   curl -X POST http://localhost:3000/browser/init');
console.log('   curl -X POST http://localhost:3000/browser/navigate -d \'{"url":"https://example.com"}\'');
console.log('   curl -X POST http://localhost:3000/browser/get-content -d \'{"type":"text"}\'');
console.log('\n💡 Press Ctrl+C to stop server and close browser\n');

// Handle termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`\n✅ Server stopped (exit code: ${code})`);
  process.exit(code);
});
