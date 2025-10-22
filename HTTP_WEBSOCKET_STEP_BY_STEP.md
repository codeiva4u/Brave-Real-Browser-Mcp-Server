# 🚀 HTTP & WebSocket - Step-by-Step Configuration Guide
## स्टेप-बाय-स्टेप सेटअप गाइड (हिन्दी + English)

---

## 📚 Table of Contents / विषय-सूची

1. [HTTP Protocol Setup](#http-protocol-setup)
2. [WebSocket Protocol Setup](#websocket-protocol-setup)
3. [IDE-Specific Configurations](#ide-specific-configurations)
4. [Testing & Verification](#testing--verification)
5. [Troubleshooting](#troubleshooting)

---

# 🌐 HTTP Protocol Setup

## 📋 Overview / अवलोकन

**HTTP Mode** सभी IDEs और tools के साथ काम करता है। यह एक REST API server है जिसे आप manually start करते हैं।

**क्यों HTTP Mode?**
- ✅ किसी भी IDE के साथ काम करता है
- ✅ कोई special configuration नहीं चाहिए
- ✅ Standard HTTP requests
- ✅ आसान integration

---

## 🎯 Step 1: Server Install करें

### Option A: Global Installation (Recommended)

```bash
# Install globally
npm install -g brave-real-browser-mcp-server@latest

# Verify installation
brave-real-browser-mcp-server --version
```

### Option B: NPX (No Installation)

```bash
# Run directly with npx (no installation needed)
npx brave-real-browser-mcp-server@latest --help
```

---

## 🎯 Step 2: HTTP Server Start करें

### Basic Setup

```bash
# Start HTTP server on default port 3000
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

**Output दिखेगा:**
```
🟢 [HTTP] Starting HTTP/WebSocket server...
✅ [HTTP] Server ready at http://localhost:3000
💡 [HTTP] Universal mode - works with ALL AI IDEs
```

### Custom Configuration

```bash
# Custom host and port
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 8080

# HTTP only (without WebSocket)
npx brave-real-browser-mcp-server@latest --mode http --port 3000 --no-websocket
```

---

## 🎯 Step 3: Server Test करें

### Test 1: Health Check

```bash
# Terminal में run करें
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test 2: List Available Tools

```bash
curl http://localhost:3000/tools
```

**Response में सभी available tools की list मिलेगी।**

---

## 🎯 Step 4: अपने IDE/Tool में Configure करें

### For Qoder AI

**File:** Qoder AI Settings

```json
{
  "extensions": {
    "brave-real-browser": {
      "type": "http",
      "enabled": true,
      "endpoint": "http://localhost:3000",
      "timeout": 30000
    }
  }
}
```

**Steps:**
1. Qoder AI open करें
2. Settings → Extensions
3. Add New Extension
4. ऊपर दिया गया config paste करें
5. Save और Reload

### For Custom JavaScript/Node.js Script

**File:** `browser-client.js`

```javascript
const axios = require('axios');

// Create HTTP client
const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Initialize browser
async function initBrowser() {
  const response = await client.post('/tools/browser_init', {
    headless: false
  });
  console.log('✅ Browser initialized');
  return response.data;
}

// Navigate to URL
async function navigate(url) {
  const response = await client.post('/tools/navigate', {
    url: url
  });
  console.log('✅ Navigated to:', url);
  return response.data;
}

// Get page content
async function getContent() {
  const response = await client.post('/tools/get_content', {
    type: 'text'
  });
  console.log('📄 Content received');
  return response.data;
}

// Main function
async function main() {
  try {
    await initBrowser();
    await navigate('https://example.com');
    const content = await getContent();
    console.log(content);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

**Run करें:**
```bash
node browser-client.js
```

### For Python Scripts

**File:** `browser_client.py`

```python
import requests
import json

# Base URL
BASE_URL = "http://localhost:3000"

def init_browser():
    """Browser initialize करें"""
    response = requests.post(
        f"{BASE_URL}/tools/browser_init",
        json={"headless": False}
    )
    print("✅ Browser initialized")
    return response.json()

def navigate(url):
    """Website पर navigate करें"""
    response = requests.post(
        f"{BASE_URL}/tools/navigate",
        json={"url": url}
    )
    print(f"✅ Navigated to: {url}")
    return response.json()

def get_content():
    """Page content प्राप्त करें"""
    response = requests.post(
        f"{BASE_URL}/tools/get_content",
        json={"type": "text"}
    )
    print("📄 Content received")
    return response.json()

# Main execution
if __name__ == "__main__":
    try:
        init_browser()
        navigate("https://example.com")
        content = get_content()
        print(content)
    except Exception as e:
        print(f"Error: {e}")
```

**Run करें:**
```bash
python browser_client.py
```

### For VSCode REST Client Extension

**File:** `api-tests.http`

```http
### Health Check
GET http://localhost:3000/health

### List Tools
GET http://localhost:3000/tools

### Initialize Browser
POST http://localhost:3000/tools/browser_init
Content-Type: application/json

{
  "headless": false
}

### Navigate to URL
POST http://localhost:3000/tools/navigate
Content-Type: application/json

{
  "url": "https://example.com"
}

### Get Page Content
POST http://localhost:3000/tools/get_content
Content-Type: application/json

{
  "type": "text"
}

### Close Browser
POST http://localhost:3000/tools/browser_close
Content-Type: application/json

{}
```

**How to use:**
1. VSCode में REST Client extension install करें
2. `.http` file create करें
3. ऊपर का code paste करें
4. "Send Request" button पर click करें

---

## 🎯 Step 5: Complete Workflow Example

### Full Automation Script (JavaScript)

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 30000
});

async function automateWebsite() {
  try {
    console.log('🚀 Starting automation...\n');

    // Step 1: Initialize Browser
    console.log('Step 1: Initializing browser...');
    await client.post('/tools/browser_init', {
      headless: false
    });
    console.log('✅ Browser initialized\n');

    // Step 2: Navigate to website
    console.log('Step 2: Navigating to website...');
    await client.post('/tools/navigate', {
      url: 'https://example.com'
    });
    console.log('✅ Navigation successful\n');

    // Step 3: Wait for page load
    console.log('Step 3: Waiting for page to load...');
    await client.post('/tools/wait', {
      type: 'timeout',
      value: '2000'
    });
    console.log('✅ Page loaded\n');

    // Step 4: Get page content
    console.log('Step 4: Extracting content...');
    const content = await client.post('/tools/get_content', {
      type: 'text'
    });
    console.log('✅ Content extracted\n');
    console.log('📄 Content preview:');
    console.log(content.data.result.content.substring(0, 200) + '...\n');

    // Step 5: Take screenshot
    console.log('Step 5: Taking screenshot...');
    await client.post('/tools/full_page_screenshot', {
      path: './screenshot.png'
    });
    console.log('✅ Screenshot saved\n');

    // Step 6: Close browser
    console.log('Step 6: Closing browser...');
    await client.post('/tools/browser_close', {});
    console.log('✅ Browser closed\n');

    console.log('🎉 Automation completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

automateWebsite();
```

---

# 🔌 WebSocket Protocol Setup

## 📋 Overview / अवलोकन

**WebSocket Mode** real-time, bidirectional communication provide करता है। यह web-based IDEs और modern applications के लिए perfect है।

**क्यों WebSocket Mode?**
- ✅ Real-time communication
- ✅ Bidirectional data flow
- ✅ Event-driven architecture
- ✅ Low latency
- ✅ Perfect for web apps

---

## 🎯 Step 1: WebSocket Server Start करें

### Server Start (HTTP के साथ WebSocket automatically enable होता है)

```bash
# Start server with WebSocket enabled (default)
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

**WebSocket endpoint available होगा:**
```
ws://localhost:3000
```

---

## 🎯 Step 2: WebSocket Client बनाएं

### For Browser/JavaScript

**File:** `websocket-client.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Brave Browser WebSocket Client</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        button {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #45a049;
        }
        #status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .connected {
            background: #d4edda;
            color: #155724;
        }
        .disconnected {
            background: #f8d7da;
            color: #721c24;
        }
        #output {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            max-height: 400px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <h1>🌐 Brave Browser WebSocket Client</h1>
    
    <div id="status" class="disconnected">
        Status: Disconnected
    </div>

    <div>
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
        <button onclick="initBrowser()">Initialize Browser</button>
        <button onclick="navigate()">Navigate</button>
        <button onclick="getContent()">Get Content</button>
        <button onclick="closeBrowser()">Close Browser</button>
    </div>

    <h3>Output:</h3>
    <div id="output"></div>

    <script>
        let ws = null;
        let messageId = 0;
        const callbacks = new Map();

        function log(message) {
            const output = document.getElementById('output');
            const timestamp = new Date().toLocaleTimeString();
            output.innerHTML += `[${timestamp}] ${message}<br>`;
            output.scrollTop = output.scrollHeight;
        }

        function updateStatus(connected) {
            const status = document.getElementById('status');
            if (connected) {
                status.className = 'connected';
                status.textContent = 'Status: ✅ Connected';
            } else {
                status.className = 'disconnected';
                status.textContent = 'Status: ❌ Disconnected';
            }
        }

        function connect() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                log('Already connected!');
                return;
            }

            log('Connecting to WebSocket server...');
            ws = new WebSocket('ws://localhost:3000');

            ws.onopen = () => {
                log('✅ Connected to server!');
                updateStatus(true);
            };

            ws.onmessage = (event) => {
                const response = JSON.parse(event.data);
                log(`📨 Received: ${JSON.stringify(response)}`);
                
                if (response.id && callbacks.has(response.id)) {
                    const callback = callbacks.get(response.id);
                    callback(response);
                    callbacks.delete(response.id);
                }
            };

            ws.onerror = (error) => {
                log('❌ WebSocket error!');
                console.error(error);
            };

            ws.onclose = () => {
                log('🔌 Disconnected from server');
                updateStatus(false);
            };
        }

        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
                log('Disconnected');
            }
        }

        function send(action, params = {}) {
            return new Promise((resolve, reject) => {
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    reject(new Error('Not connected'));
                    log('❌ Not connected! Click Connect first.');
                    return;
                }

                const id = ++messageId;
                const message = { action, params, id };

                callbacks.set(id, (response) => {
                    if (response.success) {
                        resolve(response.result);
                    } else {
                        reject(new Error(response.error));
                    }
                });

                log(`📤 Sending: ${action}`);
                ws.send(JSON.stringify(message));
            });
        }

        async function initBrowser() {
            try {
                await send('browser_init', { headless: false });
                log('✅ Browser initialized!');
            } catch (error) {
                log(`❌ Error: ${error.message}`);
            }
        }

        async function navigate() {
            try {
                await send('navigate', { url: 'https://example.com' });
                log('✅ Navigated to example.com!');
            } catch (error) {
                log(`❌ Error: ${error.message}`);
            }
        }

        async function getContent() {
            try {
                const result = await send('get_content', { type: 'text' });
                log('✅ Content received!');
                log(`📄 Content preview: ${result.content.substring(0, 100)}...`);
            } catch (error) {
                log(`❌ Error: ${error.message}`);
            }
        }

        async function closeBrowser() {
            try {
                await send('browser_close', {});
                log('✅ Browser closed!');
            } catch (error) {
                log(`❌ Error: ${error.message}`);
            }
        }

        // Auto-connect on page load
        window.onload = () => {
            log('Page loaded. Click "Connect" to start.');
        };
    </script>
