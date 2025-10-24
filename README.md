# 🌐 Brave Real Browser MCP Server

## Universal AI IDE Support with Advanced Browser Automation

<div align="center">

![Version](https://img.shields.io/badge/version-2.12.1-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Tools](https://img.shields.io/badge/tools-111-purple.svg)
![IDEs](https://img.shields.io/badge/AI_IDEs-15+-orange.svg)
![License](https://img.shields.io/badge/license-MIT-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | 111+ Tools | Browser Automation | Web Scraping | CAPTCHA Solving**

[Installation](#-installation) | [Quick Start](#-quick-start) | [Tools](#-available-tools-111) | [HTTP/WebSocket](#-httpwebsocket-setup) | [Configuration](#-ide-configurations) | [Troubleshooting](#-troubleshooting)

</div>

---

## 🎯 What is This?

**Brave Real Browser MCP Server** एक powerful automation tool है जो:

- ✅ **15+ AI IDEs में काम करता है** (Claude, Cursor, Windsurf, Cline, Zed, VSCode, Qoder AI, etc.)
- ✅ **111+ Automation Tools** - Browser control, scraping, CAPTCHA solving, video extraction
- ✅ **3 Protocol Modes** - MCP (STDIO), LSP, HTTP/WebSocket
- ✅ **Auto-Detection** - Automatically detects your IDE
- ✅ **Real Brave Browser** - Anti-detection features, bypass Cloudflare
- ✅ **Universal API** - Works with any programming language (JS, Python, PHP, Go, etc.)

---

## 🚀 Quick Start

### ⚡ Quick Setup Summary

**Choose your setup based on your AI Editor:**

| Editor | Setup Time | Method |
|--------|-----------|--------|
| **Claude Desktop** | 2 min | Add config → Restart | 
| **Cursor AI** | 2 min | Add config → Restart |
| **Windsurf** | 2 min | Add config → Restart |
| **Zed Editor** | 3 min | Add to `context_servers` → Restart |
| **Qoder AI** | 4 min | Start HTTP server → Add config → Restart |
| **Others (HTTP)** | 3 min | Start HTTP server → Configure endpoint |

**Quick Commands:**

```bash
# For MCP Editors (Claude, Cursor, Windsurf)
npx -y brave-real-browser-mcp-server@latest

# For HTTP-based Editors (Qoder AI, Custom)
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Check if working
curl http://localhost:3000/health  # For HTTP mode
```

---

### Installation

```bash
# Install globally
npm install -g brave-real-browser-mcp-server@latest

# Or use with npx (no installation needed)
npx brave-real-browser-mcp-server@latest
```

### For MCP IDEs (Claude, Cursor, Windsurf)

**Add to your IDE config file:**

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

**Config file locations:**

- **Claude Desktop:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
- **Cursor:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **Windsurf:** `%APPDATA%\Windsurf\mcp.json`

### For Other IDEs (Qoder AI, Custom Tools)

Use HTTP/WebSocket mode - [See HTTP/WebSocket Setup](#-httpwebsocket-setup)

---

## 🌐 HTTP/WebSocket Setup

### HTTP Protocol - 5 Steps

HTTP mode works with **ANY IDE or programming language**. No special configuration needed!

#### Step 1: Start HTTP Server

```bash
# Start server on port 3000
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Custom host and port
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 8080

# HTTP only (without WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000 --no-websocket
```

**Server will start and show:**

```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

#### Step 2: Test Server

```bash
# Health check
curl http://localhost:3000/health

# List all available tools
curl http://localhost:3000/tools
```

#### Step 5: Configure in Your IDE

**For Qoder AI:**

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

**For any custom tool:** Just make HTTP POST requests to `http://localhost:3000/tools/{tool_name}`

---

### WebSocket Protocol - Complete Setup Guide

WebSocket provides **real-time, bidirectional communication** for modern applications.

#### Step 1: Start WebSocket Server

```bash
# WebSocket is automatically enabled with HTTP mode
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# WebSocket will be available at: ws://localhost:3000
```

**Server will start and show:**

```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
✅ [WebSocket] Server running on ws://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

#### Step 2: Verify WebSocket Connection

Test WebSocket connection using browser console or Node.js:

**Using Browser Console:**

```javascript
// Open browser console (F12) and paste:
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('✅ WebSocket connected!');
  
  // Test tool execution
  ws.send(JSON.stringify({
    id: 1,
    tool: 'browser_init',
    args: {}
  }));
};

ws.onmessage = (event) => {
  console.log('📥 Response:', JSON.parse(event.data));
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('🔴 WebSocket disconnected');
};
```

**Using Node.js:**

```javascript
// Install ws package: npm install ws
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('✅ WebSocket connected!');
  
  // Execute a tool
  ws.send(JSON.stringify({
    id: 1,
    tool: 'browser_init',
    args: {}
  }));
});

ws.on('message', (data) => {
  console.log('📥 Response:', JSON.parse(data));
});

ws.on('error', (error) => {
  console.error('❌ Error:', error);
});

ws.on('close', () => {
  console.log('🔴 Connection closed');
});
```

#### Step 3: WebSocket Message Format

**Request Format:**

```json
{
  "id": 1,
  "tool": "tool_name",
  "args": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

**Response Format:**

```json
{
  "id": 1,
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Result data"
      }
    ]
  }
}
```

**Error Response:**

```json
{
  "id": 1,
  "success": false,
  "error": "Error message"
}
```

#### Step 4: Example - Complete Browser Automation via WebSocket

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

let messageId = 0;

function sendCommand(tool, args) {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    
    const handler = (data) => {
      const response = JSON.parse(data);
      if (response.id === id) {
        ws.removeListener('message', handler);
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.error));
        }
      }
    };
    
    ws.on('message', handler);
    
    ws.send(JSON.stringify({ id, tool, args }));
  });
}

