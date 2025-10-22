# 🧪 सभी AI IDEs के लिए Complete Testing Guide

## 📋 सभी Supported IDEs की सूची (15+)

यह guide आपको हर एक AI IDE के साथ Brave Real Browser MCP Server को test करने में मदद करेगी।

---

## ✅ Supported IDEs की पूरी List

### Tier 1: Native MCP Support (बिना Extension)
1. ✅ **Claude Desktop** - Anthropic (Best Integration)
2. ✅ **Windsurf** - Codeium (Native MCP)
3. ✅ **Zed Editor** - Zed Industries (LSP Mode)

### Tier 2: MCP via Extensions
4. ✅ **Cursor AI** - Anysphere (via Cline)
5. ✅ **VSCode** - Microsoft (via Cline Extension)
6. ✅ **VSCodium** - Community (via Cline Extension)

### Tier 3: HTTP/WebSocket Mode (Universal)
7. ✅ **Qoder AI** - HTTP Mode
8. ✅ **Continue.dev** - HTTP Mode
9. ✅ **Tabnine** - HTTP Mode
10. ✅ **GitHub Copilot** - HTTP Mode
11. ✅ **Cody** - Sourcegraph (HTTP Mode)
12. ✅ **Warp Terminal** - HTTP Mode
13. ✅ **Roo Coder** - HTTP Mode
14. ✅ **JetBrains IDEs** - HTTP Mode
15. ✅ **Any Custom IDE** - HTTP/WebSocket API

---

## 🎯 Testing करने से पहले

### आवश्यक Requirements:
```bash
# 1. Node.js Version Check
node --version
# Output: v18.0.0 या उससे ऊपर होना चाहिए

# 2. npm Version Check
npm --version
# Output: 9.0.0 या उससे ऊपर

# 3. Server Test
npx brave-real-browser-mcp-server@latest --help
# यह command बिना error के run होना चाहिए
```

---

## 1️⃣ Claude Desktop - Testing

### Status: ✅ सबसे बेहतर Support

### Configuration File Location:
```
Windows: %APPDATA%\Claude\claude_desktop_config.json
Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
Linux: ~/.config/Claude/claude_desktop_config.json
```

### Configuration:
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

### Setup Steps:
1. Claude Desktop को **पूरी तरह** बंद करें (System Tray से भी)
2. Task Manager में check करें - `Claude.exe` running नहीं होना चाहिए
3. `Win+R` दबाएं और type करें: `%APPDATA%\Claude`
4. `claude_desktop_config.json` file बनाएं या edit करें
5. ऊपर दिया गया JSON paste करें
6. File save करें (Ctrl+S)
7. Claude Desktop फिर से खोलें

### Verification Steps:
```
✅ Step 1: Claude खोलें
✅ Step 2: Settings → Developer → View MCP Servers
✅ Step 3: "brave-real-browser" listed होना चाहिए
✅ Step 4: Status: "Connected" या green indicator
✅ Step 5: Tools count: 110+
```

### Test Commands:
```
Test 1: "Initialize the browser and navigate to example.com"
Test 2: "Get the page title"
Test 3: "Take a screenshot of the page"
Test 4: "Extract all links from the page"
Test 5: "Close the browser"
```

### Expected Results:
- Browser automatically open होगा
- Example.com load होगा
- Title extract होगा
- Screenshot save होगा
- Links list में return होंगे
- Browser close होगा

### Common Issues:
| Problem | Solution |
|---------|----------|
| Tools नहीं दिख रहे | Claude को restart करें, JSON syntax check करें |
| Connection failed | Node.js install check करें |
| Server not responding | npx command manually test करें |

---

## 2️⃣ Cursor AI - Testing

### Status: ✅ Excellent Support (via Cline)

### Prerequisites:
1. Cursor AI install करें: https://cursor.sh
2. Cline extension install करें

### Configuration File Location:
```
Windows: %APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
Mac: ~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

### Configuration:
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "disabled": false,
      "autoApprove": [
        "browser_init",
        "navigate",
        "get_content",
        "wait",
        "browser_close"
      ]
    }
  }
}
```

### Setup Steps:
1. Cursor AI खोलें
2. Extensions (Ctrl+Shift+X) में जाएं
3. "Cline" search करें और install करें
4. Cursor को पूरी तरह बंद करें
5. Config file location पर जाएं
6. `cline_mcp_settings.json` बनाएं/edit करें
7. Configuration paste करें
8. Save करें और Cursor restart करें
9. Cline panel खोलें (Ctrl+Shift+P → "Cline: Open")

