# 🚀 Brave Real Browser MCP Server - पूर्ण सेटअप गाइड (हिंदी)

## 📋 विषय-सूची

1. [सिस्टम आवश्यकताएं](#-सिसटम-आवशयकतए)
2. [इंस्टॉलेशन](#-इसटलशन)
3. [IDE कॉन्फ़िगरेशन](#-ide-कनफगरशन)
4. [HTTP/WebSocket मोड](#-httpwebsocket-मड)
5. [टेस्टिंग](#-टसटग)
6. [समस्या निवारण](#-समसय-नवरण)
7. [उदाहरण](#-उदहरण)

---

## 🔧 सिस्टम आवश्यकताएं

### आवश्यक सॉफ्टवेयर:
- ✅ **Node.js** - Version 18.0.0 या उससे ऊपर
- ✅ **npm** - Node.js के साथ आता है
- ✅ **Brave Browser** - (Optional) यदि installed नहीं है तो automatically download होगा

### सिस्टम जांच:

```bash
# Node.js version चेक करें
node --version
# Output: v18.0.0 या उससे ऊपर होना चाहिए

# npm version चेक करें
npm --version
# Output: 9.0.0 या उससे ऊपर
```

---

## 📦 इंस्टॉलेशन

### विधि 1: NPX के साथ (बिना Installation के)

**सबसे आसान तरीका - Recommended!**

```bash
# सीधे चलाएं, कोई installation नहीं चाहिए
npx -y brave-real-browser-mcp-server@latest
```

### विधि 2: Global Installation

```bash
# Global install करें
npm install -g brave-real-browser-mcp-server@latest

# फिर सीधे चला सकते हैं
brave-real-browser-mcp-server
```

### विधि 3: Local Project से

```bash
# Project folder में जाएं
cd C:\Users\Admin\Desktop\Brave-Real-Browser-Mcp-Server-main

# Dependencies install करें
npm install

# Project build करें
npm run build

# Server start करें
npm start
```

---

## 🎯 IDE कॉन्फ़िगरेशन

### 1️⃣ Claude Desktop

**Configuration File Location:**
```
Windows: C:\Users\<YourUsername>\AppData\Roaming\Claude\claude_desktop_config.json
Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
Linux: ~/.config/Claude/claude_desktop_config.json
```

**Configuration:**

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

**Custom Brave Path के साथ:**

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

**Setup Steps:**

1. Claude Desktop बंद करें
2. File Explorer खोलें
3. Address bar में टाइप करें: `%APPDATA%\Claude`
4. `claude_desktop_config.json` file खोलें (या बनाएं)
5. ऊपर दिया गया JSON paste करें
6. File save करें
7. Claude Desktop फिर से खोलें
8. Settings → Tools में "brave-real-browser" दिखना चाहिए

---

### 2️⃣ Cursor AI

**Configuration File Location:**
```
Windows: %APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
Mac: ~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Configuration:**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "disabled": false,
      "autoApprove": ["browser_init", "navigate", "get_content"]
    }
  }
}
```

**Setup Steps:**

1. Cursor AI खोलें
2. Cline extension install करें
3. File Explorer में जाएं: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings`
4. `cline_mcp_settings.json` file बनाएं या edit करें
5. Configuration paste करें
6. Cursor को restart करें

---

### 3️⃣ Windsurf

**Configuration File Location:**
```
Windows: %APPDATA%\Windsurf\mcp.json
Mac: ~/.windsurf/mcp.json
```

**Configuration:**

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

**Setup Steps:**

1. Windsurf बंद करें
2. `%APPDATA%\Windsurf` folder में जाएं
3. `mcp.json` file बनाएं
4. Configuration paste करें
5. Windsurf start करें

---

### 4️⃣ Cline (VSCode Extension)

**Configuration File Location:**
```
Windows: %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
Mac: ~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Configuration:**

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

---

### 5️⃣ Zed Editor

**Configuration File Location:**
```
Windows: %APPDATA%\Zed\settings.json
Mac: ~/.config/zed/settings.json
```

**Configuration (LSP Mode):**

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

## 🌐 HTTP/WebSocket मोड

यह mode **किसी भी IDE या Programming Language** के साथ काम करता है!

### HTTP Server शुरू करें

```bash
# Default port (3000) पर start करें
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Custom port पर start करें
npx brave-real-browser-mcp-server@latest --mode http --port 8080

# Custom host और port
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 9000
```

### Server Output:

```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
💡 [HTTP] WebSocket ready at ws://localhost:3000
📊 [HTTP] Available tools: 111
🔧 [HTTP] Health endpoint: http://localhost:3000/health
📚 [HTTP] Tools list: http://localhost:3000/tools
🌐 [HTTP] Universal mode - works with ALL AI IDEs
```

### API Endpoints:

#### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.12.1",
  "mode": "http"
}
```

#### 2. List All Tools
```bash
curl http://localhost:3000/tools
```

#### 3. Execute Tool
```bash
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d '{
    "headless": false,
    "userAgent": "Mozilla/5.0..."
  }'
```

### WebSocket Connection:

**JavaScript Example:**

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected to Brave MCP Server');
  
  // Tool execute करें
  ws.send(JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'browser_init',
      arguments: {
        headless: false
      }
    }
  }));
});

ws.on('message', (data) => {
  console.log('Response:', data.toString());
});
```

**Python Example:**

```python
import websocket
import json

def on_message(ws, message):
    print(f"Response: {message}")

def on_open(ws):
    print("Connected to Brave MCP Server")
    
    # Tool execute करें
    ws.send(json.dumps({
        "method": "tools/call",
        "params": {
            "name": "browser_init",
            "arguments": {
                "headless": False
            }
        }
    }))

ws = websocket.WebSocketApp(
    "ws://localhost:3000",
    on_open=on_open,
    on_message=on_message
)

ws.run_forever()
```

---

## ✅ टेस्टिंग

### 1. Installation Test करें

```bash
# Server को test करें
npx brave-real-browser-mcp-server@latest --help
```

### 2. HTTP Mode Test करें

```bash
# Terminal 1: Server start करें
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Terminal 2: Health check करें
curl http://localhost:3000/health

# Tools list देखें
curl http://localhost:3000/tools
```

### 3. Browser Test करें

**Test Script बनाएं:** `test-browser.js`

```javascript
import fetch from 'node-fetch';

async function testBrowser() {
  const baseUrl = 'http://localhost:3000';
  
  // 1. Browser initialize करें
  console.log('🔧 Initializing browser...');
  const initResponse = await fetch(`${baseUrl}/tools/browser_init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      headless: false,
      args: ['--start-maximized']
    })
  });
  
  const initResult = await initResponse.json();
  console.log('✅ Browser initialized:', initResult);
  
  // 2. Website पर जाएं
  console.log('🌐 Navigating to website...');
  const navResponse = await fetch(`${baseUrl}/tools/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://example.com',
      waitUntil: 'networkidle2'
    })
  });
  
  const navResult = await navResponse.json();
  console.log('✅ Navigation complete:', navResult);
  
  // 3. Content extract करें
  console.log('📄 Extracting content...');
  const contentResponse = await fetch(`${baseUrl}/tools/get_content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format: 'text'
    })
  });
  
  const content = await contentResponse.json();
  console.log('✅ Content extracted:', content.content.substring(0, 100) + '...');
  
  // 4. Browser close करें
  console.log('🔒 Closing browser...');
  await fetch(`${baseUrl}/tools/browser_close`, {
    method: 'POST'
  });
  
  console.log('✅ Test completed successfully!');
}

