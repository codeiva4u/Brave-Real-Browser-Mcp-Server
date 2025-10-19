// Quick test for HTTP API
const http = require('http');

async function testHttpAPI() {
  console.log('🧪 Testing HTTP API...\n');

  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const healthResponse = await makeRequest('GET', '/health');
    console.log('   ✅ Health check:', healthResponse);
  } catch (error) {
    console.log('   ❌ Health check failed:', error.message);
  }

  // Test 2: List tools
  console.log('\n2️⃣ Testing tools list endpoint...');
  try {
    const toolsResponse = await makeRequest('GET', '/tools');
    const tools = JSON.parse(toolsResponse);
    console.log(`   ✅ Found ${tools.tools.length} tools`);
    console.log(`   📋 Sample tools: ${tools.tools.slice(0, 5).map(t => t.name).join(', ')}...`);
  } catch (error) {
    console.log('   ❌ Tools list failed:', error.message);
  }

  console.log('\n✅ Basic HTTP API tests completed!');
  console.log('💡 To test browser automation:');
  console.log('   POST http://localhost:3000/browser/init');
  console.log('   POST http://localhost:3000/browser/navigate');
}

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

// Run test
testHttpAPI().catch(console.error);
