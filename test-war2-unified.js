import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Unified end-to-end test that maintains browser state throughout
console.log('🎬 Testing all tools on War 2 movie page with persistent browser state...\n');

const TEST_URL = 'https://multimovies.sale/movies/war-2-2/';

// All tools to test in proper sequence
const toolsToTest = [
  // Setup sequence - this will establish proper workflow state
  { name: 'browser_init', args: { headless: true }, isSetup: true },
  { name: 'navigate', args: { url: TEST_URL }, isSetup: true },
  { name: 'get_content', args: { type: 'html' }, isSetup: true },
  
  // Video Extraction Tools - should now work after setup
  { name: 'html_elements_extraction', args: {} },
  { name: 'network_video_extraction', args: {} },
  { name: 'video_selector_generation', args: {} },
  { name: 'comprehensive_video_extraction', args: {} },
  { name: 'url_redirect_trace', args: { url: TEST_URL } },
  
  // Specialized Video and Links Extraction Tools
  { name: 'links_finders', args: {} },
  { name: 'video_play_sources_finder', args: {} },
  { name: 'video_player_hostars_sources_finder', args: {} },
  { name: 'ajax_finders', args: {} },
  { name: 'video_sources_extracts', args: {} },
  { name: 'video_sources_links_finders', args: {} },
  { name: 'original_video_hosters_finder', args: {} },
  { name: 'video_play_push_sources', args: {} },
  { name: 'ajax_extracts', args: {} },
  { name: 'user_agent_finders', args: {} },
  { name: 'user_agent_extracts', args: {} },
  
  // Video Download Tools
  { name: 'video_download_page', args: {} },
  { name: 'video_download_button', args: {} }
];