### Verification Steps:
```
✅ Step 1: Cursor में Cline panel खोलें
✅ Step 2: Cline settings gear icon click करें
✅ Step 3: "MCP Settings" tab में जाएं
✅ Step 4: "brave-real-browser" listed होना चाहिए
✅ Step 5: Status "Connected" होना चाहिए
```

### Test Commands (Cline panel में):
```
Test 1: "Initialize browser and go to google.com"
Test 2: "Get all headings from the page"
Test 3: "Take a screenshot"
Test 4: "Extract meta tags"
Test 5: "Close browser"
```

### Special Features:
- **autoApprove**: Listed tools automatically approve होंगे
- **disabled**: true/false - server को toggle करें

---

## 3️⃣ Windsurf - Testing

### Status: ✅ Native MCP Support

### Configuration File Location:
```
Windows: %APPDATA%\Windsurf\mcp.json
Mac: ~/.windsurf/mcp.json
```

### Configuration:
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

### Setup Steps:
1. Windsurf को बंद करें
2. Config folder खोलें: `%APPDATA%\Windsurf`
3. `mcp.json` file बनाएं
4. Configuration paste करें
5. Save करें
6. Windsurf start करें
7. AI panel खोलें

### Verification Steps:
```
✅ Step 1: Status bar में MCP indicator देखें
✅ Step 2: AI chat panel खोलें
✅ Step 3: "@brave-real-browser" type करके autocomplete check करें
✅ Step 4: Connection status green होना चाहिए
```

### Test Commands:
```
Test 1: "@brave-real-browser initialize browser"
Test 2: "Navigate to example.com"
Test 3: "Get page content"
Test 4: "Take screenshot"
```

---

## 4️⃣ Cline (VSCode) - Testing

### Status: ✅ Full Support

### Prerequisites:
1. VSCode install करें
2. Cline extension install करें (saoudrizwan.claude-dev)

### Configuration File Location:
```
Windows: %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
Mac: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

### Configuration:
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

### Setup Steps:
1. VSCode खोलें
2. Ctrl+Shift+X → "Cline" search → Install
3. VSCode close करें
4. Config file location पर जाएं
5. Configuration add करें
6. VSCode restart करें
7. Cline panel खोलें

### Test Commands:
Same as Cursor AI (दोनों Cline extension use करते हैं)

---

## 5️⃣ Zed Editor - Testing

### Status: ✅ LSP Mode Support

### Configuration File Location:
```
Windows: %APPDATA%\Zed\settings.json
Mac: ~/.config/zed/settings.json
```

### Configuration (⚠️ LSP Mode Required):
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

### ⚠️ महत्वपूर्ण:
- **MUST use `--mode lsp` argument**
- बिना LSP mode के काम नहीं करेगा

### Setup Steps:
1. Zed Editor बंद करें
2. `%APPDATA%\Zed` folder खोलें
3. `settings.json` edit करें
4. LSP configuration add करें
5. **`--mode lsp`** argument जरूर add करें
6. Save और restart करें

### Verification:
```
✅ Step 1: Status bar में LSP indicator देखें
✅ Step 2: "brave-real-browser" LSP server running होना चाहिए
✅ Step 3: Command palette से LSP features accessible होने चाहिए
```

---

## 6️⃣ - 15️⃣ HTTP Mode IDEs - Universal Testing

### सभी बाकी IDEs के लिए HTTP/WebSocket Mode

ये IDEs HTTP mode का उपयोग करते हैं:
- Qoder AI
- Continue.dev
- Tabnine
- GitHub Copilot
- Cody (Sourcegraph)
- Warp Terminal
- Roo Coder
- JetBrains IDEs (IntelliJ, PyCharm, WebStorm, etc.)
- Any Custom IDE/Tool

### HTTP Server शुरू करें:

#### Method 1: NPX (Recommended)
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

#### Method 2: Local Installation
```bash
cd C:\Users\Admin\Desktop\Brave-Real-Browser-Mcp-Server-main
npm start:http
```

#### Method 3: Custom Port
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 8080 --host 0.0.0.0
```

