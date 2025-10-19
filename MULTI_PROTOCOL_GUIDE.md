# Multi-Protocol Support Guide

यह server अब **तीन protocols** को support करता है:
1. ✅ **MCP** - Claude Desktop, Cursor, Warp के लिए
2. ✅ **HTTP/WebSocket** - किसी भी HTTP client के लिए
3. ✅ **LSP** - Zed AI IDE, VSCode और अन्य LSP-compatible editors के लिए

---

## 🎯 Quick Start

### MCP Mode (Default)
```bash
# Claude Desktop/Cursor/Warp के लिए
npm start
# या
npx brave-real-browser-mcp-server
```

### HTTP/WebSocket Mode
```bash
# HTTP REST API + WebSocket server
npm run start:http
# या
npx brave-real-browser-mcp-server --mode http --port 3000
```

### LSP Mode (Zed AI IDE)
```bash
# Language Server Protocol mode
npm run start:lsp
# या
npx brave-real-browser-mcp-server --mode lsp
```

---

## 🔵 1. MCP Protocol Setup

### Claude Desktop
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

**Config Location:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### Cursor IDE
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

**Config Location:** `.cursor/mcp.json` या `~/.cursor/mcp.json`

---

## 🟢 2. HTTP/WebSocket API Setup

### Start Server
```bash
npx brave-real-browser-mcp-server --mode http --port 3000
```

### REST API Endpoints

#### Health Check
```bash
GET http://localhost:3000/health
```

#### List Tools
```bash
GET http://localhost:3000/tools
```

#### Initialize Browser
```bash
POST http://localhost:3000/browser/init
Content-Type: application/json

{
  "headless": false
}
```

#### Navigate
```bash
POST http://localhost:3000/browser/navigate
Content-Type: application/json

{
  "url": "https://example.com"
}
```

#### Click Element
```bash
POST http://localhost:3000/browser/click
Content-Type: application/json

{
  "selector": "button.submit"
}
```

#### Get Page Content
```bash
POST http://localhost:3000/browser/get-content
Content-Type: application/json

{
  "type": "text"
}
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  // Send command
  ws.send(JSON.stringify({
    id: 'unique-request-id',
    tool: 'browser_init',
    args: { headless: false }
  }));
};

ws.onmessage = (event) => {
  const result = JSON.parse(event.data);
  console.log('Result:', result);
};
```

### Example: Python Client
```python
import requests

# Initialize browser
response = requests.post('http://localhost:3000/browser/init', 
    json={'headless': False})
print(response.json())

# Navigate to website
response = requests.post('http://localhost:3000/browser/navigate',
    json={'url': 'https://google.com'})
print(response.json())

# Get content
response = requests.post('http://localhost:3000/browser/get-content',
    json={'type': 'text'})
print(response.json())
```

### Example: Node.js Client
```javascript
const axios = require('axios');

async function automateExample() {
  const baseUrl = 'http://localhost:3000';
  
  // Initialize browser
  await axios.post(`${baseUrl}/browser/init`, {
    headless: false
  });
  
  // Navigate
  await axios.post(`${baseUrl}/browser/navigate`, {
    url: 'https://google.com'
  });
  
  // Get content
  const content = await axios.post(`${baseUrl}/browser/get-content`, {
    type: 'text'
  });
  
  console.log(content.data);
}

automateExample();
```

---

## 🟣 3. LSP Protocol Setup (Zed AI IDE)

### Zed AI IDE Configuration

1. **Zed Settings Location:**
   - Mac/Linux: `~/.config/zed/settings.json`
   - Windows: `%APPDATA%\Zed\settings.json`

2. **Add LSP Configuration:**
```json
{
  "lsp": {
    "brave-browser-automation": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest", "--mode", "lsp"],
      "settings": {}
    }
  }
}
```

3. **Restart Zed IDE**

### VSCode Configuration

**.vscode/settings.json:**
```json
{
  "brave-browser-automation.serverPath": "npx",
  "brave-browser-automation.serverArgs": [
    "brave-real-browser-mcp-server@latest",
    "--mode",
    "lsp"
  ]
}
```

