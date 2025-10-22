# 📁 IDE Configurations - Brave Real Browser MCP Server

## 🎯 इस Folder में क्या है?

यह folder सभी 15+ AI IDEs के लिए ready-to-use configuration files और testing guides contain करता है।

---

## 📋 Available Files

### Configuration Files (JSON):

1. **01-claude-desktop.json**
   - Claude Desktop के लिए complete configuration
   - Setup instructions included
   - Troubleshooting tips
   - Alternative configurations

2. **02-cursor-ai.json**
   - Cursor AI के लिए configuration (via Cline extension)
   - autoApprove feature examples
   - Custom Brave path configuration
   - Advanced settings

3. **03-windsurf.json**
   - Windsurf के लिए native MCP configuration
   - Multiple server setup examples
   - Performance optimizations
   - Best practices

4. **04-cline-vscode.json**
   - VSCode + Cline extension configuration
   - Local path options
   - Environment variables
   - Integration tips

5. **05-zed-editor.json**
   - Zed Editor के लिए LSP configuration
   - **Important:** LSP mode required
   - Performance settings
   - Common issues solutions

### Documentation Files:

6. **ALL-IDES-TESTING-GUIDE-HI.md**
   - सभी 15+ IDEs के लिए complete testing guide
   - Step-by-step instructions
   - Test commands for each IDE
   - Verification steps
   - Performance benchmarks

7. **test-all-modes.cjs**
   - Automated testing script
   - Tests HTTP, MCP, और LSP modes
   - Comprehensive test suite
   - Results reporting

---

## 🚀 Quick Start - किसी भी IDE के साथ

### Step 1: अपना IDE चुनें

**Tier 1 (सबसे आसान - Native MCP):**
- Claude Desktop ⭐⭐⭐⭐⭐
- Windsurf ⭐⭐⭐⭐⭐
- Zed Editor ⭐⭐⭐⭐

**Tier 2 (Extension के साथ):**
- Cursor AI ⭐⭐⭐⭐⭐
- VSCode (Cline) ⭐⭐⭐⭐
- VSCodium ⭐⭐⭐⭐

**Tier 3 (HTTP Mode - Universal):**
- Qoder AI, Continue.dev, GitHub Copilot, Tabnine, Cody, Warp Terminal, और सभी अन्य

---

### Step 2: Configuration File देखें

```bash
# JSON file खोलें
cat 01-claude-desktop.json    # Claude Desktop के लिए
cat 02-cursor-ai.json          # Cursor AI के लिए
cat 03-windsurf.json           # Windsurf के लिए
cat 04-cline-vscode.json       # VSCode के लिए
cat 05-zed-editor.json         # Zed Editor के लिए
```

हर JSON file में शामिल है:
- ✅ Configuration JSON
- ✅ Alternative configurations
- ✅ Setup steps
- ✅ Test commands
- ✅ Verification steps
- ✅ Troubleshooting solutions

---

## 💻 IDE-Specific Usage Instructions

### 1️⃣ Claude Desktop

**Configuration File Location:**
```
Windows: %APPDATA%\Claude\claude_desktop_config.json
Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
```

**Quick Setup:**
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

**Steps:**
1. File खोलें या बनाएं
2. JSON paste करें
3. Save करें
4. Claude restart करें
5. Test करें!

---

### 2️⃣ Cursor AI

**Configuration File Location:**
```
Windows: %APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Quick Setup:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "disabled": false,
      "autoApprove": ["browser_init", "navigate", "get_content"]
    }
  }
}
```

**Steps:**
1. Cline extension install करें
2. Configuration file में JSON add करें
3. Cursor restart करें
4. Cline panel खोलें और test करें

---

### 3️⃣ Windsurf

**Configuration File Location:**
```
Windows: %APPDATA%\Windsurf\mcp.json
Mac: ~/.windsurf/mcp.json
```

**Quick Setup:**
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

---

### 4️⃣ VSCode (Cline)

**Configuration File Location:**
```
Windows: %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json
```

**Setup:** Same as Cursor AI (दोनों Cline use करते हैं)

---

### 5️⃣ Zed Editor

**Configuration File Location:**
```
Windows: %APPDATA%\Zed\settings.json
Mac: ~/.config/zed/settings.json
```

**Quick Setup (⚠️ LSP Mode Required):**
```json
{
  "lsp": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest", "--mode", "lsp"]
    }
  }
}
```

**Important:** `--mode lsp` argument जरूरी है!

---

### 6️⃣ HTTP Mode (सभी अन्य IDEs)

**Server Start करें:**
```bash
npx brave-real-browser-mcp-server@latest --mode http --port 3000
```

**Test करें:**
```bash
# Health check
curl http://localhost:3000/health

# Tools list
curl http://localhost:3000/tools

# Browser init
curl -X POST http://localhost:3000/tools/browser_init \
  -H "Content-Type: application/json" \
  -d '{"headless": false}'
```

---

## 🧪 Testing Script Usage

### Automated Testing:

```bash
# सभी modes test करें
node test-all-modes.cjs

# केवल HTTP mode test करें
node test-all-modes.cjs --mode http

# केवल MCP mode test करें
node test-all-modes.cjs --mode mcp

# केवल LSP mode test करें
node test-all-modes.cjs --mode lsp
```

### Test Script Features:
- ✅ Prerequisites check (Node.js, npm, npx)
- ✅ HTTP mode complete testing
- ✅ MCP mode verification
- ✅ LSP mode verification
- ✅ Configuration files validation
- ✅ IDE compatibility check
- ✅ Detailed test results
- ✅ Success/failure reporting

---

## 📚 Complete Testing Guide

**File:** `ALL-IDES-TESTING-GUIDE-HI.md`

यह comprehensive guide में शामिल है:
- 15+ IDEs की complete list
- हर IDE के लिए setup steps
- Test commands और examples
- Verification procedures
- Performance benchmarks
- Troubleshooting solutions
- Best practices
- Comparison matrix

**Usage:**
```bash
# Guide पढ़ें
cat ALL-IDES-TESTING-GUIDE-HI.md

# या
code ALL-IDES-TESTING-GUIDE-HI.md
```

---

## 🎯 Recommendation Matrix

| Your Need | Recommended IDE | Config File |
|-----------|----------------|-------------|
| **Beginners** | Claude Desktop | 01-claude-desktop.json |
| **Developers** | Windsurf / Cursor | 03-windsurf.json / 02-cursor-ai.json |
| **Speed** | Zed Editor | 05-zed-editor.json |
| **VSCode Users** | VSCode + Cline | 04-cline-vscode.json |
| **Universal** | HTTP Mode | Use test-all-modes.cjs |
| **Custom Tools** | HTTP Mode | Server + API calls |

---

## 📖 How to Use These Files

### Method 1: Copy Configuration Directly

```bash
# Example: Claude Desktop के लिए
# 1. JSON file खोलें
cat 01-claude-desktop.json

# 2. "configuration" section copy करें
# 3. अपनी IDE की config file में paste करें
# 4. Save और restart करें
```

### Method 2: Read और Customize

```bash
# 1. JSON file में alternatives देखें
# 2. अपनी needs के according modify करें
# 3. Custom Brave path add करें
# 4. Environment variables set करें
# 5. Save और test करें
```

### Method 3: Follow Step-by-Step Guide

```bash
# 1. JSON file खोलें
# 2. "setupSteps" section follow करें
# 3. "testCommands" से test करें
# 4. "verification" steps से verify करें
# 5. "troubleshooting" section help के लिए
```

---

## 🔍 File Structure Explained

### JSON Configuration Files:

```json
{
  "name": "IDE Name",
  "description": "Description",
  "status": "✅ Status",
  "protocol": "MCP/LSP/HTTP",
  "configFile": {
    "windows": "Path on Windows",
    "mac": "Path on Mac",
    "linux": "Path on Linux"
  },
  "configuration": {
    // Main configuration JSON
  },
  "alternativeConfiguration": {
    // Alternative options
  },
  "setupSteps": [
    // Step-by-step instructions
  ],
  "testCommands": [
    // Commands to test
  ],
  "verification": {
    // How to verify setup
  },
  "troubleshooting": {
    // Common issues and solutions
  },
  "notes": [
    // Important notes
  ]
}
```