### Server Output (Expected):
```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
💡 [HTTP] WebSocket ready at ws://localhost:3000
📊 [HTTP] Available tools: 111
🔧 [HTTP] Health endpoint: http://localhost:3000/health
📚 [HTTP] Tools list: http://localhost:3000/tools
```

### Verification Tests:

#### Test 1: Health Check
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.12.1",
  "mode": "http",
  "tools": 111
}
```

#### Test 2: List All Tools
```bash
curl http://localhost:3000/tools
```

**Expected Response:**
```json
{
  "tools": [
    "browser_init",
    "navigate",
    "get_content",
    "click",
    "type",
    ...
  ],
  "count": 111
}
```

#### Test 3: Initialize Browser
```bash
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d "{\"headless\": false}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Browser initialized successfully",
  "sessionId": "xxx-xxx-xxx"
}
```

#### Test 4: Navigate to URL
```bash
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://example.com\"}"
```

#### Test 5: Get Content
```bash
curl -X POST http://localhost:3000/tools/get_content \
  -H "Content-Type: application/json" \
  -d "{\"format\": \"text\"}"
```

#### Test 6: Take Screenshot
```bash
curl -X POST http://localhost:3000/tools/full_page_screenshot \
  -H "Content-Type: application/json" \
  -d "{\"path\": \"screenshot.png\"}"