ws.on('open', async () => {
  try {
    // Step 1: Initialize browser
    console.log('Initializing browser...');
    await sendCommand('browser_init', {});
    
    // Step 2: Navigate to URL
    console.log('Navigating to page...');
    await sendCommand('navigate', { url: 'https://example.com' });
    
    // Step 3: Get page content
    console.log('Getting content...');
    const content = await sendCommand('get_content', { type: 'text' });
    console.log('Content:', content);
    
    // Step 4: Close browser
    console.log('Closing browser...');
    await sendCommand('browser_close', {});
    
    console.log('✅ Automation complete!');
    ws.close();
  } catch (error) {
    console.error('❌ Error:', error);
    ws.close();
  }
});
```

#### Step 5: WebSocket Client Libraries

**JavaScript/Node.js:**
```bash
npm install ws
```

**Python:**
```bash
pip install websockets
```

```python
import asyncio
import websockets
import json

async def automation():
    uri = "ws://localhost:3000"
    async with websockets.connect(uri) as websocket:
        # Initialize browser
        await websocket.send(json.dumps({
            "id": 1,
            "tool": "browser_init",
            "args": {}
        }))
        response = await websocket.recv()
        print(f"Response: {response}")
        
        # Navigate
        await websocket.send(json.dumps({
            "id": 2,
            "tool": "navigate",
            "args": {"url": "https://example.com"}
        }))
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(automation())
```

**Go:**
```bash
go get github.com/gorilla/websocket
```

```go
package main

import (
    "encoding/json"
    "fmt"
    "github.com/gorilla/websocket"
)

type Message struct {
    ID   int                    `json:"id"`
    Tool string                 `json:"tool"`
    Args map[string]interface{} `json:"args"`
}

func main() {
    ws, _, err := websocket.DefaultDialer.Dial("ws://localhost:3000", nil)
    if err != nil {
        panic(err)
    }
    defer ws.Close()
    
    // Initialize browser
    msg := Message{
        ID:   1,
        Tool: "browser_init",
        Args: make(map[string]interface{}),
    }
    
    ws.WriteJSON(msg)
    
    var response map[string]interface{}
    ws.ReadJSON(&response)
    fmt.Printf("Response: %+v\n", response)
}
```

**PHP:**
```bash
composer require textalk/websocket
```

```php
<?php
require 'vendor/autoload.php';

use WebSocket\Client;

$client = new Client("ws://localhost:3000");

// Initialize browser
$client->send(json_encode([
    'id' => 1,
    'tool' => 'browser_init',
    'args' => new stdClass()
]));

$response = json_decode($client->receive());
echo "Response: " . print_r($response, true);

$client->close();
?>
```

#### Step 6: WebSocket Advanced Features

**Connection Options:**

```javascript
const ws = new WebSocket('ws://localhost:3000', {
  headers: {
    'Authorization': 'Bearer your-token',
    'X-Custom-Header': 'value'
  }
});
```

**Reconnection Logic:**

```javascript
function connectWebSocket() {
  const ws = new WebSocket('ws://localhost:3000');
  
  ws.on('close', () => {
    console.log('Connection closed, reconnecting in 5s...');
    setTimeout(connectWebSocket, 5000);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  return ws;
}

const ws = connectWebSocket();
```

**Heartbeat/Ping-Pong:**

```javascript
const ws = new WebSocket('ws://localhost:3000');

setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 30000); // Ping every 30 seconds

ws.on('pong', () => {
  console.log('Pong received - connection alive');
});
```

#### Troubleshooting WebSocket

**Issue: Connection Refused**

```bash
# Check if HTTP server is running
curl http://localhost:3000/health

# If not running, start it:
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

**Issue: WebSocket Disabled**

```bash
# Start server with WebSocket explicitly enabled
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Note: WebSocket is enabled by default
# To disable: use --no-websocket flag
```

**Issue: Connection Timeout**

```javascript
// Increase connection timeout
const ws = new WebSocket('ws://localhost:3000', {
  handshakeTimeout: 10000 // 10 seconds
});
```

**Issue: Firewall Blocking**

```bash
# Windows - Allow Node.js through firewall
netsh advfirewall firewall add rule name="Node.js WebSocket" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes

# Linux - Allow port 3000
sudo ufw allow 3000
```

## 🎨 IDE Configurations

### Claude Desktop

**Protocol:** MCP (STDIO) | **Setup Time:** 2 minutes | **Auto-Start:** ✅ Yes

#### 📋 Step-by-Step Setup Guide:

**Step 1: Locate Configuration File**

```bash
# Windows (PowerShell)
cd $env:APPDATA\Claude
notepad claude_desktop_config.json

# Windows (CMD)
cd %APPDATA%\Claude
notepad claude_desktop_config.json

# Mac
cd ~/Library/Application\ Support/Claude
open -e claude_desktop_config.json

# Linux
cd ~/.config/Claude
gedit claude_desktop_config.json
```

**If file doesn't exist, create it:**

```bash
# Windows (PowerShell)
New-Item -Path "$env:APPDATA\Claude\claude_desktop_config.json" -ItemType File -Force

# Mac/Linux
mkdir -p ~/.config/Claude
touch ~/.config/Claude/claude_desktop_config.json
```

**Step 2: Add Configuration**

Copy and paste this configuration:

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

**Advanced Configuration (Optional):**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false"
      }
    }
  }
}
```

**Step 3: Save and Close File**

Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac) to save.

**Step 4: Restart Claude Desktop**

```bash
# Windows
taskkill /F /IM claude.exe
# Then reopen Claude Desktop

