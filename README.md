# Brave Real Browser MCP Server

> **AI assistants के लिए powerful, anti-detection browser automation - Unified MCP+LSP+SSE ecosystem**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/brave-real-browser-mcp-server.svg)](https://www.npmjs.com/package/brave-real-browser-mcp-server)

## 🚀 Quick Start

### Option 1: NPX (Recommended for AI IDEs)

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"],
      "env": {
        "headless": "false"
      }
    }
  }
}
```

## Option 2: (Local AI IDEs) 

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "node",
      "args": [
        "c:\\Users\\Admin\\Desktop\\Workspace-For-Brave-Real-browser-Mcp-Server\\Brave-Real-Browser-Mcp-Server\\dist\\index.js"
      ],
      "env": {
        "headless": "false"
      }
    }
  }
}
```

### Option 1: NPX (Recommended for Opencode AI IDEs)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "brave-real-browser": {
      "type": "local",
      "command": ["npx", "-y", "brave-real-browser-mcp-server@latest"],
      "environment": {
        "headless": "false"
      },
      "enabled": true
    }
  }
}
```

### Option 2: ( Locle for Opencode AI IDEs)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "brave-real-browser": {
      "type": "local",
      "command": ["node", "c: path hare "],
      "environment": {
        "headless": "false"
      },
      "enabled": true
    }
  }
}
```



**Config locations:**
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac:** `~/Library/Application Support/Claude/`
- **Linux:** `~/.config/Claude/`

### Option 2: Unified Server (Full Features)

```bash
npm run dev
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **33 MCP Tools** | Complete browser automation toolkit |
| **Unified Server** | MCP + SSE + LSP in one command |
| **Stealth Mode** | 50+ anti-detection features |
| **Captcha Solving** | reCAPTCHA, hCaptcha, Turnstile |
| **Brave Browser** | Auto-detection, uBlock Origin built-in |
| **TypeScript Analyzer** | Full Compiler API integration |
| **Real-time Streaming** | SSE for live progress updates |
| **Auto-Sync** | SharedEventBus connects all protocols |

---

## 🆕 New in v2.33.x - Advanced Stealth & Bot Detection Bypass

### 🛡️ SannySoft Bot Detection - 100% Pass Rate

| Test | Status | Fix Applied |
|------|--------|-------------|
| **WebDriver** | ✅ PASSED | Property deletion + hasOwnProperty override |
| **WebDriver Advanced** | ✅ PASSED | 30+ automation keys cleaned |
| **Chrome** | ✅ PASSED | window.chrome object present |
| **Permissions** | ✅ PASSED | Fake Notification API + permissions.query spoof |
| **Plugins** | ✅ PASSED | Real PluginArray with 7 plugins |
| **Languages** | ✅ PASSED | Proper language array |
| **WebGL Vendor/Renderer** | ✅ PASSED | Real GPU info exposed |

### 🔒 Advanced Fingerprinting Protection

| Feature | Description |
|---------|-------------|
| **Canvas Fingerprinting** | Noise injection in toDataURL and getImageData |
| **WebGL Fingerprinting** | GPU vendor/renderer spoofing (Intel, NVIDIA, AMD) |
| **AudioContext Fingerprinting** | Oscillator frequency + analyzer noise |
| **Notification API Spoof** | Creates fake Notification with permission='default' |
| **Permissions API Spoof** | Returns 'prompt' for notifications query |

### 🔄 uBlock Origin Auto-Sync (GitHub Action)

Automatic filter updates every 6 hours:
- Fetches official uBlock Origin filters
- Includes EasyList, EasyPrivacy
- Extracts popup, redirect, scriptlet rules
- Auto-patches `ublock-custom-filters.txt`
- Triggers version bump on filter updates

**Workflow:** `.github/workflows/ublock-filter-sync.yml`

### 📊 Visual Test Results

```
✅ SannySoft Bot Detection - ALL PASSED
✅ AdBlock Tester Score: 100/100
✅ CanYouBlockIt - Clean (no ads visible)
✅ AmIUnique - Not Unique (blends in with real users)
✅ Window.open Wrapper - Properly intercepted
```

---

## 🆕 New in v2.28.1 - Advanced Enhancements

### 🌐 Advanced Navigation
| Option | Description |
|--------|-------------|
| `blockResources` | Block images, fonts, CSS for faster loading |
| `customHeaders` | Set custom HTTP headers |
| `referrer` | Custom referrer URL |
| `waitForSelector` | Wait for specific element after load |
| `waitForContent` | Wait for specific text content |
| `scrollToBottom` | Auto-scroll for lazy loading |
| `randomDelay` | Human-like delay (100-500ms) |
| `bypassCSP` | Bypass Content Security Policy |

**Example:**
```json
{
  "url": "https://example.com",
  "blockResources": ["image", "font"],
  "waitForSelector": ".main-content",
  "scrollToBottom": true,
  "randomDelay": true
}
```

### 🚀 Parallel Scraping (js_scrape)
| Option | Description |
|--------|-------------|
| `urls` | Array of multiple URLs to scrape |
| `concurrency` | Max concurrent scrapes (1-10) |
| `continueOnError` | Continue even if some URLs fail |
| `delayBetween` | Delay between scrapes (ms) |

**Example:**
```json
{
  "urls": ["https://site1.com", "https://site2.com", "https://site3.com"],
  "concurrency": 3,
  "extractSelector": "article"
}
```

### 📄 Auto-Pagination (link_harvester)
| Option | Description |
|--------|-------------|
| `followPagination` | Auto-follow pagination links |
| `maxPages` | Maximum pages to scrape (1-20) |
| `paginationSelector` | Custom next page selector |
| `delayBetweenPages` | Delay between pages (ms) |

**Example:**
```json
{
  "followPagination": true,
  "maxPages": 10,
  "filter": "movie"
}
```

### 🔌 API Interceptor (network_recorder)
| Option | Description |
|--------|-------------|
| `interceptMode` | `record`, `intercept`, or `mock` |
| `blockPatterns` | URL patterns to block |
| `mockResponses` | Fake responses for URLs |
| `modifyHeaders` | Modify request headers |
| `capturePayloads` | Capture POST/PUT bodies |

**Example:**
```json
{
  "interceptMode": "intercept",
  "blockPatterns": ["ads", "tracking"],
  "capturePayloads": true
}
```

### 🛡️ Anti-Detection Enhancements

| Feature | Description |
|---------|-------------|
| **Fingerprint Randomizer** | Canvas, Audio, Hardware randomization |
| **Human Behavior Simulation** | Natural mouse/scroll patterns |
| **WebGL Spoofing** | Random GPU from 8 configs (Intel, NVIDIA, AMD) |
| **Proxy Rotation** | round-robin, random, least-used, on-error strategies |
| **Rate Limiter** | Per-second/minute limits, domain-specific |
| **Error Auto-Recovery** | Smart retry with different strategies |

### 🔄 Internal Systems

```javascript
// Rate Limiter
initRateLimiter({ requestsPerSecond: 5, requestsPerMinute: 100 });
setDomainRateLimit('api.example.com', 2); // 2 req/sec for this domain

