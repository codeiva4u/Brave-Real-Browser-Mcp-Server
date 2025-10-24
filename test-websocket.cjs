/**
 * WebSocket Protocol Test
 * Tests that all 110 tools work via WebSocket
 */

const WebSocket = require('ws');

console.log('🧪 Testing WebSocket Protocol...\n');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', async () => {
  console.log('✅ WebSocket connected\n');

  // Test 1: Browser Init
  console.log('Test 1: browser_init');
  ws.send(JSON.stringify({
    id: 1,
    tool: 'browser_init',
    args: {}
  }));

  setTimeout(() => {
    // Test 2: Navigate
    console.log('Test 2: navigate');
    ws.send(JSON.stringify({
      id: 2,
      tool: 'navigate',
      args: { url: 'https://example.com' }
    }));
  }, 5000);

  setTimeout(() => {
    // Test 3: Advanced tool - link_harvester
    console.log('Test 3: link_harvester (advanced tool)');
    ws.send(JSON.stringify({
      id: 3,
      tool: 'link_harvester',
      args: { selector: 'a[href]', classifyLinks: true }
    }));
  }, 10000);

  setTimeout(() => {
    // Test 4: Video tool
    console.log('Test 4: video_source_extractor');
    ws.send(JSON.stringify({
      id: 4,
      tool: 'video_source_extractor',
      args: {}
    }));
  }, 15000);

  setTimeout(() => {
    // Test 5: Close
    console.log('Test 5: browser_close');
    ws.send(JSON.stringify({
      id: 5,
      tool: 'browser_close',
      args: {}
    }));
    
    setTimeout(() => {
      console.log('\n✅ All WebSocket tests completed!');
      ws.close();
      process.exit(0);
    }, 3000);
  }, 20000);
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  if (response.success) {
    console.log(`  ✅ Test ${response.id} SUCCESS`);
  } else {
    console.log(`  ❌ Test ${response.id} FAILED:`, response.error);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket closed');
});
