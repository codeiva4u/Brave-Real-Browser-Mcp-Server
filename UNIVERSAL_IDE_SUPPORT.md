# 🌐 Universal AI IDE Support - Technical Documentation

## 📚 Overview

This document explains how **Brave Real Browser MCP Server** provides **universal support for all AI-powered IDEs** through automatic detection and multi-protocol adaptation.

---

## 🎯 What is Universal IDE Support?

Universal IDE Support means:

- ✅ **Zero Configuration Required** - Works automatically with any AI IDE
- ✅ **Auto-Detection** - Automatically detects which IDE is running the server
- ✅ **Multi-Protocol** - Supports MCP, LSP, HTTP, and WebSocket protocols
- ✅ **15+ IDEs Supported** - Works with all major AI-powered development tools
- ✅ **Fallback Mechanism** - Falls back to HTTP if IDE cannot be detected
- ✅ **Manual Override** - Can manually specify protocol if needed

---

## 🔍 How Auto-Detection Works

### Detection Strategy (Priority Order)

The Universal IDE Adapter uses multiple detection strategies in order:

#### 1. **Environment Variables Detection** (Highest Priority)
```javascript
// Checks for IDE-specific environment variables
process.env.CLAUDE_DESKTOP     // → Claude Desktop
process.env.CURSOR_IDE         // → Cursor AI
process.env.WINDSURF_IDE       // → Windsurf
process.env.CLINE_MODE         // → Cline
process.env.WARP               // → Warp Terminal
process.env.ZED_EDITOR         // → Zed Editor
process.env.VSCODE_PID         // → VSCode
```

#### 2. **Parent Process Detection**
```javascript
// Checks parent process name
"claude" in parentName     // → Claude Desktop
"cursor" in parentName     // → Cursor AI
"windsurf" in parentName   // → Windsurf
"zed" in parentName        // → Zed Editor
"code" in parentName       // → VSCode
```

#### 3. **STDIO Analysis**
```javascript
// Checks if stdin/stdout are piped (MCP clients)
if (stdin.isPiped && stdout.isPiped) {
  // Likely an MCP client (Claude, Cursor, etc.)
  return ProtocolType.STDIO;
}
```

#### 4. **Configuration Files**
```javascript
// Checks for IDE-specific config files
~/.config/Claude/claude_desktop_config.json    // → Claude Desktop
~/.cursor/mcp_settings.json                    // → Cursor AI
~/.windsurf/mcp.json                           // → Windsurf
```

#### 5. **Fallback to HTTP**
```javascript
// If nothing detected, use universal HTTP protocol
return {
  protocol: ProtocolType.HTTP,
  ide: AIIDEType.UNKNOWN
};
```

---

## 📡 Supported Protocols

### 1. MCP (Model Context Protocol)
- **Transport:** STDIO (Standard Input/Output)
- **Used By:** Claude Desktop, Cursor, Windsurf, Cline, Warp, Roo Coder
- **Characteristics:** 
  - Bidirectional communication over stdin/stdout
  - JSON-RPC based
  - Best for desktop applications

### 2. LSP (Language Server Protocol)
- **Transport:** STDIO or TCP
- **Used By:** Zed, VSCode, Neovim, Emacs, Sublime Text
- **Characteristics:**
  - Standard protocol for editor integrations
  - Well-established ecosystem
  - Best for traditional code editors

### 3. HTTP/REST
- **Transport:** HTTP
- **Used By:** Any IDE with HTTP client capabilities
- **Characteristics:**
  - Universal protocol
  - Easy to integrate
  - Best for web-based or custom tools

### 4. WebSocket
- **Transport:** WebSocket over HTTP
- **Used By:** Modern web-based IDEs, real-time applications
- **Characteristics:**
  - Real-time bidirectional communication
  - Event-driven
  - Best for reactive UIs

---

## 🤖 Complete List of Supported AI IDEs

