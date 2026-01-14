/**
 * Transport Test Suite
 * Tests all transport modes: STDIO, SSE, and HTTP Stream
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const TEST_PORT = 3456;
const TEST_HOST = 'localhost';

describe('Transport Tests', () => {
  describe('STDIO Transport', () => {
    it('should start server with STDIO transport', async () => {
      const serverProcess = spawn('node', ['dist/index.js'], {
        env: { ...process.env, MCP_TRANSPORT: 'stdio', DEBUG: 'false' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          serverProcess.kill();
          reject(new Error('STDIO server startup timeout'));
        }, 10000);

        serverProcess.stderr?.on('data', (data: Buffer) => {
          const output = data.toString();
          if (output.includes('started successfully')) {
            clearTimeout(timeout);
            serverProcess.kill();
            resolve();
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  });

  describe('SSE Transport', () => {
    let serverProcess: ChildProcess;

    beforeAll(async () => {
      serverProcess = spawn('node', ['dist/index.js'], {
        env: {
          ...process.env,
          MCP_TRANSPORT: 'sse',
          MCP_PORT: TEST_PORT.toString(),
          MCP_HOST: TEST_HOST,
          DEBUG: 'false',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Wait for server to start
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('SSE server startup timeout'));
        }, 10000);

        serverProcess.stderr?.on('data', (data: Buffer) => {
          const output = data.toString();
          if (output.includes('SSE MCP Server listening')) {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    });

    afterAll(() => {
      serverProcess?.kill();
    });

    it('should respond to health check', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/mcp/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.transport).toBe('sse');
    });

    it('should establish SSE connection', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/mcp/sse`, {
        headers: { 'Accept': 'text/event-stream' },
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/event-stream');
      
      // Close the connection
      response.body?.cancel();
    });

    it('should return session info', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/mcp/session`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.stats).toBeDefined();
    });
  });

  describe('HTTP Stream Transport', () => {
    let serverProcess: ChildProcess;
    const HTTP_PORT = TEST_PORT + 1;

    beforeAll(async () => {
      serverProcess = spawn('node', ['dist/index.js'], {
        env: {
          ...process.env,
          MCP_TRANSPORT: 'http-stream',
          MCP_PORT: HTTP_PORT.toString(),
          MCP_HOST: TEST_HOST,
          DEBUG: 'false',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Wait for server to start
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HTTP Stream server startup timeout'));
        }, 10000);

        serverProcess.stderr?.on('data', (data: Buffer) => {
          const output = data.toString();
          if (output.includes('HTTP Stream MCP Server listening')) {
            clearTimeout(timeout);
            resolve();
          }
        });
      });
    });

    afterAll(() => {
      serverProcess?.kill();
    });

    it('should respond to health check', async () => {
      const response = await fetch(`http://${TEST_HOST}:${HTTP_PORT}/mcp/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.transport).toBe('http-stream');
    });

    it('should handle OPTIONS request for CORS', async () => {
      const response = await fetch(`http://${TEST_HOST}:${HTTP_PORT}/mcp`, {
        method: 'OPTIONS',
      });
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});

describe('Session Manager', () => {
  it('should create and manage sessions', async () => {
    const { SessionManager } = await import('../src/transport/session-manager.js');
    
    const manager = new SessionManager({
      sessionTimeout: 5000,
      maxSessionsPerClient: 3,
    });

    // Create session
    const session = manager.createSession('test-client', { test: true });
    expect(session.sessionId).toBeDefined();
    expect(session.clientId).toBe('test-client');
    expect(session.state).toBe('active');

    // Get session
    const retrieved = manager.getSession(session.sessionId);
    expect(retrieved).toEqual(session);

    // Update browser state
    manager.updateBrowserState(session.sessionId, {
      isInitialized: true,
      currentUrl: 'https://example.com',
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      viewportSize: { width: 1920, height: 1080 },
      userAgent: 'Test Agent',
    });

    const updated = manager.getSession(session.sessionId);
    expect(updated?.browserState?.currentUrl).toBe('https://example.com');

    // Destroy session
    manager.destroySession(session.sessionId);
    expect(manager.getSession(session.sessionId)).toBeNull();

    manager.shutdown();
  });

  it('should enforce session limits per client', async () => {
    const { SessionManager } = await import('../src/transport/session-manager.js');
    
    const manager = new SessionManager({
      maxSessionsPerClient: 2,
    });

    // Create 3 sessions for same client
    const s1 = manager.createSession('client1');
    const s2 = manager.createSession('client1');
    const s3 = manager.createSession('client1');

    // First session should be removed
    expect(manager.getSession(s1.sessionId)).toBeNull();
    expect(manager.getSession(s2.sessionId)).toBeDefined();
    expect(manager.getSession(s3.sessionId)).toBeDefined();

    manager.shutdown();
  });
});

describe('Progress Notifier', () => {
  it('should track progress updates', async () => {
    const { ProgressNotifier } = await import('../src/transport/progress-notifier.js');
    
    const notifier = new ProgressNotifier();
    const updates: any[] = [];

    // Subscribe to all updates
    notifier.subscribeAll((update) => {
      updates.push(update);
    });

    // Start operation
    notifier.startOperation('test-op', 'Testing...');
    expect(updates.length).toBe(1);
    expect(updates[0].progressToken).toBe('test-op');
    expect(updates[0].progress).toBe(0);

    // Update progress
    notifier.updateProgress('test-op', 50, { message: 'Half way' });
    expect(updates.length).toBe(2);
    expect(updates[1].progress).toBe(50);

    // Complete
    notifier.completeOperation('test-op', 'Done!');
    expect(updates.length).toBe(3);
    expect(updates[2].progress).toBe(100);

    notifier.cleanup();
  });

  it('should handle progress tracker', async () => {
    const { ProgressNotifier } = await import('../src/transport/progress-notifier.js');
    
    const notifier = new ProgressNotifier();
    const tracker = notifier.createTracker('tracker-test');

    const updates: any[] = [];
    notifier.subscribeAll((update) => {
      updates.push(update);
    });

    tracker.start(10, 'Starting 10-step task');
    tracker.step('Step 1');
    tracker.step('Step 2');
    tracker.setProgress(5, 'Half way');
    tracker.complete('All done!');

    expect(updates.length).toBe(5);
    expect(updates[4].progress).toBe(10); // Total steps

    notifier.cleanup();
  });
});
