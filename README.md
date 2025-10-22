# 🌐 Brave Real Browser MCP Server
## Universal AI IDE Support with Advanced Browser Automation

<div align="center">

![Version](https://img.shields.io/badge/version-2.12.1-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Tools](https://img.shields.io/badge/tools-111-purple.svg)
![IDEs](https://img.shields.io/badge/AI_IDEs-15+-orange.svg)
![License](https://img.shields.io/badge/license-MIT-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | 111+ Tools | Browser Automation | Web Scraping | CAPTCHA Solving**

[Installation](#-installation) | [Quick Start](#-quick-start) | [Tools](#-available-tools-111) | [HTTP/WebSocket](#-httpwebsocket-setup) | [Configuration](#-ide-configurations)

</div>

---

## 🎯 What is This?

**Brave Real Browser MCP Server** एक powerful automation tool है जो:

- ✅ **15+ AI IDEs में काम करता है** (Claude, Cursor, Windsurf, Cline, Zed, VSCode, Qoder AI, etc.)
- ✅ **111+ Automation Tools** - Browser control, scraping, CAPTCHA solving, video extraction
- ✅ **3 Protocol Modes** - MCP (STDIO), LSP, HTTP/WebSocket
- ✅ **Auto-Detection** - Automatically detects your IDE
- ✅ **Real Brave Browser** - Anti-detection features, bypass Cloudflare
- ✅ **Universal API** - Works with any programming language (JS, Python, PHP, Go, etc.)

---

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g brave-real-browser-mcp-server@latest

# Or use with npx (no installation)
npx brave-real-browser-mcp-server@latest
```

### For MCP IDEs (Claude, Cursor, Windsurf)

**Add to your IDE config file:**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"]
    }
  }
}
```

**Config file locations:**
- **Claude Desktop:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
- **Cursor:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **Windsurf:** `%APPDATA%\Windsurf\mcp.json`

### For Other IDEs (Qoder AI, Custom Tools)

Use HTTP/WebSocket mode - [See HTTP/WebSocket Setup](#-httpwebsocket-setup)

---

## 🛠️ Available Tools (111)

### 🌐 Browser Management (2 tools)

| Tool | Description |
|------|-------------|
| `browser_init` | Initialize browser with anti-detection features |
| `browser_close` | Close browser instance |

### 🧭 Navigation (2 tools)

| Tool | Description |
|------|-------------|
| `navigate` | Navigate to URL with wait conditions |
| `wait` | Wait for selector, navigation, or timeout |

### 🖱️ Interactions (4 tools)

| Tool | Description |
|------|-------------|
| `click` | Click on elements |
| `type` | Type text into inputs |
| `random_scroll` | Human-like scrolling |
| `solve_captcha` | Solve CAPTCHA (reCAPTCHA, hCaptcha, Turnstile, etc.) |

### 📄 Content Extraction (10 tools)

| Tool | Description |
|------|-------------|
| `get_content` | Extract page content (HTML/Text/Markdown) |
| `find_selector` | Find CSS selectors for elements |
| `scrape_table` | Extract table data with headers |
| `extract_list` | Extract list items |
| `extract_json` | Extract JSON data from page |
| `scrape_meta_tags` | Extract meta tags and SEO info |
| `extract_schema` | Extract schema.org structured data |
| `save_content_as_markdown` | Save page as markdown file |
| `html_to_text` | Convert HTML to clean text |
| `smart_text_cleaner` | Clean and normalize text |

### 🔍 Multi-Element Extraction (8 tools)

| Tool | Description |
|------|-------------|
| `batch_element_scraper` | Scrape multiple elements at once |
| `nested_data_extraction` | Extract nested data structures |
| `attribute_harvester` | Extract element attributes |
| `image_scraper` | Extract all images with metadata |
| `link_harvester` | Extract all links from page |
| `media_extractor` | Extract media files (audio/video) |
| `pdf_link_finder` | Find PDF download links |
| `html_elements_extractor` | Extract specific HTML elements |

### 🎯 Advanced Extraction (10 tools)

| Tool | Description |
|------|-------------|
| `tags_finder` | Find elements by tag name |
| `links_finder` | Advanced link extraction |
| `xpath_links` | Extract links using XPath |
| `ajax_extractor` | Extract AJAX/dynamic content |
| `fetch_xhr` | Capture XHR/Fetch requests |
| `network_recorder` | Record all network traffic |
| `api_finder` | Discover API endpoints |
| `regex_pattern_finder` | Find patterns using regex |
| `iframe_extractor` | Extract iframe content |
| `embed_page_extractor` | Extract embedded pages |

### 🎬 Video & Media Tools (19 tools)

| Tool | Description |
|------|-------------|
| `video_link_finder` | Find video URLs |
| `video_download_page` | Navigate to video download page |
| `video_download_button` | Find video download buttons |
| `video_play_push_source` | Get video play sources |
| `video_play_button_click` | Click video play button |
| `url_redirect_trace_endpoints` | Trace URL redirects |
| `network_recording_finder` | Find network recordings |
| `network_recording_extractors` | Extract network data |
| `video_links_finders` | Multiple video link finders |
| `videos_selectors` | Video element selectors |
| `link_process_extracts` | Process and extract links |
| `video_link_finders_extracts` | Advanced video link extraction |
| `video_download_button_finders` | Find all download buttons |
| `advanced_video_extraction` | Advanced video extraction with ad-bypass |
| `image_extractor_advanced` | Advanced image extraction |
| `video_source_extractor` | Extract video source URLs |
| `video_player_extractor` | Extract video player info |
| `video_player_hoster_finder` | Find video hosting platform |
| `original_video_hoster_finder` | Find original video source |

### 🔐 CAPTCHA & Security (4 tools)

| Tool | Description |
|------|-------------|
| `solve_captcha` | Multi-CAPTCHA solver (reCAPTCHA, hCaptcha, Turnstile, Arkose, etc.) |
| `ocr_engine` | OCR for text-based CAPTCHAs |
| `audio_captcha_solver` | Solve audio CAPTCHAs |
| `puzzle_captcha_handler` | Handle puzzle CAPTCHAs |

### 🔧 Data Processing (9 tools)

| Tool | Description |
|------|-------------|
| `price_parser` | Extract and parse prices |
| `date_normalizer` | Normalize dates to standard format |
| `contact_extractor` | Extract contact information |
| `schema_validator` | Validate data against schema |
| `required_fields_checker` | Check for required fields |
| `duplicate_remover` | Remove duplicate entries |
| `data_deduplication` | Advanced deduplication |
| `missing_data_handler` | Handle missing data |
| `data_type_validator` | Validate data types |

### 📊 Data Quality (3 tools)

| Tool | Description |
|------|-------------|
| `outlier_detection` | Detect data outliers |
| `consistency_checker` | Check data consistency |
| `data_quality_metrics` | Generate quality metrics |

### 🤖 AI-Powered Tools (5 tools)

| Tool | Description |
|------|-------------|
| `smart_selector_generator` | Auto-generate CSS selectors |
| `content_classification` | Classify content type |
| `sentiment_analysis` | Analyze text sentiment |
| `summary_generator` | Generate content summaries |
| `translation_support` | Translate content |

### 🔎 Search & Filter (5 tools)

| Tool | Description |
|------|-------------|
| `keyword_search` | Search for keywords in page |
| `regex_pattern_matcher` | Match regex patterns |
| `xpath_support` | XPath query support |
| `advanced_css_selectors` | Advanced CSS selector queries |
| `visual_element_finder` | Find elements visually |

### 📑 Pagination & Navigation (5 tools)

| Tool | Description |
|------|-------------|
| `auto_pagination` | Auto-paginate through pages |
| `infinite_scroll` | Handle infinite scroll |
| `multi_page_scraper` | Scrape multiple pages |
| `sitemap_parser` | Parse and navigate sitemaps |
| `breadcrumb_navigator` | Navigate using breadcrumbs |

### 🔒 Session Management (7 tools)

| Tool | Description |
|------|-------------|
| `cookie_manager` | Manage cookies |
| `session_persistence` | Persist sessions |
| `form_auto_fill` | Auto-fill forms |
| `ajax_content_waiter` | Wait for AJAX content |
| `modal_popup_handler` | Handle modal popups |
| `login_session_manager` | Manage login sessions |
| `shadow_dom_extractor` | Extract Shadow DOM content |

### 📸 Visual Tools (5 tools)

| Tool | Description |
|------|-------------|
| `full_page_screenshot` | Full page screenshot |
| `element_screenshot` | Screenshot specific element |
| `pdf_generation` | Generate PDF from page |
| `video_recording` | Record page as video |
| `visual_comparison` | Compare screenshots |

### 📈 Monitoring & Reporting (6 tools)

| Tool | Description |
|------|-------------|
| `progress_tracker` | Track automation progress |
| `error_logger` | Log errors |
| `success_rate_reporter` | Report success rates |
| `data_quality_metrics` | Data quality metrics |
| `performance_monitor` | Monitor performance |
| `monitoring_summary` | Get monitoring summary |

### 🌐 API Integration (3 tools)

| Tool | Description |
|------|-------------|
| `rest_api_endpoint_finder` | Find REST API endpoints |
| `webhook_support` | Webhook integration |
| `all_website_api_finder` | Find all APIs on website |

### 🛡️ Advanced Extraction & Obfuscation (5 tools)

| Tool | Description |
|------|-------------|
| `deobfuscate_js` | Deobfuscate JavaScript |
| `multi_layer_redirect_trace` | Trace multi-layer redirects |
| `ad_protection_detector` | Detect ad protection |
| `url_redirect_tracer` | Trace URL redirects |
| `user_agent_extractor` | Extract user agent info |

---

## 🌐 HTTP/WebSocket Setup

### HTTP Protocol - 5 Steps

HTTP mode works with **ANY IDE or programming language**. No special configuration needed!

#### Step 1: Start HTTP Server

```bash
# Start server on port 3000
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Custom host and port
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 8080

# HTTP only (without WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000 --no-websocket
```

**Server will start and show:**
```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

#### Step 2: Test Server

```bash
# Health check
curl http://localhost:3000/health

# List all available tools
curl http://localhost:3000/tools
```

#### Step 5: Configure in Your IDE

**For Qoder AI:**
```json
{
  "extensions": {
    "brave-real-browser": {
      "type": "http",
      "enabled": true,
      "endpoint": "http://localhost:3000"
    }
  }
}
```

**For any custom tool:** Just make HTTP POST requests to `http://localhost:3000/tools/{tool_name}`

---

### WebSocket Protocol - 5 Steps

WebSocket provides **real-time, bidirectional communication** for modern applications.

#### Step 1: Start WebSocket Server

```bash
# WebSocket is automatically enabled with HTTP mode
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# WebSocket will be available at: ws://localhost:3000
```

## 🎨 IDE Configurations

### Claude Desktop

**File:** `claude_desktop_config.json`

**Location:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"]
    }
  }
}
```

### Cursor AI

**File:** `cline_mcp_settings.json`

**Location:**
- Windows: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Mac: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
      }
    }
  }
}
```

### Windsurf

**File:** `mcp.json`

**Location:**
- Windows: `%APPDATA%\Windsurf\mcp.json`
- Mac: `~/.windsurf/mcp.json`

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"]
    }
  }
}
```

### Cline (VSCode Extension)

**File:** `cline_mcp_settings.json`

**Location:**
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Mac: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"]
    }
  }
}
```

