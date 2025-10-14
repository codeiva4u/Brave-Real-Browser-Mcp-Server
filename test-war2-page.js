import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

// Comprehensive end-to-end test for all fixed tools on War 2 movie page
console.log('🎬 Testing all fixed tools on War 2 movie page...\n');

const TEST_URL = 'https://multimovies.sale/movies/war-2-2/';

// Use proper workflow - need to init browser and navigate first
const setupSteps = [
  { name: 'browser_init', args: { headless: false } },
  { name: 'navigate', args: { url: TEST_URL } },
  { name: 'get_content', args: { type: 'html' } }
];

const toolsToTest = [
  // Video Extraction Tools (these need browser to be already navigated)
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

const results = [];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupBrowserAndNavigate() {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Setting up browser and navigating to ${TEST_URL}...`);
    
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let messageId = 1;

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Setup timeout'));
    }, 45000);

    child.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    // Send initialization
    const initMessage = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'war2-setup-client', version: '1.0.0' }
      }
    };
    child.stdin.write(JSON.stringify(initMessage) + '\n');

    // Setup sequence with delays
    setTimeout(() => {
      // Browser init
      const browserInitMessage = {
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'browser_init',
          arguments: { headless: true }
        }
      };
      child.stdin.write(JSON.stringify(browserInitMessage) + '\n');
      
      setTimeout(() => {
        // Navigate
        const navigateMessage = {
          jsonrpc: '2.0',
          id: messageId++,
          method: 'tools/call',
          params: {
            name: 'navigate',
            arguments: { url: TEST_URL }
          }
        };
        child.stdin.write(JSON.stringify(navigateMessage) + '\n');
        
        setTimeout(() => {
          // Get content
          const getContentMessage = {
            jsonrpc: '2.0',
            id: messageId++,
            method: 'tools/call',
            params: {
              name: 'get_content',
              arguments: { type: 'html' }
            }
          };
          child.stdin.write(JSON.stringify(getContentMessage) + '\n');
          
          setTimeout(() => {
            child.stdin.end();
          }, 5000);
        }, 3000);
      }, 3000);
    }, 2000);
  });
}

async function testTool(toolData) {
  return new Promise((resolve) => {
    console.log(`\n🔧 Testing ${toolData.name}...`);
    
    const child = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd(),
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let hasError = false;
    let timeoutHandle;
    let messageId = 1;

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      hasError = true;
      console.log(`❌ Process error: ${error.message}`);
    });

    // Set up timeout
    timeoutHandle = setTimeout(() => {
      console.log(`⏰ ${toolData.name}: Test timeout, killing process`);
      child.kill('SIGKILL');
    }, 40000); // 40 second timeout per tool (includes setup)

    child.on('exit', () => {
      clearTimeout(timeoutHandle);
      
      if (!hasError) {
        try {
          // Parse JSON responses - look for the final tool response
          const lines = stdout.split('\n').filter(line => line.trim());
          let toolResponse = null;
          
          // Look for the tool response (it should be the last meaningful response)
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(lines[i]);
              if (parsed.jsonrpc === '2.0' && parsed.id === 5) { // Tool call is id 5 after setup
                toolResponse = parsed;
                break;
              }
            } catch {
              // Skip non-JSON lines
            }
          }
          
          if (toolResponse && toolResponse.result && toolResponse.result.content) {
            const contentText = toolResponse.result.content[0]?.text;
            if (contentText && contentText.trim() !== '{}' && contentText.trim() !== '[]') {
              try {
                const parsedContent = JSON.parse(contentText);
                const hasData = Object.keys(parsedContent).length > 0 || 
                               (Array.isArray(parsedContent) && parsedContent.length > 0);
                
                if (hasData) {
                  console.log(`✅ ${toolData.name}: SUCCESS - Found valid data`);
                  results.push({
                    tool: toolData.name,
                    status: 'SUCCESS',
                    hasData: true,
                    dataSize: contentText.length,
                    preview: contentText.substring(0, 300) + '...'
                  });
                } else {
                  console.log(`⚠️ ${toolData.name}: Empty data structure`);
                  results.push({
                    tool: toolData.name,
                    status: 'EMPTY',
                    hasData: false,
                    dataSize: 0,
                    preview: 'Empty object/array'
                  });
                }
              } catch {
                console.log(`✅ ${toolData.name}: SUCCESS - Non-JSON response (likely text data)`);
                results.push({
                  tool: toolData.name,
                  status: 'SUCCESS',
                  hasData: true,
                  dataSize: contentText.length,
                  preview: contentText.substring(0, 300) + '...'
                });
              }
            } else {
              console.log(`❌ ${toolData.name}: Empty response`);
              results.push({
                tool: toolData.name,
                status: 'EMPTY',
                hasData: false,
                dataSize: 0,
                preview: 'No content'
              });
            }
          } else if (toolResponse && toolResponse.error) {
            console.log(`❌ ${toolData.name}: Error - ${toolResponse.error.message}`);
            results.push({
              tool: toolData.name,
              status: 'ERROR',
              hasData: false,
              dataSize: 0,
              preview: toolResponse.error.message
            });
          } else {
            console.log(`❌ ${toolData.name}: No valid MCP response`);
            results.push({
              tool: toolData.name,
              status: 'NO_RESPONSE',
              hasData: false,
              dataSize: 0,
              preview: 'No MCP response found'
            });
          }
        } catch (error) {
          console.log(`❌ ${toolData.name}: Parse error - ${error.message}`);
          results.push({
            tool: toolData.name,
            status: 'PARSE_ERROR',
            hasData: false,
            dataSize: 0,
            preview: error.message
          });
        }
      } else {
        results.push({
          tool: toolData.name,
          status: 'PROCESS_ERROR',
          hasData: false,
          dataSize: 0,
          preview: 'Process failed to start'
        });
      }
      
      resolve();
    });

    // Send MCP messages with full workflow
    const initMessage = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'war2-test-client', version: '1.0.0' }
      }
    };
    child.stdin.write(JSON.stringify(initMessage) + '\n');
    
    // Setup sequence with delays
    setTimeout(() => {
      const browserInitMessage = {
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: { name: 'browser_init', arguments: { headless: true } }
      };
      child.stdin.write(JSON.stringify(browserInitMessage) + '\n');
      
      setTimeout(() => {
        const navigateMessage = {
          jsonrpc: '2.0',
          id: messageId++,
          method: 'tools/call',
          params: { name: 'navigate', arguments: { url: TEST_URL } }
        };
        child.stdin.write(JSON.stringify(navigateMessage) + '\n');
        
        setTimeout(() => {
          const getContentMessage = {
            jsonrpc: '2.0',
            id: messageId++,
            method: 'tools/call',
            params: { name: 'get_content', arguments: { type: 'html' } }
          };
          child.stdin.write(JSON.stringify(getContentMessage) + '\n');
          
          setTimeout(() => {
            const toolMessage = {
              jsonrpc: '2.0',
              id: messageId++,
              method: 'tools/call',
              params: {
                name: toolData.name,
                arguments: toolData.args
              }
            };
            child.stdin.write(JSON.stringify(toolMessage) + '\n');
            
            setTimeout(() => {
              child.stdin.end();
            }, 8000);
          }, 3000);
        }, 3000);
      }, 3000);
    }, 2000);
  });
}

async function runAllTests() {
  console.log(`🚀 Starting comprehensive test of ${toolsToTest.length} tools on ${TEST_URL}\n`);
  console.log('Each tool will be tested individually with a 30-second timeout...\n');
  
  for (let i = 0; i < toolsToTest.length; i++) {
    const tool = toolsToTest[i];
    console.log(`\n📊 Progress: ${i + 1}/${toolsToTest.length}`);
    
    await testTool(tool);
    
    // Small delay between tests to avoid overwhelming the server
    if (i < toolsToTest.length - 1) {
      await delay(2000);
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.status === 'SUCCESS');
  const empty = results.filter(r => r.status === 'EMPTY');
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'PARSE_ERROR' || r.status === 'PROCESS_ERROR');
  const noResponse = results.filter(r => r.status === 'NO_RESPONSE');
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   ✅ Successful: ${successful.length}/${toolsToTest.length} (${Math.round(successful.length/toolsToTest.length*100)}%)`);
  console.log(`   ⚠️  Empty responses: ${empty.length}/${toolsToTest.length} (${Math.round(empty.length/toolsToTest.length*100)}%)`);
  console.log(`   ❌ Errors: ${errors.length}/${toolsToTest.length} (${Math.round(errors.length/toolsToTest.length*100)}%)`);
  console.log(`   🚫 No response: ${noResponse.length}/${toolsToTest.length} (${Math.round(noResponse.length/toolsToTest.length*100)}%)`);
  
  if (successful.length > 0) {
    console.log(`\n✅ WORKING TOOLS (${successful.length}):`);
    successful.forEach(result => {
      console.log(`   • ${result.tool} - Data size: ${result.dataSize} chars`);
    });
  }
  
  if (empty.length > 0) {
    console.log(`\n⚠️ TOOLS WITH EMPTY RESPONSES (${empty.length}):`);
    empty.forEach(result => {
      console.log(`   • ${result.tool} - ${result.preview}`);
    });
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ TOOLS WITH ERRORS (${errors.length}):`);
    errors.forEach(result => {
      console.log(`   • ${result.tool} - ${result.preview}`);
    });
  }
  
  // Save detailed results to file
  const detailedReport = {
    testUrl: TEST_URL,
    timestamp: new Date().toISOString(),
    summary: {
      total: toolsToTest.length,
      successful: successful.length,
      empty: empty.length,
      errors: errors.length,
      noResponse: noResponse.length
    },
    results: results
  };
  
  writeFileSync('war2-test-results.json', JSON.stringify(detailedReport, null, 2));
  console.log(`\n📄 Detailed results saved to: war2-test-results.json`);
  
  if (successful.length >= toolsToTest.length * 0.7) {
    console.log(`\n🎉 SUCCESS: ${Math.round(successful.length/toolsToTest.length*100)}% of tools are working correctly!`);
  } else if (successful.length >= toolsToTest.length * 0.5) {
    console.log(`\n⚡ PARTIAL SUCCESS: ${Math.round(successful.length/toolsToTest.length*100)}% of tools are working. Some need attention.`);
  } else {
    console.log(`\n⚠️ NEEDS ATTENTION: Only ${Math.round(successful.length/toolsToTest.length*100)}% of tools are working correctly.`);
  }
  
  console.log('\n🔚 Test completed!');
}

runAllTests().catch(console.error);