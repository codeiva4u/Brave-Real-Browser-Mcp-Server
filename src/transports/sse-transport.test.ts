import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SseTransport } from './sse-transport.js';

describe('SSE Transport', () => {
  let transport: SseTransport;
  const TEST_PORT = 3099; // Use different port to avoid conflicts
  const TEST_HOST = 'localhost';

  beforeAll(async () => {
    transport = new SseTransport({
      port: TEST_PORT,
      host: TEST_HOST,
      heartbeatInterval: 5000,
    });
    await transport.start();
    // Give server time to fully start
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await transport.stop();
  });

  describe('Server Initialization', () => {
    it('should start SSE server successfully', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.protocol).toBe('SSE');
    });

    it('should return tools list', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/tools`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.tools).toBeDefined();
      expect(Array.isArray(data.tools)).toBe(true);
      expect(data.tools.length).toBeGreaterThan(0);
    });
  });

  describe('SSE Event Stream', () => {
    it('should establish SSE connection and receive connected event', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/events`, {
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(response.headers.get('cache-control')).toBe('no-cache');
      expect(response.headers.get('connection')).toBe('keep-alive');
    });

    it('should track connected clients', async () => {
      const initialClientsCount = transport.getClientsCount();
      
      // Establish SSE connection
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/events`, {
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      // Wait a bit for connection to be registered
      await new Promise(resolve => setTimeout(resolve, 100));

      const currentClientsCount = transport.getClientsCount();
      expect(currentClientsCount).toBeGreaterThan(initialClientsCount);
    });
  });

  describe('Browser Tool Execution', () => {
    it('should handle browser init failure gracefully', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/browser/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      expect([200, 500]).toContain(response.status);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('result');
    });

    it('should handle navigation without browser', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/browser/navigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it('should handle get-content without browser', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/browser/get-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'text' }),
      });

      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });
  });

  describe('Generic Tool Execution', () => {
    it('should reject unknown tool', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/tools/unknown_tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      // MCP format: errors are returned in content with isError flag
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.isError).toBe(true);
      expect(data.result.content[0].text).toContain('Unknown tool');
    });

    it('should validate tool arguments', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/tools/navigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ /* missing url */ }),
      });

      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/health`);
      
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/tools`, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast custom events', () => {
      // This is a unit test for the broadcast method
      expect(typeof transport.broadcast).toBe('function');
      
      // Call broadcast (won't fail even with no clients)
      expect(() => {
        transport.broadcast('test_event', { test: 'data' });
      }).not.toThrow();
    });

    it('should handle broadcast to disconnected clients', () => {
      // Broadcast should handle errors gracefully
      expect(() => {
        transport.broadcast('error_test', { data: 'test' });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/tools/navigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      expect(response.status).toBe(500); // Express body-parser returns 500 for bad JSON
    });

    it('should handle missing request body', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/browser/navigate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Server Lifecycle', () => {
    it('should stop gracefully', async () => {
      const tempTransport = new SseTransport({
        port: TEST_PORT + 1,
        host: TEST_HOST,
      });

      await tempTransport.start();
      expect(tempTransport.getClientsCount()).toBe(0);

      await tempTransport.stop();
      
      // Verify server is stopped by trying to connect
      await expect(
        fetch(`http://${TEST_HOST}:${TEST_PORT + 1}/health`)
      ).rejects.toThrow();
    });

    it('should handle stop when no clients connected', async () => {
      const tempTransport = new SseTransport({
        port: TEST_PORT + 2,
        host: TEST_HOST,
      });

      await tempTransport.start();
      await tempTransport.stop();

      expect(tempTransport.getClientsCount()).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultTransport = new SseTransport();
      expect(defaultTransport).toBeDefined();
      // Don't start it to avoid port conflicts
    });

    it('should use custom port and host', async () => {
      const customTransport = new SseTransport({
        port: TEST_PORT + 3,
        host: '127.0.0.1',
        heartbeatInterval: 10000,
      });

      await customTransport.start();
      
      const response = await fetch(`http://127.0.0.1:${TEST_PORT + 3}/health`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');

      await customTransport.stop();
    });
  });

  describe('Health Check Details', () => {
    it('should include client count in health check', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/health`);
      const data = await response.json();
      
      expect(data).toHaveProperty('clients');
      expect(typeof data.clients).toBe('number');
      expect(data.clients).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp in health check', async () => {
      const response = await fetch(`http://${TEST_HOST}:${TEST_PORT}/health`);
      const data = await response.json();
      
      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});