### Neovim Configuration

**init.lua:**
```lua
require'lspconfig'.brave_browser_automation.setup{
  cmd = { "npx", "brave-real-browser-mcp-server@latest", "--mode", "lsp" },
  filetypes = { "javascript", "typescript", "python" },
}
```

### LSP Features

1. **Autocompletion**: Browser automation commands की auto-completion
2. **Hover Information**: Tool documentation hover पर
3. **Execute Commands**: Browser commands को directly execute करें

### LSP Commands

LSP mode में आप ये commands use कर सकते हैं:
- `browser.browser_init` - Browser initialize करें
- `browser.navigate` - URL पर navigate करें
- `browser.click` - Element पर click करें
- `browser.type` - Text type करें
- `browser.get_content` - Page content प्राप्त करें

---

## 🌈 All Modes (HTTP Only)

```bash
npx brave-real-browser-mcp-server --mode all
```

**Note:** MCP और LSP दोनों stdio/IPC use करते हैं, इसलिए simultaneously नहीं चल सकते। `all` mode में सिर्फ HTTP/WebSocket active होता है।

---

## 📋 CLI Options

```bash
brave-real-browser-mcp-server [options]

Options:
  --mode, -m <mode>       Protocol: mcp | http | lsp | all (default: mcp)
  --port, -p <port>       HTTP server port (default: 3000)
  --host, -h <host>       HTTP server host (default: 0.0.0.0)
  --no-websocket          WebSocket को disable करें
  --help                  Help message दिखाएं
```

---

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Run in Dev Mode

```bash
# MCP mode
npm run dev

# HTTP mode
npm run dev:http

# LSP mode
npm run dev:lsp
```

---

## 📊 Protocol Comparison

| Feature | MCP | HTTP/WebSocket | LSP |
|---------|-----|----------------|-----|
| **Best For** | Claude, Cursor, Warp | Any HTTP client | Zed, VSCode, Neovim |
| **Transport** | stdio | HTTP/WebSocket | stdio/IPC |
| **Setup Complexity** | Medium | Easy | Medium |
| **Programming Language** | Any | Any | Any |
| **Real-time Updates** | ✅ | ✅ (WebSocket) | ✅ |
| **REST API** | ❌ | ✅ | ❌ |
| **IDE Integration** | Limited | Custom | Native |
| **Autocomplete** | ❌ | ❌ | ✅ |

---

## 🎯 Zed AI IDE Complete Setup Example

### Step 1: Install Node.js
```bash
# Ensure Node.js 18+ is installed
node --version
```

### Step 2: Configure Zed
**~/.config/zed/settings.json:**
```json
{
  "lsp": {
    "brave-browser-automation": {
      "command": "npx",
      "args": [
        "brave-real-browser-mcp-server@latest",
        "--mode",
        "lsp"
      ],
      "settings": {}
    }
  }
}
```

### Step 3: Restart Zed

### Step 4: Test
Create a test file और LSP commands test करें।

---

## 🐛 Troubleshooting

### HTTP Mode Issues

**Port already in use:**
```bash
npx brave-real-browser-mcp-server --mode http --port 3001
```

**CORS errors:**
Server automatically CORS headers add करता है। अगर फिर भी issue है, तो check करें कि origin सही है।

### LSP Mode Issues

**Zed में server नहीं दिख रहा:**
1. Zed को completely restart करें
2. Config file का path check करें
3. npx command manually terminal में test करें:
   ```bash
   npx brave-real-browser-mcp-server@latest --mode lsp
   ```

**Command execution fail हो रहा:**
- Ensure browser initialized है
- Server logs check करें

---

## 📚 Examples Repository

More examples देखने के लिए:
- [HTTP Client Examples](./examples/http/)
- [WebSocket Client Examples](./examples/websocket/)
- [LSP Configuration Examples](./examples/lsp/)

---

## 🤝 Contributing

Multi-protocol support को improve करने के लिए contributions welcome हैं!

---

## 📄 License

MIT License - [LICENSE](./LICENSE)
