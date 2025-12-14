# 🌐 Brave Real Browser MCP Server

## Universal AI IDE Support with Advanced Browser Automation

<div align="center">

![Version](https://img.shields.io/badge/version-2.14.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Tools](https://img.shields.io/badge/tools-108-purple.svg)
![IDEs](https://img.shields.io/badge/AI_IDEs-15+-orange.svg)
![License](https://img.shields.io/badge/license-MIT-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | 108+ Tools | Browser Automation | Web Scraping | CAPTCHA Solving**

[Installation](#-installation) | [Quick Start](#-quick-start) | [Qoder AI Setup](#-qoder-ai---complete-integration-guide) | [Tools](#-available-tools-108) | [IDE Configurations](#-ide-configurations)

</div>

---

## 🎯 What is This?

**Brave Real Browser MCP Server** एक powerful automation tool है जो:

- ✅ **15+ AI IDEs में काम करता है** (Claude, Cursor, Windsurf, Cline, Zed, VSCode, Qoder AI, etc.)
- ✅ **108+ Automation Tools** - Browser control, scraping, CAPTCHA solving, video extraction
- ✅ **MCP Protocol (STDIO)** - Fast and secure local communication
- ✅ **Auto-Detection** - Automatically detects your IDE
- ✅ **Real Brave Browser** - Anti-detection features, bypass Cloudflare
- ✅ **Universal API** - Works with any programming language (JS, Python, PHP, Go, etc.)

---

## 🚀 Quick Start

### ⚡ Quick Setup Summary

**Choose your setup based on your AI Editor:**

| Editor | Setup Time | Protocol | Method |
|--------|-----------|----------|--------|
| **Claude Desktop** | 2 min | MCP | Add config → Restart | 
| **Cursor AI** | 2 min | MCP | Add config → Restart |
| **Windsurf** | 2 min | MCP | Add config → Restart |
| **Qoder AI** | 3 min | MCP (STDIO) | Add config → Restart |

**Quick Commands:**

```bash
# Auto-detect environment
npx brave-real-browser-mcp-server@latest
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
- **Cursor:** `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings<tool_call>_mcp_settings.json`
- **Windsurf:** `%APPDATA%\Windsurf\mcp.json`

### For Qoder AI

**Qoder AI supports MCP servers through **STDIO** (Standard Input/Output).

**Complete step-by-step guide:** [See Qoder AI Integration Guide](#-qoder-ai---complete-integration-guide)

**Quick setup (STDIO):**
1. Add to config: `{"command": "npx", "args": ["-y", "brave-real-browser-mcp-server@latest"]}`
2. Restart Qoder AI
3. Use 108 browser automation tools!

---

## 🤖 Qoder AI - Complete Integration Guide

**Qoder AI** supports MCP servers through **STDIO** (Standard Input/Output).

[Official Documentation](https://docs.qoder.com/user-guide/chat/model-context-protocol)

---

### 🟢 Method 1: STDIO Transport (Recommended for Local)

**STDIO** uses stdin/stdout streams for communication. Perfect for local MCP servers.

#### Step 1: Find Qoder AI MCP Config File

**Config file locations:**

```bash
# Windows
%APPDATA%\Qoder\mcp_settings.json

# Mac
~/Library/Application Support/Qoder/mcp_settings.json

# Linux
~/.config/Qoder/mcp_settings.json
```

#### Step 2: Add STDIO Configuration

**Windows Configuration:**
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

**Mac Configuration:**
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

**Linux Configuration:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["-y", "brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "/usr/bin/brave-browser"
      }
    }
  }
}
```

#### Step 3: Restart Qoder AI

Close and reopen Qoder AI completely.

#### Step 4: Verify Integration

In Qoder AI, test:

```
"List all available MCP tools"
→ Expected: 108 tools from Brave Real Browser

"Use browser_init to start the browser"
→ Expected: Browser opens

"Navigate to https://example.com and get content"
→ Expected: Page content extracted
```

---

### ⚡ Quick Troubleshooting for Qoder AI

**Problem 1: "MCP Server timeout" or "Connection failed"**

**Solution:**
```bash
# Install globally for faster startup
npm install -g brave-real-browser-mcp-server@latest
```

Then update config to:
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "brave-real-browser-mcp-server",
      "args": []
    }
  }
}
```

**Problem 2: "Tools not showing in Qoder AI"**

**Solution:**
1. Check config file path is correct
2. Verify JSON format is valid
3. Restart Qoder AI completely
4. Check Qoder AI logs for errors

**Problem 3: "Browser not opening"**

**Solution:**
```bash
# Set Brave path explicitly in config
"env": {
  "BRAVE_PATH": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
}
```

---

### 📊 Available Tools in Qoder AI

All **108 tools** are available:

✅ **Browser Management:** `browser_init`, `browser_close`  
✅ **Navigation:** `navigate`, `wait`, `click`, `type`  
✅ **Content Extraction:** `get_content`, `scrape_table`, `extract_json`, `scrape_meta_tags`  
✅ **Media Tools:** `video_link_finder`, `image_scraper`, `media_extractor`  
✅ **CAPTCHA Solving:** `solve_captcha`, `ocr_engine`  
✅ **Data Processing:** `price_parser`, `date_normalizer`, `contact_extractor`  
✅ **Visual Tools:** `full_page_screenshot`, `pdf_generation`  
✅ **And 87+ more tools!**

---

## 🎨 IDE Configurations

### Claude Desktop

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

**Configuration Locations:**
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### Cursor AI

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

- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings<tool_call>_mcp_settings.json`
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

## 🛠️ Available Tools (108)

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
| `regex_pattern_finder` | Find patterns using regex    |
| `iframe_extractor`     | Extract iframe content       |
| `embed_page_extractor` | Extract embedded pages       |
| `user_agent_extractor` | Extract user agent info      |

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

### 🛡️ Advanced Extraction & Obfuscation (4 tools)

| Tool                         | Description                 |
| ---------------------------- | --------------------------- |
| `deobfuscate_js`             | Deobfuscate JavaScript      |
| `multi_layer_redirect_trace` | Trace multi-layer redirects |
| `ad_protection_detector`     | Detect ad protection        |
| `url_redirect_tracer`        | Trace URL redirects         |


## 🔧 Environment Variables

```bash
# Optional: Specify Brave browser path
BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# Optional: Run in headless mode
HEADLESS=true

# Optional: Disable content priority
DISABLE_CONTENT_PRIORITY=true
```

## 📊 Supported Protocols

|| Protocol        | Used By                                       | Auto-Config | Status     |
|| --------------- | --------------------------------------------- | ----------- | ---------- |
|| **MCP (STDIO)** | Claude Desktop, Cursor, Windsurf, Cline, Warp | ✅          | 🟢 Working |

## 📄 License

MIT License - See LICENSE file for details.

---

## 🔗 Links

- **GitHub:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server
- **NPM:** https://www.npmjs.com/package/brave-real-browser-mcp-server
- **Issues:** https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues

---

<div align="center">

**🌟 108 Tools | 15+ AI IDEs | MCP Protocol | Universal Support 🌟**

**Made with ❤️ for the AI Development Community**
