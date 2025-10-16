// Test setup for Vitest MCP server tests
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { platform } from 'os';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.BRAVE_TEST_MODE = 'true';

// Configure test timeouts based on research findings
// Research shows default 5s Vitest timeout is too low for:
// - Browser initialization (can take 15-30s)
// - Server startup (can take 30-45s in some environments)
// - Integration test cleanup (needs proper process termination)
if (!process.env.VITEST_TEST_TIMEOUT) {
  process.env.VITEST_TEST_TIMEOUT = '60000'; // 60 seconds for integration tests
}
if (!process.env.VITEST_HOOK_TIMEOUT) {
  process.env.VITEST_HOOK_TIMEOUT = '45000'; // 45 seconds for setup/teardown
}

/**
 * Brave Process Management for TDD Testing
 * Following TDD-specific-workflow-tutorial.md guidelines
 */

// Brave process cleanup utility
async function killBraveProcesses(): Promise<void> {
  const isWindows = platform() === 'win32';
  
  try {
    if (isWindows) {
      // Windows: Kill Brave processes
      await new Promise<void>((resolve) => {
        const killProcess = spawn('taskkill', ['/F', '/IM', 'brave.exe'], { stdio: 'ignore' });
        killProcess.on('close', () => resolve());
        killProcess.on('error', () => resolve()); // Ignore errors
      });
    } else {
      // macOS/Linux: Kill Brave processes
      await new Promise<void>((resolve) => {
        const killProcess = spawn('pkill', ['-f', 'Brave Browser'], { stdio: 'ignore' });
        killProcess.on('close', () => resolve());
        killProcess.on('error', () => resolve()); // Ignore errors
      });
    }
    
    // Additional cleanup for zombie processes
    await new Promise<void>((resolve) => {
      const killBrave = spawn('pkill', ['-f', 'brave'], { stdio: 'ignore' });
      killBrave.on('close', () => resolve());
      killBrave.on('error', () => resolve()); // Ignore errors
    });
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn('Brave cleanup warning (non-fatal):', error.message);
  }
}

// Check Brave process count
async function getBraveProcessCount(): Promise<number> {
  return new Promise((resolve) => {
    const psProcess = spawn('ps', ['aux'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let output = '';
    
    psProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    psProcess.on('close', () => {
      const braveLines = output.split('\n').filter(line => 
        line.includes('brave') || line.includes('Brave Browser')
      );
      resolve(braveLines.length);
    });
    
    psProcess.on('error', () => resolve(0)); // Default to 0 on error
  });
}

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting TDD test session - cleaning up Brave processes...');
  
  // Clean up any existing Brave processes before starting tests
  await killBraveProcesses();
  
  // Wait for processes to be cleaned up
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const processCount = await getBraveProcessCount();
  console.log(`📊 Brave processes after cleanup: ${processCount}`);
});

// Clean up after each test to prevent Brave zombie processes
afterEach(async () => {
  // Kill any Brave processes that might have been left behind
  await killBraveProcesses();
  
  // Small delay to ensure cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Final cleanup after all tests
afterAll(async () => {
  console.log('🧹 TDD test session complete - final Brave cleanup...');
  
  // Final cleanup
  await killBraveProcesses();
  
  // Verify cleanup
  const finalProcessCount = await getBraveProcessCount();
  console.log(`✅ Final Brave processes: ${finalProcessCount}`);
  
  if (finalProcessCount > 0) {
    console.warn('⚠️  Warning: Some Brave processes may still be running');
  }
});

// Export utilities for use in tests
export { killBraveProcesses, getBraveProcessCount };