async function runUnifiedTest() {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting unified test with persistent browser state...\n`);
    
    // Start single MCP server process that will persist throughout test
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let messageId = 1;
    let currentToolIndex = 0;
    let results = [];
    let setupComplete = false;

    child.stdout.on('data', (data) => {
      const newData = data.toString();
      stdout += newData;
      
      // Process only new lines to avoid duplicate processing
      const newLines = newData.split('\n');
      for (const line of newLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        try {
          const response = JSON.parse(trimmedLine);
          if (response.jsonrpc === '2.0' && response.id && response.id > 1) {
            // This is a tool response
            if (pendingResponses.has(response.id)) {
              const toolData = pendingResponses.get(response.id);
              handleToolResponse(toolData, response);
              pendingResponses.delete(response.id);
            }
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    });
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      console.error('❌ Process error:', error.message);
      reject(error);
    });

    child.on('exit', (code) => {
      console.log('\n================================================================================');
      console.log('🎯 UNIFIED TEST RESULTS SUMMARY');
      console.log('================================================================================\n');
      
      const setupTools = results.filter(r => r.isSetup);
      const testTools = results.filter(r => !r.isSetup);
      const successful = testTools.filter(r => r.success).length;
      const errors = testTools.filter(r => !r.success).length;
      
      console.log(`📈 Overall Statistics:`);
      console.log(`   ✅ Setup tools: ${setupTools.filter(r => r.success).length}/${setupTools.length}`);
      console.log(`   ✅ Test tools successful: ${successful}/${testTools.length} (${Math.round(successful/testTools.length*100)}%)`);
      console.log(`   ❌ Test tools with errors: ${errors}/${testTools.length} (${Math.round(errors/testTools.length*100)}%)`);
      
      console.log('\n✅ SETUP RESULTS:');
      setupTools.forEach(result => {
        console.log(`   • ${result.name} - ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (!result.success && result.error) {
          console.log(`     Error: ${result.error.substring(0, 100)}...`);
        }
      });
      
      console.log('\n✅ WORKING TOOLS:');
      testTools.filter(r => r.success).forEach(result => {
        const dataSize = result.data ? result.data.length : 0;
        console.log(`   • ${result.name} - Data size: ${dataSize} chars`);
      });

      if (errors > 0) {
        console.log('\n❌ TOOLS WITH ERRORS:');
        testTools.filter(r => !r.success).forEach(result => {
          console.log(`   • ${result.name} - ${result.error}`);
        });
      }
      
      // Save detailed results
      const detailedResults = {
        testUrl: TEST_URL,
        timestamp: new Date().toISOString(),
        summary: {
          total: testTools.length,
          successful,
          errors,
          successRate: Math.round(successful/testTools.length*100)
        },
        setupResults: setupTools,
        testResults: testTools
      };
      
      writeFileSync('war2-unified-results.json', JSON.stringify(detailedResults, null, 2));
      console.log('\n📄 Detailed results saved to: war2-unified-results.json');
      
      console.log('\n🔚 Unified test completed!');
      resolve(detailedResults);
    });

    function handleToolResponse(toolData, response) {
      const isSuccess = !response.error;
      let errorMessage = '';
      let resultData = '';
      
      if (response.error) {
        errorMessage = response.error.message || 'Unknown error';
      } else if (response.result && response.result.content) {
        resultData = JSON.stringify(response.result.content);
      }
      
      const result = {
        name: toolData.name,
        success: isSuccess,
        error: errorMessage,
        data: resultData,
        isSetup: toolData.isSetup || false
      };
      
      results.push(result);
      
      const statusIcon = isSuccess ? '✅' : '❌';
      const statusText = isSuccess ? 'SUCCESS' : 'ERROR';
      
      console.log(`📊 Progress: ${currentToolIndex}/${toolsToTest.length}`);
      console.log(`${statusIcon} ${toolData.name}: ${statusText}`);
      
      if (!isSuccess) {
        console.log(`   Error: ${errorMessage}`);
      } else if (resultData && !toolData.isSetup) {
        console.log(`   Data size: ${resultData.length} chars`);
      }
      
      // Check if setup is complete
      if (toolData.isSetup && isSuccess && toolData.name === 'get_content') {
        setupComplete = true;
        console.log('\n🔄 Browser setup complete! Starting tool tests...\n');
      }
      
      // Send next tool call
      sendNextTool();
    }

    function sendNextTool() {
      if (currentToolIndex >= toolsToTest.length) {
        // All tools tested, end the process
        console.log('\n✅ All tools tested. Ending process...');
        setTimeout(() => {
          child.stdin.end();
          setTimeout(() => {
            child.kill('SIGTERM');
          }, 1000);
        }, 1000);
        return;
      }
      
      const toolData = toolsToTest[currentToolIndex];
      currentToolIndex++;
      
      // Add delay between calls for stability
      setTimeout(() => {
        const message = {
          jsonrpc: '2.0',
          id: messageId++,
          method: 'tools/call',
          params: {
            name: toolData.name,
            arguments: toolData.args
          }
        };
        
        console.log(`\n🔧 Testing ${toolData.name}...`);
        child.stdin.write(JSON.stringify(message) + '\n');
      }, toolData.isSetup ? 3000 : 2000); // Longer delay for setup tools
    }

    // Initialize the MCP server
    const initMessage = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'war2-unified-client', version: '1.0.0' }
      }
    };
    
    child.stdin.write(JSON.stringify(initMessage) + '\n');
    
    // Start the test sequence after initialization
    setTimeout(() => {
      sendNextTool();
    }, 2000);

    // Overall test timeout (20 minutes for all tools)
    setTimeout(() => {
      console.log('⏰ Overall test timeout reached, terminating...');
      child.kill('SIGKILL');
      reject(new Error('Test timeout'));
    }, 1200000);
  });
}

// Run the test
runUnifiedTest()
  .then((results) => {
    console.log(`\n🎉 Test completed with ${results.summary.successRate}% success rate!`);
    process.exit(results.summary.successRate === 100 ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });