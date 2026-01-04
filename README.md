# 🌐 Brave Real Browser MCP Server

## Universal AI IDE Support with Advanced Browser Automation

<div align="center">

![Version](https://img.shields.io/badge/version-2.17.10-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Tools](https://img.shields.io/badge/tools-35-purple.svg)
![Optimization](https://img.shields.io/badge/Gemini_3_Pro-Optimized-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | 35 Optimized Tools | Browser Automation | Web Scraping | CAPTCHA Solving**

[Installation](#-installation) | [Quick Start](#-quick-start) | [Features](#-key-features) | [Tools](#-available-tools-35) | [IDE Configurations](#-ide-configurations)

</div>

---

## 🎯 What is This?

**Brave Real Browser MCP Server** एक शक्तिशाली ऑटोमेशन टूल है जो **Real Brave Browser** का उपयोग करता है। यह साधारण ऑटोमेशन नहीं है, इसमें **In-built Anti-Detection**, **Ad-Blocking**, और **Smart Auto-Install** फीचर्स हैं।

> **🆕 New in v2.17.10:** विशेष रूप से **Gemini 3 Pro** और अन्य Large Language Models के लिए अनुकूलित (Optimized)। टूल की संख्या को कम करके (35) और अधिक शक्तिशाली "Unified Tools" बनाकर संदर्भ (Context) को हल्का रखा गया है।

### ✨ Key Features (मुख्य विशेषताएँ)

- ✅ **Gemini 3 Pro Optimized**: कम टोकन उपयोग और तेज़ प्रतिक्रिया के लिए 35 अति-अनुकूलित tools।
- ✅ **Deep Analysis Tool**: एक ही कमांड में नेटवर्क Logs, कंसोल Logs, DOM Snapshot, और स्क्रीनशॉट रिकॉर्ड करें (Trace Recording)।
- ✅ **Unified CAPTCHA Solver**: OCR, Audio, और Puzzle CAPTCHA को एक ही `solve_captcha` टूल से हल करें।
- ✅ **Automatic Brave Installation**: यदि आपके सिस्टम पर Brave Browser नहीं है, तो यह उसे अपने आप इंस्टॉल कर लेता है।
- ✅ **Built-in Ad-Blocker**: uBlock Origin पहले से इंस्टॉल आता है।
- ✅ **Anti-Detection**: Cloudflare और अन्य सुरक्षा प्रणालियों को बायपास करने में सक्षम।

---

## 🚀 Quick Start

### ⚡ Installation

आपको इसे अलग से इंस्टॉल करने की आवश्यकता नहीं है। आप सीधे `npx` का उपयोग कर सकते हैं:

```bash
npx -y brave-real-browser-mcp-server@latest
```

---

## 🛠️ Available Tools (35)

इस नए अपडेट में 48 पुराने टूल्स को घटाकर **35 सुपर-टूल्स** में बदल दिया गया है।

### 🌐 Core Browser & Navigation (7 tools)
| Tool | Description |
|------|-------------|
| `browser_init` | Initialize browser with auto-install & anti-detection |
| `browser_close` | Close the browser instance |
| `navigate` | Navigate to a URL with smart wait |
| `wait` | Wait for selectors, navigation, or time |
| `breadcrumb_navigator` | Navigate using site breadcrumbs |
| `url_redirect_tracer` | Trace standard URL redirects |
| `multi_layer_redirect_trace` | Trace complex/hidden redirects |

### 🔍 Search & Extraction (Unified) (5 tools)
| Tool | Description |
|------|-------------|
| **`search_content`** | (New) Search text OR Regex patterns in one tool |
| **`find_element_advanced`** | (New) Find elements using XPath OR Advanced CSS |
| `get_content` | **Primary Tool** for page content (HTML/Text) |
| `extract_json` | Extract embedded JSON/API data |
| `scrape_meta_tags` | Extract SEO & Open Graph tags |

### 🖱️ Interaction & Input (6 tools)
| Tool | Description |
|------|-------------|
| **`solve_captcha`** | (Unified) Solve Auto, OCR, Audio, & Puzzle CAPTCHAs |
| `click` | Smart click on elements |
| `type` | Human-like typing with delays |
| `press_key` | Simulate keyboard key presses |
| `random_scroll` | Human-like random scrolling |
| `progress_tracker` | Track automation progress |

### 📊 Deep Analysis & Network (5 tools)
| Tool | Description |
|------|-------------|
| **`deep_analysis`** | (New) **Trace Recording**: Logs, Network, DOM, & Screenshot in one go |
| `network_recorder` | Record full network traffic |
| `api_finder` | Discover hidden API endpoints |
| `ad_protection_detector` | Detect anti-adblock systems |
| `ajax_content_waiter` | Wait for dynamic AJAX loading |

### 🎬 Media & Visual (6 tools)
| Tool | Description |
|------|-------------|
| `advanced_video_extraction` | **Premium** video extractor with ad-bypass |
| `media_extractor` | Extract generic media (audio/video) |
| `element_screenshot` | Capture element screenshots |
| `video_recording` | Record browser session |
| `link_harvester` | Harvest all links from page |
| `image_extractor_advanced` | Advanced image extraction |

### 🤖 Smart Automation (6 tools)
| Tool | Description |
|------|-------------|
| `smart_selector_generator` | AI-powered selector generation |
| `content_classification` | Classify page content type |
| `batch_element_scraper` | Scrape lists of items efficiently |
| `extract_schema` | Extract Schema.org structured data |
| `save_content_as_markdown` | Save page as clean Markdown |
| `content_classification` | Classify content |

---

## 🎨 IDE Configurations

### 1. Antigravity AI IDE / Gemini 3 Pro
Add to your config:

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

### 2. Claude Desktop / Cursor AI
**File:** `%APPDATA%\Claude\claude_desktop_config.json`

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

## 🔧 Environment Variables (.env)

```bash
# Optional: Run in headless mode (default: false)
HEADLESS=true

# Optional: Disable content priority
DISABLE_CONTENT_PRIORITY=true

# Optional: Proxy Configuration
PROXY_URL=http://user:pass@host:port
```

---

## 📄 License
MIT License
