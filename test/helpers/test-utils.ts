import { ChildProcess } from 'child_process';

/**
 * Test utilities for MCP server integration tests
 * Converts callback-based tests to Promise-based for Vitest
 */

export interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: any;
}

export interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: any;
}

/**
 * Wait for server to start up by monitoring stderr output
 */
export function waitForServerStartup(serverProcess: ChildProcess, timeoutMs: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error(`[TEST] Server startup timeout after ${timeoutMs}ms`);
        reject(new Error(`Server did not start within ${timeoutMs}ms`));
      }
    }, timeoutMs);

    const stderrHandler = (data: Buffer) => {
      const output = data.toString();
      if (output.includes('Brave Real Browser MCP Server started successfully')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          serverProcess.stderr?.removeListener('data', stderrHandler);
          console.error('[TEST] Server startup detected successfully');
          resolve();
        }
      }
    };
    
    const errorHandler = (error: Error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        console.error('[TEST] Server process error:', error.message);
        reject(new Error(`Server process error: ${error.message}`));
      }
    };
    
    const exitHandler = (code: number | null) => {
      if (!resolved && code !== 0) {
        resolved = true;
        clearTimeout(timeout);
        console.error(`[TEST] Server process exited with code: ${code}`);
        reject(new Error(`Server process exited with code ${code}`));
      }
    };

    serverProcess.stderr?.on('data', stderrHandler);
    serverProcess.on('error', errorHandler);
    serverProcess.on('exit', exitHandler);
    
    // Cleanup listeners if resolved
    const cleanup = () => {
      serverProcess.stderr?.removeListener('data', stderrHandler);
      serverProcess.removeListener('error', errorHandler);
      serverProcess.removeListener('exit', exitHandler);
    };
    
    timeout.unref(); // Don't keep process alive just for timeout
  });
}

// Track if server has been initialized
let serverInitialized = false;

/**
 * Reset server initialization state (call this in test cleanup)
 */
export function resetServerInitialization(): void {
  serverInitialized = false;
}

/**
 * Send initialize request to server
 */
async function initializeServer(serverProcess: ChildProcess): Promise<void> {
  if (serverInitialized) return;
  
  const initRequest: MCPRequest = {
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  return new Promise((resolve, reject) => {
    const message = JSON.stringify(initRequest) + '\n';
    let responseReceived = false;
    
    const timeout = setTimeout(() => {
      if (!responseReceived) {
        console.error('[TEST] Initialize request timed out after 15s');
        reject(new Error('Server initialization timeout'));
      }
    }, 15000); // Increased to 15 seconds
    
    const dataHandler = (data: Buffer) => {
      const lines = data.toString().split('\n').filter((line: string) => line.trim());
      
      lines.forEach((line: string) => {
        try {
          const response = JSON.parse(line);
          // Check for initialize response (id === 0 and has result)
          if (response.id === 0 && response.result) {
            console.error('[TEST] Initialize response received successfully');
            responseReceived = true;
            serverInitialized = true;
            clearTimeout(timeout);
            serverProcess.stdout?.removeListener('data', dataHandler);
            resolve();
          }
        } catch (e) {
          // Ignore non-JSON lines
        }
      });
    };
    
    serverProcess.stdout?.on('data', dataHandler);
    
    // Small delay to ensure server is ready
    setTimeout(() => {
      console.error('[TEST] Sending initialize request');
      serverProcess.stdin?.write(message);
    }, 100);
  });
}

/**
 * Send an MCP request and wait for a response
 */
export async function sendMCPRequest(
  serverProcess: ChildProcess, 
  request: MCPRequest, 
  timeoutMs: number = 10000
): Promise<MCPResponse> {
  // Wait for server startup and initialize if not done
  // Use longer timeout to ensure server has time to start
  try {
    await waitForServerStartup(serverProcess, 45000);
  } catch (error) {
    console.error('[TEST] Failed to wait for server startup:', error);
    throw error;
  }
  
  try {
    await initializeServer(serverProcess);
  } catch (error) {
    console.error('[TEST] Failed to initialize server:', error);
    throw error;
  }
  
  return new Promise((resolve, reject) => {
    const message = JSON.stringify(request) + '\n';
    let responseReceived = false;

    const timeout = setTimeout(() => {
      if (!responseReceived) {
        reject(new Error(`No response received for request ${request.id} within ${timeoutMs}ms`));
      }
    }, timeoutMs);

    const dataHandler = (data: Buffer) => {
      const lines = data.toString().split('\n').filter((line: string) => line.trim());
      
      lines.forEach((line: string) => {
        try {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            responseReceived = true;
            clearTimeout(timeout);
            serverProcess.stdout?.removeListener('data', dataHandler);
            resolve(response);
          }
        } catch (e) {
          // Ignore non-JSON lines
        }
      });
    };

    serverProcess.stdout?.on('data', dataHandler);
    serverProcess.stdin?.write(message);
  });
}

