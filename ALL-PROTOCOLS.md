# 🌐 All 5 Protocols - Complete Setup Guide

**Brave Real Browser MCP Server** supports 5 protocols. Choose the one that fits your needs:

---

## 📊 Quick Comparison

| Protocol | Best For | Setup Time | Port | Command |
|----------|----------|------------|------|---------|
| **MCP (STDIO)** | AI IDEs (Claude, Cursor, Windsurf) | 2 min | stdio | Auto-start |
| **LSP** | Code editors (Zed, VSCode, Neovim) | 3 min | stdio | Auto-start |
| **HTTP/REST** | Universal API (any language) | 1 min | 3000 | Manual |
| **WebSocket** | Real-time bidirectional | 1 min | 3000 | Auto with HTTP |
| **SSE** | Real-time monitoring/dashboards | 1 min | 3001 | Manual |

---

## 1️⃣ MCP (STDIO) - For AI IDEs

### What is MCP?
Model Context Protocol - The standard way for AI assistants to access tools.

### Supported IDEs
✅ Claude Desktop  
✅ Cursor AI  
✅ Windsurf  
✅ Cline (VSCode Extension)  
✅ Warp Terminal  
✅ Roo Coder

### Setup Steps

#### For Claude Desktop

**Step 1:** Find config file
```bash
# Windows
%APPDATA%\Claude\claude_desktop_config.json

# Mac
~/Library/Application Support/Claude/claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

**Step 2:** Add configuration
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

**Step 3:** Restart Claude Desktop

**Step 4:** Verify - Look for 🔧 tools icon with 111 tools

#### For Cursor AI

**Step 1:** Install Cline extension (if not installed)

**Step 2:** Find config file
```bash
# Windows
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json

# Mac
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Step 3:** Add same configuration as Claude

**Step 4:** Restart Cursor

#### For Windsurf

**Step 1:** Find config file
```bash
# Windows
%APPDATA%\Windsurf\mcp.json

# Mac
~/.windsurf/mcp.json
```

**Step 2:** Add configuration
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

**Step 3:** Restart Windsurf

### Usage Example
```
In Claude/Cursor/Windsurf, type:

"Use browser_init to start the browser, then navigate to https://example.com and get the page content"
```

