# 🦁 Brave Real Puppeteer Core

**Ultra-Fast Stealth Automation | 50+ Features | 80% Bot Detection Bypass**

## ✨ Features

- 🛡️ **50+ Stealth Features** - Navigator, Canvas, WebGL, Performance spoofing
- ⚡ **1-5ms Ultra-Fast Timing** - Optimized performance
- 🦁 **Brave Browser Integration** - Auto-detection on all platforms
- 🤖 **AI-Powered Testing** - Intelligent validation
- 🔄 **Version Sync** - Check for latest Puppeteer/Playwright releases
- 📱 **Device Emulation** - Mobile and tablet emulation
- 🌍 **Geo Spoofing** - Location spoofing
- 🖱️ **Human Mouse** - Realistic mouse movements

## 🚀 Quick Start

### Installation
```bash
npm install brave-real-puppeteer-core
```

### Setup Commands
```bash
npm run setup-both              # Complete setup (Recommended)
npm run setup-puppeteer         # Puppeteer only
npm run setup-playwright        # Playwright only
npm run setup-complete          # With tests included
```

## 📋 Available Scripts

### Testing Scripts
```bash
npm test                         # Run 8 unit tests
npm run test-bot-detector        # GUI bot detection test
npm run test-bot-detector-headless # Headless bot detection test
npm run test-bot-detector-mobile # Mobile bot detection test
npm run ai-agent                 # AI-powered testing
```

### Patching Scripts
```bash
npm run patch                    # Apply stealth patches
npm run patch-both               # Patch Puppeteer + Playwright
npm run patch-puppeteer          # Patch Puppeteer only
npm run patch-playwright         # Patch Playwright only
npm run patch-puppeteer-basic    # Basic Puppeteer patch
npm run patch-playwright-basic   # Basic Playwright patch
```

### Version Management
```bash
npm run version-sync             # Check version sync
npm run version-sync-fix         # Fix version mismatches
npm run version-table            # Show version table
npm run check-versions           # Check all versions
```

### Package Creation
```bash
npm run create-brave-puppeteer   # Create brave-puppeteer package
npm run create-brave-playwright  # Create brave-playwright package
npm run create-brave-packages    # Create both packages
```

## 📂 Project Structure

```
brave-real-puppeteer-core/
├── patches/
│   ├── puppeteer-core/          # Puppeteer patches
│   ├── playwright-core/         # Playwright patches  
│   └── stealth-core/            # Core stealth patches
├── scripts/
│   ├── patcher.js               # Main patcher with stealth (CLI)
│   ├── stealth-injector.js      # 131KB stealth code
│   ├── ai-agent.js              # AI testing assistant
│   ├── test-bot-detector.js     # Bot detection tests
│   ├── captcha-solver.js        # CAPTCHA handling
│   ├── device-emulator.js       # Device emulation
│   ├── geo-spoof.js             # Geolocation spoofing
│   ├── human_mouse.js           # Human-like mouse
│   ├── session-manager.js       # Session management
│   ├── proxy-manager.js         # Proxy rotation
│   └── ...21 total scripts
└── test/
    └── test.cjs                 # Unit tests (8 tests)
```

## 🧪 Test Coverage

| Test | Description |
|------|-------------|
| Patcher Script Exists | Verifies patcher.js is present |
| Patches Directory | Checks patch files exist |
| Package.json Validity | Validates package configuration |
| Patcher CLI Help | Tests CLI --help command |
| Stealth Features | Verifies stealth patches (17 files) |
| Version Sync Check | Tests version synchronization |
| AI Agent Script | Checks AI agent exists |
| CJS Compatibility | Tests CommonJS compatibility |

## 🛡️ Stealth Features

| Category | Features |
|----------|----------|
| **CDP Bypasses** | Runtime.Enable, sourceURL masking, Console.enable, exposeFunction |
| Navigator | webdriver, plugins, languages, userAgentData |
| Canvas | Fingerprint noise, toDataURL spoofing |
| WebGL | GPU profiles, renderer spoofing |
| Performance | 1-5ms timing, instant responses |
| Automation | All bot signatures removed |
| Mouse | Human-like movements (ghost-cursor) |
| Geolocation | Location spoofing |