---

## 🆘 Troubleshooting

### Common Issues के लिए:

1. **Configuration file नहीं मिल रही:**
   - हर JSON file में "configFile" section देखें
   - Path exactly follow करें
   - Directory create करें if needed

2. **JSON syntax error:**
   - jsonlint.com पर validate करें
   - Trailing commas remove करें
   - Quotes properly escape करें

3. **Server not connecting:**
   - Node.js installed है verify करें
   - npx available है check करें
   - Manual command test करें
   - Logs check करें

4. **Tools नहीं दिख रहे:**
   - IDE completely restart करें
   - Configuration file path verify करें
   - JSON syntax validate करें
   - IDE logs check करें

5. **Performance issues:**
   - Headless mode use करें
   - Browser properly close करें
   - Concurrent operations limit करें
   - Logs monitor करें

---

## 💡 Pro Tips

### सबसे अच्छे Results के लिए:

1. ✅ **JSON files को Reference के रूप में use करें**
   - सभी options documented हैं
   - Examples included हैं
   - Alternatives provided हैं

2. ✅ **Testing Guide Follow करें**
   - Step-by-step instructions हैं
   - Test commands ready हैं
   - Verification steps clear हैं

3. ✅ **Test Script Run करें**
   - Automated testing
   - Quick verification
   - Detailed results

4. ✅ **Backup Configuration रखें**
   - Working config save करें
   - Changes track करें
   - Revert करने में आसान

5. ✅ **Documentation Update रखें**
   - Regular updates check करें
   - New features explore करें
   - Community feedback follow करें

---

## 🔗 Links to Other Documentation

### Project Root:
- **SETUP-GUIDE-HI.md** - विस्तृत सेटअप गाइड
- **QUICK-START-HI.md** - 5 मिनट quick start
- **SETUP-COMPLETE-HI.md** - Complete reference
- **README.md** - English documentation

### This Folder:
- **ALL-IDES-TESTING-GUIDE-HI.md** - Testing guide
- **test-all-modes.cjs** - Testing script
- **01-05 JSON files** - IDE configurations

---

## 📊 IDE Support Summary

### Total IDEs Supported: **15+**

**Tier 1 (Native MCP):** 3 IDEs
- Claude Desktop
- Windsurf
- Zed Editor (LSP)

**Tier 2 (Extension MCP):** 3 IDEs
- Cursor AI
- VSCode
- VSCodium

**Tier 3 (HTTP Mode):** 9+ IDEs
- Qoder AI
- Continue.dev
- GitHub Copilot
- Tabnine
- Cody
- Warp Terminal
- Roo Coder
- JetBrains IDEs
- Custom IDEs

---

## ✅ Final Checklist

Before using any configuration:

- [ ] Node.js 18.0.0+ installed
- [ ] npm और npx working
- [ ] IDE installed
- [ ] Configuration file location identified
- [ ] JSON syntax validated
- [ ] Backup created (if modifying existing config)
- [ ] IDE ready to restart
- [ ] Test commands prepared

---

## 🎉 Success!

इन files के साथ आप:
- ✅ किसी भी IDE को quickly setup कर सकते हैं
- ✅ All 111 tools access कर सकते हैं
- ✅ Troubleshooting खुद से कर सकते हैं
- ✅ Performance optimize कर सकते हैं
- ✅ Custom configurations बना सकते हैं

---

## 📞 Need More Help?

### Documentation:
- 📖 Full Setup Guide: ../SETUP-GUIDE-HI.md
- 📖 Quick Start: ../QUICK-START-HI.md
- 📖 Testing Guide: ALL-IDES-TESTING-GUIDE-HI.md

### Online:
- 🐙 GitHub: https://github.com/withLinda/brave-real-browser-mcp-server
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

**🚀 Happy Configuring! सभी IDEs के साथ automation का मज़ा लें! 🚀**

---

*Last Updated: October 2024*  
*Files: 7 (5 configs + 1 guide + 1 script)*  
*IDEs Covered: 15+*  
*Status: ✅ Complete and Tested*