### Troubleshooting
- Check logs: Claude logs are in `%APPDATA%\Claude\logs\`
- Test manually: `npx -y brave-real-browser-mcp-server@latest`
- Verify Node.js: `node --version` (must be 18+)

---

## 2️⃣ LSP - For Code Editors

### What is LSP?
Language Server Protocol - Provides code intelligence in editors.

### Supported Editors
✅ Zed Editor  
✅ VSCode  
✅ Neovim  
✅ Emacs  
✅ Sublime Text

### Setup Steps

#### For Zed Editor

**Step 1:** Open Zed settings
```bash
# Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
# Type "Open Settings"
```

**Step 2:** Add configuration
```json
{
  "context_servers": {
    "brave-real-browser": {
      "source": "custom",
      "command": "npx.cmd",  // Windows: npx.cmd, Mac/Linux: npx
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

**Step 3:** Restart Zed

**Step 4:** Verify in output panel

### Manual Start (Optional)
```bash
npx brave-real-browser-mcp-server@latest --mode lsp
```

### Features
- ✅ Tool autocomplete
- ✅ Hover documentation
- ✅ Command execution
- ✅ Inline errors

---

## 3️⃣ HTTP/REST - Universal API

### What is HTTP?
Traditional REST API - Works with ANY programming language.

### Supported Languages
✅ JavaScript/Node.js  
✅ Python  
✅ PHP  
✅ Go  
✅ Java  
✅ C#  
✅ Any language with HTTP support

### Setup Steps

**Step 1:** Start HTTP server
```bash
# Default (port 3000)
npx brave-real-browser-mcp-server@latest --mode http

# Custom port
npx brave-real-browser-mcp-server@latest --mode http --port 8080

# Custom host
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 3000
```

**Step 2:** Test server
```bash
# Health check
curl http://localhost:3000/health

# List tools
curl http://localhost:3000/tools
```

**Step 3:** Use API

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/tools` | List all tools |
| POST | `/browser/init` | Initialize browser |
| POST | `/browser/navigate` | Navigate to URL |
| POST | `/browser/click` | Click element |
| POST | `/browser/type` | Type text |
| POST | `/browser/get-content` | Get page content |
| POST | `/browser/close` | Close browser |
| POST | `/tools/:toolName` | Execute any tool |

### Usage Examples

#### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/browser/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const result = await response.json();
```

#### Python
```python
import requests

response = requests.post('http://localhost:3000/browser/init', json={})
result = response.json()
```

#### PHP
```php
$ch = curl_init('http://localhost:3000/browser/init');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = json_decode(curl_exec($ch), true);
```

#### curl
```bash
# Initialize browser
curl -X POST http://localhost:3000/browser/init \
  -H "Content-Type: application/json" \
  -d '{}'

# Navigate
curl -X POST http://localhost:3000/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get content
curl -X POST http://localhost:3000/browser/get-content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'
```

---

## 4️⃣ WebSocket - Real-time Bidirectional

### What is WebSocket?
Two-way real-time communication protocol.

### Supported Platforms
✅ Browser (JavaScript)  
✅ Node.js  
✅ Python  
✅ Any language with WebSocket support

### Setup Steps

**Step 1:** Start HTTP server (WebSocket auto-enabled)
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# WebSocket will be available at: ws://localhost:3000
```

**Step 2:** Connect via WebSocket

### Usage Examples

#### Browser (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('✅ Connected');
  
  // Send command
  ws.send(JSON.stringify({
    id: 1,
    tool: 'browser_init',
    args: {}
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Response:', response);
};
```

#### Node.js
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  ws.send(JSON.stringify({
    id: 1,
    tool: 'navigate',
    args: { url: 'https://example.com' }
  }));
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data));
});
```

#### Python
```python
import asyncio
import websockets
import json

async def automation():
    uri = "ws://localhost:3000"
    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps({
            "id": 1,
            "tool": "browser_init",
            "args": {}
        }))
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(automation())
```

### Message Format

**Request:**
```json
{
  "id": 1,
  "tool": "navigate",
  "args": {
    "url": "https://example.com"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Navigation completed"
      }
    ]
  }
}
```

---

## 5️⃣ SSE - Real-time Monitoring

### What is SSE?
Server-Sent Events - One-way real-time streaming from server to client.

### Supported Platforms
✅ Browser (JavaScript)  
✅ Node.js  
✅ Python  
✅ Any platform with EventSource API

### Setup Steps

**Step 1:** Start SSE server
```bash
# Default (port 3001)
npx brave-real-browser-mcp-server@latest --mode sse

# Custom port
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Custom host
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001 --host 0.0.0.0
```

**Step 2:** Test server
```bash
curl http://localhost:3001/health
```

**Step 3:** Connect to event stream

### Usage Examples

#### Browser (JavaScript)
```javascript
const eventSource = new EventSource('http://localhost:3001/events');

eventSource.onopen = () => {
  console.log('✅ Connected to SSE stream');
};

eventSource.addEventListener('browser_init_success', (event) => {
  const data = JSON.parse(event.data);
  console.log('🎬 Browser initialized:', data);
});

eventSource.addEventListener('tool_success', (event) => {
  const data = JSON.parse(event.data);
  console.log('✅ Tool completed:', data.tool);
});
```

#### Execute tools via HTTP
```bash
# SSE is read-only, execute tools via HTTP
curl -X POST http://localhost:3001/browser/init \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Node.js
```javascript
const EventSource = require('eventsource');
const es = new EventSource('http://localhost:3001/events');

es.addEventListener('tool_success', (event) => {
  const data = JSON.parse(event.data);
  console.log(`✅ ${data.tool} completed`);
});
```

#### Python
```python
from sseclient import SSEClient
import json

messages = SSEClient('http://localhost:3001/events')

for msg in messages:
    if msg.event == 'tool_success':
        data = json.loads(msg.data)
        print(f"✅ {data['tool']} completed")
```

### Event Types

