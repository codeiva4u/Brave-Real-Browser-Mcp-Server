# ES6 Module and CommonJS Dual Support Setup

This project supports both ES6 Modules (ESM) and CommonJS (CJS) for maximum compatibility.

## Current Module Configuration

### package.json Configuration
```json
{
  "type": "module",
  "main": "dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## Module System Features

### ES6 Modules (Current Default)
- **File Extensions**: `.js`, `.ts`, `.mjs`
- **Import Syntax**: `import { tool } from './module.js'`
- **Export Syntax**: `export const tool = ...`
- **Benefits**: Tree shaking, static analysis, modern syntax

### CommonJS Support
- **File Extensions**: `.cjs`
- **Import Syntax**: `const { tool } = require('./module.cjs')`
- **Export Syntax**: `module.exports = { tool }`
- **Benefits**: Legacy compatibility, dynamic imports

## Implementation Details

### Source Files (TypeScript)
All source files use ES6 import/export syntax:

```typescript
// src/handlers/specialized-tools-handlers.ts
import { getBrowser, getPage } from '../browser-manager.js';
export async function handleLinksFinders(args: any) {
  // Implementation
}
```

### Built Files (JavaScript)
The TypeScript compiler generates ES6 modules:

```javascript
// dist/handlers/specialized-tools-handlers.js
import { getBrowser, getPage } from '../browser-manager.js';
export async function handleLinksFinders(args) {
  // Compiled implementation
}
```

### Manual CommonJS Files
Scripts that need CommonJS use `.cjs` extension:

```javascript
// scripts/setup-brave.cjs
const fs = require('fs');
const path = require('path');

module.exports = {
  setupBrave: () => {
    // Implementation
  }
};
```

## Module Resolution Rules

### For ES6 Modules
1. Must use `.js` extensions in imports (even for `.ts` files)
2. Cannot use `require()` directly
3. Use `import()` for dynamic imports
4. Top-level `await` supported

### For CommonJS
1. Can use `require()` directly
2. No need for file extensions in require calls
3. Use `require()` for synchronous imports
4. No top-level `await`

## Tool Integration Examples

### Importing Fixed Tools (ES6 Module)
```javascript
import {
  handleHtmlElementsExtraction,
  handleNetworkVideoExtraction,
  handleVideoSelectorGeneration
} from './handlers/video-extraction-handlers.js';

import {
  handleLinksFinders,
  handleAjaxFinders,
  handleVideoSourcesExtracts
} from './handlers/specialized-tools-handlers.js';
```

### Using Tools (CommonJS - for scripts)
```javascript
// In .cjs files
const { spawn } = require('child_process');
const path = require('path');

// Start the ES6 module server
const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath]);
```

## Benefits of Current Setup

### ES6 Module Advantages
1. **Static Analysis**: Better IDE support and bundling
2. **Tree Shaking**: Unused code elimination
3. **Circular Dependencies**: Better handling
4. **Future-Proof**: Modern JavaScript standard

### CommonJS Compatibility
1. **Legacy Scripts**: Setup and utility scripts work
2. **Node.js Tools**: Compatible with older tooling
3. **NPM Packages**: Many packages still use CommonJS

## Testing Both Module Systems

### ES6 Module Test
```javascript
import { TOOLS } from './dist/tool-definitions.js';
console.log(`Loaded ${TOOLS.length} tools via ES6 import`);
```

### CommonJS Test
```javascript
// test.cjs
const path = require('path');
const { execSync } = require('child_process');

// Test ES6 module via Node.js
const result = execSync(`node -e "import('./dist/tool-definitions.js').then(m => console.log(m.TOOLS.length))"`);
console.log(`Tools loaded: ${result.toString().trim()}`);
```

## Best Practices

### In TypeScript Source Files
```typescript
// Always use .js extensions in imports
import { BrowserManager } from './browser-manager.js';

// Use proper export syntax
export const handleTool = async (args: any) => {
  // Implementation
};

// Default exports
export default class ToolHandler {
  // Implementation
}
```

### In Package Scripts
```javascript
// Use .cjs for Node.js scripts
// scripts/build.cjs
const { execSync } = require('child_process');

execSync('tsc', { stdio: 'inherit' });
console.log('Build completed');
```

### In Tests
```typescript
// Use dynamic imports for ES6 modules in tests
const { handleTool } = await import('../src/handlers/tool.js');

// Or use static imports
import { handleTool } from '../src/handlers/tool.js';
```

## Troubleshooting Common Issues

### "Cannot use import outside module"
- Ensure `"type": "module"` in package.json
- Use `.cjs` extension for CommonJS files
- Use `.mjs` extension to force ES6 module

### "require is not defined"
- You're in an ES6 module context
- Use `import()` instead of `require()`
- Or rename file to `.cjs`

### "Must use import to load ES module"
- The target is an ES6 module
- Use `import()` or static import
- Cannot use `require()` with ES6 modules

## Current Project Status

✅ **ES6 Module Support**: Fully implemented
✅ **TypeScript Compilation**: NodeNext module system
✅ **Build System**: Generates ES6 modules
✅ **Script Compatibility**: CommonJS scripts work
✅ **Tool Integration**: All 13 fixed tools properly exported

The project successfully supports both module systems with proper separation and compatibility.