# 🌐 Brave Real Browser MCP Server

## Universal AI IDE Support with Advanced Browser Automation

<div align="center">

![Version](https://img.shields.io/badge/version-2.12.1-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Tools](https://img.shields.io/badge/tools-111-purple.svg)
![IDEs](https://img.shields.io/badge/AI_IDEs-15+-orange.svg)
![License](https://img.shields.io/badge/license-MIT-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | 111+ Tools | Browser Automation | Web Scraping | CAPTCHA Solving**

[📖 **All 5 Protocols Complete Guide**](./ALL-PROTOCOLS.md) 👈 **NEW! Step-by-step setup for all protocols**

[Installation](#-installation) | [Quick Start](#-quick-start) | [Qoder AI Setup](#-qoder-ai---complete-integration-guide) | [Tools](#-available-tools-111) | [HTTP/WebSocket/SSE](#-httpwebsocketsse-protocol-setup) | [IDE Configurations](#-ide-configurations)

</div>

---

## 🎯 What is This?

**Brave Real Browser MCP Server** एक powerful automation tool है जो:

- ✅ **15+ AI IDEs में काम करता है** (Claude, Cursor, Windsurf, Cline, Zed, VSCode, Qoder AI, etc.)
- ✅ **111+ Automation Tools** - Browser control, scraping, CAPTCHA solving, video extraction
- ✅ **5 Protocol Modes** - MCP (STDIO), LSP, HTTP/WebSocket, SSE
- ✅ **Auto-Detection** - Automatically detects your IDE
- ✅ **Real Brave Browser** - Anti-detection features, bypass Cloudflare
- ✅ **Universal API** - Works with any programming language (JS, Python, PHP, Go, etc.)

---

## 🚀 Quick Start

### ⚡ Quick Setup Summary

**Choose your setup based on your AI Editor:**

| Editor | Setup Time | Protocol | Method |
|--------|-----------|----------|--------|
| **Claude Desktop** | 2 min | MCP | Add config → Restart | 
| **Cursor AI** | 2 min | MCP | Add config → Restart |
| **Windsurf** | 2 min | MCP | Add config → Restart |
| **Zed Editor** | 3 min | LSP | Add to `context_servers` → Restart |
|| **Qoder AI** | 3 min | MCP (STDIO/SSE) | Add config → Restart |
| **Custom Apps** | 1 min | HTTP/WebSocket/SSE | Start server → Use API |

**Quick Commands:**

```bash
# Auto-detect environment
npx brave-real-browser-mcp-server@latest

# MCP mode (Claude, Cursor, Windsurf)
npx brave-real-browser-mcp-server@latest --mode mcp

# LSP mode (Zed, VSCode, Neovim)
npx brave-real-browser-mcp-server@latest --mode lsp

# HTTP mode (Universal API + WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# SSE mode (Real-time monitoring)
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Check if working
curl http://localhost:3000/health  # For HTTP mode
curl http://localhost:3001/health  # For SSE mode
```

---

### Installation

```bash
# Install globally
npm install -g brave-real-browser-mcp-server@latest

# Or use with npx (no installation needed)
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

### For Qoder AI

**Qoder AI supports 2 MCP transport types:** STDIO (local) and SSE (remote)

**Complete step-by-step guide:** [See Qoder AI Integration Guide](#-qoder-ai---complete-integration-guide)

**Quick setup (STDIO):**
1. Add to config: `{"command": "npx", "args": ["-y", "brave-real-browser-mcp-server@latest"]}`
2. Restart Qoder AI
3. Use 111 browser automation tools!

### For Other Custom Tools

Use HTTP/WebSocket/SSE mode - [See Protocol Setup](#-httpwebsocketsse-protocol-setup)

---

## 🌐 HTTP/WebSocket/SSE Protocol Setup

### 1️⃣ HTTP Protocol - Complete Configuration

HTTP mode works with **ANY IDE or programming language**. No special configuration needed!

#### Step 1: Start HTTP Server

```bash
# Start server on port 3000
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Custom host and port
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 8080

# HTTP only (without WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000 --no-websocket

# With custom Brave browser path
set BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

**Server will start and show:**

```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
✅ [WebSocket] Server running on ws://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

#### Step 2: Test Server

```bash
# Health check
curl http://localhost:3000/health

# List all available tools
curl http://localhost:3000/tools

# Get specific tool info
curl http://localhost:3000/tools/browser_init
```

#### Step 3: Available HTTP Endpoints

| Method | Endpoint | Description | Example |
|--------|----------|-------------|----------|
| **GET** | `/health` | Health check | `curl http://localhost:3000/health` |
| **GET** | `/tools` | List all 111 tools | `curl http://localhost:3000/tools` |
| **GET** | `/tools/:toolName` | Get tool info | `curl http://localhost:3000/tools/browser_init` |
| **POST** | `/tools/:toolName` | Execute any tool | See documentation |

#### Step 4: MCP Configuration for HTTP

If your IDE supports HTTP-based MCP servers, use this configuration:

**Config format:**
```json
{
  "mcpServers": {
    "brave-real-browser-http": {
      "url": "http://localhost:3000",
      "transport": "http",
      "name": "Brave Browser (HTTP)",
      "enabled": true
    }
  }
}
```

**With authentication:**
```json
{
  "mcpServers": {
    "brave-real-browser-http": {
      "url": "http://localhost:3000",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer your-token"
      },
      "enabled": true
    }
  }
}
```

#### Step 5: Error Handling

**Success Response:**
```json
{
  "success": true,
  "data": {
    "result": "Browser initialized successfully"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Browser initialization failed",
  "details": "Brave browser not found at specified path"
}
```

---

### 2️⃣ WebSocket Protocol - Complete Configuration

WebSocket provides **real-time, bidirectional communication** for modern applications.

#### Step 1: Start WebSocket Server

```bash
# WebSocket is automatically enabled with HTTP mode
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# WebSocket will be available at: ws://localhost:3000
```

**Server will start and show:**

```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
✅ [WebSocket] Server running on ws://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

#### Step 2: WebSocket Message Format

**Request Format:**
```json
{
  "tool": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "tool": "browser_init",
  "data": {
    "result": "Browser initialized successfully"
  },
  "timestamp": "2025-01-25T04:20:00.000Z"
}
```

#### Step 3: MCP Configuration for WebSocket

If your IDE supports WebSocket-based MCP servers:

**Config format:**
```json
{
  "mcpServers": {
    "brave-real-browser-ws": {
      "url": "ws://localhost:3000",
      "transport": "websocket",
      "name": "Brave Browser (WebSocket)",
      "enabled": true
    }
  }
}
```

**With custom options:**
```json
{
  "mcpServers": {
    "brave-real-browser-ws": {
      "url": "ws://localhost:3000",
      "transport": "websocket",
      "reconnect": true,
      "reconnectDelay": 3000,
      "headers": {
        "Authorization": "Bearer your-token"
      },
      "enabled": true
    }
  }
}
```

#### Step 4: WebSocket Features

**WebSocket URL:** `ws://localhost:3000`

**Features:**
- ✅ Real-time bidirectional communication
- ✅ Auto-reconnection support
- ✅ Ping/Pong keep-alive
- ✅ Custom headers support
- ✅ All 111 tools accessible

---

### 3️⃣ SSE Protocol - Complete Configuration

Server-Sent Events (SSE) provides **real-time, one-way streaming** from server to client.

#### Step 1: Start SSE Server

```bash
# Default (port 3001)
npx brave-real-browser-mcp-server@latest --mode sse

# Custom port
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Custom host
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001 --host 0.0.0.0

# With custom Brave path
set BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001
```

**Server will start and show:**

```
🟢 [SSE] Starting SSE server...
✅ [SSE] Server ready at http://localhost:3001
💡 [SSE] Real-time monitoring enabled
```

#### Step 2: Test SSE Server

```bash
# Health check
curl http://localhost:3001/health

# List available event types
curl http://localhost:3001/events/types
```

#### Step 3: Available SSE Event Types

| Event Type | Description | Example Data |
|------------|-------------|-------------|
| `browser_init_success` | Browser initialized | `{"status": "ready", "pid": 12345}` |
| `browser_init_error` | Browser failed to start | `{"error": "Brave not found"}` |
| `navigation_start` | Navigation started | `{"url": "https://example.com"}` |
| `navigation_complete` | Navigation finished | `{"url": "https://example.com", "time": 1250}` |
| `tool_start` | Tool execution started | `{"tool": "scrape_table"}` |
| `tool_success` | Tool completed successfully | `{"tool": "scrape_table", "result": [...]}` |
| `tool_error` | Tool execution failed | `{"tool": "scrape_table", "error": "Selector not found"}` |
| `content_extracted` | Content extracted | `{"type": "html", "size": 50000}` |
| `screenshot_captured` | Screenshot taken | `{"path": "/path/to/screenshot.png"}` |
| `error_occurred` | General error | `{"error": "Connection timeout"}` |

#### Step 4: MCP Configuration for SSE

If your IDE supports SSE-based MCP servers:

**Config format:**
```json
{
  "mcpServers": {
    "brave-real-browser-sse": {
      "url": "http://localhost:3001/sse",
      "transport": "sse",
      "name": "Brave Browser (SSE)",
      "enabled": true
    }
  }
}
```

**With event filters:**
```json
{
  "mcpServers": {
    "brave-real-browser-sse": {
      "url": "http://localhost:3001/sse?filter=tool_success,navigation_complete",
      "transport": "sse",
      "reconnect": true,
      "enabled": true
    }
  }
}
```

#### Step 5: SSE Advanced Features

**Custom Event Filters:**
```bash
# Connect with filter query parameter
curl http://localhost:3001/events?filter=tool_success,navigation_complete
```

---

## 🤖 Qoder AI - Complete Integration Guide

**Qoder AI** supports MCP servers through **2 official transport types:**
- ✅ **STDIO** (Standard Input/Output) - For local MCP servers
- ✅ **SSE** (Server-Sent Events) - For remote MCP servers

[Official Documentation](https://docs.qoder.com/user-guide/chat/model-context-protocol)

---

### 🟢 Method 1: STDIO Transport (Recommended for Local)

**STDIO** uses stdin/stdout streams for communication. Perfect for local MCP servers.

#### Step 1: Find Qoder AI MCP Config File

**Config file locations:**

```bash
# Windows
%APPDATA%\Qoder\mcp_settings.json

# Mac
~/Library/Application Support/Qoder/mcp_settings.json

# Linux
~/.config/Qoder/mcp_settings.json
```

#### Step 2: Add STDIO Configuration

**Windows Configuration:**
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

**Mac Configuration:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
      }
    }
  }
}
```

**Linux Configuration:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/usr/bin/brave-browser"
      }
    }
  }
}
```

#### Step 3: Restart Qoder AI

Close and reopen Qoder AI completely.

#### Step 4: Verify Integration

In Qoder AI, test:

```
"List all available MCP tools"
→ Expected: 111 tools from Brave Real Browser

"Use browser_init to start the browser"
→ Expected: Browser opens

"Navigate to https://example.com and get content"
→ Expected: Page content extracted
```

---

### 🔵 Method 2: SSE Transport (For Remote MCP Servers)

**SSE** uses HTTP POST for requests and event streams for responses. Perfect for remote hosted servers.

#### Step 1: Start SSE Server

```bash
# Windows
set BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Mac
export BRAVE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Linux
export BRAVE_PATH="/usr/bin/brave-browser"
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001
```

**Server will start:**
```
🟢 [SSE] Starting SSE server...
✅ [SSE] Server ready at http://localhost:3001
💡 [SSE] Real-time monitoring enabled
```

#### Step 2: Configure Qoder AI for SSE

**In Qoder AI Settings → MCP Servers:**

```json
{
  "brave-real-browser": {
    "url": "http://localhost:3001/sse",
    "transport": "sse",
    "name": "Brave Real Browser (SSE)",
    "enabled": true
  }
}
```

#### Step 3: Restart Qoder AI

Close and reopen Qoder AI.

---

### 🛠️ Using Brave Browser in Qoder AI

Once configured, you can use **all 111 tools** in Qoder AI:

**Example 1: Web Scraping**
```
"Initialize browser, navigate to https://news.ycombinator.com and scrape all article titles"
```

**Example 2: Form Automation**
```
"Open https://example.com/login, fill the form with username 'test' and password 'pass123', then click submit"
```

**Example 3: Data Extraction**
```
"Go to https://example.com/products and extract all product names, prices, and images"
```

**Example 4: Video Extraction**
```
"Navigate to [video URL] and extract all video download links"
```

**Example 5: Screenshot**
```
"Take a full-page screenshot of https://example.com and save it"
```

---

### ⚡ Quick Troubleshooting for Qoder AI

**Problem 1: "MCP Server timeout" or "Connection failed"**

**Solution:**
```bash
# Install globally for faster startup
npm install -g brave-real-browser-mcp-server@latest
```

Then update config to:
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "brave-real-browser-mcp-server",
      "args": []
    }
  }
}
```

**Problem 2: "Tools not showing in Qoder AI"**

**Solution:**
1. Check config file path is correct
2. Verify JSON format is valid
3. Restart Qoder AI completely
4. Check Qoder AI logs for errors

**Problem 3: "Browser not opening"**

**Solution:**
```bash
# Set Brave path explicitly in config
"env": {
  "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
}
```

**Problem 4: "SSE server not connecting"**

**Solution:**
```bash
# Check if server is running
curl http://localhost:3001/health