```

#### Test 7: Close Browser
```bash
curl -X POST http://localhost:3000/tools/browser_close
```

---

## 🔧 IDE-Specific HTTP Integration

### Qoder AI
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

### Continue.dev
```json
{
  "mcpServers": [
    {
      "name": "brave-real-browser",
      "url": "http://localhost:3000",
      "type": "http"
    }
  ]
}
```

### Warp Terminal
```bash
# .warp/config.json
{
  "integrations": {
    "brave-automation": "http://localhost:3000"
  }
}
```

---

## 📊 Complete Testing Checklist

### Pre-Testing Checklist:
- [ ] Node.js 18.0.0+ installed
- [ ] npm working properly
- [ ] Server can start without errors
- [ ] Network/firewall not blocking

### For MCP Mode IDEs (Claude, Cursor, Windsurf, VSCode):
- [ ] Configuration file created
- [ ] JSON syntax validated
- [ ] IDE completely restarted
- [ ] MCP server listed in IDE
- [ ] Connection status is green/connected
- [ ] Tools count shows 110+
- [ ] Test command executed successfully

### For LSP Mode (Zed):
- [ ] Configuration includes --mode lsp
- [ ] LSP server appears in status bar
- [ ] Server status is "Running"
- [ ] Test command works

### For HTTP Mode (Universal):
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Tools list endpoint works
- [ ] Browser init successful
- [ ] Navigate works
- [ ] Content extraction works
- [ ] Screenshot works
- [ ] Browser close works

---

## 🧪 Standard Test Suite (सभी IDEs के लिए)

### Basic Test Suite:
```
1. Initialize browser
2. Navigate to example.com
3. Get page title
4. Take screenshot
5. Close browser
```

### Intermediate Test Suite:
```
1. Initialize browser (headless: false)
2. Navigate to google.com
3. Type in search box: "brave browser"
4. Click search button
5. Wait for results
6. Get all links
7. Take screenshot
8. Close browser
```

### Advanced Test Suite:
```
1. Initialize browser
2. Navigate to complex website
3. Scrape table data
4. Extract all images
5. Get meta tags
6. Save content as markdown
7. Extract schema.org data
8. Take full page screenshot
9. Close browser
```

---

## 🆘 Common Issues और Solutions

### Issue 1: "Command not found" या "npx not found"
**Solution:**
```bash
# Node.js reinstall करें
# Windows: https://nodejs.org/ से download
# Verify installation
node --version
npm --version
npx --version
```

### Issue 2: Port already in use
**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# या different port use करें
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

### Issue 3: Tools नहीं दिख रहे (MCP Mode)
**Solution:**
1. IDE को **completely** close करें
2. Task Manager में process kill करें
3. JSON syntax validate करें (jsonlint.com)
4. Configuration file path verify करें
5. IDE logs check करें
6. IDE restart करें

### Issue 4: Connection timeout (HTTP Mode)
**Solution:**
```bash
# Firewall check करें
# Antivirus temporarily disable करें
# Different port try करें
# Server logs check करें
```

### Issue 5: Brave Browser not found
**Solution:**
```json
{
  "env": {
    "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}
```

### Issue 6: Permission denied
**Solution:**
```bash
# Administrator mode में run करें
# npm cache clean करें
npm cache clean --force
npm install -g brave-real-browser-mcp-server@latest
```

---

## 📈 Performance Testing

### Test Server Performance:
```bash
# Test 1: Health check response time
time curl http://localhost:3000/health

# Test 2: Tools list response time
time curl http://localhost:3000/tools

# Test 3: Browser init time
time curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d '{"headless": true}'
```

### Expected Performance:
- Health check: < 50ms
- Tools list: < 100ms
- Browser init: 2-3 seconds
- Navigate: 1-2 seconds
- Screenshot: < 1 second
- Content extract: < 500ms

---

## 🎯 IDE Comparison Matrix

| IDE | Protocol | Setup Difficulty | Performance | Extensions Needed | Rating |
|-----|----------|------------------|-------------|-------------------|--------|
| Claude Desktop | MCP | ⭐ Easy | ⚡⚡⚡ Fast | ❌ No | ⭐⭐⭐⭐⭐ |
| Windsurf | MCP | ⭐ Easy | ⚡⚡⚡ Fast | ❌ No | ⭐⭐⭐⭐⭐ |
| Cursor AI | MCP | ⭐⭐ Medium | ⚡⚡⚡ Fast | ✅ Cline | ⭐⭐⭐⭐⭐ |
| VSCode | MCP | ⭐⭐ Medium | ⚡⚡ Good | ✅ Cline | ⭐⭐⭐⭐ |
| Zed | LSP | ⭐⭐ Medium | ⚡⚡⚡ Fast | ❌ No | ⭐⭐⭐⭐ |
| Qoder AI | HTTP | ⭐ Easy | ⚡⚡ Good | ❌ No | ⭐⭐⭐⭐ |
| Continue.dev | HTTP | ⭐ Easy | ⚡⚡ Good | ❌ No | ⭐⭐⭐ |
| Others | HTTP | ⭐ Easy | ⚡⚡ Good | ❌ No | ⭐⭐⭐ |

---

## 🎓 Best Practices

### For Best Results:
1. ✅ हमेशा latest version use करें
2. ✅ Configuration file का backup रखें
3. ✅ JSON syntax validate करें
4. ✅ Logs regularly check करें
5. ✅ IDE को properly restart करें
6. ✅ Test suite regularly run करें
7. ✅ Documentation up-to-date रखें

### For Optimal Performance:
1. ⚡ Headless mode use करें जब UI की जरूरत न हो
2. ⚡ Auto-approve safe tools (MCP mode में)
3. ⚡ Browser sessions properly close करें
4. ⚡ Concurrent operations limit करें
5. ⚡ Cache और cookies manage करें

---

## 📞 Support और Help

### Documentation:
- 📖 Setup Guide: SETUP-GUIDE-HI.md
- 📖 Quick Start: QUICK-START-HI.md
- 📖 Complete Reference: SETUP-COMPLETE-HI.md

### Online Resources:
- 🐙 GitHub: https://github.com/withLinda/brave-real-browser-mcp-server
- 📚 Issues: GitHub Issues page
- 💬 Discussions: GitHub Discussions

---

## ✅ Final Testing Checklist

### Before Deployment:
- [ ] सभी configurations test किए
- [ ] कम से कम 3 IDEs में successfully काम कर रहा है
- [ ] All basic tests pass हो रहे हैं
- [ ] Performance acceptable है
- [ ] Error handling काम कर रहा है
- [ ] Logs properly generate हो रहे हैं
- [ ] Documentation complete है

---

## 🎉 Conclusion

इस guide से आप सभी 15+ AI IDEs के साथ Brave Real Browser MCP Server को successfully setup और test कर सकते हैं।

### Quick Summary:
- **Tier 1 (Best):** Claude Desktop, Windsurf
- **Tier 2 (Excellent):** Cursor, VSCode, Zed
- **Tier 3 (Universal):** सभी अन्य IDEs (HTTP mode)

### Recommendation:
- **Beginners:** Claude Desktop use करें
- **Developers:** Cursor या VSCode use करें
- **Custom Tools:** HTTP mode use करें

---

**Happy Testing! 🚀**

*Last Updated: 2024*
*Version: 2.12.1*
*Status: ✅ Production Ready*