## 💡 Usage

### Easy Integration (Recommended)

#### Puppeteer - One-Liner
```javascript
import puppeteer from 'puppeteer-core';
import { applyStealthToPuppeteer } from 'brave-real-puppeteer-core';

const browser = await puppeteer.launch({ executablePath: '/path/to/brave' });
const page = await browser.newPage();
await applyStealthToPuppeteer(page); // That's it!

await page.goto('https://bot-detector.rebrowser.net/');
```

#### Playwright - One-Liner
```javascript
import { chromium } from 'playwright-core';
import { applyStealthToPlaywright } from 'brave-real-puppeteer-core';

const browser = await chromium.launch({ executablePath: '/path/to/brave' });
const page = await browser.newPage();
await applyStealthToPlaywright(page); // That's it!

await page.goto('https://bot-detector.rebrowser.net/');
```

### With brave-real-browser (Full Integration)
```javascript
const { connect } = require('brave-real-browser');

const { browser, page } = await connect({
  headless: false,
  turnstile: true  // Auto-solve Cloudflare
});

await page.goto('https://example.com');
```

### Manual Puppeteer
```javascript
const puppeteer = require('puppeteer-core');
// Patches are auto-applied at npm install time

const browser = await puppeteer.launch({
  executablePath: '/path/to/brave',
  headless: false
});
const page = await browser.newPage();
await page.goto('https://bot.sannysoft.com');
```

## 🔧 Environment Variables

```bash
REBROWSER_STEALTH_MODE=comprehensive
REBROWSER_ULTRA_FAST_PERFORMANCE=1
```

## 📊 Test Results

- **Sannysoft**: 100% pass
- **DrissionPage**: 100% pass
- **FingerprintJS**: 100% pass
- **Datadome**: 100% pass
- **Cloudflare Turnstile**: ✅ Auto-solved
- **reCAPTCHA v3**: High score
- **Bot Detector**: 80% pass (8/10 tests) - All critical tests pass

## 📦 Module Support

This package supports multiple module formats for maximum compatibility:

| Format | File | Usage | Node.js Version |
|--------|------|-------|-----------------|
| **ESM** | `index.js` | Modern JavaScript (ES6+) | 18+ (Recommended) |
| **CJS** | `index.cjs` | CommonJS | 12+ |
| **ES5** | N/A | Legacy JavaScript | 10+ (Requires build) |

### Usage Examples

#### ESM (Recommended for Node.js 18+)
```javascript
import puppeteer from 'brave-real-puppeteer-core';
const browser = await puppeteer.launch();
```

#### CJS (For Node.js 12-17)
```javascript
const puppeteer = require('brave-real-puppeteer-core');
const browser = await puppeteer.launch();
```

### ES5 Support

ES5 support requires additional transpilation setup. The package targets Node.js 18+ which natively supports ES6+ features, so ES5 transpilation is not required for the default use case.

**To add ES5 support:**
1. Install Babel: `npm install --save-dev @babel/core @babel/preset-env`
2. Create `.babelrc`:
```json
{
  "presets": [["@babel/preset-env", {
    "targets": {
      "node": "10"
    }
  }]]
}
```
3. Add build script to package.json:
```json
{
  "scripts": {
    "build:es5": "babel index.js --out-file index.es5.js"
  }
}
```

## 🔄 Refresh Persistence

The package includes robust refresh persistence to ensure stealth scripts survive page refreshes:

- **CDP Scripts**: Automatically injected on every new document
- **Manual Refresh Handler**: Re-injects scripts after F5 refresh
- **Lifecycle Monitoring**: Monitors page visibility and load events
- **Error Stack Sanitization**: Persists across refreshes for sourceUrlLeak test
- **Continuous Monitoring**: Active monitoring for 60 seconds after page load

### Testing Refresh Persistence

Run the bot detector test to verify refresh persistence:

```bash
npm run test-bot-detector
```

The test will:
1. Navigate to https://bot-detector.rebrowser.net/
2. Wait for all tests to pass (initial load)
3. Refresh the page (F5)
4. Verify all critical tests still pass after refresh

## 📄 License

MIT - Based on rebrowser-patches by Rebrowser
