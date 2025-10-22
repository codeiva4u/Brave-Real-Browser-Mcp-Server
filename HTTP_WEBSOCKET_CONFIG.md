# 🌐 HTTP & WebSocket Configuration Guide

## 📚 पूर्ण गाइड - HTTP और WebSocket के साथ कैसे उपयोग करें

---

## 🎯 Overview

**HTTP और WebSocket modes** सभी IDEs और tools के साथ काम करते हैं। MCP protocol के विपरीत, इन्हें किसी विशेष configuration की जरूरत नहीं होती।

### **मुख्य अंतर:**

| Feature | MCP Protocol | HTTP/WebSocket |
|---------|-------------|----------------|
| **Configuration** | IDE config file में entry चाहिए | कोई config नहीं चाहिए |
| **Compatibility** | केवल MCP-compatible IDEs | सभी IDEs/Tools |
| **Connection** | IDE server को start करता है | आप manually start करते हैं |
| **Use Case** | Claude, Cursor, Windsurf | Web apps, scripts, custom tools |
| **Protocol** | STDIO-based | HTTP/WebSocket-based |

---

## 🚀 Quick Start

### **Step 1: Server Start करें**

```bash
# Basic setup
npx brave-real-browser-mcp-server@latest --mode http --port 3000

# Custom configuration
npx brave-real-browser-mcp-server@latest --mode http --host 0.0.0.0 --port 8080

# Without WebSocket (HTTP only)
npx brave-real-browser-mcp-server@latest --mode http --port 3000 --no-websocket
```

### **Step 2: Test करें**

```bash
# Health check
curl http://localhost:3000/health

# List available tools
curl http://localhost:3000/tools
```

---

## 📡 HTTP REST API Configuration

### **1. Command Line (cURL)**

```bash
# Initialize browser
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d '{}'

# Navigate to URL
curl -X POST http://localhost:3000/tools/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get page content
curl -X POST http://localhost:3000/tools/get_content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'

# Close browser
curl -X POST http://localhost:3000/tools/browser_close \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **2. JavaScript/Node.js**

```javascript
// Using axios
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0'
  }
});

async function automateWebsite() {
  try {
    // Initialize browser
    await client.post('/tools/browser_init', {
      headless: false
    });
    console.log('✅ Browser initialized');

    // Navigate to website
    await client.post('/tools/navigate', {
      url: 'https://example.com',
      waitUntil: 'networkidle2'
    });
    console.log('✅ Navigated to website');

    // Get page content
    const response = await client.post('/tools/get_content', {
      type: 'text'
    });
    console.log('📄 Content:', response.data.result.content);

    // Click an element
    await client.post('/tools/click', {
      selector: 'button.submit'
    });
    console.log('✅ Clicked button');

    // Type text
    await client.post('/tools/type', {
      selector: 'input[name="search"]',
      text: 'Hello World'
    });
    console.log('✅ Typed text');

    // Take screenshot
    await client.post('/tools/full_page_screenshot', {
      path: './screenshot.png'
    });
    console.log('📸 Screenshot saved');

    // Close browser
    await client.post('/tools/browser_close', {});
    console.log('✅ Browser closed');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

automateWebsite();
```

```javascript
// Using fetch (modern browsers/Node.js 18+)
async function getBrowserContent() {
  // Initialize
  await fetch('http://localhost:3000/tools/browser_init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Navigate
  await fetch('http://localhost:3000/tools/navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
  });

  // Get content
  const response = await fetch('http://localhost:3000/tools/get_content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text' })
  });

  const data = await response.json();
  console.log(data);
}
```

### **3. Python**

```python
import requests
import json

class BraveBrowserClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Python-Client/1.0'
        })
    
    def init_browser(self, headless=False):
        response = self.session.post(
            f"{self.base_url}/tools/browser_init",
            json={"headless": headless}
        )
        return response.json()
    
    def navigate(self, url):
        response = self.session.post(
            f"{self.base_url}/tools/navigate",
            json={"url": url}
        )
        return response.json()
    
    def get_content(self, content_type="text"):
        response = self.session.post(
            f"{self.base_url}/tools/get_content",
            json={"type": content_type}
        )
        return response.json()
    
    def click(self, selector):
        response = self.session.post(
            f"{self.base_url}/tools/click",
            json={"selector": selector}
        )
        return response.json()
    
    def type_text(self, selector, text):
        response = self.session.post(
            f"{self.base_url}/tools/type",
            json={"selector": selector, "text": text}
        )
        return response.json()
    
    def close_browser(self):
        response = self.session.post(
            f"{self.base_url}/tools/browser_close",
            json={}
        )
        return response.json()