# Mac
pkill -f Claude
# Then reopen Claude Desktop
```

**Step 5: Verify Installation**

1. Open Claude Desktop
2. Look for 🔧 icon or "Tools" section
3. You should see "brave-real-browser" with 111 tools
4. Try this command in Claude:
   ```
   Use browser_init tool to start the browser
   ```

**Troubleshooting:**

```bash
# Check Claude logs
# Windows
type "%APPDATA%\Claude\logs\mcp*.log"

# Mac
cat ~/Library/Logs/Claude/mcp*.log

# If server fails, test manually:
npx -y brave-real-browser-mcp-server@latest
```

**Configuration Locations:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### Cursor AI

**Protocol:** MCP (STDIO) | **Setup Time:** 2 minutes | **Auto-Start:** ✅ Yes

#### 📋 Step-by-Step Setup Guide:

**Step 1: Install Cline Extension (if not installed)**

1. Open Cursor AI
2. Press `Ctrl+Shift+X` (Extensions)
3. Search for "Cline" or "Claude Dev"
4. Click Install
5. Restart Cursor

**Step 2: Locate Configuration File**

```bash
# Windows (PowerShell)
$configPath = "$env:APPDATA\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings"
cd $configPath
notepad cline_mcp_settings.json

# Windows (CMD)
cd %APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings
notepad cline_mcp_settings.json

# Mac
cd ~/Library/Application\ Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings
open -e cline_mcp_settings.json
```

**If file doesn't exist, create it:**

```bash
# Windows (PowerShell)
$settingsPath = "$env:APPDATA\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings"
New-Item -Path $settingsPath -ItemType Directory -Force
New-Item -Path "$settingsPath\cline_mcp_settings.json" -ItemType File -Force

# Mac
mkdir -p ~/Library/Application\ Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings
touch ~/Library/Application\ Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

**Step 3: Add Configuration**

**Basic Configuration:**
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

**Advanced Configuration (with Brave path):**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false"
      }
    }
  }
}
```

**For Mac:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
      }
    }
  }
}
```

**Step 4: Save and Restart Cursor**

```bash
# Windows
taskkill /F /IM Cursor.exe
# Then reopen Cursor

# Mac
pkill -f Cursor
# Then reopen Cursor
```

**Step 5: Verify Installation**

1. Open Cursor AI
2. Open Cline panel (usually in sidebar)
3. Look for MCP tools section
4. You should see "brave-real-browser" listed
5. Test with:
   ```
   @brave-real-browser browser_init
   ```

**Step 6: Using Tools in Cursor**

```
# In Cline chat:
Use the browser_init tool from brave-real-browser to start automation

# Or directly:
@brave-real-browser navigate {"url": "https://example.com"}
```

**Troubleshooting:**

```bash
# Check if Cline extension is active
# Cursor → Extensions → Search "Cline" → Should show "Active"

# View Cline logs
# Cursor → View → Output → Select "Cline" from dropdown

# Test server manually
npx -y brave-real-browser-mcp-server@latest

# Clear Cursor cache
# Windows
Remove-Item -Recurse -Force "$env:APPDATA\Cursor\Cache"

# Mac
rm -rf ~/Library/Application\ Support/Cursor/Cache
```

**Configuration Locations:**
- Windows: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Mac: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Windsurf

**File:** `mcp.json`

**Location:**

- Windows: `%APPDATA%\Windsurf\mcp.json`
- Mac: `~/.windsurf/mcp.json`

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

### Cline (VSCode Extension)

**File:** `cline_mcp_settings.json`

**Location:**

- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Mac: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

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

**Protocol:** Context Servers (MCP)

**File:** `settings.json`

**Location:**

- Windows: `%APPDATA%\Zed\settings.json`
- Mac: `~/.config/zed/settings.json`
- Linux: `~/.config/zed/settings.json`

#### Step-by-Step Setup Guide:

**Step 1:** Open Zed Editor and press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