| # | IDE Name | Protocol(s) | Auto-Detect | Config File Location |
|---|----------|-------------|-------------|---------------------|
| 1 | **Claude Desktop** | MCP/STDIO | ✅ | `%APPDATA%\Claude\claude_desktop_config.json` |
| 2 | **Cursor AI** | MCP/STDIO | ✅ | `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` |
| 3 | **Windsurf** | MCP/STDIO | ✅ | `%APPDATA%\Windsurf\mcp.json` |
| 4 | **Cline** | MCP/STDIO | ✅ | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` |
| 5 | **Warp Terminal** | MCP/STDIO | ✅ | Auto-detected via environment |
| 6 | **Roo Coder** | MCP/STDIO | ✅ | Auto-detected via environment |
| 7 | **Zed Editor** | LSP/MCP | ✅ | `~/.config/zed/settings.json` |
| 8 | **VSCode** | LSP/HTTP | ✅ | Auto-detected via process |
| 9 | **Qoder AI** | HTTP/WS | ✅ | Uses HTTP endpoint |
| 10 | **Continue.dev** | MCP/HTTP | ✅ | `~/.continue/config.json` |
| 11 | **GitHub Copilot** | HTTP/LSP | ✅ | Auto-detected via VSCode |
| 12 | **CodeWhisperer** | HTTP/LSP | ✅ | Auto-detected via IDE |
| 13 | **Tabnine** | HTTP/WS | ✅ | Uses HTTP endpoint |
| 14 | **Cody** | HTTP/LSP | ✅ | Auto-detected via IDE |
| 15 | **Aider** | STDIO/HTTP | ✅ | Auto-detected via environment |
| 16 | **Pieces** | HTTP/WS | ✅ | Uses HTTP endpoint |

---

## 🔧 Configuration Examples

### Auto Mode (Recommended)

```bash
# Just run the server - it will auto-detect your IDE
brave-real-browser-mcp-server

# Or explicitly use auto mode
brave-real-browser-mcp-server --mode auto
```

### Manual Mode Selection

```bash
# Force MCP protocol
brave-real-browser-mcp-server --mode mcp

# Force HTTP protocol
brave-real-browser-mcp-server --mode http --port 3000

# Force LSP protocol
brave-real-browser-mcp-server --mode lsp
```

### IDE-Specific Configuration Files

#### Claude Desktop
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

#### Cursor AI
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

#### Windsurf
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

#### Qoder AI / HTTP-based IDEs
```bash
# Start HTTP server
brave-real-browser-mcp-server --mode http --port 3000

# Use REST API endpoint
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## 🏗️ Technical Architecture

### Components

#### 1. **UniversalIDEAdapter**
- Main orchestrator for IDE detection and protocol selection
- Manages detection strategies
- Provides fallback mechanisms

#### 2. **UniversalIDEDetector**
- Implements detection strategies
- Returns confidence score for each detection
- Supports multiple detection methods

#### 3. **AI_IDE_REGISTRY**
- Central registry of all supported IDEs
- Contains capabilities for each IDE
- Defines supported protocols per IDE

#### 4. **MultiProtocolLauncher**
- Starts appropriate transport layer based on detected protocol
- Manages server lifecycle
- Handles cleanup on shutdown

### Protocol Flow

```
User Starts Server
      ↓
UniversalIDEAdapter Initializes
      ↓
Detection Strategies Execute (Priority Order)
      ↓
IDE Detected → Protocol Selected
      ↓
Appropriate Transport Started
   ├─ MCP → StdioServerTransport
   ├─ LSP → LspTransport
   └─ HTTP → HttpTransport + WebSocket
      ↓
Server Ready → Tools Available
```

---

## 📊 Detection Confidence Levels

| Confidence | Method | Reliability |
|-----------|---------|-------------|
| **90%** | Environment Variables | High |
| **85%** | Parent Process Name | High |
| **80%** | VSCode Generic Detection | Medium-High |
| **75%** | Configuration Files | Medium |
| **70%** | STDIO Analysis | Medium |
| **50%** | Fallback (HTTP) | Low |

---

## 🚀 Usage Examples

### Example 1: Auto-Detection in Claude Desktop

```bash
# User runs from Claude Desktop's config
# Server automatically detects:
# - IDE: Claude Desktop
# - Protocol: MCP/STDIO
# - Confidence: 90%

🔍 [Universal Adapter] Starting AI IDE detection...
✅ [Universal Adapter] Detected: Claude Desktop (90% confidence)
📡 [Universal Adapter] Using protocol: stdio
🔵 [MCP] Starting MCP server with STDIO transport...
🎯 [MCP] Optimized for: Claude Desktop
✅ [MCP] Server started successfully
```

### Example 2: Auto-Detection Fallback

