# 🌐 All Protocol Modes - Complete Guide

## Quick Protocol Selection

| Protocol | Best For | Setup Time | Command |
|----------|----------|------------|---------|
| **MCP (STDIO)** | Claude, Cursor, Windsurf | 2 min | Auto-start via config |
| **LSP** | Zed, VSCode, Neovim | 3 min | Auto-start via config |
| **HTTP/REST** | Any tool, custom apps | 1 min | `--mode http` |
| **WebSocket** | Real-time bidirectional | 1 min | `--mode http` (included) |
| **SSE** | Monitoring, dashboards | 1 min | `--mode sse` |

---

## 1️⃣ MCP (STDIO) - For AI IDEs

### What is MCP?

Model Context Protocol - Standard for AI assistants to access tools.

### Supported IDEs

✅ Claude Desktop  
✅ Cursor AI  
✅ Windsurf  
✅ Cline (VSCode)  
✅ Warp Terminal  
✅ Roo Coder

### Setup (Step-by-Step)

#### For Claude Desktop

**Step 1:** Find config file
```bash
# Windows
%APPDATA%\Claude\claude_desktop_config.json

# Mac
~/Library/Application Support/Claude/claude_desktop_config.json
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

**Step 4:** Verify - Look for 🔧 tools icon

#### For Cursor AI

**Step 1:** Install Cline extension

**Step 2:** Find config file
```bash
# Windows
%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Step 3:** Add same configuration as Claude

**Step 4:** Restart Cursor

#### For Windsurf

**Step 1:** Find config file
```bash
# Windows
%APPDATA%\Windsurf\mcp.json
```

**Step 2:** Add configuration

**Step 3:** Restart Windsurf

### Usage Example

```
In Claude/Cursor/Windsurf, type:

"Use browser_init to start the browser, then navigate to https://example.com and get the page content"
```

---

## 2️⃣ LSP - For Code Editors

### What is LSP?

Language Server Protocol - Code editor integration with autocomplete & hover info.

### Supported Editors

✅ Zed Editor  
✅ VSCode  
✅ Neovim  
✅ Emacs  
✅ Sublime Text

### Setup (Step-by-Step)

#### For Zed Editor

**Step 1:** Open Zed settings (`Ctrl+Shift+P` → "Open Settings")

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

### Commands

```bash
# Start LSP server
npx brave-real-browser-mcp-server@latest --mode lsp
```

### Usage

LSP provides:
- ✅ Tool autocomplete
- ✅ Hover documentation
- ✅ Command execution
- ✅ Inline errors

---

## 3️⃣ HTTP/REST - Universal API

### What is HTTP?

Traditional REST API - Works with ANY programming language or tool.

### Supported Languages

✅ JavaScript/Node.js  
✅ Python  
✅ PHP  
✅ Go  
✅ Java  
✅ C#  
✅ Any language with HTTP support

### Setup (Step-by-Step)

**Step 1:** Start HTTP server
```bash
# Default port 3000
npx brave-real-browser-mcp-server@latest --mode http

# Custom port
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

**Step 2:** Test server
```bash
curl http://localhost:3000/health
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

response = requests.post('http://localhost:3000/browser/init', 
                        json={})
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
curl -X POST http://localhost:3000/browser/init \
  -H "Content-Type: application/json" \
  -d '{}'
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

### Setup (Step-by-Step)

**Step 1:** Start HTTP server (WebSocket included automatically)
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 3000
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

### Setup (Step-by-Step)

**Step 1:** Start SSE server
```bash
# Default port 3001
npx brave-real-browser-mcp-server@latest --mode sse

# Custom port
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001
```

**Step 2:** Connect to event stream

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

**Execute tools via HTTP:**
```bash
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

---

## Protocol Comparison Matrix

| Feature | MCP | LSP | HTTP | WebSocket | SSE |
|---------|-----|-----|------|-----------|-----|
| **Direction** | Bidirectional | Bidirectional | Request-Response | Bidirectional | Server→Client |
| **Real-time** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Auto-start** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Complexity** | Low | Medium | Very Low | Medium | Low |
| **AI IDE Support** | ✅✅✅ | ✅✅ | ✅ | ✅ | ✅ |
| **Universal** | ❌ | ❌ | ✅✅✅ | ✅✅ | ✅✅ |
| **Best For** | AI chat | Code editors | APIs | Interactive | Monitoring |

---

## All Commands Summary

```bash
# Auto mode (detects your environment)
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

# Custom configuration
npx brave-real-browser-mcp-server@latest --mode http --port 8080 --host 0.0.0.0 --no-websocket
```

---

## Quick Start by Use Case

### Use Case 1: I'm using Claude Desktop
```bash
# Add to Claude config, restart Claude
# No command needed - auto-starts
```

### Use Case 2: I want a REST API
```bash
npx brave-real-browser-mcp-server@latest --mode http
```

### Use Case 3: I want real-time monitoring
```bash
npx brave-real-browser-mcp-server@latest --mode sse
```

### Use Case 4: I'm using Zed Editor
```bash
# Add to Zed config, restart Zed
# No command needed - auto-starts
```

### Use Case 5: I want WebSocket communication
```bash
npx brave-real-browser-mcp-server@latest --mode http
# WebSocket is included automatically at ws://localhost:3000
```

---

## Testing Commands

```bash
# Test MCP (check Claude/Cursor tools)
# Just use the IDE

# Test LSP (check Zed/VSCode)
# Just use the editor

# Test HTTP
curl http://localhost:3000/health

# Test WebSocket
# Use browser console:
# const ws = new WebSocket('ws://localhost:3000');

# Test SSE
curl http://localhost:3001/events
# Or open http://localhost:3001/events in browser
```

---

## Detailed Guides

- 📖 [SSE Guide](./SSE-GUIDE.md) - Complete SSE documentation
- 📖 [Main README](../README.md) - Full documentation

---

## FAQ

### Q: Which protocol should I use?

**For AI IDEs (Claude, Cursor):** Use MCP (auto-configured)  
**For code editors (Zed, VSCode):** Use LSP (auto-configured)  
**For custom apps:** Use HTTP  
**For real-time apps:** Use WebSocket or SSE  
**For monitoring:** Use SSE

### Q: Can I run multiple protocols simultaneously?

Yes, but MCP and LSP use stdio, so they need separate instances:

```bash
# Terminal 1: HTTP server
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Terminal 2: SSE server
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001
```

### Q: Which is faster?

**Fastest:** WebSocket (bidirectional, persistent connection)  
**Fast:** SSE (persistent connection, one-way)  
**Standard:** HTTP (request-response)  
**Optimized:** MCP/LSP (auto-managed by IDE)

### Q: Which is easiest?

**Easiest:** MCP for AI IDEs (zero setup after config)  
**Easy:** HTTP (simple REST API)  
**Medium:** SSE (simple EventSource API)  
**Advanced:** WebSocket (requires message handling)

---

**Need Help?**  
🐛 [Report Issues](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)  
⭐ [Star on GitHub](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server)
