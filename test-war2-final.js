import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Final comprehensive test that maintains browser state throughout all tools
console.log('🎬 Final comprehensive test for all tools on War 2 movie page...\n');

const TEST_URL = 'https://multimovies.sale/movies/war-2-2/';

// All tools to test in proper sequence with setup first
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

async function runFinalTest() {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting final test with persistent browser state...\n`);
    
    // Start single MCP server process that will persist throughout test
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      shell: true
    });

    let messageId = 1;
    let currentToolIndex = 0;
    let results = [];
    let isProcessingResponse = false;
    let processedResponses = new Set(); // Track processed response IDs

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        try {
          const response = JSON.parse(trimmedLine);
          if (response.jsonrpc === '2.0' && response.id && response.id > 1) {
            // Avoid processing the same response twice
            if (processedResponses.has(response.id)) {
              continue;
            }
            processedResponses.add(response.id);
            
            if (!isProcessingResponse) {
              isProcessingResponse = true;
              handleToolResponse(response);
            }
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    });

    child.stderr.on('data', (data) => {
      console.error('MCP Server Error:', data.toString());
    });

    child.on('error', (error) => {
      console.error('❌ Process error:', error.message);
      reject(error);
    });

    child.on('exit', (code) => {
      console.log('\n================================================================================');
      console.log('🎯 FINAL TEST RESULTS SUMMARY');
      console.log('================================================================================\n');
      
      const setupTools = results.filter(r => r.isSetup);
      const testTools = results.filter(r => !r.isSetup);
      const successful = testTools.filter(r => r.success).length;
      const errors = testTools.filter(r => !r.success).length;
      const setupSuccess = setupTools.filter(r => r.success).length;
      
      console.log(`📈 Overall Statistics:`);
      console.log(`   🔧 Setup: ${setupSuccess}/${setupTools.length} (${Math.round(setupSuccess/setupTools.length*100)}%)`);
      console.log(`   ✅ Tools successful: ${successful}/${testTools.length} (${Math.round(successful/testTools.length*100)}%)`);
      console.log(`   ❌ Tools with errors: ${errors}/${testTools.length} (${Math.round(errors/testTools.length*100)}%)`);
      
      console.log('\n🔧 SETUP RESULTS:');
      setupTools.forEach(result => {
        console.log(`   • ${result.name} - ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        if (!result.success && result.error) {
          console.log(`     Error: ${result.error.substring(0, 100)}...`);
        }
      });
      
      if (successful > 0) {
        console.log('\n✅ WORKING TOOLS:');
        testTools.filter(r => r.success).forEach(result => {
          const dataSize = result.data ? result.data.length : 0;
          console.log(`   • ${result.name} - Data size: ${dataSize} chars`);
        });
      }

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
          totalTools: testTools.length,
          setupSuccess,
          totalSetupTools: setupTools.length,
          successful,
          errors,
          successRate: testTools.length > 0 ? Math.round(successful/testTools.length*100) : 0
        },
        setupResults: setupTools,
        testResults: testTools
      };
      
      writeFileSync('war2-final-results.json', JSON.stringify(detailedResults, null, 2));
      console.log('\n📄 Detailed results saved to: war2-final-results.json');
      
      if (detailedResults.summary.successRate === 100) {
        console.log('\n🎉 PERFECT! ALL TOOLS ARE WORKING 100%! 🎉');
      } else if (detailedResults.summary.successRate >= 90) {
        console.log('\\n🎊 EXCELLENT! Over 90% tools working!');
      } else if (detailedResults.summary.successRate >= 75) {
        console.log('\\n👍 GOOD! Over 75% tools working!');
      } else {
        console.log('\\n⚠️ NEEDS IMPROVEMENT: Only ' + detailedResults.summary.successRate + '% tools working.');
      }
      
      console.log('\n🔚 Final test completed!');
      resolve(detailedResults);
    });

    function handleToolResponse(response) {
      const toolData = toolsToTest[currentToolIndex - 1];
      if (!toolData) {
        isProcessingResponse = false;
        return;
      }
      
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
        console.log('\n🔄 Browser setup complete! Starting tool tests...\n');
      }
      
      isProcessingResponse = false;
      
      // Send next tool call
      setTimeout(() => {
        sendNextTool();
      }, 1500); // 1.5 second delay between tools
    }

    function sendNextTool() {
      if (currentToolIndex >= toolsToTest.length) {
        // All tools tested, gracefully end
        console.log('\n✅ All tools tested. Gracefully ending process...');
        setTimeout(() => {
          child.kill('SIGTERM');
        }, 2000);
        return;
      }
      
      const toolData = toolsToTest[currentToolIndex];
      currentToolIndex++;
      
      const currentMessageId = messageId++;
      const message = {
        jsonrpc: '2.0',
        id: currentMessageId,
        method: 'tools/call',
        params: {
          name: toolData.name,
          arguments: toolData.args
        }
      };
      
      console.log(`\n🔧 Testing ${toolData.name}...`);
      child.stdin.write(JSON.stringify(message) + '\n');
      
      // Set timeout for individual tool (25 seconds to allow for complex operations)
      setTimeout(() => {
        if (!processedResponses.has(currentMessageId)) {
          console.log(`⏰ ${toolData.name}: Tool timeout after 25 seconds`);
          const timeoutResult = {
            name: toolData.name,
            success: false,
            error: 'Tool execution timeout (25 seconds)',
            data: '',
            isSetup: toolData.isSetup || false
          };
          results.push(timeoutResult);
          processedResponses.add(currentMessageId);
          
          // Continue with next tool
          setTimeout(() => {
            sendNextTool();
          }, 500);
        }
      }, 25000);
    }

    // Initialize the MCP server
    const initMessage = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'war2-final-client', version: '1.0.0' }
      }
    };
    
    child.stdin.write(JSON.stringify(initMessage) + '\n');
    
    // Start the test sequence after initialization
    setTimeout(() => {
      sendNextTool();
    }, 2000);

    // Overall test timeout (15 minutes for all tools)
    setTimeout(() => {
      console.log('⏰ Overall test timeout reached (15 minutes), terminating...');
      child.kill('SIGKILL');
      reject(new Error('Test timeout'));
    }, 900000);
  });
}

// Run the final comprehensive test
runFinalTest()
  .then((results) => {
    console.log(`\n🎯 Final test completed with ${results.summary.successRate}% success rate!`);
    process.exit(results.summary.successRate >= 90 ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Final test failed:', error.message);
    process.exit(1);
  });