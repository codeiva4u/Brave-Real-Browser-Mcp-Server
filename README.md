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
      "args": ["brave-real-browser-mcp-server@latest"]
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

## 🌐 Unified MCP+LSP+SSE Ecosystem

**एक command से सब active:**

```bash
npm run dev
```

### Output:
```
🦁 Brave Real Browser - Unified Server v2.22.0
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

## 🛠️ All 33 MCP Tools

### Browser Management
| Tool | Description |
|------|-------------|
| `browser_init` | Initialize Brave browser with stealth |
| `browser_close` | Close browser instance |

### Navigation
| Tool | Description |
|------|-------------|
| `navigate` | Navigate to URL |
| `wait` | Wait for conditions |

### Content
| Tool | Description |
|------|-------------|
| `get_content` | Get page HTML/text |
| `find_element` | Find by selector/text/AI |
| `save_content_as_markdown` | Save as markdown file |

### Interaction
| Tool | Description |
|------|-------------|
| `click` | Click on element |
| `type` | Type text into input |
| `press_key` | Keyboard press |
| `random_scroll` | Natural scrolling |
| `solve_captcha` | Solve CAPTCHAs |

### Media Extraction
| Tool | Description |
|------|-------------|
| `media_extractor` | Extract video/audio |
| `m3u8_parser` | Parse HLS streams |
| `stream_extractor` | Direct download URLs |

### Advanced
| Tool | Description |
|------|-------------|
| `search_content` | Search patterns |
| `extract_json` | Extract embedded JSON |
| `scrape_meta_tags` | Meta/OG tags |
| `deep_analysis` | Full page analysis |
| `network_recorder` | Record traffic |
| `api_finder` | Discover APIs |
| `ajax_content_waiter` | Wait for AJAX |
| `link_harvester` | Harvest links |
| `batch_element_scraper` | Batch scrape |
| `extract_schema` | Schema.org data |
| `element_screenshot` | Screenshot element |
| `breadcrumb_navigator` | Navigate breadcrumbs |
| `redirect_tracer` | Trace redirects |
| `progress_tracker` | Track progress |
| `cookie_manager` | Manage cookies |
| `file_downloader` | Download files |
| `iframe_handler` | Handle iframes |
| `popup_handler` | Handle popups |

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
