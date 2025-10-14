import { spawn } from 'child_process';

// Test script to verify the specialized tools handlers work correctly
console.log('🧪 Testing specialized tools handlers...\n');

const toolsToTest = [
  'links_finders',
  'video_play_sources_finder',
  'video_sources_extracts',
  'ajax_finders',
  'video_download_page'
];

async function testTool(toolName) {
  return new Promise((resolve, reject) => {
    console.log(`Testing ${toolName}...`);
    
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: process.cwd(),
      shell: true
    });

    let stdout = '';
    let hasError = false;

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.on('error', (error) => {
      hasError = true;
      reject(error);
    });

    // Send the MCP messages
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    const toolMessage = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: { url: 'https://example.com' }
      }
    };

    // Send messages
    child.stdin.write(JSON.stringify(initMessage) + '\n');
    
    setTimeout(() => {
      child.stdin.write(JSON.stringify(toolMessage) + '\n');
      
      setTimeout(() => {
        child.kill();
        
        if (!hasError) {
          // Check if we got any JSON responses
          const responses = stdout.split('\n').filter(line => {
            try {
              const parsed = JSON.parse(line);
              return parsed.jsonrpc === '2.0' && parsed.id === 2;
            } catch {
              return false;
            }
          });
          
          if (responses.length > 0) {
            const result = JSON.parse(responses[0]);
            if (result.result && result.result.content && result.result.content.length > 0) {
              console.log(`✅ ${toolName}: Returns proper content structure`);
              resolve(true);
            } else {
              console.log(`❌ ${toolName}: Missing content structure`);
              resolve(false);
            }
          } else {
            console.log(`❌ ${toolName}: No valid response received`);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, 3000);
    }, 1000);
  });
}

async function runTests() {
  console.log('Building project first...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    shell: true
  });
  
  buildProcess.on('close', async (code) => {
    if (code !== 0) {
      console.log('❌ Build failed');
      return;
    }
    
    console.log('✅ Build successful\n');
    
    let passedCount = 0;
    let totalCount = toolsToTest.length;
    
    for (const tool of toolsToTest) {
      try {
        const passed = await testTool(tool);
        if (passed) passedCount++;
      } catch (error) {
        console.log(`❌ ${tool}: Error - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Test Results: ${passedCount}/${totalCount} tools working correctly`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All specialized tools handlers are working properly!');
    } else {
      console.log('⚠️  Some tools may need additional fixes');
    }
  });
}

runTests().catch(console.error);