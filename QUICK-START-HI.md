# 🚀 Quick Start Guide (हिंदी)

## Brave Real Browser MCP Server को 5 मिनट में शुरू करें!

---

## ⚡ तेज़ शुरुआत (सबसे आसान तरीका)

### 1️⃣ Claude Desktop के साथ (Recommended)

**Step 1:** Configuration file खोलें
```
Windows: Win+R → %APPDATA%\Claude\claude_desktop_config.json
Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
```

**Step 2:** यह JSON paste करें
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

**Step 3:** Claude Desktop को restart करें

**Step 4:** Claude में टाइप करें:
```
Please initialize the browser and navigate to example.com
```

✅ **बस! आप तैयार हैं!**

---

## 🌐 HTTP Mode (सभी IDEs के लिए)

### Server शुरू करें (एक Terminal में):
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

### Test करें (दूसरे Terminal में):
```bash
# Health check
curl http://localhost:3000/health

# Tools list देखें
curl http://localhost:3000/tools

# Browser शुरू करें
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d "{\"headless\": false}"
```

---

## 📋 अन्य IDE Configurations

### Cursor AI
**File:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
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

### Windsurf
**File:** `%APPDATA%\Windsurf\mcp.json`
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
**File:** `%APPDATA%\Zed\settings.json`
```json
{
  "lsp": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest", "--mode", "lsp"]
    }
  }
}
```

---

## 🎯 पहले 5 Tools जो आपको जानने चाहिए

### 1. `browser_init` - Browser शुरू करें
```
Claude में कहें: "Browser open करो"
```

### 2. `navigate` - Website पर जाएं
```
Claude में कहें: "Google.com पर जाओ"
```

### 3. `get_content` - Content निकालें
```
Claude में कहें: "इस page की सारी text निकालो"
```

### 4. `click` - Click करें
```
Claude में कहें: "Search button पर click करो"
```

### 5. `type` - Text टाइप करें
```
Claude में कहें: "Search box में 'hello world' type करो"
```

---

## 💡 Quick Examples

### Example 1: Web Scraping
```
Claude से पूछें:
"example.com पर जाओ और title निकालो"
```

### Example 2: Screenshot
```
Claude से पूछें:
"google.com का screenshot लो"
```

### Example 3: Form Fill
```
Claude से पूछें:
"example.com पर जाकर search box में 'test' type करो और submit करो"
```

### Example 4: Table Extract
```
Claude से पूछें:
"इस page की table से सारा data निकालो"
```

### Example 5: Video Links
```
Claude से पूछें:
"इस page से सभी video links निकालो"
```

---

## 🔧 Advanced: Local Installation

अगर आप project को locally build करना चाहते हैं:

```bash
# 1. Repository clone करें
git clone https://github.com/withLinda/brave-real-browser-mcp-server.git
cd brave-real-browser-mcp-server

# 2. Dependencies install करें
npm install

# 3. Build करें
npm run build

# 4. Run करें
npm start

# या HTTP mode में
npm start:http
```

---

## 🆘 समस्याएं?

### ❌ Claude में Tools नहीं दिख रहे?
**समाधान:**
1. Claude को **पूरी तरह** बंद करें (System Tray से भी)
2. Task Manager में check करें - `Claude.exe` running नहीं होना चाहिए
3. Configuration file में JSON syntax check करें
4. Claude फिर से खोलें

### ❌ "Port already in use" Error?
**समाधान:**
```bash
# Different port use करें
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

### ❌ Brave Browser नहीं मिल रहा?
**समाधान:**
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

### ❌ Permission Error?
**समाधान:**
```bash
# Administrator mode में PowerShell खोलें
npm cache clean --force
npm install -g brave-real-browser-mcp-server@latest
```

---

## 📚 111+ Tools Categories

✅ **Browser Management** (2) - Init, Close
✅ **Navigation** (2) - Navigate, Wait
✅ **Interactions** (4) - Click, Type, Scroll, CAPTCHA
✅ **Content Extraction** (10) - Text, HTML, Tables, Lists
✅ **Multi-Element** (8) - Batch scraping, Images, Links
✅ **Advanced Extraction** (10) - XPath, AJAX, API
✅ **Video & Media** (19) - Video links, Download, Extract
✅ **CAPTCHA & Security** (4) - Solve all types
✅ **Data Processing** (9) - Parse, Validate, Clean
✅ **Data Quality** (3) - Outliers, Consistency
✅ **AI-Powered** (5) - Smart selectors, Classification
✅ **Search & Filter** (5) - Keyword, Regex, XPath
✅ **Pagination** (5) - Auto-pagination, Infinite scroll
✅ **Session** (7) - Cookies, Forms, Modals
✅ **Visual** (5) - Screenshots, PDF, Video recording
✅ **Monitoring** (6) - Progress, Errors, Performance

---

## 🎉 अब आप तैयार हैं!

### Next Steps:
1. ✅ Configuration किया
2. ✅ IDE restart किया
3. 💬 अब Claude/IDE में कुछ भी automation task पूछें!

### Helpful Commands:
```bash
# Server info
npx brave-real-browser-mcp-server@latest --help

# HTTP mode
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Check if running
curl http://localhost:3000/health
```

### Documentation:
- 📖 Full Guide: [SETUP-GUIDE-HI.md](./SETUP-GUIDE-HI.md)
- 📖 English README: [README.md](./README.md)
- 🐙 GitHub: https://github.com/withLinda/brave-real-browser-mcp-server

---

## 🌟 Pro Tips

💡 **Tip 1:** Claude को specific instructions दें
```
❌ "Website scrape करो"
✅ "example.com पर जाओ, title निकालो, और screenshot लो"
```

💡 **Tip 2:** HTTP mode किसी भी programming language के साथ काम करता है
```javascript
// JavaScript
fetch('http://localhost:3000/tools/navigate', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://example.com' })
})
```

💡 **Tip 3:** Auto-approve common tools (Cursor में)
```json
"autoApprove": ["browser_init", "navigate", "get_content"]
```

💡 **Tip 4:** Multiple browsers एक साथ run कर सकते हैं
```bash
# Terminal 1
npm start:http -- --port 3000

# Terminal 2
npm start:http -- --port 3001
```

---

**Happy Automating! 🚀**

*Setup में मदद चाहिए? Full guide देखें: [SETUP-GUIDE-HI.md](./SETUP-GUIDE-HI.md)*