**Step 2:** Type "Open Settings" and select "Zed: Open Settings"

**Step 3:** Add the following configuration:

```json
{
  "context_servers": {
    "brave-real-browser": {
      "source": "custom",
      "command": "npx.cmd",
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

**For Mac/Linux, use:**
```json
{
  "context_servers": {
    "brave-real-browser": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

**Step 4:** Save the file and restart Zed Editor

**Step 5:** Verify installation by checking Zed's output panel

**Important Notes:**
- ⚠️ **Zed uses `context_servers` NOT `mcpServers` or `lsp`**
- ✅ Make sure you're using Zed Preview version (v0.120.0+) for MCP support
- ✅ On Windows, use `npx.cmd` instead of `npx`
- ✅ Server will auto-start when Zed launches

### Qoder AI Editor

**Protocol:** MCP (STDIO) | **Setup Time:** 3 minutes | **Auto-Start:** ✅ Yes

**✅ Good News:** Qoder AI supports standard STDIO-based MCP servers (just like Claude, Cursor, Windsurf)!

#### 📋 Step-by-Step Setup Guide:

**Step 1: Open Qoder Settings**

```bash
# Method 1: Using keyboard shortcut
# Windows: Ctrl + Shift + ,
# Mac: ⌘ + Shift + ,

# Method 2: Click user icon in upper-right corner
# Then select "Qoder Settings"
```

**Step 2: Navigate to MCP Section**

1. In left-side navigation pane, click **MCP**
2. Click on **My Servers** tab
3. Click **+ Add** button in upper-right corner

**Step 3: Add Configuration**

A JSON file will appear. Add this configuration:

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

**Advanced Configuration (with environment variables):**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        "HEADLESS": "false"
      }
    }
  }
}
```

**For Mac:**

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
      }
    }
  }
}
```

**Step 4: Save Configuration**

1. Close the JSON file
2. Click **Save** when prompted
3. The new server will appear in your list
4. A **link icon** (🔗) means the connection is successful

**Step 5: Verify Installation**

1. Expand the **brave-real-browser** entry
2. You should see list of 111 available tools
3. If server fails to start, click **Quick Fix** button
4. If issue persists, check troubleshooting section below

**Step 6: Using Tools in Qoder AI**

1. Switch to **Agent mode** in AI Chat panel
2. Ask Qoder to use browser automation:
   ```
   Use brave-real-browser to navigate to https://example.com and extract the main content
   ```
3. Qoder will prompt for confirmation before using MCP tools
4. Press `Ctrl+Enter` (Windows) or `⌘+Enter` (Mac) to execute

**Important Notes:**

- ⚠️ **Maximum 10 MCP servers** can be used simultaneously
- ✅ **Only works in Agent mode** (not in Ask mode)
- ✅ **Server auto-starts** when Qoder launches
- ✅ **Node.js V18+ required** (includes NPM V8+)

**Prerequisites Check:**

```bash
# Verify Node.js installation
node -v  # Should show v18.0.0 or higher
npx -v   # Should show version number

# If not installed:
# Windows: Download from https://nodejs.org/
# Mac: brew install node
# Linux: Use package manager (apt, yum, etc.)
```

**Troubleshooting:**

**Issue: "exec: npx: executable file not found"**

```bash
# Solution: Install Node.js V18 or later
# Windows
nvm install 22.14.0
nvm use 22.14.0

# Mac
brew install node

# Verify
node -v
npx -v
```

**Issue: "failed to initialize MCP client: context deadline exceeded"**

1. Click **Copy complete command** in Qoder UI
2. Run command in terminal to see detailed error
3. Check if Node.js is blocked by security software
4. Add Node.js to security software whitelist

**Issue: Server fails to connect**

1. Click **Retry** icon in Qoder interface
2. Qoder will attempt to restart MCP server automatically
3. Check **My Servers** tab for connection status
4. Expand server details to see tools list

**Issue: Tools not being called by LLM**

1. Make sure you're in **Agent mode** (not Ask mode)
2. Open a project directory in Qoder
3. Ensure MCP server shows **link icon** (connected)
4. Try explicit prompt: "Use brave-real-browser to..."

**Configuration Locations:**

- Windows: Qoder Settings → MCP → My Servers
- Mac: Qoder Settings → MCP → My Servers
- Linux: Qoder Settings → MCP → My Servers

**Official Documentation:**
- Qoder MCP Guide: https://docs.qoder.com/user-guide/chat/model-context-protocol
- MCP Common Issues: https://docs.qoder.com/support/mcp-common-issues

### Other HTTP-based IDEs (Gemini CLI, Qwen Code CLI, Custom Tools)

**Step 1:** Start HTTP server as shown above

**Step 2:** Configure your IDE/tool to use endpoint: `http://localhost:3000`

**Step 3:** Make HTTP POST requests to execute tools:

```bash
# Example: Navigate to URL
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Example: Get page content
curl -X POST http://localhost:3000/tools/get_content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'
```

---

## 🛠️ Available Tools (111)

### 🌐 Browser Management (2 tools)

