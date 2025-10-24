# 📡 SSE (Server-Sent Events) Transport Guide

## Overview

SSE provides **one-way, real-time streaming** from server to client for live browser automation updates.

### Why Use SSE?

- ✅ **Real-time Updates** - Get live progress of browser automation
- ✅ **Simple HTTP-based** - No complex WebSocket setup
- ✅ **Auto-reconnection** - Browser handles reconnection automatically
- ✅ **Firewall Friendly** - Uses standard HTTP
- ✅ **Perfect for Monitoring** - Dashboards, logs, status updates

---

## Quick Start

### Step 1: Start SSE Server

```bash
# Default (port 3001)
npx brave-real-browser-mcp-server@latest --mode sse

# Custom port
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# Custom host and port
npx brave-real-browser-mcp-server@latest --mode sse --sse-port 3001 --host 0.0.0.0
```

**Expected Output:**
```
🟠 [SSE] Starting Server-Sent Events transport...
✅ [SSE] Server running on http://0.0.0.0:3001
📡 [SSE] Event stream available at http://0.0.0.0:3001/events
💡 [SSE] Real-time browser automation events enabled
```

---

## Step 2: Connect to SSE Stream

### Browser (JavaScript)

```javascript
const eventSource = new EventSource('http://localhost:3001/events');

eventSource.onopen = () => {
  console.log('✅ Connected to SSE stream');
};

// Listen for connection event
eventSource.addEventListener('connected', (event) => {
  const data = JSON.parse(event.data);
  console.log('🔗 Connection established:', data);
});

// Listen for browser events
eventSource.addEventListener('browser_init_success', (event) => {
  const data = JSON.parse(event.data);
  console.log('🎬 Browser initialized:', data);
});

eventSource.addEventListener('browser_navigate_success', (event) => {
  const data = JSON.parse(event.data);
  console.log('🌐 Navigated to:', data.url);
});

// Listen for tool events
eventSource.addEventListener('tool_start', (event) => {
  const data = JSON.parse(event.data);
  console.log('🔧 Tool started:', data.tool);
});

eventSource.addEventListener('tool_success', (event) => {
  const data = JSON.parse(event.data);
  console.log('✅ Tool completed:', data.tool);
});

eventSource.addEventListener('tool_error', (event) => {
  const data = JSON.parse(event.data);
  console.error('❌ Tool failed:', data.tool, data.error);
});

eventSource.onerror = (error) => {
  console.error('❌ SSE connection error');
};
```

---

## Step 3: Execute Tools via HTTP

SSE streams are **read-only**. Execute tools using HTTP POST:

```bash
# Check server health
curl http://localhost:3001/health

# Initialize browser (triggers browser_init_start & browser_init_success events)
curl -X POST http://localhost:3001/browser/init \
  -H "Content-Type: application/json" \
  -d '{}'

# Navigate (triggers browser_navigate_start & browser_navigate_success events)
curl -X POST http://localhost:3001/browser/navigate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get page content
curl -X POST http://localhost:3001/browser/get-content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'

# Execute any tool (triggers tool_start & tool_success events)
curl -X POST http://localhost:3001/tools/get_content \
  -H "Content-Type: application/json" \
  -d '{"type": "text"}'
```

---

## SSE Event Types

### Connection Events

| Event | Description | Data |
|-------|-------------|------|
| `connected` | Client connected to stream | `{ clientId, message, timestamp }` |
| Heartbeat | Keep-alive (comment lines) | `: heartbeat` |

### Browser Events

| Event | Description | Data |
|-------|-------------|------|
| `browser_init_start` | Browser initialization started | `{ timestamp }` |
| `browser_init_success` | Browser ready | `{ timestamp }` |
| `browser_init_error` | Browser init failed | `{ error, timestamp }` |
| `browser_navigate_start` | Navigation started | `{ url, timestamp }` |
| `browser_navigate_success` | Navigation completed | `{ url, timestamp }` |
| `browser_navigate_error` | Navigation failed | `{ error, timestamp }` |
| `browser_action` | User action performed | `{ action, selector, timestamp }` |
| `browser_close` | Browser closed | `{ timestamp }` |

### Tool Events

| Event | Description | Data |
|-------|-------------|------|
| `tool_start` | Tool execution started | `{ tool, timestamp }` |
| `tool_success` | Tool completed | `{ tool, timestamp }` |
| `tool_error` | Tool failed | `{ tool, error, timestamp }` |

---

## Complete Examples

### Example 1: React Dashboard

