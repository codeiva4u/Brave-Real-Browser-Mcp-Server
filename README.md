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
npm install -g brave-real-browser-mcp-server

# Or use with npx (no installation needed)
npx brave-real-browser-mcp-server
```

### Usage

```bash
# Auto mode (automatically detects your IDE) - DEFAULT
brave-real-browser-mcp-server

# Or explicitly specify protocol
brave-real-browser-mcp-server --mode auto

# MCP mode (for Claude, Cursor, Windsurf, etc.)
brave-real-browser-mcp-server --mode mcp

# HTTP mode (universal - works with ALL IDEs)
brave-real-browser-mcp-server --mode http --port 3000

# LSP mode (for Zed, VSCode, etc.)
brave-real-browser-mcp-server --mode lsp
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
    "brave-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
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
    "brave-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"],
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
    "brave-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
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
    "brave-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
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
    "brave-browser": {
      "command": "brave-real-browser-mcp-server",
      "args": ["--mode", "lsp"]
    }
  }
}
```

### 6. Qoder AI & Other HTTP-based IDEs

Start the server in HTTP mode:

```bash
brave-real-browser-mcp-server --mode http --port 3000
```

Then use the REST API endpoint: `http://localhost:3000`

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
  server_name: "brave-browser",
  tool_name: "browser_init",
  arguments: {}
});

// Navigate to website
await use_mcp_tool({
  server_name: "brave-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com" }
});

// Get content
await use_mcp_tool({
  server_name: "brave-browser",
  tool_name: "get_content",
  arguments: { type: "text" }
});
```

### Example 2: Solve CAPTCHA & Extract Data

```javascript
// Navigate to page with CAPTCHA
await use_mcp_tool({
  server_name: "brave-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com/protected-page" }
});

// Solve CAPTCHA
await use_mcp_tool({
  server_name: "brave-browser",
  tool_name: "solve_captcha",
  arguments: { type: "recaptcha" }
});

// Extract table data
await use_mcp_tool({
  server_name: "brave-browser",
  tool_name: "scrape_table",
  arguments: { selector: "table.data" }
});
```

### Example 3: HTTP API Usage

```bash
# Start HTTP server
brave-real-browser-mcp-server --mode http --port 3000
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
  server_name: "brave-browser",
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
3. Reinstall: `npm install -g brave-real-browser-mcp-server`
4. Check logs in stderr

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
npm install -g brave-real-browser-mcp-server

# या npx से चलाएं (बिना installation के)
npx brave-real-browser-mcp-server
```

### उपयोग

```bash
# Auto mode (आपका IDE automatically detect होगा) - डिफ़ॉल्ट
brave-real-browser-mcp-server

# MCP mode (Claude, Cursor, Windsurf आदि के लिए)
brave-real-browser-mcp-server --mode mcp

# HTTP mode (सभी IDEs के साथ काम करता है)
brave-real-browser-mcp-server --mode http --port 3000

# LSP mode (Zed, VSCode आदि के लिए)
brave-real-browser-mcp-server --mode lsp
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
    "brave-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
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
    "brave-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

### 3. HTTP-आधारित IDEs (Qoder AI आदि)

Server को HTTP mode में start करें:

```bash
brave-real-browser-mcp-server --mode http --port 3000
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
  server_name: "brave-browser",
  tool_name: "browser_init",
  arguments: {}
});

// Website पर जाएं
await use_mcp_tool({
  server_name: "brave-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com" }
});

// Content प्राप्त करें
await use_mcp_tool({
  server_name: "brave-browser",
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