### Zed Editor

**File:** `settings.json`

**Location:**
- Windows: `%APPDATA%\Zed\settings.json`
- Mac: `~/.config/zed/settings.json`

```json
{
  "lsp": {
    "brave-real-browser": {
      "command": "brave-real-browser-mcp-server@latest",
      "args": ["--mode", "lsp"]
    }
  }
}
```

### Qoder AI / HTTP-based IDEs

Start server in HTTP mode and configure:

```json
{
  "extensions": {
    "brave-real-browser": {
      "type": "http",
      "enabled": true,
      "endpoint": "http://localhost:3000",
      "timeout": 30000
    }
  }
}
```

---

## 💡 Usage Examples

### Example 1: Simple Web Scraping (MCP Mode)

```javascript
// Using MCP tool in Claude/Cursor
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {}
});

await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com" }
});

await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "get_content",
  arguments: { type: "text" }
});
```

### Example 2: CAPTCHA Solving

```javascript
// Navigate to CAPTCHA page
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://site-with-captcha.com" }
});

// Solve CAPTCHA
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "solve_captcha",
  arguments: { type: "recaptcha" }
});

// Continue automation
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "click",
  arguments: { selector: "button.submit" }
});
```

### Example 3: Video Extraction

```javascript
// Navigate to video page
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://video-site.com/video/123" }
});

// Find video links
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "video_link_finder",
  arguments: {}
});

// Advanced video extraction with ad bypass
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "advanced_video_extraction",
  arguments: {}
});
```