testBrowser().catch(console.error);
```

**Test Run करें:**

```bash
# Server start करें (Terminal 1)
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Test चलाएं (Terminal 2)
node test-browser.js
```

---

## 🔍 समस्या निवारण

### समस्या 1: "command not found" या "npx not found"

**समाधान:**
```bash
# Node.js और npm install करें
# Windows: https://nodejs.org/ से download करें
# या Chocolatey से:
choco install nodejs

# Installation verify करें
node --version
npm --version
```

### समस्या 2: "Cannot find module '@modelcontextprotocol/sdk'"

**समाधान:**
```bash
# Dependencies reinstall करें
npm install -g brave-real-browser-mcp-server@latest --force

# या
npm cache clean --force
npm install -g brave-real-browser-mcp-server@latest
```

### समस्या 3: "Port already in use"

**समाधान:**
```bash
# Windows में port kill करें
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# या दूसरा port use करें
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

### समस्या 4: Brave Browser नहीं मिल रहा

**समाधान:**
```bash
# Brave का path manually set करें
set BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe

# या environment variable में add करें
# System Properties → Environment Variables → New
# Variable: BRAVE_PATH
# Value: C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe
```

### समस्या 5: Claude Desktop में Tools नहीं दिख रहे

**समाधान:**
1. Claude Desktop को **completely close** करें (System Tray से भी)
2. Task Manager में check करें कि `Claude.exe` running नहीं है
3. Configuration file को फिर से check करें
4. JSON syntax validate करें: https://jsonlint.com/
5. Claude Desktop फिर से start करें
6. Settings → Developer → View Logs में errors check करें

### समस्या 6: "Permission Denied" Error

**Windows:**
```bash
# Administrator mode में PowerShell खोलें
# फिर install करें
npm install -g brave-real-browser-mcp-server@latest
```

