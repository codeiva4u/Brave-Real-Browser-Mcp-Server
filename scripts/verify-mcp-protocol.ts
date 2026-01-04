
import { spawn } from 'child_process';
import path from 'path';

const SERVER_PATH = path.join(process.cwd(), 'src', 'index.ts');

console.error('Testing MCP Server Stdio Integrity...');
console.error(`Target: ${SERVER_PATH}`);

// Handle Windows npx
const npmCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const serverProcess = spawn(npmCmd, ['tsx', SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'inherit'], // Pipe stdin/stdout, inherit stderr
    env: { ...process.env, BRAVE_PATH: process.env.BRAVE_PATH || '' }
});

let stdoutBuffer = '';
let hasError = false;

serverProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    stdoutBuffer += chunk;

    // Check for non-JSON content immediately
    const lines = chunk.split('\n').filter(l => l.trim());
    for (const line of lines) {
        if (!line.startsWith('{') && !line.startsWith('[')) {
            console.error(`❌ FAILURE: Non-JSON content detected in stdout: "${line}"`);
            hasError = true;
            serverProcess.kill();
            process.exit(1);
        }
    }
});

// Send initialize request
const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'verifier', version: '1.0.0' }
    }
};

setTimeout(() => {
    // Send request after a brief pause
    console.error('Sending initialize request...');
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
}, 2000);

setTimeout(() => {
    if (!stdoutBuffer.includes('"result":')) {
        console.error('❌ TIMEOUT: Did not receive valid JSON-RPC response.');
        hasError = true;
    } else {
        try {
            const lines = stdoutBuffer.split('\n').filter(l => l.trim());
            for (const line of lines) {
                JSON.parse(line);
            }
            console.error('✅ SUCCESS: Received valid JSON-RPC response and no stdout pollution.');
        } catch (e) {
            console.error('❌ PARSE ERROR: stdout contained invalid JSON:', stdoutBuffer);
            hasError = true;
        }
    }

    serverProcess.kill();
    if (hasError) process.exit(1);
    process.exit(0);
}, 5000);