```jsx
import React, { useEffect, useState } from 'react';

function BrowserDashboard() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [browserStatus, setBrowserStatus] = useState('Not initialized');

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/events');

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    eventSource.addEventListener('connected', (e) => {
      addEvent('System', 'Connected to SSE stream', 'info');
    });

    eventSource.addEventListener('browser_init_start', (e) => {
      setBrowserStatus('Initializing...');
      addEvent('Browser', 'Initialization started', 'info');
    });

    eventSource.addEventListener('browser_init_success', (e) => {
      setBrowserStatus('Ready');
      addEvent('Browser', 'Ready for automation', 'success');
    });

    eventSource.addEventListener('browser_navigate_success', (e) => {
      const data = JSON.parse(e.data);
      addEvent('Navigation', `Loaded: ${data.url}`, 'success');
    });

    eventSource.addEventListener('tool_success', (e) => {
      const data = JSON.parse(e.data);
      addEvent('Tool', `${data.tool} completed`, 'success');
    });

    eventSource.addEventListener('tool_error', (e) => {
      const data = JSON.parse(e.data);
      addEvent('Tool', `${data.tool} failed: ${data.error}`, 'error');
    });

    return () => eventSource.close();
  }, []);

  const addEvent = (category, message, level) => {
    setEvents(prev => [{
      category,
      message,
      level,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 100));
  };

  const initBrowser = async () => {
    await fetch('http://localhost:3001/browser/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
  };

  const navigate = async (url) => {
    await fetch('http://localhost:3001/browser/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Browser Automation Dashboard</h1>
        <div className="status">
          <span>SSE: {connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
          <span>Browser: {browserStatus}</span>
        </div>
      </header>

      <div className="controls">
        <button onClick={initBrowser}>Initialize Browser</button>
        <button onClick={() => navigate('https://example.com')}>
          Navigate to Example.com
        </button>
      </div>

      <div className="events-log">
        <h2>Live Events</h2>
        {events.map((event, i) => (
          <div key={i} className={`event ${event.level}`}>
            <span className="time">{event.time}</span>
            <span className="category">{event.category}</span>
            <span className="message">{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BrowserDashboard;
```

### Example 2: Node.js Client

```javascript
const EventSource = require('eventsource');

const es = new EventSource('http://localhost:3001/events');

es.onopen = () => {
  console.log('✅ SSE connected');
};

es.addEventListener('tool_start', (event) => {
  const data = JSON.parse(event.data);
  console.log(`⏳ ${data.tool} started at ${data.timestamp}`);
});

es.addEventListener('tool_success', (event) => {
  const data = JSON.parse(event.data);
  console.log(`✅ ${data.tool} completed at ${data.timestamp}`);
});

es.addEventListener('tool_error', (event) => {
  const data = JSON.parse(event.data);
  console.error(`❌ ${data.tool} failed: ${data.error}`);
});

// Execute automation
async function runAutomation() {
  const fetch = (await import('node-fetch')).default;

  // Initialize browser
  await fetch('http://localhost:3001/browser/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Navigate
  await fetch('http://localhost:3001/browser/navigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' })
  });

  // Get content
  const response = await fetch('http://localhost:3001/browser/get-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text' })
  });

  const result = await response.json();
  console.log('Page content:', result);
}

runAutomation().catch(console.error);
```

### Example 3: Python Client

```python
import json
import requests
from sseclient import SSEClient

# Connect to SSE stream
messages = SSEClient('http://localhost:3001/events')

def handle_event(event):
    if event.event == 'connected':
        data = json.loads(event.data)
        print(f"✅ Connected: {data['message']}")
    
    elif event.event == 'browser_init_success':
        print("🎬 Browser initialized")
    
    elif event.event == 'tool_success':
        data = json.loads(event.data)
        print(f"✅ Tool completed: {data['tool']}")
    
    elif event.event == 'tool_error':
        data = json.loads(event.data)
        print(f"❌ Tool failed: {data['tool']} - {data['error']}")

# Listen for events in background thread
import threading

def listen_sse():
    for msg in messages:
        if msg.event:
            handle_event(msg)

thread = threading.Thread(target=listen_sse, daemon=True)
thread.start()

# Execute automation via HTTP
def init_browser():
    response = requests.post('http://localhost:3001/browser/init', 
                            json={})
    return response.json()

def navigate(url):
    response = requests.post('http://localhost:3001/browser/navigate',
                            json={'url': url})
    return response.json()

def get_content():
    response = requests.post('http://localhost:3001/browser/get-content',
                            json={'type': 'text'})
    return response.json()

# Run automation
print("Initializing browser...")
init_browser()

import time
time.sleep(2)

print("Navigating...")
navigate('https://example.com')

time.sleep(2)

print("Getting content...")
result = get_content()
print(f"Content: {result}")

# Keep script running to receive events
time.sleep(10)
```

---

## SSE vs WebSocket