| Tool            | Description                                     |
| --------------- | ----------------------------------------------- |
| `browser_init`  | Initialize browser with anti-detection features |
| `browser_close` | Close browser instance                          |

### 🧭 Navigation (2 tools)

| Tool       | Description                               |
| ---------- | ----------------------------------------- |
| `navigate` | Navigate to URL with wait conditions      |
| `wait`     | Wait for selector, navigation, or timeout |

### 🖱️ Interactions (4 tools)

| Tool            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `click`         | Click on elements                                    |
| `type`          | Type text into inputs                                |
| `random_scroll` | Human-like scrolling                                 |
| `solve_captcha` | Solve CAPTCHA (reCAPTCHA, hCaptcha, Turnstile, etc.) |

### 📄 Content Extraction (10 tools)

| Tool                       | Description                               |
| -------------------------- | ----------------------------------------- |
| `get_content`              | Extract page content (HTML/Text/Markdown) |
| `find_selector`            | Find CSS selectors for elements           |
| `scrape_table`             | Extract table data with headers           |
| `extract_list`             | Extract list items                        |
| `extract_json`             | Extract JSON data from page               |
| `scrape_meta_tags`         | Extract meta tags and SEO info            |
| `extract_schema`           | Extract schema.org structured data        |
| `save_content_as_markdown` | Save page as markdown file                |
| `html_to_text`             | Convert HTML to clean text                |
| `smart_text_cleaner`       | Clean and normalize text                  |

### 🔍 Multi-Element Extraction (8 tools)

| Tool                      | Description                       |
| ------------------------- | --------------------------------- |
| `batch_element_scraper`   | Scrape multiple elements at once  |
| `nested_data_extraction`  | Extract nested data structures    |
| `attribute_harvester`     | Extract element attributes        |
| `image_scraper`           | Extract all images with metadata  |
| `link_harvester`          | Extract all links from page       |
| `media_extractor`         | Extract media files (audio/video) |
| `pdf_link_finder`         | Find PDF download links           |
| `html_elements_extractor` | Extract specific HTML elements    |

### 🎯 Advanced Extraction (10 tools)

| Tool                   | Description                  |
| ---------------------- | ---------------------------- |
| `tags_finder`          | Find elements by tag name    |
| `links_finder`         | Advanced link extraction     |
| `xpath_links`          | Extract links using XPath    |
| `ajax_extractor`       | Extract AJAX/dynamic content |
| `fetch_xhr`            | Capture XHR/Fetch requests   |
| `network_recorder`     | Record all network traffic   |
| `api_finder`           | Discover API endpoints       |
| `regex_pattern_finder` | Find patterns using regex    |
| `iframe_extractor`     | Extract iframe content       |
| `embed_page_extractor` | Extract embedded pages       |

### 🎬 Video & Media Tools (19 tools)

| Tool                            | Description                              |
| ------------------------------- | ---------------------------------------- |
| `video_link_finder`             | Find video URLs                          |
| `video_download_page`           | Navigate to video download page          |
| `video_download_button`         | Find video download buttons              |
| `video_play_push_source`        | Get video play sources                   |
| `video_play_button_click`       | Click video play button                  |
| `url_redirect_trace_endpoints`  | Trace URL redirects                      |
| `network_recording_finder`      | Find network recordings                  |
| `network_recording_extractors`  | Extract network data                     |
| `video_links_finders`           | Multiple video link finders              |
| `videos_selectors`              | Video element selectors                  |
| `link_process_extracts`         | Process and extract links                |
| `video_link_finders_extracts`   | Advanced video link extraction           |
| `video_download_button_finders` | Find all download buttons                |
| `advanced_video_extraction`     | Advanced video extraction with ad-bypass |
| `image_extractor_advanced`      | Advanced image extraction                |
| `video_source_extractor`        | Extract video source URLs                |
| `video_player_extractor`        | Extract video player info                |
| `video_player_hoster_finder`    | Find video hosting platform              |
| `original_video_hoster_finder`  | Find original video source               |

### 🔐 CAPTCHA & Security (4 tools)

| Tool                     | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `solve_captcha`          | Multi-CAPTCHA solver (reCAPTCHA, hCaptcha, Turnstile, Arkose, etc.) |
| `ocr_engine`             | OCR for text-based CAPTCHAs                                         |
| `audio_captcha_solver`   | Solve audio CAPTCHAs                                                |
| `puzzle_captcha_handler` | Handle puzzle CAPTCHAs                                              |

### 🔧 Data Processing (9 tools)

| Tool                      | Description                        |
| ------------------------- | ---------------------------------- |
| `price_parser`            | Extract and parse prices           |
| `date_normalizer`         | Normalize dates to standard format |
| `contact_extractor`       | Extract contact information        |
| `schema_validator`        | Validate data against schema       |
| `required_fields_checker` | Check for required fields          |
| `duplicate_remover`       | Remove duplicate entries           |
| `data_deduplication`      | Advanced deduplication             |
| `missing_data_handler`    | Handle missing data                |
| `data_type_validator`     | Validate data types                |

### 📊 Data Quality (3 tools)