```bash
# User runs from unknown IDE
# Server falls back to HTTP:

🔍 [Universal Adapter] Starting AI IDE detection...
⚠️  [Universal Adapter] Could not detect specific IDE
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

### Example 3: Manual Override

```bash
# User wants to force HTTP mode
brave-real-browser-mcp-server --mode http --port 3000

📡 Mode: HTTP
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
```

---

## 🔍 Debugging Auto-Detection

### Enable Detailed Logging

```bash
# Set environment variable for debug logs
DEBUG=* brave-real-browser-mcp-server --mode auto
```

### Check Detection Results

```bash
# Use --list-ides to see all supported IDEs
brave-real-browser-mcp-server --list-ides

# Output:
═══════════════════════════════════════════════════════════
🌐 Supported AI IDEs (Universal Compatibility)
═══════════════════════════════════════════════════════════
✓ Claude Desktop              [mcp, stdio]
✓ Cursor AI                   [mcp, stdio, http]
✓ Windsurf Editor             [mcp, stdio, http]
✓ Cline (VSCode Extension)    [mcp, stdio, http]
✓ Warp Terminal               [mcp, stdio]
✓ Roo Coder                   [mcp, stdio, http]
✓ Zed Editor                  [lsp, mcp, http]
✓ Continue.dev                [mcp, http, stdio]
✓ Qoder AI Editor             [http, ws, mcp]
...
═══════════════════════════════════════════════════════════
```

---

## 🛠️ Troubleshooting

### Issue: IDE Not Detected

**Solution 1:** Use manual mode
```bash
brave-real-browser-mcp-server --mode mcp
```

**Solution 2:** Set environment variable
```bash
export CURSOR_IDE=true
brave-real-browser-mcp-server
```

**Solution 3:** Use HTTP fallback
```bash
brave-real-browser-mcp-server --mode http --port 3000
```

### Issue: Wrong Protocol Selected

**Solution:** Disable auto-detection and specify protocol
```bash
brave-real-browser-mcp-server --no-auto-detect --mode lsp
```

### Issue: Server Won't Start

**Solution:** Check Node.js version and permissions
```bash
node --version  # Should be >= 18.0.0
npm cache clean --force
npm install -g brave-real-browser-mcp-server
```

---

## 📈 Performance Considerations

- **Detection Time:** < 100ms typically
- **Memory Overhead:** ~5MB for adapter
- **CPU Impact:** Negligible after initialization
- **Protocol Overhead:**
  - MCP/STDIO: Lowest (direct pipes)
  - LSP: Low (optimized protocol)
  - HTTP: Medium (network overhead)
  - WebSocket: Medium (persistent connections)

---

## 🔮 Future Enhancements

- [ ] Add support for more AI IDEs as they emerge
- [ ] Implement plugin system for custom IDE adapters
- [ ] Add telemetry for detection accuracy improvement
- [ ] Support for custom protocol implementations
- [ ] IDE preference learning based on usage patterns

---

## 🤝 Contributing New IDE Support

To add support for a new AI IDE:

1. Add entry to `AI_IDE_REGISTRY` in `universal-ide-adapter.ts`:
```typescript
[AIIDEType.NEW_IDE]: {
  type: AIIDEType.NEW_IDE,
  name: 'New IDE Name',
  supportedProtocols: [ProtocolType.MCP, ProtocolType.HTTP],
  preferredProtocol: ProtocolType.MCP,
  autoDetectable: true,
  requiresManualSetup: false,
}
```

2. Add detection logic in `UniversalIDEDetector.detectFromEnvironment()`:
```typescript
if (env.NEW_IDE_ENV_VAR) {
  return {
    detected: true,
    ide: AIIDEType.NEW_IDE,
    protocol: ProtocolType.MCP,
    capabilities: AI_IDE_REGISTRY[AIIDEType.NEW_IDE],
    confidence: 90,
    detectionMethod: 'environment-variables',
  };
}
```

3. Test detection and protocol switching
4. Update documentation
5. Submit Pull Request

---

## 📞 Support & Resources

- **GitHub:** https://github.com/withLinda/brave-real-browser-mcp-server
- **Issues:** https://github.com/withLinda/brave-real-browser-mcp-server/issues
- **Documentation:** See README.md for usage examples
- **NPM:** https://www.npmjs.com/package/brave-real-browser-mcp-server

---

## 📄 License

MIT License - See LICENSE file for details

---

<div align="center">

**Built with ❤️ for Universal AI IDE Compatibility**

Made by the community, for the community

</div>