/**
 * Monitor stdout for invalid (non-JSON) output
 */
export function monitorStdoutOutput(
  serverProcess: ChildProcess, 
  durationMs: number = 2000
): Promise<boolean> {
  return new Promise((resolve) => {
    let hasInvalidOutput = false;

    const dataHandler = (data: Buffer) => {
      const lines = data.toString().split('\n').filter((line: string) => line.trim());
      
      lines.forEach((line: string) => {
        try {
          JSON.parse(line);
        } catch (e) {
          if (line.includes('Found Chrome at:') || line.includes('Chrome not found')) {
            hasInvalidOutput = true;
          }
        }
      });
    };

    serverProcess.stdout?.on('data', dataHandler);

    setTimeout(() => {
      serverProcess.stdout?.removeListener('data', dataHandler);
      resolve(hasInvalidOutput);
    }, durationMs);
  });
}

/**
 * Test sequence for workflow validation
 */
export async function testWorkflowSequence(
  serverProcess: ChildProcess,
  sequence: MCPRequest[]
): Promise<MCPResponse[]> {
  // Initialize server once before the entire sequence
  try {
    await initializeServer(serverProcess);
  } catch (error) {
    console.error('[TEST] Failed to initialize server for workflow sequence:', error);
    throw error;
  }
  
  const responses: MCPResponse[] = [];
  
  for (const request of sequence) {
    // Send requests without re-initializing
    const response = await new Promise<MCPResponse>((resolve, reject) => {
      const message = JSON.stringify(request) + '\n';
      let responseReceived = false;
      const timeoutMs = 40000; // Extra long timeout for workflow tests

      const timeout = setTimeout(() => {
        if (!responseReceived) {
          reject(new Error(`No response received for request ${request.id} within ${timeoutMs}ms`));
        }
      }, timeoutMs);

      const dataHandler = (data: Buffer) => {
        const lines = data.toString().split('\n').filter((line: string) => line.trim());
        
        lines.forEach((line: string) => {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              responseReceived = true;
              clearTimeout(timeout);
              serverProcess.stdout?.removeListener('data', dataHandler);
              resolve(response);
            }
          } catch (e) {
            // Ignore non-JSON lines
          }
        });
      };

      serverProcess.stdout?.on('data', dataHandler);
      serverProcess.stdin?.write(message);
    });
    
    responses.push(response);
  }
  
  return responses;
}

/**
 * Create an MCP request builder for easier test construction
 */
export class MCPRequestBuilder {
  private request: Partial<MCPRequest> = {
    jsonrpc: '2.0'
  };

  id(id: number): MCPRequestBuilder {
    this.request.id = id;
    return this;
  }

  method(method: string): MCPRequestBuilder {
    this.request.method = method;
    return this;
  }

  params(params: any): MCPRequestBuilder {
    this.request.params = params;
    return this;
  }

  build(): MCPRequest {
    if (!this.request.id || !this.request.method) {
      throw new Error('Request must have id and method');
    }
    return this.request as MCPRequest;
  }
}

/**
 * Helper to create common MCP requests
 */
export const createMCPRequest = {
  toolsList: (id: number): MCPRequest => 
    new MCPRequestBuilder().id(id).method('tools/list').params({}).build(),
    
  resourcesList: (id: number): MCPRequest => 
    new MCPRequestBuilder().id(id).method('resources/list').params({}).build(),
    
  promptsList: (id: number): MCPRequest => 
    new MCPRequestBuilder().id(id).method('prompts/list').params({}).build(),
    
  toolCall: (id: number, name: string, args: any): MCPRequest => 
    new MCPRequestBuilder().id(id).method('tools/call').params({ name, arguments: args }).build(),
};