| Tool                   | Description              |
| ---------------------- | ------------------------ |
| `outlier_detection`    | Detect data outliers     |
| `consistency_checker`  | Check data consistency   |
| `data_quality_metrics` | Generate quality metrics |

### 🤖 AI-Powered Tools (5 tools)

| Tool                       | Description                 |
| -------------------------- | --------------------------- |
| `smart_selector_generator` | Auto-generate CSS selectors |
| `content_classification`   | Classify content type       |
| `sentiment_analysis`       | Analyze text sentiment      |
| `summary_generator`        | Generate content summaries  |
| `translation_support`      | Translate content           |

### 🔎 Search & Filter (5 tools)

| Tool                     | Description                   |
| ------------------------ | ----------------------------- |
| `keyword_search`         | Search for keywords in page   |
| `regex_pattern_matcher`  | Match regex patterns          |
| `xpath_support`          | XPath query support           |
| `advanced_css_selectors` | Advanced CSS selector queries |
| `visual_element_finder`  | Find elements visually        |

### 📑 Pagination & Navigation (5 tools)

| Tool                   | Description                 |
| ---------------------- | --------------------------- |
| `auto_pagination`      | Auto-paginate through pages |
| `infinite_scroll`      | Handle infinite scroll      |
| `multi_page_scraper`   | Scrape multiple pages       |
| `sitemap_parser`       | Parse and navigate sitemaps |
| `breadcrumb_navigator` | Navigate using breadcrumbs  |

### 🔒 Session Management (7 tools)

| Tool                    | Description                |
| ----------------------- | -------------------------- |
| `cookie_manager`        | Manage cookies             |
| `session_persistence`   | Persist sessions           |
| `form_auto_fill`        | Auto-fill forms            |
| `ajax_content_waiter`   | Wait for AJAX content      |
| `modal_popup_handler`   | Handle modal popups        |
| `login_session_manager` | Manage login sessions      |
| `shadow_dom_extractor`  | Extract Shadow DOM content |

### 📸 Visual Tools (5 tools)

| Tool                   | Description                 |
| ---------------------- | --------------------------- |
| `full_page_screenshot` | Full page screenshot        |
| `element_screenshot`   | Screenshot specific element |
| `pdf_generation`       | Generate PDF from page      |
| `video_recording`      | Record page as video        |
| `visual_comparison`    | Compare screenshots         |

### 📈 Monitoring & Reporting (6 tools)

| Tool                    | Description               |
| ----------------------- | ------------------------- |
| `progress_tracker`      | Track automation progress |
| `error_logger`          | Log errors                |
| `success_rate_reporter` | Report success rates      |
| `data_quality_metrics`  | Data quality metrics      |
| `performance_monitor`   | Monitor performance       |
| `monitoring_summary`    | Get monitoring summary    |

### 🌐 API Integration (3 tools)

| Tool                       | Description              |
| -------------------------- | ------------------------ |
| `rest_api_endpoint_finder` | Find REST API endpoints  |
| `webhook_support`          | Webhook integration      |
| `all_website_api_finder`   | Find all APIs on website |

### 🛡️ Advanced Extraction & Obfuscation (5 tools)

| Tool                         | Description                 |
| ---------------------------- | --------------------------- |
| `deobfuscate_js`             | Deobfuscate JavaScript      |
| `multi_layer_redirect_trace` | Trace multi-layer redirects |
| `ad_protection_detector`     | Detect ad protection        |
| `url_redirect_tracer`        | Trace URL redirects         |
| `user_agent_extractor`       | Extract user agent info     |

---

## 💡 Usage Examples

### Example 1: Simple Web Scraping (MCP Mode)

```javascript
// Using MCP tool in Claude/Cursor
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {},
});

await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://example.com" },
});

await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "get_content",
  arguments: { type: "text" },
});
```

### Example 2: CAPTCHA Solving

```javascript
// Navigate to CAPTCHA page
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://site-with-captcha.com" },
});

// Solve CAPTCHA
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "solve_captcha",
  arguments: { type: "recaptcha" },
});

// Continue automation
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "click",
  arguments: { selector: "button.submit" },
});
```

### Example 3: Video Extraction

```javascript
// Navigate to video page
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { url: "https://video-site.com/video/123" },
});

// Find video links
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "video_link_finder",
  arguments: {},
});

// Advanced video extraction with ad bypass
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "advanced_video_extraction",
  arguments: {},
});
```

### Example 4: Multi-Page Scraping

```javascript
// Initialize browser
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "browser_init",
  arguments: {},
});

// Auto-paginate through all pages
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "multi_page_scraper",
  arguments: {
    startUrl: "https://example.com/page/1",
    maxPages: 10,
  },
});
```

---

## 📋 API Endpoints (HTTP Mode)

When running in HTTP mode, these endpoints are available:

```
GET  /health                    - Health check
GET  /tools                     - List all tools
POST /tools/:toolName           - Execute any tool
POST /browser/init              - Initialize browser
POST /browser/navigate          - Navigate to URL
POST /browser/get_content       - Get page content
POST /browser/click             - Click element
POST /browser/type              - Type text
POST /browser/close             - Close browser
```

**Example:**