# Try different port
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3002
```

---

### 📊 Available Tools in Qoder AI

All **111 tools** are available:

✅ **Browser Management:** `browser_init`, `browser_close`  
✅ **Navigation:** `navigate`, `wait`, `click`, `type`  
✅ **Content Extraction:** `get_content`, `scrape_table`, `extract_json`, `scrape_meta_tags`  
✅ **Media Tools:** `video_link_finder`, `image_scraper`, `media_extractor`  
✅ **CAPTCHA Solving:** `solve_captcha`, `ocr_engine`  
✅ **Data Processing:** `price_parser`, `date_normalizer`, `contact_extractor`  
✅ **Visual Tools:** `full_page_screenshot`, `pdf_generation`  
✅ **And 90+ more tools!**

---

## 🎨 IDE Configurations


**Step 2: Add Configuration**

Copy and paste this configuration:

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

**Advanced Configuration (Optional):**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false"
      }
    }
  }
}
```

**Configuration Locations:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### Cursor AI

**Step 3: Add Configuration**

**Basic Configuration:**
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

**Advanced Configuration (with Brave path):**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false"
      }
    }
  }
}
```

**For Mac:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
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

**Protocol:** Context Servers (MCP)

**File:** `settings.json`

**Location:**

- Windows: `%APPDATA%\Zed\settings.json`
- Mac: `~/.config/zed/settings.json`
- Linux: `~/.config/zed/settings.json`

#### Step-by-Step Setup Guide:

**Step 1:** Open Zed Editor and press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

**Step 2:** Type "Open Settings" and select "Zed: Open Settings"

**Step 3:** Add the following configuration:

```json
{
  "context_servers": {
    "brave-real-browser": {
      "source": "custom",
      "command": "npx.cmd",
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

**For Mac/Linux, use:**
```json
{
  "context_servers": {
    "brave-real-browser": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

**Note:** Replace path in Option C with your actual global npm modules path:
- Windows: `%APPDATA%\npm\node_modules\brave-real-browser-mcp-server\dist\index.js`
- Mac/Linux: `/usr/local/lib/node_modules/brave-real-browser-mcp-server/dist/index.js`

**Advanced Configuration (with environment variables):**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false"
      }
    }
  }
}
```

**For Mac:**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
      }
    }
  }
}
```

**Cause:** Qoder AI has a short initialization timeout. Using `npx` can be slow on first run because it needs to download and cache the package.

**Solution 1 - Install Globally (Recommended):**
```bash
# Install package globally for instant startup
npm install -g brave-real-browser-mcp-server@latest
```

Then update your configuration to:
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "brave-real-browser-mcp-server",
      "args": []
    }
  }
}
```

