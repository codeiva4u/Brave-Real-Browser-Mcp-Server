# 🚀 Quick Start Guide - All 5 Protocols

## ✅ Implementation Status

| Protocol | Status | Tests | Documentation |
|----------|--------|-------|---------------|
| **MCP (STDIO)** | ✅ Working | ✅ Passing | ✅ Complete |
| **LSP** | ✅ Working | ✅ Passing | ✅ Complete |
| **HTTP/REST** | ✅ Working | ✅ Passing | ✅ Complete |
| **WebSocket** | ✅ Working | ✅ Passing | ✅ Complete |
| **SSE** | ✅ Working | ✅ Passing | ✅ Complete |

**Total Tests:** 328 (all passing ✅)

---

## Choose Your Protocol

### 1. I'm using Claude Desktop / Cursor / Windsurf

**Protocol:** MCP (STDIO)  
**Setup Time:** 2 minutes  
**Auto-start:** Yes

```bash
# Just add to config file - no command needed
# See docs/PROTOCOLS.md for details
```

---

### 2. I'm using Zed Editor / VSCode / Neovim

**Protocol:** LSP  
**Setup Time:** 3 minutes  
**Auto-start:** Yes

```bash
# Just add to editor config - no command needed
# See docs/PROTOCOLS.md for details
```

---

### 3. I want a REST API (Universal)

**Protocol:** HTTP/REST  
**Setup Time:** 1 minute  
**Auto-start:** No (manual)

```bash
# Start HTTP server
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Test
curl http://localhost:3000/health

# Use from any language
# JavaScript, Python, PHP, Go, Java, C#, etc.
```

---

### 4. I want Real-time Bidirectional Communication

**Protocol:** WebSocket  
**Setup Time:** 1 minute  
**Auto-start:** No (manual)

```bash
# Start HTTP server (WebSocket included)
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Connect via WebSocket
# ws://localhost:3000
```

---

### 5. I want Real-time Monitoring / Dashboard

**Protocol:** SSE (Server-Sent Events)  
**Setup Time:** 1 minute  
**Auto-start:** No (manual)

```bash
# Start SSE server
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Connect to event stream
# http://localhost:3001/events

# Or test
curl http://localhost:3001/health
```

---

## All Commands

```bash
# Auto-detect environment
npx brave-real-browser-mcp-server@latest

# MCP mode
npx brave-real-browser-mcp-server@latest --mode mcp

# LSP mode
npx brave-real-browser-mcp-server@latest --mode lsp

# HTTP mode (includes WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# SSE mode
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# All protocols
npx brave-real-browser-mcp-server@latest --mode all
```

---

## Quick Examples

### HTTP Example
```bash
# Initialize browser
curl -X POST http://localhost:3000/browser/init \
  -H "Content-Type: application/json" \
  -d '{}'

# Navigate
curl -X POST http://localhost:3000/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### WebSocket Example
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  ws.send(JSON.stringify({
    id: 1,
    tool: 'browser_init',
    args: {}
  }));
};

ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

### SSE Example
```javascript
const eventSource = new EventSource('http://localhost:3001/events');

eventSource.addEventListener('browser_init_success', (event) => {
  console.log('Browser ready!', JSON.parse(event.data));
});

eventSource.addEventListener('tool_success', (event) => {
  console.log('Tool completed!', JSON.parse(event.data));
});
```

---

## Detailed Documentation

- 📖 [All Protocols Guide](./docs/PROTOCOLS.md) - Complete protocol comparison
- 📖 [SSE Guide](./docs/SSE-GUIDE.md) - Full SSE documentation
- 📖 [Main README](./README.md) - Complete documentation

---

## Need Help?

🐛 [Report Issues](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)  
⭐ [Star on GitHub](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server)

---

**Made with ❤️ | 5 Protocols | 111 Tools | 328 Tests Passing**