| Event | Description |
|-------|-------------|
| `connected` | Client connected |
| `browser_init_success` | Browser ready |
| `browser_navigate_success` | Navigation completed |
| `tool_start` | Tool execution started |
| `tool_success` | Tool completed |
| `tool_error` | Tool failed |

### SSE API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | SSE event stream |
| GET | `/health` | Health check |
| GET | `/tools` | List all tools |
| POST | `/browser/init` | Initialize browser |
| POST | `/browser/navigate` | Navigate to URL |
| POST | `/browser/close` | Close browser |
| POST | `/tools/:toolName` | Execute any tool |

---

## 📋 All Commands Summary

```bash
# Auto-detect environment
npx brave-real-browser-mcp-server@latest

# MCP mode (for Claude, Cursor, Windsurf)
npx brave-real-browser-mcp-server@latest --mode mcp

# LSP mode (for Zed, VSCode, Neovim)
npx brave-real-browser-mcp-server@latest --mode lsp

# HTTP mode (universal REST API + WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# SSE mode (real-time monitoring)
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# All protocols (HTTP only, others need separate instances)
npx brave-real-browser-mcp-server@latest --mode all
```

---

## 🎯 Which Protocol Should I Use?

### For AI Chat IDEs
→ Use **MCP** (Claude Desktop, Cursor, Windsurf)

### For Code Editors
→ Use **LSP** (Zed, VSCode, Neovim)

### For Custom Apps (any language)
→ Use **HTTP/REST**

### For Real-time Interactive Apps
→ Use **WebSocket**

### For Monitoring/Dashboards
→ Use **SSE**

---

## 🔧 Advanced Configuration

### Run Multiple Protocols Simultaneously

```bash
# Terminal 1: HTTP server
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Terminal 2: SSE server
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001
```

### Custom Brave Path

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

### Headless Mode

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "HEADLESS": "true"
      }
    }
  }
}
```

---

## 📚 Detailed Guides

- 📖 [SSE Complete Guide](./docs/SSE-GUIDE.md) - Full SSE documentation
- 📖 [All Protocols Comparison](./docs/PROTOCOLS.md) - Detailed comparison
- 📖 [Quick Start](./QUICK-START.md) - Fast reference guide
- 📖 [Main README](./README.md) - Complete documentation

---

## ❓ FAQ

**Q: Can I use multiple protocols at once?**  
A: Yes! MCP and LSP use stdio (one at a time), but you can run HTTP and SSE simultaneously in different terminals.

**Q: Which is fastest?**  
A: WebSocket > SSE > HTTP > MCP/LSP (optimized by IDE)

**Q: Which is easiest?**  
A: MCP for AI IDEs (zero setup after config) > HTTP (simple REST) > SSE > WebSocket

**Q: Do I need to install anything?**  
A: No! Use `npx` - it downloads and runs automatically. Only Node.js 18+ is required.

**Q: Does it work offline?**  
A: Browser automation works offline, but npm package download requires internet first time.

---

## 🐛 Troubleshooting

### MCP not working in Claude
1. Check config file path
2. Restart Claude completely
3. Check logs: `%APPDATA%\Claude\logs\`
4. Test manually: `npx -y brave-real-browser-mcp-server@latest`

### HTTP server won't start
1. Check if port is already in use: `netstat -ano | findstr :3000`
2. Try different port: `--port 8080`
3. Check Node.js version: `node --version` (need 18+)

### SSE not connecting
1. Check if server is running: `curl http://localhost:3001/health`
2. Check firewall settings
3. Try different port: `--sse-port 3002`

### Browser not opening
1. Check Brave is installed
2. Set BRAVE_PATH environment variable
3. Check logs for errors

---

## 🎉 Success Checklist

✅ **328 tests passing**  
✅ **5 protocols working**  
✅ **111 tools available**  
✅ **15+ AI IDEs supported**  
✅ **Universal API for all languages**

---

**Need Help?**  
🐛 [Report Issues](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)  
⭐ [Star on GitHub](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server)

---

**Made with ❤️ | 5 Protocols | 111 Tools | 328 Tests Passing**
