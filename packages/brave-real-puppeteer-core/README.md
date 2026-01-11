# 🦁 Brave Real Puppeteer Playwright Core

**Ultra-Fast Stealth Automation | 80+ Features | 80% Bot Detection Bypass**

## ✨ Features

- 🛡️ **80+ Stealth Features** - Navigator, Canvas, WebGL, Performance spoofing
- ⚡ **1-5ms Ultra-Fast Timing** - Optimized performance
- 🦁 **Brave Browser Integration** - Auto-detection on all platforms
- 🤖 **AI-Powered Testing** - Intelligent validation
- 🔄 **Auto-Updates** - Daily sync with Puppeteer/Playwright releases

## 🚀 Quick Start

### Installation (NPM)
```bash
npm install brave-real-puppeteer-core
npm install brave-real-playwright-core
```

### Installation (Source)
```bash
git clone https://github.com/codeiva4u/Brave-Real-Puppeteer-Playwrite-Core.git
cd Brave-Real-Puppeteer-Playwrite-Core
npm install
npm run setup-both
```

## 📋 Commands

### Setup
```bash
npm run setup-both              # Complete setup (Recommended)
npm run setup-puppeteer         # Puppeteer only
npm run setup-playwright        # Playwright only
```

### Testing
```bash
npm run test-bot-detector          # Puppeteer GUI test
npm run test-bot-detector-headless # Puppeteer headless test
npm run ai-agent                   # AI-powered testing
```

### Patching
```bash
npm run patch-both              # Patch both engines
npm run patch-puppeteer         # Patch Puppeteer only
npm run patch-playwright        # Patch Playwright only
```

## 💡 Usage

### Puppeteer
```javascript
const puppeteer = require('brave-real-puppeteer-core');

const browser = await puppeteer.launch({
  headless: false,
  // Stealth features auto-enabled
});
const page = await browser.newPage();
await page.goto('https://example.com');
```

### Playwright
```javascript
const { chromium } = require('brave-real-playwright-core');

const browser = await chromium.launch({
  headless: false,
  // Stealth features auto-enabled
});
const page = await browser.newPage();
await page.goto('https://example.com');
```

## 🛡️ Stealth Features

| Category | Features |
|----------|----------|
| Navigator | webdriver, plugins, languages, userAgentData |
| Canvas | Fingerprint noise, toDataURL spoofing |
| WebGL | GPU profiles, renderer spoofing |
| Performance | 1-5ms timing, instant responses |
| Automation | All bot signatures removed |

## 🔄 Auto-Updates

This project automatically updates daily:
- ✅ Checks Puppeteer/Playwright versions
- ✅ Fetches latest Chrome version
- ✅ Applies stealth patches
- ✅ Publishes to NPM

## 📦 Package Structure

```
dist/
├── brave-real-puppeteer-core/   # Puppeteer package
└── brave-real-playwright-core/  # Playwright package
```

## 🔧 Environment Variables

```bash
REBROWSER_STEALTH_MODE=comprehensive
REBROWSER_ULTRA_FAST_PERFORMANCE=1
```

## 📊 Test Results

- **Puppeteer**: 80% success rate
- **Playwright**: 88% success rate
- **Performance**: 1-5ms timing

## 📄 License

MIT - Based on rebrowser-patches by Rebrowser
