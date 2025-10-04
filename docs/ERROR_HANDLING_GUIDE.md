# Error Handling System - Complete Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Error Categories](#error-categories)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)
6. [Recovery Strategies](#recovery-strategies)
7. [Cross-Project Integration](#cross-project-integration)

---

## Overview

The **Brave Real Browser MCP Server Ecosystem** implements a comprehensive, standardized error handling system across all four projects:

1. **MCP Server** - TypeScript-based centralized error system
2. **Brave Real Browser** - JavaScript error handling for browser operations
3. **Brave Real Launcher** - TypeScript error system for launcher operations
4. **Puppeteer-Core** - JavaScript error handling for patching operations

### Key Features

✅ **Standardized Error Classes** - Consistent error structure across all projects  
✅ **Error Categorization** - Automatic categorization of generic errors  
✅ **Severity Levels** - LOW, MEDIUM, HIGH, CRITICAL  
✅ **Recovery Strategies** - Built-in recovery recommendations  
✅ **Context Preservation** - Rich error context for debugging  
✅ **MCP Protocol Integration** - Errors serialized for MCP responses  

---

## Architecture

### Error Class Hierarchy

```
MCPError (Base)
├── BrowserError
├── NavigationError
├── InteractionError
├── ContentError
├── FileError
├── ValidationError
└── ProtocolError
```

### Error Flow

```
Operation → Try-Catch → categorizeError() → Custom Error Class → Error Handler → User Response
```

---

## Error Categories

### MCP Server (`src/errors/index.ts`)

#### Browser Errors
- `BROWSER_NOT_INITIALIZED` - Browser instance not created
- `BROWSER_INITIALIZATION_FAILED` - Failed to initialize browser
- `BROWSER_CONNECTION_FAILED` - Connection to browser failed
- `BROWSER_CLOSED` - Browser unexpectedly closed

#### Navigation Errors
- `NAVIGATION_FAILED` - Page navigation failed
- `NAVIGATION_TIMEOUT` - Navigation exceeded timeout
- `PAGE_LOAD_FAILED` - Page failed to load

#### Element Interaction Errors
- `ELEMENT_NOT_FOUND` - Selector did not match any elements
- `ELEMENT_NOT_INTERACTABLE` - Element exists but cannot be interacted with
- `SELECTOR_INVALID` - Invalid CSS selector syntax
- `CLICK_FAILED` - Click operation failed
- `TYPE_FAILED` - Type operation failed

#### Content Errors
- `CONTENT_RETRIEVAL_FAILED` - Failed to get page content
- `SCREENSHOT_FAILED` - Screenshot capture failed

#### File Errors
- `FILE_NOT_FOUND` - File does not exist
- `FILE_READ_ERROR` - Cannot read file
- `FILE_WRITE_ERROR` - Cannot write file
- `INVALID_FILE_PATH` - Invalid file path format

#### Validation Errors
- `INVALID_INPUT` - Invalid input parameter
- `VALIDATION_FAILED` - Validation check failed
- `WORKFLOW_VIOLATION` - Operation violates workflow rules

#### Protocol Errors
- `FRAME_DETACHED` - Page frame was detached
- `SESSION_CLOSED` - Browser session closed
- `TARGET_CLOSED` - Browser target closed
- `PROTOCOL_ERROR` - CDP protocol error

### Brave Real Browser (`lib/cjs/errors.js`)

- `CONNECTION_FAILED` - Browser connection failed
- `BROWSER_LAUNCH_FAILED` - Browser launch failed
- `BROWSER_CLOSED` - Browser closed unexpectedly
- `PAGE_CREATION_FAILED` - Page creation failed
- `PLUGIN_LOAD_FAILED` - Plugin failed to load
- `PROXY_CONNECTION_FAILED` - Proxy connection failed
- `XVFB_INIT_FAILED` - Xvfb initialization failed
- `PORT_UNAVAILABLE` - Port is not available

### Brave Real Launcher (`src/errors.ts`)

- `BROWSER_NOT_FOUND` - Browser executable not found
- `LAUNCH_FAILED` - Browser launch failed
- `LAUNCH_TIMEOUT` - Launch exceeded timeout
- `PORT_IN_USE` - Port already in use
- `PROCESS_CRASHED` - Browser process crashed
- `PLATFORM_UNSUPPORTED` - Operating system not supported
- `INVALID_CONFIG` - Invalid configuration

### Puppeteer-Core (`scripts/error-handler.js`)

- `PATCH_FAILED` - Patching operation failed
- `PATCH_VALIDATION_FAILED` - Patch validation failed
- `BACKUP_FAILED` - Backup creation failed
- `VERSION_MISMATCH` - Version compatibility issue
- `STEALTH_INJECTION_FAILED` - Stealth script injection failed

---

## Usage Examples

### Example 1: MCP Server - Handling Browser Initialization

```typescript
import { 
  createBrowserInitializationError,
  categorizeError 
} from './errors/index.js';

async function initializeBrowser(options) {
  try {
    // Browser initialization logic
    await browser.connect();
  } catch (error) {
    // Automatically categorize and throw standardized error
    const mcpError = createBrowserInitializationError(error, { options });
    throw mcpError;
  }
}
```

### Example 2: Using Workflow Validation Wrapper

```typescript
import { withWorkflowValidation } from './errors/workflow-wrapper.js';

export async function handleClick(args) {
  return await withWorkflowValidation('click', args, async () => {
    // Operation logic
    // Errors are automatically categorized
    await page.click(args.selector);
  });
}
```

### Example 3: Brave Real Browser - Connection Error

```javascript
const { 
  createConnectionError,
  categorizeError 
} = require('./lib/cjs/errors.js');

async function connect(options) {
  try {
    const browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${port}`
    });
    return browser;
  } catch (error) {
    throw createConnectionError(`http://127.0.0.1:${port}`, error);
  }
}
```

### Example 4: Puppeteer-Core - Patching with Retry

```javascript
const { withRetry, createPatchFailedError } = require('./scripts/error-handler.js');