## 🛠️ Available Tools (111)

### 🌐 Browser Management (2 tools)

| Tool            | Description                                     |
| --------------- | ----------------------------------------------- |
| `browser_init`  | Initialize browser with anti-detection features |
| `browser_close` | Close browser instance                          |

### 🧭 Navigation (2 tools)

| Tool       | Description                               |
| ---------- | ----------------------------------------- |
| `navigate` | Navigate to URL with wait conditions      |
| `wait`     | Wait for selector, navigation, or timeout |

### 🖱️ Interactions (4 tools)

| Tool            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `click`         | Click on elements                                    |
| `type`          | Type text into inputs                                |
| `random_scroll` | Human-like scrolling                                 |
| `solve_captcha` | Solve CAPTCHA (reCAPTCHA, hCaptcha, Turnstile, etc.) |

### 📄 Content Extraction (10 tools)

| Tool                       | Description                               |
| -------------------------- | ----------------------------------------- |
| `get_content`              | Extract page content (HTML/Text/Markdown) |
| `find_selector`            | Find CSS selectors for elements           |
| `scrape_table`             | Extract table data with headers           |
| `extract_list`             | Extract list items                        |
| `extract_json`             | Extract JSON data from page               |
| `scrape_meta_tags`         | Extract meta tags and SEO info            |
| `extract_schema`           | Extract schema.org structured data        |
| `save_content_as_markdown` | Save page as markdown file                |
| `html_to_text`             | Convert HTML to clean text                |
| `smart_text_cleaner`       | Clean and normalize text                  |