| Feature | SSE | WebSocket |
|---------|-----|-----------|
| **Direction** | Server → Client (One-way) | Bidirectional |
| **Protocol** | HTTP | WebSocket (ws://) |
| **Reconnection** | Automatic | Manual |
| **Complexity** | Simple | More complex |
| **Browser Support** | All modern browsers | All modern browsers |
| **Firewall Friendly** | ✅ Very (HTTP) | ⚠️ Sometimes blocked |
| **Best For** | Monitoring, logs, dashboards | Interactive apps, chat |

### When to Use SSE

✅ **Monitoring browser automation progress**  
✅ **Real-time dashboards**  
✅ **Live log streaming**  
✅ **Status updates**  
✅ **One-way notifications**

### When to Use WebSocket

✅ **Interactive automation control**  
✅ **Bidirectional communication**  
✅ **Low latency required**  
✅ **Gaming or real-time collaboration**

---

## Troubleshooting

### Issue: Connection Drops

**Solution: Add reconnection logic**

```javascript
function connectSSE() {
  const eventSource = new EventSource('http://localhost:3001/events');
  
  eventSource.onerror = () => {
    console.log('Connection lost. Reconnecting in 3s...');
    eventSource.close();
    setTimeout(connectSSE, 3000);
  };
  
  return eventSource;
}

const es = connectSSE();
```

### Issue: Events Not Received

**Check server is running:**

```bash
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-24T...",
  "protocol": "SSE",
  "clients": 1
}
```

### Issue: CORS Errors

SSE server includes CORS headers by default. If you still have issues:

**Check browser console** for exact error  
**Verify server host/port** configuration

---

## API Reference

### Endpoints

#### GET `/events`
- **Description**: SSE event stream
- **Response**: `text/event-stream`
- **Headers**: 
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

#### GET `/health`
- **Description**: Server health check
- **Response**: `{ status, timestamp, protocol, clients }`

#### GET `/tools`
- **Description**: List all available tools
- **Response**: `{ tools: [...] }`

#### POST `/tools/:toolName`
- **Description**: Execute any tool
- **Body**: Tool arguments
- **Response**: `{ success, result }` or `{ success, error }`

#### POST `/browser/init`
- **Description**: Initialize browser
- **Broadcasts**: `browser_init_start`, `browser_init_success`

#### POST `/browser/navigate`
- **Description**: Navigate to URL
- **Body**: `{ url: string }`
- **Broadcasts**: `browser_navigate_start`, `browser_navigate_success`

#### POST `/browser/click`
- **Description**: Click element
- **Body**: `{ selector: string }`
- **Broadcasts**: `browser_action`

#### POST `/browser/type`
- **Description**: Type text
- **Body**: `{ selector: string, text: string }`
- **Broadcasts**: `browser_action`

#### POST `/browser/get-content`
- **Description**: Get page content
- **Body**: `{ type: 'text' | 'html' }`

#### POST `/browser/close`
- **Description**: Close browser
- **Broadcasts**: `browser_close`

---

## Best Practices

### 1. Handle Reconnection

Always implement reconnection logic for production:

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connectWithRetry() {
  const es = new EventSource('http://localhost:3001/events');
  
  es.onerror = () => {
    es.close();
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(connectWithRetry, delay);
    } else {
      console.error('Max reconnect attempts reached');
    }
  };
  
  es.onopen = () => {
    reconnectAttempts = 0;
    console.log('Connected');
  };
  
  return es;
}
```

### 2. Limit Event History

Don't store unlimited events in memory:

```javascript
const MAX_EVENTS = 100;

function addEvent(event) {
  setEvents(prev => [event, ...prev].slice(0, MAX_EVENTS));
}
```

### 3. Clean Up Connections

Always close SSE connections when component unmounts:

```javascript
useEffect(() => {
  const eventSource = new EventSource('http://localhost:3001/events');
  
  // ... event listeners ...
  
  return () => {
    eventSource.close(); // Clean up on unmount
  };
}, []);
```

### 4. Error Handling

Always handle errors gracefully:

```javascript
eventSource.addEventListener('tool_error', (event) => {
  const data = JSON.parse(event.data);
  
  // Show user-friendly error
  showNotification({
    type: 'error',
    title: 'Automation Failed',
    message: `${data.tool}: ${data.error}`
  });
});
```

---

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start SSE server
pm2 start npx --name "brave-sse-server" -- brave-real-browser-mcp-server@latest --mode sse --sse-port 3001

# View logs
pm2 logs brave-sse-server

# Stop server
pm2 stop brave-sse-server
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

RUN npm install -g brave-real-browser-mcp-server@latest

EXPOSE 3001

CMD ["npx", "brave-real-browser-mcp-server@latest", "--mode", "sse", "--sse-port", "3001", "--host", "0.0.0.0"]
```

```bash
# Build image
docker build -t brave-sse-server .

# Run container
docker run -d -p 3001:3001 --name brave-sse brave-sse-server

# View logs
docker logs -f brave-sse
```

---

## Next Steps

- ✅ [HTTP/REST Guide](./HTTP-GUIDE.md) - Traditional REST API
- ✅ [WebSocket Guide](./WEBSOCKET-GUIDE.md) - Bidirectional real-time
- ✅ [MCP Guide](./MCP-GUIDE.md) - For AI IDEs
- ✅ [LSP Guide](./LSP-GUIDE.md) - For code editors

---

**Need Help?**  
📖 [Full Documentation](../README.md)  
🐛 [Report Issues](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)  
⭐ [Star on GitHub](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server)