// Proxy Rotation
initProxyRotation(['proxy1:8080', 'proxy2:8080'], 'round-robin');
rotateProxy('error'); // Rotate on error

// Error Recovery
executeWithRecovery(operation, {
  toolName: 'navigate',
  page: pageInstance,
  restartBrowser: () => browser.restart()
});
```

---

## 🌐 Unified MCP+LSP+SSE Ecosystem

**एक command से सब active:**

```bash
npm run dev
```

### Output:
```
🦁 Brave Real Browser - Unified Server v2.28.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 HTTP Server: http://localhost:3000

🛠️  Available MCP Tools:
   🚀 browser_init    🔴 browser_close   🌐 navigate
   📄 get_content     🔍 find_element    🖱️ click
   ⌨️ type           🤖 solve_captcha   🎬 media_extractor
   ... and 24 more tools

🔗 SharedEventBus: Auto-syncing MCP ↔ LSP ↔ SSE
📋 Total: 33 MCP tools | TypeScript Analyzer Active
✅ Ready! All protocols unified and auto-synced.
```

### All Endpoints:

| Category | Endpoint | Purpose |
|----------|----------|---------|
| **MCP** | `POST /mcp` | MCP over HTTP |
| **MCP** | `GET /mcp/sse` | SSE real-time streaming |
| **MCP** | `POST /mcp/message` | SSE message handler |
| **LSP** | `POST /lsp/completion` | Autocomplete |
| **LSP** | `POST /lsp/hover` | Hover documentation |
| **LSP** | `POST /lsp/analyze` | TypeScript analysis |
| **LSP** | `POST /lsp/definition` | Go to definition |
| **LSP** | `POST /lsp/references` | Find references |
| **Other** | `GET /health` | Health check |
| **Other** | `GET /events` | Event bus stats |

---

## 🛡️ Ad Blocking & Stealth (brave-real-blocker)

**Auto-enabled on all pages via ecosystem chain:**

```
brave-real-launcher
    └── brave-real-puppeteer-core
            └── brave-real-browser
                    └── brave-real-blocker (auto-enabled)
                            └── brave-real-browser-mcp-server
