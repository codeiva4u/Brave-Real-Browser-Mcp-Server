# 🌐 Brave Real Browser MCP Server

## Universal AI IDE Support with Advanced Browser Automation

<div align="center">

![Version](https://img.shields.io/badge/version-2.15.5-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![Tools](https://img.shields.io/badge/tools-49-purple.svg)
![IDEs](https://img.shields.io/badge/AI_IDEs-15+-orange.svg)
![License](https://img.shields.io/badge/license-MIT-red.svg)

**सभी AI IDEs के लिए Universal MCP Server | 49 Tools | Browser Automation | Web Scraping | CAPTCHA Solving**

[Installation](#-installation) | [Quick Start](#-quick-start) | [Features](#-key-features) | [Tools](#-available-tools-49) | [IDE Configurations](#-ide-configurations)

</div>

---

## 🎯 What is This?

**Brave Real Browser MCP Server** एक powerful automation tool है जो **Real Brave Browser** का उपयोग करता है। यह साधारण ऑटोमेशन नहीं है, इसमें **In-built Anti-Detection**, **Ad-Blocking**, और **Smart Auto-Install** फीचर्स हैं।

### ✨ Key Features (मुख्य विशेषताएँ)

- ✅ **Automatic Brave Installation**: यदि आपके Windows, Linux, या Mac पर Brave Browser नहीं है, तो यह इसे **अपने आप डाउनलोड और इंस्टॉल** कर लेता है।
- ✅ **Built-in Ad-Blocker (uBlock Origin)**: इसमें **uBlock Origin** पहले से इंस्टॉल आता है जो सभी विज्ञापनों और ट्रैकर्स को ब्लॉक करता है, जिससे पेज तेज़ी से लोड होते हैं और डिटेक्शन का खतरा कम होता है।
- ✅ **Universal Compatibility**: यह Windows, Mac, और Linux तीनों पर समान रूप से काम करता है।
- ✅ **Advanced Video Extraction**: जटिल वीडियो और स्ट्रीमिंग साइटों से वीडियो लिंक निकालने के लिए विशेष टूल्स।
- ✅ **Anti-Detection**: Cloudflare और अन्य सुरक्षा प्रणालियों को बायपास करने में सक्षम।

---

## 🚀 Quick Start

### ⚡ Installation

```bash
# Recommended: Use directly with npx (No install needed)
npx brave-real-browser-mcp-server@latest
```

---

## 🛠️ Available Tools (48)

### 🌐 Core Browser & Navigation (7 tools)
| Tool | Description |
|------|-------------|
| `browser_init` | Initialize browser with auto-install & ad-blocking |
| `browser_close` | Close the browser instance |
| `navigate` | Navigate to a URL with smart wait |
| `wait` | Wait for selectors, navigation, or time |
| `breadcrumb_navigator` | Navigate using site breadcrumbs |
| `url_redirect_tracer` | Trace standard URL redirects |
| `multi_layer_redirect_trace` | Trace complex/hidden redirects |

### 🖱️ Interaction & Input (5 tools)
| Tool | Description |
|------|-------------|
| `click` | Smart click on elements |
| `type` | Human-like typing with delays |
| `press_key` | Simulate keyboard key presses |
| `random_scroll` | Human-like random scrolling |
| `progress_tracker` | Track automation progress |

### 📄 Content Extraction (8 tools)
| Tool | Description |
|------|-------------|
| `get_content` | **Primary Tool** for page content (HTML/Text) |
| `save_content_as_markdown` | Save page as clean Markdown |
| `find_selector` | Find elements containing text |
| `html_elements_extractor` | Extract detailed element info |
| `extract_json` | Extract embedded JSON/API data |
| `scrape_meta_tags` | Extract SEO & Open Graph tags |
| `extract_schema` | Extract Schema.org structured data |
| `image_extractor_advanced` | Advanced image extraction |

### 🔍 Search & Discovery (5 tools)
| Tool | Description |
|------|-------------|
| `keyword_search` | Search for keywords in content |
| `regex_pattern_matcher` | Find patterns using Regex |
| `xpath_support` | Query elements using XPath |
| `advanced_css_selectors` | Complex CSS selector support |
| `api_finder` | Discover hidden API endpoints |

### 🎬 Advanced Video & Media (8 tools)
| Tool | Description |
|------|-------------|
| `advanced_video_extraction` | **Premium** video extractor with ad-bypass |
| `video_source_extractor` | Extract direct video sources |
| `video_player_finder` | Locate video players on page |
| `stream_detector` | Detect HLS/m3u8/DASH streams |
| `video_download_link_finder` | Find direct download buttons/links |
| `media_extractor` | Extract generic media (audio/video) |
| `fetch_xhr` | Capture background XHR requests |
| `network_recorder` | Record full network traffic |

### 🤖 Smart & AI Features (6 tools)
| Tool | Description |
|------|-------------|
| `smart_selector_generator` | AI-powered selector generation |
| `content_classification` | Classify page content type |
| `deobfuscate_js` | Deobfuscate hidden JS code |
| `ad_protection_detector` | Detect anti-adblock systems |
| `batch_element_scraper` | Scrape lists of items efficiently |
| `ajax_content_waiter` | Wait for dynamic AJAX loading |

### 🔐 Captcha & Security (6 tools)
| Tool | Description |
|------|-------------|
| `solve_captcha` | Universal CAPTCHA solver |
| `ocr_engine` | Read text from images (OCR) |
| `audio_captcha_solver` | Solve audio challenges |
| `puzzle_captcha_handler` | Solve puzzle/slider CAPTCHAs |
| `data_type_validator` | Validate extracted data |
| `attribute_harvester` | Collect element attributes |

### 📸 Visual Tools (3 tools)
| Tool | Description |
|------|-------------|
| `element_screenshot` | Capture element screenshots |
| `video_recording` | Record browser session |
| `link_harvester` | Harvest all links from page |

---

## 🎨 IDE Configurations

### 1. Claude Desktop
**File:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
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

### 2. Cursor AI, Windsurf, & Others
Add this to your MCP settings:
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