### 🔍 Multi-Element Extraction (8 tools)

| Tool                      | Description                       |
| ------------------------- | --------------------------------- |
| `batch_element_scraper`   | Scrape multiple elements at once  |
| `nested_data_extraction`  | Extract nested data structures    |
| `attribute_harvester`     | Extract element attributes        |
| `image_scraper`           | Extract all images with metadata  |
| `link_harvester`          | Extract all links from page       |
| `media_extractor`         | Extract media files (audio/video) |
| `pdf_link_finder`         | Find PDF download links           |
| `html_elements_extractor` | Extract specific HTML elements    |

### 🎯 Advanced Extraction (10 tools)

| Tool                   | Description                  |
| ---------------------- | ---------------------------- |
| `tags_finder`          | Find elements by tag name    |
| `links_finder`         | Advanced link extraction     |
| `xpath_links`          | Extract links using XPath    |
| `ajax_extractor`       | Extract AJAX/dynamic content |
| `fetch_xhr`            | Capture XHR/Fetch requests   |
| `network_recorder`     | Record all network traffic   |
| `api_finder`           | Discover API endpoints       |
| `regex_pattern_finder` | Find patterns using regex    |
| `iframe_extractor`     | Extract iframe content       |
| `embed_page_extractor` | Extract embedded pages       |