```bash
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## 🔧 Environment Variables

```bash
# Optional: Specify Brave browser path
BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Optional: Run in headless mode
HEADLESS=true

# Optional: Disable content priority
DISABLE_CONTENT_PRIORITY=true

# Optional: HTTP port
HTTP_PORT=3000
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Brave Browser Not Found

**Symptoms:**
- Error: "Brave browser not found"
- Browser fails to launch

**Solutions:**

```bash
# Windows (PowerShell)
$env:BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Windows (CMD)
set BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Mac
export BRAVE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

# Linux (Ubuntu/Debian)
export BRAVE_PATH="/usr/bin/brave-browser"

# Linux (Snap)
export BRAVE_PATH="/snap/bin/brave"
```

**Permanent Fix (Windows):**
```powershell
# Add to System Environment Variables
[System.Environment]::SetEnvironmentVariable('BRAVE_PATH', 'C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe', 'User')
```

---

#### 2. Server Won't Start

**Symptoms:**
- "Failed to start server" error
- Process exits immediately
- No output in terminal

**Solutions:**

**Step 1:** Check Node.js version
```bash
node --version
# Should show v18.0.0 or higher
```

**Step 2:** If Node.js is old, update it:
```bash
# Windows (using Chocolatey)
choco upgrade nodejs

# Mac (using Homebrew)
brew upgrade node

# Or download from: https://nodejs.org/
```

**Step 3:** Clear npm cache and reinstall
```bash
npm cache clean --force
npm uninstall -g brave-real-browser-mcp-server
npm install -g brave-real-browser-mcp-server@latest
```

**Step 4:** Check for conflicting processes
```bash
# Windows
taskkill /F /IM brave.exe

# Mac/Linux
pkill -f brave
```

---

#### 3. Port Already in Use (HTTP Mode)

**Symptoms:**
- Error: "EADDRINUSE: address already in use ::3000"
- HTTP server fails to start

**Solutions:**

**Option A:** Use a different port
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

**Option B:** Kill the process using port 3000

```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Windows (CMD)
for /f "tokens=5" %a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %a

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

#### 4. Qoder AI Configuration Fails

**Symptoms:**
- "Connection refused" error
- "Server not reachable" message
- Tools not appearing in Qoder AI

**Solutions:**

**Step 1:** Verify HTTP server is running
```bash
# Start server in a separate terminal
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# You should see:
# ✅ [HTTP] Server ready at http://localhost:3000
```

**Step 2:** Test server connection
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Step 3:** Check firewall settings
```bash
# Windows: Allow Node.js through firewall
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```

**Step 4:** Try alternative configuration
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest", "--mode", "http", "--port", "3000"],
      "env": {}
    }
  }
}
```

---

#### 5. Zed Editor Not Detecting Server

**Symptoms:**
- Context servers not appearing
- "Failed to start context server" error

**Solutions:**

**Step 1:** Ensure Zed Preview version
```bash
# Check Zed version (should be v0.120.0 or higher)
# Open Zed → Help → About Zed
```

**Step 2:** Verify correct configuration format
```json
{
  "context_servers": {
    "brave-real-browser": {
      "source": "custom",
      "command": "npx.cmd",  // Windows: use npx.cmd, Mac/Linux: use npx
      "args": ["-y", "brave-real-browser-mcp-server"]
    }
  }
}
```

**Step 3:** Check Zed logs
```bash
# Open Zed → View → Debug → Language Server Logs
# Look for error messages
```

**Step 4:** Restart Zed completely
```bash
# Close Zed and kill any background processes
# Windows
taskkill /F /IM zed.exe

# Mac
pkill -f zed
```

---

#### 6. Claude Desktop Configuration Issues

**Symptoms:**
- "MCP server failed to start"
- Tools not appearing in Claude

**Solutions:**

**Step 1:** Check config file location
```bash
# Windows
echo %APPDATA%\Claude\claude_desktop_config.json

# Mac
echo ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Step 2:** Validate JSON format
- Use https://jsonlint.com/ to validate your config
- Ensure no trailing commas
- Check quotes are properly escaped

**Step 3:** Check Claude logs
```bash
# Windows
type "%APPDATA%\Claude\logs\mcp*.log"

# Mac
cat ~/Library/Logs/Claude/mcp*.log
```

**Step 4:** Restart Claude Desktop completely
```bash
# Windows
taskkill /F /IM claude.exe

# Mac
pkill -f Claude
```

---

#### 7. CAPTCHA Not Solving

**Symptoms:**
- CAPTCHA solve timeout
- "Failed to solve CAPTCHA" error

**Solutions:**

**Step 1:** Ensure CAPTCHA is fully loaded
```javascript
// Add wait before solving
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "wait",
  arguments: { type: "timeout", value: "5000" }
});
```

**Step 2:** Try longer timeout
```javascript
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "solve_captcha",
  arguments: { 
    type: "recaptcha",
    timeout: 60000  // 60 seconds
  }
});
```

**Step 3:** Try different CAPTCHA types
- `recaptcha` - Google reCAPTCHA v2/v3
- `hcaptcha` - hCaptcha
- `turnstile` - Cloudflare Turnstile

---

#### 8. NPX Command Not Found

**Symptoms:**
- "npx: command not found"
- "npx is not recognized"

**Solutions:**

**Step 1:** Verify npm installation
```bash
npm --version
```

**Step 2:** Reinstall Node.js
- Download from: https://nodejs.org/
- Choose LTS version
- During installation, ensure "Add to PATH" is checked

**Step 3:** Add npm to PATH manually (Windows)
```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