```

### Core Features

| Feature | Description |
|---------|-------------|
| **AdBlocking** | Network-level ad/tracker blocking with uBlock Origin filters |
| **Stealth** | Native function masking (prompt, alert, confirm) |
| **RedirectBlocking** | Popup, window.open interception, tracking param removal |
| **ScriptletInjection** | Anti-adblock bypass with uBlock scriptlets |
| **CosmeticFiltering** | Element hiding with CSS injection |

### Anti-Detection (50+ Features)

| Category | Features |
|----------|----------|
| **Navigator** | WebDriver deletion, hasOwnProperty override, plugins array |
| **Permissions** | Notification.permission='default', permissions.query='prompt' |
| **Canvas** | toDataURL noise, getImageData noise injection |
| **WebGL** | GPU vendor/renderer spoofing (8 GPU configs) |
| **Audio** | AudioContext oscillator frequency noise |
| **Dialogs** | Native alert/confirm/prompt wrappers |
| **Focus** | document.hasFocus() always returns true |

### Auto-Updating Filters

| Source | Update Frequency |
|--------|------------------|
| uBlock Origin Official | Every 6 hours (GitHub Action) |
| EasyList | Every 6 hours |
| EasyPrivacy | Every 6 hours |
| Custom Rules | On deploy |

> No configuration needed - blocker activates automatically on browser launch.

---


## 🛠️ All 33 MCP Tools

### Browser Management
| Tool | Description |
|------|-------------|
| `browser_init` | Initialize Brave browser with stealth |
| `browser_close` | Close browser instance |

### Navigation
| Tool | Description |
|------|-------------|
| `navigate` | Navigate to URL with advanced options (resource blocking, custom headers, auto-scroll) |
| `wait` | Wait for conditions |

### Content
| Tool | Description |
|------|-------------|
| `get_content` | Get page HTML/text |
| `find_element` | Find by selector/text/AI with batch mode |
| `save_content_as_markdown` | Save as markdown file |

### Interaction
| Tool | Description |
|------|-------------|
| `click` | Click on element |
| `type` | Type text into input |
| `press_key` | Keyboard press |
| `random_scroll` | Natural scrolling |
| `solve_captcha` | Solve CAPTCHAs |

### Media & Streaming
| Tool | Description |
|------|-------------|
| `stream_extractor` | Extract streams with multi-quality selector, VidSrc/Filemoon/StreamWish support |
| `player_api_hook` | Hook into JWPlayer, Video.js, HLS.js, Plyr, Vidstack, DASH.js |
| `iframe_handler` | Deep iframe scraping with video source extraction |

### Scraping
| Tool | Description |
|------|-------------|
| `js_scrape` | JavaScript-rendered scraping with parallel URL support |
| `link_harvester` | Harvest links with auto-pagination |
| `network_recorder` | Record traffic with API interception |
| `extract_json` | Extract embedded JSON with AES decryption |
| `search_regex` | Regex search like regex101.com |

### Advanced
| Tool | Description |
|------|-------------|
| `scrape_meta_tags` | Meta/OG tags |
| `deep_analysis` | Full page analysis with screenshot |
| `redirect_tracer` | Trace redirects |
| `progress_tracker` | Track progress |
| `cookie_manager` | Manage cookies |
| `file_downloader` | Download files |
| `execute_js` | Run custom JavaScript |

---

## 📋 Commands

```bash
# Install
npm install

# Build
npm run build

# Development (Unified - Recommended!)
npm run dev           # MCP + SSE + LSP on port 3000

# Alternate modes
npm run dev:stdio     # STDIO only (for AI IDEs)
npm run dev:sse       # SSE standalone
npm run dev:http      # HTTP Stream standalone

# Production
npm start             # Unified server
npm run start:stdio   # STDIO mode

# Tests
npm test
npm run test:e2e
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_PORT` | `3000` | Server port |
| `MCP_HOST` | `localhost` | Server host |
| `DEBUG` | `false` | Debug logging |

---

## 🔧 Browser Options

```json
{
  "headless": false,
  "proxy": "http://proxy:8080"
}
```

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **Brave Browser** (auto-detected)

---

## 🐛 Troubleshooting

### Port in use
```bash
MCP_PORT=3001 npm run dev
```

### Debug mode
```bash
DEBUG=true npm run dev
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

Made with ❤️ by [codeiva4u](https://github.com/codeiva4u)