async function patchFile(filePath) {
  return await withRetry(
    async () => {
      // Patching logic
      await fs.writeFile(filePath, patchedContent);
    },
    3, // Max retries
    { filePath, operation: 'patch' }
  );
}
```

---

## Best Practices

### 1. Always Use Factory Functions

❌ **Bad:**
```typescript
throw new Error('Browser not initialized');
```

✅ **Good:**
```typescript
throw createBrowserNotInitializedError();
```

### 2. Provide Rich Context

❌ **Bad:**
```typescript
throw createNavigationError(url, error);
```

✅ **Good:**
```typescript
throw createNavigationError(url, error, {
  timeout: 30000,
  waitUntil: 'domcontentloaded',
  retryAttempt: 2
});
```

### 3. Use categorizeError for Generic Errors

```typescript
try {
  await someOperation();
} catch (error) {
  // Automatically categorize unknown errors
  throw categorizeError(error);
}
```

### 4. Check Error Recoverability

```typescript
try {
  await operation();
} catch (error) {
  const mcpError = categorizeError(error);
  
  if (mcpError.isRecoverable) {
    // Implement retry logic
    await retryOperation();
  } else {
    // Log and exit gracefully
    console.error(mcpError.toUserMessage());
    process.exit(1);
  }
}
```

### 5. Preserve Original Error Stack

All custom error classes preserve the original error stack trace:

```typescript
const originalError = new Error('Connection refused');
const mcpError = createConnectionError(url, originalError);
// Stack trace preserved in mcpError.stack
```

---

## Recovery Strategies

### Automatic Recovery

The error system provides built-in recovery strategies:

```typescript
import { getRecoveryStrategy } from './errors/index.js';