# Usage
if __name__ == "__main__":
    client = BraveBrowserClient()
    
    # Initialize browser
    print("Initializing browser...")
    client.init_browser(headless=False)
    
    # Navigate
    print("Navigating to website...")
    client.navigate("https://example.com")
    
    # Get content
    print("Getting content...")
    content = client.get_content("text")
    print(f"Content: {content}")
    
    # Close
    print("Closing browser...")
    client.close_browser()
```

### **4. PHP**

```php
<?php

class BraveBrowserClient {
    private $baseUrl;
    
    public function __construct($baseUrl = 'http://localhost:3000') {
        $this->baseUrl = $baseUrl;
    }
    
    private function post($endpoint, $data = []) {
        $ch = curl_init($this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'User-Agent: PHP-Client/1.0'
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    public function initBrowser($headless = false) {
        return $this->post('/tools/browser_init', ['headless' => $headless]);
    }
    
    public function navigate($url) {
        return $this->post('/tools/navigate', ['url' => $url]);
    }
    
    public function getContent($type = 'text') {
        return $this->post('/tools/get_content', ['type' => $type]);
    }
    
    public function closeBrowser() {
        return $this->post('/tools/browser_close', []);
    }
}

// Usage
$client = new BraveBrowserClient();

echo "Initializing browser...\n";
$client->initBrowser();

echo "Navigating...\n";
$client->navigate('https://example.com');

echo "Getting content...\n";
$content = $client->getContent('text');
print_r($content);

echo "Closing browser...\n";
$client->closeBrowser();
?>
```

### **5. Go**

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

type BraveBrowserClient struct {
    BaseURL string
    Client  *http.Client
}

func NewClient(baseURL string) *BraveBrowserClient {
    return &BraveBrowserClient{
        BaseURL: baseURL,
        Client:  &http.Client{},
    }
}

func (c *BraveBrowserClient) post(endpoint string, data interface{}) (map[string]interface{}, error) {
    jsonData, err := json.Marshal(data)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequest("POST", c.BaseURL+endpoint, bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("User-Agent", "Go-Client/1.0")

    resp, err := c.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    var result map[string]interface{}
    err = json.Unmarshal(body, &result)
    return result, err
}

func (c *BraveBrowserClient) InitBrowser() (map[string]interface{}, error) {
    return c.post("/tools/browser_init", map[string]interface{}{})
}

func (c *BraveBrowserClient) Navigate(url string) (map[string]interface{}, error) {
    return c.post("/tools/navigate", map[string]interface{}{"url": url})
}

func (c *BraveBrowserClient) GetContent(contentType string) (map[string]interface{}, error) {
    return c.post("/tools/get_content", map[string]interface{}{"type": contentType})
}

func main() {
    client := NewClient("http://localhost:3000")

    fmt.Println("Initializing browser...")
    client.InitBrowser()

    fmt.Println("Navigating...")
    client.Navigate("https://example.com")

    fmt.Println("Getting content...")
    content, _ := client.GetContent("text")
    fmt.Println(content)
}
```

---

## 🔌 WebSocket Configuration

### **1. JavaScript/Browser**

```javascript
class BraveBrowserWebSocket {
  constructor(url = 'ws://localhost:3000') {
    this.url = url;
    this.ws = null;
    this.messageId = 0;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ Connected to Brave Browser MCP Server');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const callback = this.callbacks.get(data.id);
          callback(data);
          this.callbacks.delete(data.id);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected');
      };
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

  async navigate(url, waitUntil = 'networkidle2') {
    return await this.send('navigate', { url, waitUntil });
  }

  async getContent(type = 'text') {
    return await this.send('get_content', { type });
  }

  async click(selector) {
    return await this.send('click', { selector });
  }

  async type(selector, text) {
    return await this.send('type', { selector, text });
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

// Usage
(async () => {
  const client = new BraveBrowserWebSocket();
  
  try {
    await client.connect();
    
    await client.initBrowser({ headless: false });
    console.log('Browser initialized');
    
    await client.navigate('https://example.com');
    console.log('Navigated to website');
    
    const content = await client.getContent('text');
    console.log('Content:', content);
    
    await client.closeBrowser();
    console.log('Browser closed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
})();
```

### **2. Node.js**

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
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        console.log('✅ Connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.id && this.callbacks.has(response.id)) {
          const callback = this.callbacks.get(response.id);
          callback(response);
          this.callbacks.delete(response.id);
        }
      });

      this.ws.on('error', reject);
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

      this.ws.send(JSON.stringify(message));
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

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
(async () => {
  const client = new BraveBrowserWSClient();
  
  await client.connect();
  await client.initBrowser();
  await client.navigate('https://example.com');
  const content = await client.getContent('text');
  console.log(content);
  
  client.close();
})();
```

### **3. Python (asyncio + websockets)**

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
    
    async def connect(self):
        self.websocket = await websockets.connect(self.uri)
        print("✅ Connected")
        
        # Start listening for responses
        asyncio.create_task(self._listen())
    
    async def _listen(self):
        async for message in self.websocket:
            data = json.loads(message)
            if 'id' in data and data['id'] in self.callbacks:
                future = self.callbacks[data['id']]
                future.set_result(data)
                del self.callbacks[data['id']]
    
    async def send(self, action, params=None):
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
        
        await self.websocket.send(json.dumps(message))
        
        response = await future
        
        if response.get('success'):
            return response.get('result')
        else:
            raise Exception(response.get('error'))
    
    async def init_browser(self, headless=False):
        return await self.send('browser_init', {'headless': headless})
    
    async def navigate(self, url):
        return await self.send('navigate', {'url': url})
    
    async def get_content(self, content_type='text'):
        return await self.send('get_content', {'type': content_type})
    
    async def close_browser(self):
        return await self.send('browser_close', {})
    
    async def close(self):
        if self.websocket:
            await self.websocket.close()

# Usage
async def main():
    client = BraveBrowserWSClient()
    
    try:
        await client.connect()
        
        await client.init_browser()
        print("Browser initialized")
        
        await client.navigate("https://example.com")
        print("Navigated")
        
        content = await client.get_content("text")
        print(f"Content: {content}")
        
        await client.close_browser()
        
    finally:
        await client.close()

asyncio.run(main())
```