---

#### 9. Permission Denied Errors (Linux/Mac)

**Symptoms:**
- "EACCES: permission denied"
- Cannot install globally

**Solutions:**

```bash
# Option A: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Option B: Use npx instead of global install
npx brave-real-browser-mcp-server@latest

# Option C: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
```

---

#### 10. Browser Crashes or Hangs

**Symptoms:**
- Browser becomes unresponsive
- "Page crashed" errors
- Memory issues

**Solutions:**

**Step 1:** Enable headless mode
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

**Step 2:** Increase timeout values
```javascript
await use_mcp_tool({
  server_name: "brave-real-browser",
  tool_name: "navigate",
  arguments: { 
    url: "https://example.com",
    waitUntil: "networkidle2",
    timeout: 60000
  }
});
```

**Step 3:** Clear browser cache
```bash
# Kill all Brave processes
# Windows
taskkill /F /IM brave.exe

# Mac/Linux
pkill -9 brave
```

---

### Getting Help

If you're still experiencing issues:

1. **Check GitHub Issues:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues
2. **Enable Debug Logs:** Set `DEBUG=*` environment variable
3. **Report Bug:** Include:
   - Operating System & version
   - Node.js version (`node --version`)
   - Editor/IDE name & version
   - Complete error message
   - Configuration file (remove sensitive data)

```bash
# Run with debug logging
DEBUG=* npx brave-real-browser-mcp-server@latest --mode http
```

---

## 📊 Supported Protocols

|| Protocol        | Used By                                       | Auto-Config | Status     |
|| --------------- | --------------------------------------------- | ----------- | ---------- |
|| **MCP (STDIO)** | Claude Desktop, Cursor, Windsurf, Cline, Warp | ✅          | 🟢 Working |
|| **LSP**         | Zed Editor, VSCode, Neovim                    | ✅          | 🟢 Working |
|| **HTTP/REST**   | Any IDE/Tool                                  | ✅          | 🟢 Working |
|| **WebSocket**   | Modern Web Apps, Real-time Tools              | ✅          | 🟢 Working |

---

## 📊 Editor Compatibility Matrix

| AI Editor | Protocol | Config File | Server Auto-Start | HTTP Server Required | Status |
|-----------|----------|-------------|-------------------|----------------------|--------|
| **Claude Desktop** | MCP | `claude_desktop_config.json` | ✅ Yes | ❌ No | 🟢 Working |
| **Cursor AI** | MCP | `cline_mcp_settings.json` | ✅ Yes | ❌ No | 🟢 Working |
| **Windsurf** | MCP | `mcp.json` | ✅ Yes | ❌ No | 🟢 Working |
| **Cline (VSCode)** | MCP | `cline_mcp_settings.json` | ✅ Yes | ❌ No | 🟢 Working |
| **Warp Terminal** | MCP | Warp config | ✅ Yes | ❌ No | 🟢 Working |
| **Zed Editor** | Context Servers (MCP) | `settings.json` | ✅ Yes | ❌ No | 🟢 Working |
| **Qoder AI** | HTTP | `mcp.json` or config | ❌ No | ✅ **Yes** | 🟢 Working |
| **Gemini CLI** | HTTP | CLI config | ❌ No | ✅ **Yes** | 🟢 Working |
| **Qwen Code CLI** | HTTP | CLI config | ❌ No | ✅ **Yes** | 🟢 Working |
| **Continue.dev** | HTTP | Extension config | ❌ No | ✅ **Yes** | 🟢 Working |
| **Custom Tools** | HTTP | API integration | ❌ No | ✅ **Yes** | 🟢 Working |
| **VSCode (Generic)** | LSP/HTTP | Extension config | Varies | Optional | 🟢 Working |

**Legend:**
- ✅ **Server Auto-Start**: Editor automatically starts the MCP server
- ❌ **HTTP Server Required**: You must manually start HTTP server before using
- 🟢 **Working**: Fully tested and operational

---

## 📋 Requirements

- **Node.js** >= 18.0.0
- **Brave Browser** (auto-detected or specify path)
- **Operating System:** Windows, macOS, Linux

---

## 🤝 Contributing

Contributions are welcome! Please submit a Pull Request.

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🔗 Links

- **GitHub:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server
- **NPM:** https://www.npmjs.com/package/brave-real-browser-mcp-server
- **Issues:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues

---

<div align="center">

**🌟 111 Tools | 15+ AI IDEs | 3 Protocols | Universal Support 🌟**

**Made with ❤️ for the AI Development Community**

[⭐ Star on GitHub](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server) | [🐛 Report Bug](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues) | [💡 Request Feature](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)

</div>
| **MCP (STDIO)** | Claude Desktop,
