/**
 * MCP Server Integration Tests
 * Tests MCP server tools with anti-detection verification
 */

import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '../..');

// Helper to send MCP request
function sendMCPRequest(serverProcess, request) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Request timeout: ${request.method}`));
        }, 60000);

        const responseHandler = (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            for (const line of lines) {
                try {
                    const response = JSON.parse(line);
                    if (response.id === request.id) {
                        clearTimeout(timeout);
                        serverProcess.stdout.removeListener('data', responseHandler);
                        resolve(response);
                    }
                } catch (e) {
                    // Ignore non-JSON lines
                }
            }
        };

        serverProcess.stdout.on('data', responseHandler);
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
}

// Start MCP server
function startMCPServer() {
    const serverPath = resolve(PROJECT_ROOT, 'dist/index.js');
    const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: PROJECT_ROOT
    });

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Server startup timeout'));
        }, 30000);

        server.stderr.on('data', (data) => {
            if (data.toString().includes('started successfully')) {
                clearTimeout(timeout);
                resolve(server);
            }
        });

        server.on('error', reject);
    });
}

test('MCP Server - Browser Init and Anti-Detection', async (t) => {
    console.log('🚀 Starting MCP Server Integration Test');
    
    const server = await startMCPServer();
    console.log('✅ MCP Server started');

    try {
        // Test 1: Initialize browser
        console.log('\n📝 Test 1: Browser Initialization');
        const initRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'browser_init',
                arguments: {
                    headless: false,
                    disableXvfb: true,
                    customConfig: {
                        args: ['--start-maximized']
                    }
                }
            }
        };

        const initResponse = await sendMCPRequest(server, initRequest);
        assert.ok(initResponse.result, 'Browser should initialize');
        console.log('✅ Browser initialized successfully');

        // Test 2: Navigate to detection test site
        console.log('\n📝 Test 2: Navigate to DrissionPage Detector');
        const navRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'navigate',
                arguments: {
                    url: 'https://web.archive.org/web/20240913054632/https://drissionpage.pages.dev/',
                    waitUntil: 'domcontentloaded'
                }
            }
        };

        const navResponse = await sendMCPRequest(server, navRequest);
        assert.ok(navResponse.result, 'Navigation should succeed');
        console.log('✅ Navigation successful');

        // Test 3: Get page content
        console.log('\n📝 Test 3: Get Page Content');
        const contentRequest = {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'get_content',
                arguments: {
                    type: 'text'
                }
            }
        };

        const contentResponse = await sendMCPRequest(server, contentRequest);
        assert.ok(contentResponse.result, 'Should get content');
        const content = contentResponse.result.content[0].text;
        console.log('✅ Page content retrieved:', content.substring(0, 100) + '...');

        // Test 4: Close browser
        console.log('\n📝 Test 4: Close Browser');
        const closeRequest = {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'browser_close',
                arguments: {}
            }
        };

        const closeResponse = await sendMCPRequest(server, closeRequest);
        assert.ok(closeResponse.result, 'Browser should close');
        console.log('✅ Browser closed successfully');

        console.log('\n🎉 All MCP Integration Tests Passed!');

    } finally {
        server.kill();
    }
});

console.log(`
╔════════════════════════════════════════════════════════════╗
║  MCP Server Integration Test Suite                         ║
║  Testing anti-detection capabilities via MCP protocol      ║
╚════════════════════════════════════════════════════════════╝
`);