---

## 🎨 IDE-Specific Configurations

### **Qoder AI**

```json
{
  "extensions": {
    "brave-real-browser-mcp": {
      "type": "http",
      "enabled": true,
      "config": {
        "endpoint": "http://localhost:3000",
        "timeout": 30000,
        "retries": 3
      }
    }
  }
}
```

### **Postman Collection**

```json
{
  "info": {
    "name": "Brave Browser MCP Server",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Initialize Browser",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{}"
        },
        "url": {
          "raw": "http://localhost:3000/tools/browser_init",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["tools", "browser_init"]
        }
      }
    },
    {
      "name": "Navigate",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"url\": \"https://example.com\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/tools/navigate",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["tools", "navigate"]
        }
      }
    }
  ]
}
```

### **Insomnia Workspace**

```yaml
_type: export
__export_format: 4
resources:
  - _id: req_1
    type: Request
    name: Initialize Browser
    method: POST
    url: http://localhost:3000/tools/browser_init
    headers:
      - name: Content-Type
        value: application/json
    body:
      mimeType: application/json
      text: "{}"

  - _id: req_2
    type: Request
    name: Navigate
    method: POST
    url: http://localhost:3000/tools/navigate
    headers:
      - name: Content-Type
        value: application/json
    body:
      mimeType: application/json
      text: '{"url": "https://example.com"}'
```

---

## 📋 Complete API Reference

### **Browser Management**

```bash
POST /tools/browser_init
Body: {
  "headless": false,
  "proxy": "http://proxy:8080",
  "customConfig": {...}
}

POST /tools/browser_close
Body: {}
```

### **Navigation**

```bash
POST /tools/navigate
Body: {
  "url": "https://example.com",
  "waitUntil": "networkidle2"
}

POST /tools/wait
Body: {
  "type": "selector",
  "value": ".element",
  "timeout": 30000
}
```

### **Interactions**

```bash
POST /tools/click
Body: {
  "selector": "button.submit"
}

POST /tools/type
Body: {
  "selector": "input[name='email']",
  "text": "user@example.com"
}

POST /tools/solve_captcha
Body: {
  "type": "recaptcha"
}
```