### Example 4: Multi-Page Scraping

```javascript
// Initialize browser
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {}
});

// Auto-paginate through all pages
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "multi_page_scraper",
  arguments: {
    startUrl: "https://example.com/page/1",
    maxPages: 10
  }
});
```

---

## 📋 API Endpoints (HTTP Mode)

When running in HTTP mode, these endpoints are available:

```
GET  /health                    - Health check
GET  /tools                     - List all tools
POST /tools/:toolName           - Execute any tool
POST /browser/init              - Initialize browser
POST /browser/navigate          - Navigate to URL
POST /browser/get_content       - Get page content
POST /browser/click             - Click element
POST /browser/type              - Type text
POST /browser/close             - Close browser
```

**Example:**
```bash
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## 🔧 Environment Variables

```bash
# Optional: Specify Brave browser path
BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Optional: Run in headless mode
HEADLESS=true

# Optional: Disable content priority
DISABLE_CONTENT_PRIORITY=true

# Optional: HTTP port
HTTP_PORT=3000
```

---

## 🐛 Troubleshooting

### Brave Browser Not Found

**Solution:**
```bash
# Windows
set BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Linux/Mac
export BRAVE_PATH="/usr/bin/brave-browser"
```

### Server Won't Start

1. Check Node.js version: `node --version` (should be >= 18)
2. Clear npm cache: `npm cache clean --force`
3. Reinstall: `npm install -g brave-real-browser-mcp-server@latest`

### Port Already in Use

```bash
# Use different port
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

