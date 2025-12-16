# Setup Instructions for Brave Real Browser MCP Server

The server is installed and verified. To use it with your AI IDE (like Claude Desktop or Antigravity), add the following configuration to your `mcp_config.json` or `claude_desktop_config.json`.

## Configuration

Add this to the `mcpServers` object:

```json
"brave-real-browser": {
  "command": "node",
  "args": [
    "C:\\Users\\Admin\\Desktop\\Brave-Real-Browser-Mcp-Server\\Brave-Real-Browser-Mcp-Server\\dist\\index.js"
  ],
  "env": {
    "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    "HEADLESS": "false"
  }
}
```

## Quick Check
You can verify the path exists by running:
```powershell
Test-Path "C:\Users\Admin\Desktop\Brave-Real-Browser-Mcp-Server\Brave-Real-Browser-Mcp-Server\dist\index.js"
```

## Running the Server manually
If you want to run it manually to see logs:
```bash
npm start
```
