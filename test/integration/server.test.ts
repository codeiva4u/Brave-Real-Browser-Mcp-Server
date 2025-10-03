import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { describe, test, beforeAll, beforeEach, afterEach, expect } from 'vitest';
import { 
  waitForServerStartup, 
  sendMCPRequest, 
  monitorStdoutOutput,
  testWorkflowSequence,
  createMCPRequest 
} from '../helpers/test-utils';

// Project root for consistent path resolution
const PROJECT_ROOT = resolve(__dirname, '../..');

// Helper function to read source files
const readSourceFile = (filePath: string): string => {
  return readFileSync(resolve(PROJECT_ROOT, filePath), 'utf8');
};

describe('MCP Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  
  beforeAll(() => {
    // No need to change directory - we'll use absolute paths
  });

  beforeEach(() => {
    // Start fresh server for each test
    serverProcess = spawn('node', [resolve(PROJECT_ROOT, 'dist/index.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: PROJECT_ROOT
    });
  });

  afterEach(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      
      // Wait for process to exit with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          serverProcess.kill('SIGKILL'); // Force kill if graceful shutdown fails
          reject(new Error('Server process did not exit gracefully'));
        }, 10000); // 10 second timeout for graceful shutdown
        
        serverProcess.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      }).catch(() => {
        // Process was force killed, continue
      });
    }
  });

  describe('Server Startup', () => {
    test('should start without errors', async () => {
      await waitForServerStartup(serverProcess, 60000); // Increased to 60 seconds for CI
      // If we get here without timeout, the server started successfully
      expect(true).toBe(true);
    }, 70000); // Test timeout

    test('should not pollute stdout with non-JSON content', async () => {
      await waitForServerStartup(serverProcess, 60000); // Increased to 60 seconds for CI
      const hasInvalidOutput = await monitorStdoutOutput(serverProcess, 5000);
      expect(hasInvalidOutput).toBe(false);
    }, 70000); // Test timeout
  });

  describe('JSON-RPC Protocol Compliance', () => {
    test('tools/list should return valid response', async () => {
      const request = createMCPRequest.toolsList(1);
      const response = await sendMCPRequest(serverProcess, request, 20000);
      
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeDefined();
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools.length).toBeGreaterThan(0);
    }, 25000);

    test('resources/list should return empty array (no Method not found)', async () => {
      const request = createMCPRequest.resourcesList(2);
      const response = await sendMCPRequest(serverProcess, request, 20000);
      
      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.resources).toBeDefined();
      expect(Array.isArray(response.result.resources)).toBe(true);
    }, 25000);

    test('prompts/list should return empty array (no Method not found)', async () => {
      const request = createMCPRequest.promptsList(3);
      const response = await sendMCPRequest(serverProcess, request, 20000);
      
      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.prompts).toBeDefined();
      expect(Array.isArray(response.result.prompts)).toBe(true);
    }, 25000);
  });

  describe('Error Handling and Retry Logic', () => {
    test('should have BrowserErrorType enum', () => {
      // This tests that error categorization is implemented
      const browserManagerCode = readSourceFile('src/browser-manager.ts');
      
      expect(browserManagerCode).toContain('enum BrowserErrorType');
      expect(browserManagerCode).toContain('FRAME_DETACHED');
      expect(browserManagerCode).toContain('SESSION_CLOSED');
      expect(browserManagerCode).toContain('TARGET_CLOSED');
      expect(browserManagerCode).toContain('PROTOCOL_ERROR');
    });

    test('should have retry wrapper function', () => {
      const systemUtilsCode = readSourceFile('src/system-utils.ts');
      
      expect(systemUtilsCode).toContain('withErrorHandling');
      expect(systemUtilsCode).toContain('withTimeout');
    });

    test('should have session validation', () => {
      const browserManagerCode = readSourceFile('src/browser-manager.ts');
      
      expect(browserManagerCode).toContain('BrowserErrorType');
      expect(browserManagerCode).toContain('SESSION_CLOSED');
    });
  });

  describe('Tool Validation (Centralized)', () => {
    const expectedTools = [
      'browser_init',
      'navigate',
      'get_content',
      'click',
      'type',
      'select',
      'wait',
      'browser_close',
      'solve_captcha',
      'random_scroll',
      'find_selector',
      'save_content_as_markdown'
    ];

    test('should have exactly 12 tools available', async () => {
      const request = createMCPRequest.toolsList(10);
      const response = await sendMCPRequest(serverProcess, request);
      
      const tools = response.result.tools;
      expect(tools).toHaveLength(12);
      expect(tools.map((t: any) => t.name).sort()).toEqual(expectedTools.sort());
    });

    test('all tools should have valid schemas and descriptions', async () => {
      const request = createMCPRequest.toolsList(11);
      const response = await sendMCPRequest(serverProcess, request, 20000);
      
      const tools = response.result.tools;
      tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.inputSchema).toBe('object');
      });
    }, 25000);

    test('browser_init tool should have correct schema', async () => {
      const request = createMCPRequest.toolsList(12);
      const response = await sendMCPRequest(serverProcess, request, 20000);
      
      const tools = response.result.tools;
      const browserInitTool = tools.find((tool: any) => tool.name === 'browser_init');
      
      expect(browserInitTool).toBeDefined();
      expect(browserInitTool.description).toContain('anti-detection');
      expect(browserInitTool.inputSchema.properties.headless).toBeDefined();
      expect(browserInitTool.inputSchema.properties.proxy).toBeDefined();
    }, 25000);
  });

  describe('Workflow Validation System', () => {
    test('should prevent find_selector before content analysis', async () => {
      const request = createMCPRequest.toolCall(20, 'find_selector', { text: 'button text' });
      const response = await sendMCPRequest(serverProcess, request, 20000);
      
      expect(response.error).toBeDefined();
      expect(response.error.message).toMatch(/Cannot search for selectors|cannot be executed in current state/);
      expect(response.error.message).toContain('get_content');
    }, 25000);

    test('should guide proper workflow sequence', async () => {
      const request = createMCPRequest.toolCall(21, 'browser_init', {});
      const response = await sendMCPRequest(serverProcess, request, 40000); // Increased to 40 seconds for browser initialization
      
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('Next step: Use navigate');
      expect(response.result.content[0].text).toContain('get_content to analyze');
      expect(response.result.content[0].text).toContain('prevents blind selector guessing');
    }, 50000);

    test('should validate workflow state transitions', () => {
      // Check that workflow validation is implemented in handlers
      const browserHandlersCode = readSourceFile('src/handlers/browser-handlers.ts');
      const interactionHandlersCode = readSourceFile('src/handlers/interaction-handlers.ts');
      
      expect(browserHandlersCode).toContain('withWorkflowValidation');
      expect(interactionHandlersCode).toContain('withWorkflowValidation');
    });

    test('should have workflow validation imports', () => {
      // Check workflow validation module exists
      const workflowValidationCode = readSourceFile('src/workflow-validation.ts');
      
      expect(workflowValidationCode).toContain('WorkflowValidator');
      expect(workflowValidationCode).toContain('validateWorkflow');
      expect(workflowValidationCode).toContain('recordExecution');
    });
  });

  describe('Token Management Integration', () => {
    test('should have token management system available', () => {
      const tokenMgmtCode = readSourceFile('src/token-management.ts');
      
      expect(tokenMgmtCode).toContain('class TokenManager');
      expect(tokenMgmtCode).toContain('MCP_MAX_TOKENS = 25000');
      expect(tokenMgmtCode).toContain('validateContentSize');
      expect(tokenMgmtCode).toContain('chunkContent');
    });

    test('should have content strategy engine available', () => {
      const strategyCode = readSourceFile('src/content-strategy.ts');
      
      expect(strategyCode).toContain('class ContentStrategyEngine');
      expect(strategyCode).toContain('processContentRequest');
      expect(strategyCode).toContain('performPreflightEstimation');
    });

    test('should integrate token management in get_content', () => {
      const contentHandlersCode = readSourceFile('src/handlers/content-handlers.ts');
      
      expect(contentHandlersCode).toContain('tokenManager');
      expect(contentHandlersCode).toContain('Content size');
      expect(contentHandlersCode).toContain('tokens');
    });
  });

  describe('Content Analysis Prevention', () => {
    test('should have stale content analysis check', () => {
      const workflowCode = readSourceFile('src/workflow-validation.ts');
      
      expect(workflowCode).toContain('isContentAnalysisStale');
      expect(workflowCode).toContain('WorkflowState.CONTENT_ANALYZED');
      expect(workflowCode).toContain('find_selector');
    });

    test('should have enhanced find_selector validation', () => {
      const workflowCode = readSourceFile('src/workflow-validation.ts');
      const handlerCode = readSourceFile('src/handlers/content-handlers.ts');
      
      expect(workflowCode).toContain('prevents blind selector guessing');
      expect(workflowCode).toContain('find_selector');
      expect(handlerCode).toContain('withWorkflowValidation');
    });
  });

  describe('Workflow State Management', () => {
    test('should have workflow state enum', () => {
      const workflowCode = readSourceFile('src/workflow-validation.ts');
      
      expect(workflowCode).toContain('enum WorkflowState');
      expect(workflowCode).toContain('BROWSER_INIT');
      expect(workflowCode).toContain('PAGE_LOADED');
      expect(workflowCode).toContain('CONTENT_ANALYZED');
      expect(workflowCode).toContain('SELECTOR_AVAILABLE');
    });

    test('should have workflow context interface', () => {
      const workflowCode = readSourceFile('src/workflow-validation.ts');
      
      expect(workflowCode).toContain('interface WorkflowContext');
      expect(workflowCode).toContain('currentState');
      expect(workflowCode).toContain('contentAnalyzed');
      expect(workflowCode).toContain('toolCallHistory');
    });

    test('should have workflow validator class', () => {
      const workflowCode = readSourceFile('src/workflow-validation.ts');
      
      expect(workflowCode).toContain('class WorkflowValidator');
      expect(workflowCode).toContain('validateToolExecution');
      expect(workflowCode).toContain('recordToolExecution');
      expect(workflowCode).toContain('updateWorkflowState');
    });
  });

  describe('Integration Tests for Issue #9 Resolution', () => {
    test('should block find_selector without prior get_content', async () => {
      // This test specifically addresses the GitHub issue
      const sequence = [
        createMCPRequest.toolCall(30, 'browser_init', {}),
        createMCPRequest.toolCall(31, 'find_selector', { text: 'test' })
      ];

      const responses = await testWorkflowSequence(serverProcess, sequence);
      
      // First response should succeed (browser_init)
      expect(responses[0].result).toBeDefined();
      
      // Second response should be blocked (find_selector without content analysis)
      expect(responses[1].error).toBeDefined();
      expect(responses[1].error.message).toMatch(/Cannot search for selectors|cannot be executed/);
      expect(responses[1].error.message).toContain('get_content');
    });
  });
});