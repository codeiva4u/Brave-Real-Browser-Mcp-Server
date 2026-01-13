# Brave Real Browser MCP Server

> **AI assistants को powerful, detection-resistant browser automation capabilities देता है**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/brave-real-browser-mcp-server.svg)](https://www.npmjs.com/package/brave-real-browser-mcp-server)

## 🚀 Quick Start

### Step 1: Configure Claude Desktop / Cursor / Gemini

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Mac:** `~/Library/Application Support/Claude/`  
**Linux:** `~/.config/Claude/`

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

### Step 2: Restart your AI assistant

### Step 3: Test it!
> "Initialize a browser and navigate to google.com, then get the page content"

---

## ✨ Features

- **Stealth by default** - Anti-detection features built-in
- **Brave Browser auto-detection** - No manual path configuration needed
- **33 powerful tools** - Complete browser automation toolkit
- **Captcha handling** - reCAPTCHA, hCaptcha, Turnstile support
- **Proxy support** - Built-in proxy configuration
- **uBlock Origin** - Ad blocking enabled by default

---

## 🛠️ Available Tools (33)

### Core Browser (4)
| Tool | Description |
|------|-------------|
| `browser_init` | Initialize stealth browser with anti-detection |
| `navigate` | Navigate to any URL |
| `get_content` | Extract page content (HTML/text) |
| `browser_close` | Close browser instance |

### Interaction (4)
| Tool | Description |
|------|-------------|
| `click` | Click on elements |
| `type` | Type text into inputs |
| `wait` | Wait for conditions |
| `press_key` | Simulate keyboard |

### Element Discovery (4)
| Tool | Description |
|------|-------------|
| `find_element` | Find elements (text, CSS, XPath, AI-powered) |
| `find_element_advanced` | Advanced element finding |
| `smart_selector_generator` | AI-powered selector generation |
| `batch_element_scraper` | Scrape lists of elements |

### Content Extraction (5)
| Tool | Description |
|------|-------------|
| `save_content_as_markdown` | Save page as markdown |
| `search_content` | Search patterns in page |
| `extract_json` | Extract embedded JSON |
| `scrape_meta_tags` | Extract meta tags |
| `extract_schema` | Extract Schema.org data |

### Navigation (3)
| Tool | Description |
|------|-------------|
| `breadcrumb_navigator` | Navigate via breadcrumbs |
| `redirect_tracer` | Trace URL redirects |
| `m3u8_parser` | Parse HLS/m3u8 streams |

### Network & API (4)
| Tool | Description |
|------|-------------|
| `network_recorder` | Record network traffic |
| `api_finder` | Discover hidden APIs |
| `ajax_content_waiter` | Wait for AJAX content |
| `deep_analysis` | Comprehensive page analysis |

### Media (3)
| Tool | Description |
|------|-------------|
| `media_extractor` | Extract video/audio |
| `file_downloader` | Download files |
| `element_screenshot` | Screenshot elements |

### Streaming & Download (3)
| Tool | Description |
|------|-------------|
| `iframe_handler` | Extract from nested iframes |
| `popup_handler` | Handle popups and new tabs |
| `stream_extractor` | Extract direct download URLs |

### Utility (3)
| Tool | Description |
|------|-------------|
| `link_harvester` | Harvest all links |
| `random_scroll` | Natural scrolling |
| `solve_captcha` | Solve CAPTCHAs |

---

## ⚙️ Browser Options

```json
{
  "headless": false,
  "proxy": "http://proxy:8080",
  "disableXvfb": false
}
```

---

## 🔧 Development

```bash
# Clone
git clone https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server.git
cd Brave-Real-Browser-Mcp-Server

# Install
npm install

# Build
npm run build

# Test
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:ci       # CI tests with coverage

# Run locally
npm run dev
```

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **Brave Browser** (automatically detected)

> **Note:** Brave Browser is automatically detected. No manual configuration needed!

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

Made with ❤️ by [codeiva4u](https://github.com/codeiva4u)
