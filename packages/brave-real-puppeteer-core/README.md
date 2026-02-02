# 🦁 Brave Real Puppeteer Core

**Ultra-Fast Stealth Automation | 50+ Features | 80% Bot Detection Bypass**

## ✨ Features

- 🛡️ **50+ Stealth Features** - Navigator, Canvas, WebGL, Performance spoofing
- ⚡ **1-5ms Ultra-Fast Timing** - Optimized performance
- 🦁 **Brave Browser Integration** - Auto-detection on all platforms
- 🤖 **AI-Powered Testing** - Intelligent validation
- 🔄 **Auto-Updates** - Daily sync with Puppeteer/Playwright releases
- 🎭 **CAPTCHA Handling** - Built-in solver support
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
npm run test-puppeteer           # Puppeteer tests
npm run test-playwright          # Playwright tests
npm run test-cloudflare          # Cloudflare bypass test
npm run test-recaptcha           # reCAPTCHA test
npm run test-features            # All features test
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
│   ├── patcher.js               # Main patcher (CLI)
│   ├── enhanced-patcher.js      # Comprehensive patching
│   ├── stealth-injector.js      # 131KB stealth code
│   ├── ai-agent.js              # AI testing assistant
│   ├── test-bot-detector.js     # Bot detection tests
│   ├── captcha-solver.js        # CAPTCHA handling
│   ├── device-emulator.js       # Device emulation
│   ├── geo-spoof.js             # Geolocation spoofing
│   ├── human_mouse.js           # Human-like mouse
│   ├── session-manager.js       # Session management
│   ├── proxy-manager.js         # Proxy rotation
│   └── ...28 total scripts
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
| Navigator | webdriver, plugins, languages, userAgentData |
| Canvas | Fingerprint noise, toDataURL spoofing |
| WebGL | GPU profiles, renderer spoofing |
| Performance | 1-5ms timing, instant responses |
| Automation | All bot signatures removed |
| Mouse | Human-like movements (ghost-cursor) |
| CAPTCHA | Auto-solving support |
| Geolocation | Location spoofing |

## 💡 Usage

### Puppeteer
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

### With brave-real-browser (Recommended)
```javascript
const { connect } = require('brave-real-browser');

const { browser, page } = await connect({
  headless: false,
  turnstile: true  // Auto-solve Cloudflare
});

await page.goto('https://example.com');
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

## 📄 License

MIT - Based on rebrowser-patches by Rebrowser