**Linux/Mac:**
```bash
# sudo के साथ install करें
sudo npm install -g brave-real-browser-mcp-server@latest

# या npm prefix change करें
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## 📚 उदाहरण

### उदाहरण 1: Web Scraping

```javascript
// Claude Desktop में पूछें:
"Brave browser use करके example.com की सारी text content निकालो"

// या HTTP API से:
const response = await fetch('http://localhost:3000/tools/get_content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    format: 'text'
  })
});
```

### उदाहरण 2: Form Fill करना

```javascript
// Claude से पूछें:
"example.com पर जाकर search box में 'hello' type करो और search button click करो"

// Steps:
// 1. browser_init - Browser open
// 2. navigate - Website पर जाएं
// 3. type - Input field में text type करें
// 4. click - Button click करें
```

### उदाहरण 3: Screenshot लेना

```javascript
// Claude से पूछें:
"example.com का full page screenshot लो और save करो"

// या HTTP API:
const response = await fetch('http://localhost:3000/tools/full_page_screenshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'screenshot.png'
  })
});
```

### उदाहरण 4: CAPTCHA Solve करना

```javascript
// Claude से पूछें:
"इस website पर जाकर CAPTCHA solve करो"

// या API:
const response = await fetch('http://localhost:3000/tools/solve_captcha', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'recaptcha',
    sitekey: 'your-site-key'
  })
});
```

### उदाहरण 5: Table Data निकालना

```javascript
// Claude से पूछें:
"इस page की table से सारा data निकालो और JSON में return करो"

// या API:
const response = await fetch('http://localhost:3000/tools/scrape_table', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    selector: 'table.data-table'
  })
});
```

---

## 🎓 Advanced Configuration

### Environment Variables:

```bash
# Brave Browser Path
BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe

# Browser Launch Args
BROWSER_ARGS=--start-maximized,--disable-notifications

# Headless Mode
HEADLESS=false

# Default Timeout
TIMEOUT=30000

# User Agent
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### Complete Configuration Example:

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false",
        "TIMEOUT": "60000",
        "BROWSER_ARGS": "--start-maximized,--disable-notifications,--disable-popup-blocking"
      },
      "disabled": false,
      "alwaysAllow": ["browser_init", "navigate", "get_content", "click", "type"]
    }
  }
}
```

---

## 🚀 Quick Start Commands

```bash
# Global install
npm install -g brave-real-browser-mcp-server@latest

# MCP Mode (for Claude Desktop)
npx -y brave-real-browser-mcp-server@latest

# HTTP Mode
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# LSP Mode (for Zed Editor)
npx brave-real-browser-mcp-server@latest --mode lsp

# All Modes (Universal)
npx brave-real-browser-mcp-server@latest --mode all

# With custom Brave path
BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" npx brave-real-browser-mcp-server@latest

# With debug logs
DEBUG=* npx brave-real-browser-mcp-server@latest --mode http
```

---

## 📞 Support और Help

### Documentation:
- GitHub: https://github.com/withLinda/brave-real-browser-mcp-server
- README: [README.md](./README.md)

### Issue Report करें:
- GitHub Issues: https://github.com/withLinda/brave-real-browser-mcp-server/issues

### Community:
- Discussions: GitHub Discussions

---

## 🎉 सफलता! Setup Complete!

अब आप Brave Real Browser MCP Server का उपयोग कर सकते हैं:

✅ **111+ Automation Tools** ready
✅ **15+ AI IDEs** supported
✅ **Browser Automation** enabled
✅ **Web Scraping** ready
✅ **CAPTCHA Solving** available

**अगला कदम:** अपने AI IDE में tools को try करें!

---

## 📖 Additional Resources

### All Available Tools (111+):
- Browser Management (2)
- Navigation (2)
- Interactions (4)
- Content Extraction (10)
- Multi-Element Extraction (8)
- Advanced Extraction (10)
- Video & Media Tools (19)
- CAPTCHA & Security (4)
- Data Processing (9)
- Data Quality (3)
- AI-Powered Tools (5)
- Search & Filter (5)
- Pagination (5)
- Session Management (7)
- Visual Tools (5)
- Monitoring (6)
- API Integration (3)
- Advanced Extraction (5)

### Example Prompts for Claude:

```
"Brave browser open करके google.com पर जाओ"

"example.com की सारी images download करो"

"इस website का full page screenshot लो"

"Table से data निकालो और CSV में save करो"

"CAPTCHA solve करके form submit करो"

"Video download link ढूंढो"

"सभी product prices निकालो"

"Page को markdown format में save करो"
```

---

**🙏 धन्यवाद! Happy Automating!** 🚀