### 🎬 Video & Media Tools (19 tools)

| Tool                            | Description                              |
| ------------------------------- | ---------------------------------------- |
| `video_link_finder`             | Find video URLs                          |
| `video_download_page`           | Navigate to video download page          |
| `video_download_button`         | Find video download buttons              |
| `video_play_push_source`        | Get video play sources                   |
| `video_play_button_click`       | Click video play button                  |
| `url_redirect_trace_endpoints`  | Trace URL redirects                      |
| `network_recording_finder`      | Find network recordings                  |
| `network_recording_extractors`  | Extract network data                     |
| `video_links_finders`           | Multiple video link finders              |
| `videos_selectors`              | Video element selectors                  |
| `link_process_extracts`         | Process and extract links                |
| `video_link_finders_extracts`   | Advanced video link extraction           |
| `video_download_button_finders` | Find all download buttons                |
| `advanced_video_extraction`     | Advanced video extraction with ad-bypass |
| `image_extractor_advanced`      | Advanced image extraction                |
| `video_source_extractor`        | Extract video source URLs                |
| `video_player_extractor`        | Extract video player info                |
| `video_player_hoster_finder`    | Find video hosting platform              |
| `original_video_hoster_finder`  | Find original video source               |

### 🔐 CAPTCHA & Security (4 tools)

| Tool                     | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `solve_captcha`          | Multi-CAPTCHA solver (reCAPTCHA, hCaptcha, Turnstile, Arkose, etc.) |
| `ocr_engine`             | OCR for text-based CAPTCHAs                                         |
| `audio_captcha_solver`   | Solve audio CAPTCHAs                                                |
| `puzzle_captcha_handler` | Handle puzzle CAPTCHAs                                              |

### 🔧 Data Processing (9 tools)

| Tool                      | Description                        |
| ------------------------- | ---------------------------------- |
| `price_parser`            | Extract and parse prices           |
| `date_normalizer`         | Normalize dates to standard format |
| `contact_extractor`       | Extract contact information        |
| `schema_validator`        | Validate data against schema       |
| `required_fields_checker` | Check for required fields          |
| `duplicate_remover`       | Remove duplicate entries           |
| `data_deduplication`      | Advanced deduplication             |
| `missing_data_handler`    | Handle missing data                |
| `data_type_validator`     | Validate data types                |

### 📊 Data Quality (3 tools)

| Tool                   | Description              |
| ---------------------- | ------------------------ |
| `outlier_detection`    | Detect data outliers     |
| `consistency_checker`  | Check data consistency   |
| `data_quality_metrics` | Generate quality metrics |

### 🤖 AI-Powered Tools (5 tools)