### **Content Extraction**

```bash
POST /tools/get_content
Body: {
  "type": "text"  // or "html", "markdown"
}

POST /tools/scrape_table
Body: {
  "selector": "table.data"
}

POST /tools/extract_list
Body: {
  "selector": "ul.items li"
}
```

---

## 🔧 Advanced Usage

### **Environment Variables**

```bash
# Set custom port
export HTTP_PORT=8080
npx brave-real-browser-mcp-server@latest --mode http --port $HTTP_PORT

# Set custom host
export HTTP_HOST=0.0.0.0
npx brave-real-browser-mcp-server@latest --mode http --host $HTTP_HOST
```

### **Docker Configuration**

```dockerfile
FROM node:18

WORKDIR /app

# Install server
RUN npm install -g brave-real-browser-mcp-server@latest

# Expose HTTP port
EXPOSE 3000

# Start server
CMD ["brave-real-browser-mcp-server", "--mode", "http", "--host", "0.0.0.0", "--port", "3000"]
```

```bash
# Build and run
docker build -t brave-browser-server .
docker run -p 3000:3000 brave-browser-server
```

### **systemd Service (Linux)**

```ini
[Unit]
Description=Brave Browser MCP Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/home/your-user
ExecStart=/usr/bin/npx brave-real-browser-mcp-server@latest --mode http --port 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable brave-browser-server
sudo systemctl start brave-browser-server
sudo systemctl status brave-browser-server
```

---

## 🐛 Troubleshooting

### **Server won't start**

```bash
# Check if port is already in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Use different port
npx brave-real-browser-mcp-server@latest --mode http --port 8080
```

### **Connection refused**

```bash
# Check server is running
curl http://localhost:3000/health

# Check firewall
sudo ufw allow 3000  # Linux
```

### **CORS errors**

Server automatically allows all origins. If you need custom CORS:

```javascript
// The server has built-in CORS support
// Headers automatically set:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
// Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 💡 Use Cases

### **1. Web Scraping Service**

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const browser = axios.create({ baseURL: 'http://localhost:3000' });

app.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    await browser.post('/tools/browser_init', {});
    await browser.post('/tools/navigate', { url });
    const content = await browser.post('/tools/get_content', { type: 'text' });
    await browser.post('/tools/browser_close', {});
    
    res.json({ content: content.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(4000, () => {
  console.log('Scraping service running on port 4000');
});
```

### **2. Automated Testing**

```javascript
describe('Website Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = axios.create({ baseURL: 'http://localhost:3000' });
    await browser.post('/tools/browser_init', {});
  });

  afterAll(async () => {
    await browser.post('/tools/browser_close', {});
  });

  it('should load homepage', async () => {
    await browser.post('/tools/navigate', { url: 'https://example.com' });
    const content = await browser.post('/tools/get_content', { type: 'text' });
    expect(content.data).toContain('Example Domain');
  });
});
```

### **3. Monitoring Dashboard**

```javascript
import { useEffect, useState } from 'react';

function BrowserMonitor() {
  const [status, setStatus] = useState('idle');

  const checkWebsite = async () => {
    setStatus('checking...');
    
    try {
      await fetch('http://localhost:3000/tools/browser_init', { method: 'POST' });
      await fetch('http://localhost:3000/tools/navigate', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://mysite.com' })
      });
      
      setStatus('✅ Website is up');
    } catch (error) {
      setStatus('❌ Website is down');
    }
  };

  return (
    <div>
      <h1>Website Monitor</h1>
      <p>Status: {status}</p>
      <button onClick={checkWebsite}>Check Now</button>
    </div>
  );
}
```

---

## 📞 Support

- **GitHub:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server
- **Issues:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues
- **Documentation:** See README.md

---

## ✅ Summary

HTTP और WebSocket modes provide:

✅ **Universal compatibility** - किसी भी IDE/tool के साथ काम करता है  
✅ **No configuration needed** - बस server start करें  
✅ **Multiple languages** - JavaScript, Python, PHP, Go, etc.  
✅ **Real-time communication** - WebSocket support  
✅ **RESTful API** - Standard HTTP endpoints  
✅ **Easy integration** - Simple HTTP requests  

**Start using HTTP/WebSocket mode today for maximum flexibility!** 🚀