### CAPTCHA Not Solving

1. Ensure CAPTCHA is fully loaded
2. Try longer timeout: `{ "timeout": 30000 }`
3. Try different CAPTCHA types: `recaptcha`, `hcaptcha`, `turnstile`

---

## 📊 Supported Protocols

| Protocol | Used By | Auto-Config | Status |
|----------|---------|-------------|--------|
| **MCP (STDIO)** | Claude Desktop, Cursor, Windsurf, Cline, Warp | ✅ | 🟢 Working |
| **LSP** | Zed Editor, VSCode, Neovim | ✅ | 🟢 Working |
| **HTTP/REST** | Any IDE/Tool | ✅ | 🟢 Working |
| **WebSocket** | Modern Web Apps, Real-time Tools | ✅ | 🟢 Working |

---

## 📋 Requirements

- **Node.js** >= 18.0.0
- **Brave Browser** (auto-detected or specify path)
- **Operating System:** Windows, macOS, Linux

---

## 🤝 Contributing

Contributions are welcome! Please submit a Pull Request.

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🔗 Links

- **GitHub:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server
- **NPM:** https://www.npmjs.com/package/brave-real-browser-mcp-server
- **Issues:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues

---

<div align="center">

**🌟 111 Tools | 15+ AI IDEs | 3 Protocols | Universal Support 🌟**

**Made with ❤️ for the AI Development Community**

[⭐ Star on GitHub](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server) | [🐛 Report Bug](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues) | [💡 Request Feature](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)

</div>
| **MCP (STDIO)** | Claude Desktop,
