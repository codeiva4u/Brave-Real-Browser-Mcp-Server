# 🌐 Brave Real Browser MCP Server - Universal AI IDE Support

<div align="center">

![Version](https://img.shields.io/badge/version-2.11.8-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)
![AI IDEs](https://img.shields.io/badge/AI_IDEs-15+-purple.svg)
![Protocols](https://img.shields.io/badge/protocols-4-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | Browser Automation | Web Scraping | CAPTCHA Solving**

[English](#english) | [हिन्दी](#hindi)

</div>

---

## 🎯 What Makes This Universal?

**यह प्रोजेक्ट सभी AI IDEs में स्वचालित रूप से काम करता है!**

✅ **Auto-Detection** - आपका IDE automatically detect होता है  
✅ **Multi-Protocol** - MCP, LSP, HTTP, WebSocket सभी supported  
✅ **Zero Configuration** - कोई manual setup की जरूरत नहीं  
✅ **15+ AI IDEs** - सभी popular AI tools supported  
✅ **Real Brave Browser** - असली Brave browser के साथ काम करता है  
✅ **Anti-Detection** - Cloudflare, reCAPTCHA bypass करता है  

---

<a name="english"></a>
# 📖 English Documentation

## 🤖 Supported AI IDEs (Universal Compatibility)

This server **automatically detects and adapts** to your AI IDE!

### ✅ Fully Supported & Auto-Detected

| IDE | Protocol | Auto-Config | Status |
|-----|----------|-------------|--------|
| **Claude Desktop** | MCP/STDIO | ✅ | 🟢 Working |
| **Cursor AI** | MCP/STDIO | ✅ | 🟢 Working |
| **Windsurf** | MCP/STDIO | ✅ | 🟢 Working |
| **Cline** (VSCode) | MCP/STDIO | ✅ | 🟢 Working |
| **Warp Terminal** | MCP/STDIO | ✅ | 🟢 Working |
| **Roo Coder** | MCP/STDIO | ✅ | 🟢 Working |
| **Zed Editor** | LSP/MCP | ✅ | 🟢 Working |
| **VSCode** | LSP/HTTP | ✅ | 🟢 Working |
| **Qoder AI** | HTTP/WS | ✅ | 🟢 Working |
| **Continue.dev** | MCP/HTTP | ✅ | 🟢 Working |
| **GitHub Copilot** | HTTP/LSP | ✅ | 🟢 Working |
| **Amazon CodeWhisperer** | HTTP/LSP | ✅ | 🟢 Working |
| **Tabnine** | HTTP/WS | ✅ | 🟢 Working |
| **Cody** (Sourcegraph) | HTTP/LSP | ✅ | 🟢 Working |
| **Aider** | STDIO/HTTP | ✅ | 🟢 Working |
| **Pieces for Developers** | HTTP/WS | ✅ | 🟢 Working |

### 📡 Supported Protocols

- **MCP** (Model Context Protocol) - Claude Desktop, Cursor, Windsurf, Cline, Warp, Roo Coder
- **LSP** (Language Server Protocol) - Zed, VSCode, Neovim, Emacs, Sublime Text
- **HTTP/REST** - Universal API for all IDEs
- **WebSocket** - Real-time communication for modern IDEs

---

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g brave-real-browser-mcp-server@latest

# Or use with npx (no installation needed)
npx brave-real-browser-mcp-server@latest
```

### Usage

```bash
# Auto mode (automatically detects your IDE) - DEFAULT
brave-real-browser-mcp-server@latest

# Or explicitly specify protocol
brave-real-browser-mcp-server@latest --mode auto

# MCP mode (for Claude, Cursor, Windsurf, etc.)
brave-real-browser-mcp-server@latest --mode mcp

# HTTP mode (universal - works with ALL IDEs)
brave-real-browser-mcp-server@latest --mode http --port 3000

# LSP mode (for Zed, VSCode, etc.)
brave-real-browser-mcp-server@latest --mode lsp
```

---

## ⚙️ Configuration for Specific IDEs

### 1. Claude Desktop

**File:** `claude_desktop_config.json`

**Location:**
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

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

### 2. Cursor AI

**File:** `cline_mcp_settings.json`

**Location:**
- **Windows:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **macOS:** `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

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

### 3. Windsurf

**File:** `mcp.json`

**Location:**
- **Windows:** `%APPDATA%\Windsurf\mcp.json`
- **macOS:** `~/.windsurf/mcp.json`

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

### 4. Cline (VSCode Extension)

**File:** `cline_mcp_settings.json`

**Location:**
- **Windows:** `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **macOS:** `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

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

### 5. Zed Editor

**File:** `settings.json`

**Location:**
- **Windows:** `%APPDATA%\Zed\settings.json`
- **macOS:** `~/.config/zed/settings.json`

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

### 6. HTTP Protocol (Universal - Works with ALL IDEs)

HTTP mode provides a REST API that works with any IDE or tool that can make HTTP requests.

#### Step 1: Start HTTP Server

```bash
# Start with default settings
brave-real-browser-mcp-server@latest --mode http --port 3000

# With custom host and port
brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 8080

# Without WebSocket support (HTTP only)
brave-real-browser-mcp-server@latest --mode http --port 3000 --no-websocket
```

#### Step 2: Configure Your IDE/Tool

**For Qoder AI:**
```javascript
// Qoder AI settings
{
  "extensions": {
    "brave-real-browser": {
      "type": "http",
      "endpoint": "http://localhost:3000",
      "enabled": true
    }
  }
}
```

**For Custom Scripts/Tools:**
```javascript
// JavaScript/Node.js
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyIDE/1.0'
  }
});

// Initialize browser
await client.post('/tools/browser_init', {});

// Navigate to URL
await client.post('/tools/navigate', {
  url: 'https://example.com'
});

// Get content
const response = await client.post('/tools/get_content', {
  type: 'text'
});
console.log(response.data);
```

**For Python Scripts:**
```python
import requests

# Base configuration
base_url = "http://localhost:3000"

# Initialize browser
requests.post(f"{base_url}/tools/browser_init", json={})

# Navigate
requests.post(f"{base_url}/tools/navigate", json={
    "url": "https://example.com"
})

# Get content
response = requests.post(f"{base_url}/tools/get_content", json={
    "type": "text"
})
print(response.json())
```

**For cURL/Command Line:**
```bash
# Initialize browser
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d '{}'

# Navigate to URL
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get page content
curl -X POST http://localhost:3000/tools/get_content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'
```

#### Available HTTP Endpoints:

```
GET  /health              - Health check
GET  /tools               - List all available tools
POST /tools/:toolName     - Execute specific tool
POST /browser/init        - Initialize browser
POST /browser/navigate    - Navigate to URL
POST /browser/get_content - Get page content
POST /browser/click       - Click element
POST /browser/type        - Type text
POST /browser/close       - Close browser
```

### 7. WebSocket Protocol (Real-time Communication)

WebSocket provides bidirectional, real-time communication for modern web-based IDEs.

#### Step 1: Start Server with WebSocket

```bash
# Start with WebSocket enabled (default)
brave-real-browser-mcp-server@latest --mode http --port 3000

# WebSocket will be available at: ws://localhost:3000
```

#### Step 2: Connect via WebSocket

**For JavaScript/Browser:**
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected to Brave Browser MCP Server');
  
  // Send command
  ws.send(JSON.stringify({
    action: 'browser_init',
    params: {}
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Response:', response);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

**For Node.js:**
```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected!');
  
  // Initialize browser
  ws.send(JSON.stringify({
    action: 'browser_init',
    params: {}
  }));
  
  // Navigate
  setTimeout(() => {
    ws.send(JSON.stringify({
      action: 'navigate',
      params: { url: 'https://example.com' }
    }));
  }, 1000);
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Received:', response);
});
```

**For Python (with websockets library):**
```python
import asyncio
import websockets
import json

async def connect():
    uri = "ws://localhost:3000"
    async with websockets.connect(uri) as websocket:
        # Initialize browser
        await websocket.send(json.dumps({
            "action": "browser_init",
            "params": {}
        }))
        
        response = await websocket.recv()
        print(f"Response: {response}")
        
        # Navigate
        await websocket.send(json.dumps({
            "action": "navigate",
            "params": {"url": "https://example.com"}
        }))
        
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(connect())
```

**For React/Web Apps:**
```javascript
import { useEffect, useState } from 'react';

function BraveBrowserClient() {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3000');
    
    websocket.onopen = () => {
      setStatus('Connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
    };
    
    websocket.onclose = () => {
      setStatus('Disconnected');
    };
    
    return () => websocket.close();
  }, []);

  const initBrowser = () => {
    if (ws) {
      ws.send(JSON.stringify({
        action: 'browser_init',
        params: {}
      }));
    }
  };

  return (
    <div>
      <p>Status: {status}</p>
      <button onClick={initBrowser}>Initialize Browser</button>
    </div>
  );
}
```

#### WebSocket Message Format:

**Request:**
```json
{
  "action": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  },
  "id": "unique-request-id"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "content": "...",
    "status": "completed"
  },
  "id": "unique-request-id"
}
```

#### Advantages of HTTP/WebSocket:

✅ **Universal Compatibility** - Works with ANY IDE or tool  
✅ **No Configuration Needed** - Just connect to endpoint  
✅ **Language Agnostic** - Use any programming language  
✅ **Web-based IDEs** - Perfect for browser-based tools  
✅ **Real-time Updates** - WebSocket provides instant feedback  
✅ **Easy Integration** - Standard HTTP/WebSocket protocols  
✅ **Multiple Clients** - Multiple tools can connect simultaneously  

---

## 🛠️ Features & Tools

### 🌐 Browser Management
- `browser_init` - Initialize Brave browser with anti-detection
- `browser_close` - Close browser instance
- `navigate` - Navigate to URL
- `wait` - Wait for elements/timeout

### 🖱️ Interaction Tools
- `click` - Click on elements
- `type` - Type text into inputs
- `solve_captcha` - Solve CAPTCHA (reCAPTCHA, hCaptcha, Turnstile, etc.)
- `random_scroll` - Human-like scrolling

### 📄 Content Extraction
- `get_content` - Extract page content (HTML/Text/Markdown)
- `find_selector` - Find CSS selectors
- `scrape_table` - Extract table data
- `extract_list` - Extract lists
- `extract_json` - Extract JSON data
- `scrape_meta_tags` - Extract meta information
- `extract_schema` - Extract schema.org data

### 🔍 Advanced Extraction
- `batch_element_scraper` - Scrape multiple elements
- `nested_data_extraction` - Extract nested data structures
- `attribute_harvester` - Extract element attributes
- `image_scraper` - Extract all images
- `link_harvester` - Extract all links
- `media_extractor` - Extract media files
- `video_link_finder` - Find video URLs

### 🤖 AI-Powered Tools
- `smart_selector_generator` - Auto-generate selectors
- `content_classification` - Classify content type
- `sentiment_analysis` - Analyze sentiment
- `summary_generator` - Generate summaries
- `translation_support` - Translate content

### 📊 Data Processing
- `smart_text_cleaner` - Clean extracted text
- `html_to_text` - Convert HTML to text
- `price_parser` - Extract & parse prices
- `date_normalizer` - Normalize dates
- `contact_extractor` - Extract contact info
- `data_deduplication` - Remove duplicates
- `data_type_validator` - Validate data types

### 🔐 CAPTCHA & Security
- `solve_captcha` - Multi-CAPTCHA solver
- `ocr_engine` - OCR for text CAPTCHAs
- `audio_captcha_solver` - Audio CAPTCHA solver
- `puzzle_captcha_handler` - Puzzle CAPTCHA handler

### 📸 Visual Tools
- `full_page_screenshot` - Full page screenshot
- `element_screenshot` - Element screenshot
- `pdf_generation` - Generate PDF
- `video_recording` - Record page video
- `visual_comparison` - Compare screenshots

### 🔄 Pagination & Navigation
- `auto_pagination` - Auto-paginate through pages
- `infinite_scroll` - Handle infinite scroll
- `multi_page_scraper` - Scrape multiple pages
- `sitemap_parser` - Parse sitemaps
- `breadcrumb_navigator` - Navigate breadcrumbs

### 🌐 Session Management
- `cookie_manager` - Manage cookies
- `session_persistence` - Persist sessions
- `form_auto_fill` - Auto-fill forms
- `login_session_manager` - Manage login sessions
- `modal_popup_handler` - Handle popups

### 📈 Monitoring & Reporting
- `progress_tracker` - Track progress
- `error_logger` - Log errors
- `success_rate_reporter` - Report success rates
- `performance_monitor` - Monitor performance
- `monitoring_summary` - Get monitoring summary

---

## 💡 Usage Examples

### Example 1: Simple Web Scraping

```javascript
// Initialize browser
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {}
});

// Navigate to website
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com" }
});

// Get content
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "get_content",
  arguments: { type: "text" }
});
```

### Example 2: Solve CAPTCHA & Extract Data

```javascript
// Navigate to page with CAPTCHA
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com/protected-page" }
});

// Solve CAPTCHA
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "solve_captcha",
  arguments: { type: "recaptcha" }
});

// Extract table data
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "scrape_table",
  arguments: { selector: "table.data" }
});
```

### Example 3: HTTP API Usage

```bash
# Start HTTP server
brave-real-browser-mcp-server@latest --mode http --port 3000
```

```javascript
// Use REST API
const response = await fetch('http://localhost:3000/tools/navigate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

const result = await response.json();
```

---

## 📋 Requirements

- **Node.js** >= 18.0.0
- **Brave Browser** (auto-detected or specify path)
- **Operating System:** Windows, macOS, or Linux

---

## 🔧 Environment Variables

```bash
# Optional: Specify Brave browser path
BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Optional: Run in headless mode
HEADLESS=true

# Optional: Disable content priority
DISABLE_CONTENT_PRIORITY=true
```

---

## 🐛 Troubleshooting

### Brave Browser Not Found

**Solution 1:** Set environment variable
```bash
# Windows
set BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Linux/macOS
export BRAVE_PATH="/usr/bin/brave-browser"
```

**Solution 2:** Specify in browser_init
```javascript
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {
    customConfig: {
      chromePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
    }
  }
});
```

### Server Not Starting

1. Check Node.js version: `node --version` (should be >= 18)
2. Clear npm cache: `npm cache clean --force`
3. Reinstall: `npm install -g brave-real-browser-mcp-server@latest`
4. Check logs in stderr
```

### CAPTCHA Not Solving

1. Wait for CAPTCHA to fully load
2. Use longer timeout: `{ "timeout": 30000 }`
3. Try different CAPTCHA types: `recaptcha`, `hcaptcha`, `turnstile`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🔗 Links

- **GitHub:** https://github.com/withLinda/brave-real-browser-mcp-server
- **NPM:** https://www.npmjs.com/package/brave-real-browser-mcp-server
- **Issues:** https://github.com/withLinda/brave-real-browser-mcp-server/issues

---

<a name="hindi"></a>
# 📖 हिन्दी दस्तावेज़

## 🤖 समर्थित AI IDEs (सार्वभौमिक संगतता)

यह server **स्वचालित रूप से आपके AI IDE को detect करता है और adapt हो जाता है!**

### ✅ पूर्णतः समर्थित और स्वतः-पता लगाना

सभी 15+ AI IDEs स्वचालित रूप से समर्थित हैं। कोई manual configuration की जरूरत नहीं!

---

## 🚀 त्वरित शुरुआत

### इंस्टॉलेशन

```bash
# Global इंस्टॉल करें
npm install -g brave-real-browser-mcp-server@latest

# या npx से चलाएं (बिना installation के)
npx brave-real-browser-mcp-server@latest
```

### उपयोग

```bash
# Auto mode (आपका IDE automatically detect होगा) - डिफ़ॉल्ट
brave-real-browser-mcp-server@latest

# MCP mode (Claude, Cursor, Windsurf आदि के लिए)
brave-real-browser-mcp-server@latest --mode mcp

# HTTP mode (सभी IDEs के साथ काम करता है)
brave-real-browser-mcp-server@latest --mode http --port 3000

# LSP mode (Zed, VSCode आदि के लिए)
brave-real-browser-mcp-server@latest --mode lsp
```

---

## ⚙️ विशिष्ट IDEs के लिए कॉन्फ़िगरेशन

### 1. Claude Desktop

**फ़ाइल:** `claude_desktop_config.json`

**स्थान:**
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

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

### 2. Cursor AI

**फ़ाइल:** `cline_mcp_settings.json`

**स्थान:**
- **Windows:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

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

### 3. HTTP-आधारित IDEs (Qoder AI आदि)

Server को HTTP mode में start करें:

```bash
brave-real-browser-mcp-server@latest --mode http --port 3000
```

फिर REST API endpoint का उपयोग करें: `http://localhost:3000`

---

## 🛠️ सुविधाएँ और उपकरण

### 🌐 ब्राउज़र प्रबंधन
- `browser_init` - Anti-detection के साथ Brave browser शुरू करें
- `browser_close` - Browser बंद करें
- `navigate` - URL पर जाएं
- `wait` - Elements/timeout के लिए प्रतीक्षा करें

### 🖱️ इंटरैक्शन टूल्स
- `click` - Elements पर क्लिक करें
- `type` - Inputs में text टाइप करें
- `solve_captcha` - CAPTCHA हल करें (reCAPTCHA, hCaptcha, आदि)
- `random_scroll` - मानव-जैसे scrolling

### 📄 कंटेंट निष्कर्षण
- `get_content` - Page content निकालें (HTML/Text/Markdown)
- `scrape_table` - Table data निकालें
- `extract_list` - Lists निकालें
- `extract_json` - JSON data निकालें
- `image_scraper` - सभी images निकालें
- `link_harvester` - सभी links निकालें

### 🤖 AI-Powered टूल्स
- `smart_selector_generator` - Selectors auto-generate करें
- `content_classification` - Content type classify करें
- `sentiment_analysis` - Sentiment का विश्लेषण करें
- `summary_generator` - Summaries बनाएं

### 🔐 CAPTCHA और सुरक्षा
- `solve_captcha` - Multi-CAPTCHA solver
- `ocr_engine` - Text CAPTCHAs के लिए OCR
- `audio_captcha_solver` - Audio CAPTCHA solver

---

## 💡 उपयोग उदाहरण

### उदाहरण 1: साधारण Web Scraping

```javascript
// Browser initialize करें
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {}
});

// Website पर जाएं
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com" }
});

// Content प्राप्त करें
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "get_content",
  arguments: { type: "text" }
});
```

---

## 📋 आवश्यकताएं

- **Node.js** >= 18.0.0
- **Brave Browser** (auto-detected या path specify करें)
- **Operating System:** Windows, macOS, या Linux

---

## 🐛 समस्या निवारण

### Brave Browser नहीं मिला

**समाधान:** Environment variable सेट करें
```bash
# Windows
set BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Linux/macOS
export BRAVE_PATH="/usr/bin/brave-browser"
```

### Server शुरू नहीं हो रहा

1. Node.js version check करें: `node --version` (>= 18 होना चाहिए)
2. NPM cache clear करें: `npm cache clean --force`
3. फिर से install करें: `npm install -g brave-real-browser-mcp-server`

---

## 🤝 योगदान

Contributions स्वागत है! कृपया Pull Request submit करें।

---

## 📄 लाइसेंस

यह प्रोजेक्ट MIT License के तहत लाइसेंस प्राप्त है।

---

## 🌟 मुख्य विशेषताएं

✅ **15+ AI IDEs समर्थित** - Claude, Cursor, Windsurf, Cline, Zed, VSCode, Qoder AI, और अधिक  
✅ **Auto-Detection** - आपका IDE automatically detect होता है  
✅ **4 Protocols** - MCP, LSP, HTTP, WebSocket  
✅ **100+ Tools** - Browser automation, scraping, CAPTCHA solving  
✅ **Anti-Detection** - Cloudflare, reCAPTCHA bypass  
✅ **Cross-Platform** - Windows, macOS, Linux  

---

<div align="center">

**Made with ❤️ for the AI Development Community**

[⭐ Star on GitHub](https://github.com/withLinda/brave-real-browser-mcp-server) | [🐛 Report Bug](https://github.com/withLinda/brave-real-browser-mcp-server/issues) | [💡 Request Feature](https://github.com/withLinda/brave-real-browser-mcp-server/issues)

</div>