try {
  await operation();
} catch (error) {
  const mcpError = categorizeError(error);
  const strategy = getRecoveryStrategy(mcpError);
  
  switch (strategy) {
    case 'initialize_browser':
      await initializeBrowser();
      break;
    
    case 'retry_navigation':
      await retryWithBackoff(navigate, url);
      break;
    
    case 'use_self_healing_locators':
      await findElementWithFallbacks(selector);
      break;
    
    case 'refresh_page':
      await page.reload();
      await operation();
      break;
  }
}
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff(
  operation: () => Promise<any>,
  maxAttempts: number = 3
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const mcpError = categorizeError(error);
      
      if (!mcpError.isRecoverable || attempt === maxAttempts) {
        throw mcpError;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Cross-Project Integration

### Error Propagation Flow

```
Puppeteer-Core Error
    ↓
Launcher Error
    ↓
Browser Error
    ↓
MCP Server Error
    ↓
Client Response
```

### Example: End-to-End Error Handling

```typescript
// Puppeteer-Core patches a file
try {
  await patchPuppeteerCore();
} catch (patchError) {
  // Categorized as PuppeteerCoreError
  throw categorizeError(patchError);
}

// Launcher uses patched core
try {
  await launchBrowser();
} catch (launchError) {
  // Categorized as LauncherError
  throw createLaunchFailedError(launchError);
}

// Browser connects to launched instance
try {
  await browser.connect();
} catch (connectError) {
  // Categorized as BraveRealBrowserError
  throw createConnectionError(url, connectError);
}

// MCP Server handles browser operations
try {
  await handleBrowserInit(args);
} catch (mcpError) {
  // Categorized as MCPError
  // Serialized for MCP protocol response
  return mcpError.toMCPResponse();
}
```

---

## Error Response Format

### MCP Protocol Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "❌ Error: Failed to initialize browser: Connection refused\n\n📋 Category: BROWSER_INITIALIZATION_FAILED\n⚠️ Severity: CRITICAL\n\n💡 Suggested Action:\nCheck browser installation and ensure all dependencies are installed. Try running with different configuration options.\n\n🔍 Context:\n{\n  \"originalError\": \"Connection refused\",\n  \"options\": {\n    \"headless\": false\n  }\n}"
    }
  ]
}
```

---

## Testing Error Handling

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { createBrowserNotInitializedError, ErrorCategory } from '../src/errors/index.js';

describe('Error System', () => {
  it('should create browser not initialized error correctly', () => {
    const error = createBrowserNotInitializedError();
    
    expect(error.category).toBe(ErrorCategory.BROWSER_NOT_INITIALIZED);
    expect(error.severity).toBe('HIGH');
    expect(error.isRecoverable).toBe(true);
    expect(error.suggestedAction).toContain('browser_init');
  });

  it('should categorize generic errors correctly', () => {
    const genericError = new Error('navigating frame was detached');
    const categorized = categorizeError(genericError);
    
    expect(categorized.category).toBe(ErrorCategory.FRAME_DETACHED);
    expect(categorized instanceof ProtocolError).toBe(true);
  });
});
```

---

## Debugging Tips

### 1. Enable Verbose Error Logging

```typescript
if (process.env.DEBUG_ERRORS === 'true') {
  console.error('Full error context:', mcpError.context);
  console.error('Stack trace:', mcpError.stack);
}
```

### 2. Error Context Inspection

```typescript
const error = categorizeError(unknownError);
console.log({
  message: error.message,
  category: error.category,
  severity: error.severity,
  recoverable: error.isRecoverable,
  timestamp: error.timestamp,
  context: error.context
});
```

### 3. Recovery Strategy Testing

```typescript
const strategies = new Map();

try {
  await operation();
} catch (error) {
  const mcpError = categorizeError(error);
  const strategy = getRecoveryStrategy(mcpError);
  
  strategies.set(mcpError.category, strategy);
  console.log('Recovery strategies:', Array.from(strategies.entries()));
}
```

---

## Contributing

When adding new error types:

1. **Choose appropriate category** - Use existing categories when possible
2. **Set correct severity** - Follow severity guidelines
3. **Mark recoverability** - Determine if automatic recovery is possible
4. **Provide context** - Include all relevant debugging information
5. **Write suggested actions** - Clear, actionable recovery steps
6. **Add tests** - Unit tests for new error types
7. **Update documentation** - Add to this guide

---

## Summary

The standardized error handling system provides:

✅ **Consistency** - Same error structure across all projects  
✅ **Clarity** - Clear error categories and severity levels  
✅ **Context** - Rich debugging information  
✅ **Recovery** - Built-in recovery strategies  
✅ **Integration** - Seamless cross-project error propagation  
✅ **User Experience** - Helpful error messages and suggestions  

This system ensures robust error handling throughout the Brave Real Browser MCP Server ecosystem! 🎉
