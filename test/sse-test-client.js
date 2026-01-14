/**
 * SSE Test Client - Tests real-time progress updates
 * Run with: node test/sse-test-client.js
 */

const http = require('http');

const HOST = process.env.MCP_HOST || 'localhost';
const PORT = process.env.MCP_PORT || 3001;
const BASE_URL = `http://${HOST}:${PORT}/mcp`;

console.log('🧪 SSE Real-time Progress Test Client\n');
console.log(`📡 Connecting to: ${BASE_URL}/sse\n`);
console.log('=' .repeat(50));

// Connect to SSE endpoint
const sseUrl = new URL(`${BASE_URL}/sse`);

const options = {
  hostname: sseUrl.hostname,
  port: sseUrl.port,
  path: sseUrl.pathname,
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
  },
};

const req = http.request(options, (res) => {
  console.log(`\n✅ Connected! Status: ${res.statusCode}`);
  console.log(`📋 Session ID: ${res.headers['x-session-id'] || 'N/A'}`);
  console.log('\n📥 Waiting for events...\n');
  console.log('-'.repeat(50));

  let buffer = '';

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    
    // Process complete events (separated by double newline)
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Keep incomplete event in buffer
    
    for (const event of events) {
      if (!event.trim()) continue;
      
      const lines = event.split('\n');
      let eventType = 'message';
      let data = '';
      
      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          data = line.substring(5).trim();
        }
      }
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          
          if (eventType === 'progress' || parsed.method === 'notifications/progress') {
            const params = parsed.params || parsed;
            const percent = params.total 
              ? Math.round((params.progress / params.total) * 100) 
              : params.progress;
            
            // Create progress bar
            const barLength = 30;
            const filled = Math.round((percent / 100) * barLength);
            const empty = barLength - filled;
            const bar = '█'.repeat(filled) + '░'.repeat(empty);
            
            console.log(`\r[${bar}] ${percent}% - ${params.message || ''}`);
          } else {
            console.log(`\n📨 Event: ${eventType}`);
            console.log(`   Data: ${JSON.stringify(parsed, null, 2)}`);
          }
        } catch (e) {
          console.log(`\n📨 Event: ${eventType}`);
          console.log(`   Raw: ${data}`);
        }
      }
    }
  });

  res.on('end', () => {
    console.log('\n\n🔌 Connection closed by server');
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`\n❌ Connection error: ${error.message}`);
  console.log('\n💡 Make sure the server is running with SSE transport:');
  console.log('   MCP_TRANSPORT=sse MCP_PORT=3001 npm start');
  process.exit(1);
});

req.end();

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Disconnecting...');
  req.destroy();
  process.exit(0);
});

console.log('Press Ctrl+C to disconnect\n');