</body>
</html>
```

**How to use:**
1. ऊपर का HTML code save करें (`websocket-client.html`)
2. Browser में open करें
3. "Connect" button पर click करें
4. अन्य buttons use करके browser control करें

### For Node.js

**File:** `websocket-client.js`

```javascript
const WebSocket = require('ws');

class BraveBrowserWSClient {
  constructor(url = 'ws://localhost:3000') {
    this.url = url;
    this.ws = null;
    this.messageId = 0;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to WebSocket server...');
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('✅ Connected!');
        resolve();
      });

      this.ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        console.log('📨 Received:', response);
        
        if (response.id && this.callbacks.has(response.id)) {
          const callback = this.callbacks.get(response.id);
          callback(response);
          this.callbacks.delete(response.id);
        }
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 Disconnected');
      });
    });
  }

  send(action, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const message = { action, params, id };

      this.callbacks.set(id, (response) => {
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.error));
        }
      });

      console.log(`📤 Sending: ${action}`);
      this.ws.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async initBrowser(options = {}) {
    return await this.send('browser_init', options);
  }

  async navigate(url) {
    return await this.send('navigate', { url });
  }

  async getContent(type = 'text') {
    return await this.send('get_content', { type });
  }

  async closeBrowser() {
    return await this.send('browser_close', {});
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage Example
async function main() {
  const client = new BraveBrowserWSClient();

  try {
    // Step 1: Connect
    await client.connect();

    // Step 2: Initialize browser
    console.log('\n🚀 Step 1: Initializing browser...');
    await client.initBrowser({ headless: false });
    console.log('✅ Browser initialized\n');

    // Step 3: Navigate
    console.log('🚀 Step 2: Navigating...');
    await client.navigate('https://example.com');
    console.log('✅ Navigation successful\n');

    // Step 4: Get content
    console.log('🚀 Step 3: Getting content...');
    const content = await client.getContent('text');
    console.log('✅ Content received');
    console.log('📄 Preview:', content.content.substring(0, 100) + '...\n');

    // Step 5: Close browser
    console.log('🚀 Step 4: Closing browser...');
    await client.closeBrowser();
    console.log('✅ Browser closed\n');

    console.log('🎉 All done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.close();
  }
}

main();
```

**Install dependencies:**
```bash
npm install ws
```

**Run:**
```bash
node websocket-client.js
```

### For Python (asyncio)

**File:** `websocket_client.py`

```python
import asyncio
import websockets
import json

class BraveBrowserWSClient:
    def __init__(self, uri="ws://localhost:3000"):
        self.uri = uri
        self.websocket = None
        self.message_id = 0
        self.callbacks = {}
        self.listen_task = None
    
    async def connect(self):
        """Server से connect करें"""
        print("🔌 Connecting to WebSocket server...")
        self.websocket = await websockets.connect(self.uri)
        print("✅ Connected!")
        
        # Start listening for responses
        self.listen_task = asyncio.create_task(self._listen())
    
    async def _listen(self):
        """Messages को listen करें"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                print(f"📨 Received: {data}")
                
                if 'id' in data and data['id'] in self.callbacks:
                    future = self.callbacks[data['id']]
                    future.set_result(data)
                    del self.callbacks[data['id']]
        except websockets.exceptions.ConnectionClosed:
            print("🔌 Connection closed")
    
    async def send(self, action, params=None):
        """Message भेजें"""
        if params is None:
            params = {}
        
        self.message_id += 1
        message_id = self.message_id
        
        message = {
            "action": action,
            "params": params,
            "id": message_id
        }
        
        future = asyncio.Future()
        self.callbacks[message_id] = future
        
        print(f"📤 Sending: {action}")
        await self.websocket.send(json.dumps(message))
        
        response = await future
        
        if response.get('success'):
            return response.get('result')
        else:
            raise Exception(response.get('error'))
    
    async def init_browser(self, headless=False):
        """Browser initialize करें"""
        return await self.send('browser_init', {'headless': headless})
    
    async def navigate(self, url):
        """URL पर navigate करें"""
        return await self.send('navigate', {'url': url})
    
    async def get_content(self, content_type='text'):
        """Content प्राप्त करें"""
        return await self.send('get_content', {'type': content_type})
    
    async def close_browser(self):
        """Browser बंद करें"""
        return await self.send('browser_close', {})
    
    async def close(self):
        """Connection बंद करें"""
        if self.listen_task:
            self.listen_task.cancel()
        if self.websocket:
            await self.websocket.close()

# Usage Example
async def main():
    client = BraveBrowserWSClient()
    
    try:
        # Step 1: Connect
        await client.connect()
        
        # Step 2: Initialize browser
        print("\n🚀 Step 1: Initializing browser...")
        await client.init_browser(headless=False)
        print("✅ Browser initialized\n")
        
        # Step 3: Navigate
        print("🚀 Step 2: Navigating...")
        await client.navigate("https://example.com")
        print("✅ Navigation successful\n")
        
        # Step 4: Get content
        print("🚀 Step 3: Getting content...")
        content = await client.get_content("text")
        print("✅ Content received")
        print(f"📄 Preview: {content['content'][:100]}...\n")
        
        # Step 5: Close browser
        print("🚀 Step 4: Closing browser...")
        await client.close_browser()
        print("✅ Browser closed\n")
        
        print("🎉 All done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await client.close()

# Run
if __name__ == "__main__":
    asyncio.run(main())
```

**Install dependencies:**
```bash
pip install websockets
```

**Run:**
```bash
python websocket_client.py
```

---

# 🎨 IDE-Specific Configurations

## Qoder AI

### HTTP Configuration

```json
{
  "extensions": {
    "brave-real-browser": {
      "type": "http",
      "enabled": true,
      "endpoint": "http://localhost:3000",
      "timeout": 30000,
      "retries": 3
    }
  }
}
```

### WebSocket Configuration

```json
{
  "extensions": {
    "brave-real-browser": {
      "type": "websocket",
      "enabled": true,
      "endpoint": "ws://localhost:3000",
      "reconnect": true,
      "reconnectInterval": 5000
    }
  }
}
```

---

## React/Next.js Applications

**File:** `components/BrowserClient.jsx`

```javascript
import { useEffect, useState } from 'react';

export default function BrowserClient() {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [output, setOutput] = useState([]);
  const [messageId, setMessageId] = useState(0);
  const [callbacks] = useState(new Map());

  useEffect(() => {
    // Connect on mount
    const websocket = new WebSocket('ws://localhost:3000');

    websocket.onopen = () => {
      setStatus('Connected ✅');
      addLog('Connected to server!');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`Received: ${JSON.stringify(data)}`);
      
      if (data.id && callbacks.has(data.id)) {
        const callback = callbacks.get(data.id);
        callback(data);
        callbacks.delete(data.id);
      }
    };

    websocket.onclose = () => {
      setStatus('Disconnected ❌');
      addLog('Disconnected from server');
    };

    setWs(websocket);

    return () => websocket.close();
  }, []);

  const addLog = (message) => {
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const send = (action, params = {}) => {
    return new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }

      const id = messageId + 1;
      setMessageId(id);

      callbacks.set(id, (response) => {
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.error));
        }
      });

      ws.send(JSON.stringify({ action, params, id }));
    });
  };

  const initBrowser = async () => {
    try {
      await send('browser_init', { headless: false });
      addLog('Browser initialized!');
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };

  const navigate = async () => {
    try {
      await send('navigate', { url: 'https://example.com' });
      addLog('Navigation successful!');
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };

  const getContent = async () => {
    try {
      const result = await send('get_content', { type: 'text' });
      addLog('Content received!');
      console.log(result);
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🌐 Brave Browser Client</h1>
      
      <div style={{ 
        padding: '10px', 
        background: status.includes('✅') ? '#d4edda' : '#f8d7da',
        borderRadius: '5px',
        marginBottom: '10px'
      }}>
        Status: {status}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={initBrowser}>Initialize Browser</button>
        <button onClick={navigate}>Navigate</button>
        <button onClick={getContent}>Get Content</button>
      </div>

      <h3>Output:</h3>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        {output.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}
```

---

# ✅ Testing & Verification

## Test 1: Basic Connection

```bash
# Start server
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# In another terminal, test health
curl http://localhost:3000/health
```

## Test 2: Browser Automation

```bash
# Initialize
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d '{}'

# Navigate
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get content
curl -X POST http://localhost:3000/tools/get_content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'
```

## Test 3: WebSocket Connection

**Using websocat tool:**

```bash
# Install websocat
# Windows: Download from https://github.com/vi/websocat/releases
# Linux: cargo install websocat
# Mac: brew install websocat

# Connect and send message
echo '{"action":"browser_init","params":{},"id":1}' | websocat ws://localhost:3000
```

---

# 🐛 Troubleshooting

## Problem 1: Server won't start

**Error:** `Port 3000 already in use`

**Solution:**
```bash
# Check what's using the port