| Tool                       | Description                 |
| -------------------------- | --------------------------- |
| `smart_selector_generator` | Auto-generate CSS selectors |
| `content_classification`   | Classify content type       |
| `sentiment_analysis`       | Analyze text sentiment      |
| `summary_generator`        | Generate content summaries  |
| `translation_support`      | Translate content           |

### 🔎 Search & Filter (5 tools)

| Tool                     | Description                   |
| ------------------------ | ----------------------------- |
| `keyword_search`         | Search for keywords in page   |
| `regex_pattern_matcher`  | Match regex patterns          |
| `xpath_support`          | XPath query support           |
| `advanced_css_selectors` | Advanced CSS selector queries |
| `visual_element_finder`  | Find elements visually        |

### 📑 Pagination & Navigation (5 tools)

| Tool                   | Description                 |
| ---------------------- | --------------------------- |
| `auto_pagination`      | Auto-paginate through pages |
| `infinite_scroll`      | Handle infinite scroll      |
| `multi_page_scraper`   | Scrape multiple pages       |
| `sitemap_parser`       | Parse and navigate sitemaps |
| `breadcrumb_navigator` | Navigate using breadcrumbs  |

### 🔒 Session Management (7 tools)

| Tool                    | Description                |
| ----------------------- | -------------------------- |
| `cookie_manager`        | Manage cookies             |
| `session_persistence`   | Persist sessions           |
| `form_auto_fill`        | Auto-fill forms            |
| `ajax_content_waiter`   | Wait for AJAX content      |
| `modal_popup_handler`   | Handle modal popups        |
| `login_session_manager` | Manage login sessions      |
| `shadow_dom_extractor`  | Extract Shadow DOM content |

### 📸 Visual Tools (5 tools)

| Tool                   | Description                 |
| ---------------------- | --------------------------- |
| `full_page_screenshot` | Full page screenshot        |
| `element_screenshot`   | Screenshot specific element |
| `pdf_generation`       | Generate PDF from page      |
| `video_recording`      | Record page as video        |
| `visual_comparison`    | Compare screenshots         |

### 📈 Monitoring & Reporting (6 tools)

| Tool                    | Description               |
| ----------------------- | ------------------------- |
| `progress_tracker`      | Track automation progress |
| `error_logger`          | Log errors                |
| `success_rate_reporter` | Report success rates      |
| `data_quality_metrics`  | Data quality metrics      |
| `performance_monitor`   | Monitor performance       |
| `monitoring_summary`    | Get monitoring summary    |

### 🌐 API Integration (3 tools)

| Tool                       | Description              |
| -------------------------- | ------------------------ |
| `rest_api_endpoint_finder` | Find REST API endpoints  |
| `webhook_support`          | Webhook integration      |
| `all_website_api_finder`   | Find all APIs on website |

### 🛡️ Advanced Extraction & Obfuscation (5 tools)

| Tool                         | Description                 |
| ---------------------------- | --------------------------- |
| `deobfuscate_js`             | Deobfuscate JavaScript      |
| `multi_layer_redirect_trace` | Trace multi-layer redirects |
| `ad_protection_detector`     | Detect ad protection        |
| `url_redirect_tracer`        | Trace URL redirects         |
| `user_agent_extractor`       | Extract user agent info     |


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

## 📊 Supported Protocols

|| Protocol        | Used By                                       | Auto-Config | Status     |
|| --------------- | --------------------------------------------- | ----------- | ---------- |
|| **MCP (STDIO)** | Claude Desktop, Cursor, Windsurf, Cline, Warp | ✅          | 🟢 Working |
|| **LSP**         | Zed Editor, VSCode, Neovim                    | ✅          | 🟢 Working |
|| **HTTP/REST**   | Any IDE/Tool                                  | ✅          | 🟢 Working |
|| **WebSocket**   | Modern Web Apps, Real-time Tools              | ✅          | 🟢 Working |
|| **SSE**         | Real-time Streaming, Web Apps                 | ✅          | 🟢 Working |

## 📄 License

MIT License - See LICENSE file for details.

---

## 🔗 Links

- **GitHub:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server
- **NPM:** https://www.npmjs.com/package/brave-real-browser-mcp-server
- **Issues:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues

---

<div align="center">

**🌟 111 Tools | 15+ AI IDEs | 5 Protocols | Universal Support 🌟**

**Made with ❤️ for the AI Development Community**

