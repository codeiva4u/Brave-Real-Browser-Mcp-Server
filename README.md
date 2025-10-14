
⚠️ **UNDER MAINTENANCE** - This project is still being actively developed. Some features may be incomplete or change without notice.

# Brave Real Browser MCP Server

Provides AI assistants with powerful, detection-resistant browser automation capabilities built on ZFC Digital's brave-real-browser package.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

1. [Quick Start for Beginners](#quick-start-for-beginners)
2. [Introduction](#introduction)
3. [Features](#features)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Usage](#usage)
   - [With Claude Desktop](#with-claude-desktop)
   - [With Claude Code CLI](#with-claude-code-cli)
   - [With Cursor IDE](#with-cursor-ide)
   - [With Other AI Assistants](#with-other-ai-assistants)
7. [Available Tools](#available-tools)
8. [Advanced Features](#advanced-features)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)
11. [Development](#development)
12. [Testing](#testing)
13. [Contributing](#contributing)
14. [License](#license)

## Quick Start for Beginners

### What is this?
This is an MCP (Model Context Protocol) server that lets AI assistants like Claude control a real web browser. Think of it as giving Claude "hands" to interact with websites - it can click buttons, fill forms, extract content, and much more, all while avoiding bot detection.

### Important: You DON'T Need to Install This Package!
If you're just using this MCP server (not developing it), you don't need to run `npm install`. The `npx` command in the configuration will automatically download and run the latest version for you. Installation is only required for development purposes.

### Step-by-Step Setup

#### 1. Install Node.js (Required)
- Go to [nodejs.org](https://nodejs.org/)
- Download and install Node.js (version 18 or higher)
- Verify installation by opening terminal/command prompt and typing: `node --version`

## Installation for Developers

> **Note for Claude Desktop Users:** You don't need to install anything! The npx command in your configuration automatically handles everything. Skip to the [Usage](#usage) section.

This section is for developers who want to:
- Contribute to the project
- Run the server locally for development
- Create custom modifications

### Global Installation (For Command Line Usage)

If you want to run the server directly from the command line without using npx:

```bash
npm install -g brave-real-browser-mcp-server@latest
```

After global installation, you can run:
```bash
brave-real-browser-mcp-server
```

### Development Setup (For Contributors)

```bash
# Clone the repository
git clone https://github.com/withLinda/brave-real-browser-mcp-server.git
cd brave-real-browser-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```


#### 2. Configure Claude Desktop

**For Windows:**
1. Open File Explorer and navigate to: `%APPDATA%\Claude\`
2. Open (or create) `claude_desktop_config.json`
3. Add this configuration:

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"]
    }
  }
}
```

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"
      }
    }
  }
}
```

**For Mac:**
1. Open Finder and press `Cmd+Shift+G`
2. Go to: `~/Library/Application Support/Claude/`
3. Open (or create) `claude_desktop_config.json`
4. Add the same configuration as above

**For Linux:**
1. Navigate to: `~/.config/Claude/`
2. Open (or create) `claude_desktop_config.json`
3. Add the same configuration as above

**Why @latest?** The `@latest` tag ensures you always get the most recent version with bug fixes and improvements. The `npx` command automatically downloads and runs it without installing anything permanently on your system.

#### 3. Restart Claude Desktop
Close and reopen Claude Desktop completely.

#### 4. Test It Works
In Claude Desktop, try saying:
> "Initialize a browser and navigate to google.com, then get the page content"

If everything is working, Claude should be able to:
- Start a browser
- Navigate to Google
- Extract and show you the page content

### What Can You Do With It?

Once set up, you can ask Claude to:
- **Browse websites**: "Go to amazon.com and search for laptops"
- **Fill forms**: "Fill out this contact form with my details"
- **Extract data**: "Get all the product prices from this page"
- **Automate tasks**: "Log into my account and download my invoice"
- **Solve captchas**: "Handle any captchas that appear"

### Safety Notes
- Claude will show you what it's doing - you can see the browser window
- Always review what Claude does before approving sensitive actions
- Use headless mode (`headless: true`) if you don't want to see the browser window
- Be respectful of websites' terms of service

## Introduction

The Brave Real Browser MCP Server acts as a bridge between AI assistants
and browser automation. It leverages brave-real-browser to provide stealth
browsing capabilities that can bypass common bot detection mechanisms.

This server implements the Model Context Protocol (MCP), allowing AI
assistants to control a real browser, extract content, and more.

## Features

- **🔄 Auto-Update System**: Automatically updates all dependencies to latest versions on every `npm install`
- **🦁 Brave Browser Exclusive**: Specially designed for Brave Browser with exclusive optimizations
  - Advanced Brave path detection (Registry + File System + Environment Variables)
  - Brave-specific launch arguments and configurations
  - Full compatibility with Brave Browser's privacy features
  - Automatic detection across all Brave versions (Stable, Beta, Dev, Nightly)
- **Stealth by default**: All browser instances use anti-detection features powered by `brave-real-browser`
- **Enhanced cross-platform support**: Comprehensive Brave browser detection on Windows/Mac/Linux
  - **Windows**: Registry-based detection + 15+ installation paths
  - **macOS**: Application bundle detection for all Brave variants
  - **Linux**: Package manager and manual installation detection
- **Smart browser detection**: Multi-layer detection system with automatic fallbacks
- **Connection resilience**: Automatic localhost/127.0.0.1 fallback with port management
- **Multiple retry strategies**: 5 different connection approaches with progressive fallback
- **Advanced configuration**: Full support for all brave-real-browser options
- **Dynamic selector discovery**: Intelligent element finding without hardcoded selectors
- **Random scrolling**: Tools for natural scrolling to avoid detection
- **Comprehensive toolset**: 62+ professional tools covering all browser automation needs
- **Proxy support**: Built-in proxy configuration for enhanced privacy
- **Captcha handling**: Support for solving reCAPTCHA, hCaptcha, and Turnstile
- **Robust error handling**: Advanced error recovery with circuit breaker pattern
- **Stack overflow protection**: Comprehensive protection against infinite recursion
- **Timeout controls**: Automatic timeout mechanisms prevent hanging operations
- **Platform optimization**: Windows-specific flags and longer timeouts for better compatibility

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- **Brave Browser (REQUIRED)** - This project exclusively uses Brave Browser
- Basic understanding of TypeScript/JavaScript (for development)

### Browser Requirements

#### 🦁 Brave Browser (Required)

This project **exclusively uses Brave Browser** and is specifically optimized for the `brave-real-browser` package with advanced integration features.

**Why Brave Browser Exclusively?**
- **🎯 Perfect Compatibility**: Designed specifically for `brave-real-browser` package
- **🔒 Enhanced Privacy**: Built-in ad-blocking and tracking protection
- **🚀 Superior Performance**: Faster page loads and reduced memory usage
- **🛡️ Anti-Detection**: Better stealth capabilities compared to regular browsers
- **✅ Advanced Auto-Detection**: Multi-layer detection system across all platforms
- **🎯 Reliability**: Simplified codebase focused on single browser for better stability
- **🦁 Native Integration**: Custom launch arguments and configurations optimized for Brave

**Install Brave:**
- **All Platforms**: Download from [brave.com/download](https://brave.com/download/)
- Brave is automatically detected in all standard installation locations
- Use `BRAVE_PATH` environment variable for custom installations

**Windows (Advanced Detection):**
- **Registry-Based Detection**: Queries Windows Registry for all Brave installations
- **File System Scanning**: Searches 15+ common installation paths
- **Standard Paths Detected**:
  - System-wide: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
  - 32-bit: `C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe`
  - User-specific: `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe`
  - Portable installations in common directories
- **All Brave Variants Supported**:
  - Brave Browser (Stable)
  - Brave Browser Beta
  - Brave Browser Dev
  - Brave Browser Nightly
- **Environment Variable Support**: `BRAVE_PATH` for custom locations
- **Automatic Fallback**: Progressive detection with multiple strategies

**macOS:**
- **Brave Browser** paths:
  - `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`
  - `/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta`
  - `/Applications/Brave Browser Nightly.app/Contents/MacOS/Brave Browser Nightly`
  - `/Applications/Brave Browser Dev.app/Contents/MacOS/Brave Browser Dev`

**Linux:**
- **Brave Browser** installation:
  - Install: `sudo apt install brave-browser` or from [brave.com](https://brave.com/)
  - Detected paths: `/usr/bin/brave-browser`, `/snap/bin/brave`, `/usr/bin/brave`, `/opt/brave.com/brave/brave-browser`
- Install xvfb for headless operation: `sudo apt-get install -y xvfb`


## Usage

### With Claude Desktop

The configuration below uses `npx` to automatically download and run the latest version. No installation required!

```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"]
    }
  }
}
```

> **What does npx do?** The `npx` command downloads and runs the package without permanently installing it. The `@latest` ensures you always get the newest version with all bug fixes and improvements.

### With Claude Code CLI

Claude Code CLI offers multiple convenient methods to add the brave-real-browser MCP server. Choose the method that best fits your workflow:

#### Method 1: Quick Setup (Recommended)

The fastest way to get started is using the `claude mcp add` command:

```bash
claude mcp add brave-real-browser -- npx brave-real-browser-mcp-server@latest
```

This command:
- Adds the server to your local scope (available only to you in current project)
- Uses npx to automatically download and run the latest version
- No installation required - everything is handled automatically

#### Method 2: Add with Environment Variables

If you need to configure proxy settings or custom Brave paths:

```bash
claude mcp add brave-real-browser \
  -e BRAVE_PATH="/path/to/brave" \
  -e PROXY_URL="http://proxy:8080" \
  -- npx brave-real-browser-mcp-server@latest
```

#### Method 3: Scoped Configuration

**For User-Wide Access (Available Across All Projects):**
```bash
claude mcp add brave-real-browser -s user -- npx brave-real-browser-mcp-server@latest
```

**For Project-Wide Access (Shared with Team via .mcp.json):**
```bash
claude mcp add brave-real-browser -s project -- npx brave-real-browser-mcp-server@latest
```

#### Method 4: JSON Configuration

For advanced users who want precise control:

```bash
claude mcp add-json brave-real-browser '{
  "type": "stdio",
  "command": "npx",
  "args": ["brave-real-browser-mcp-server@latest"],
  "env": {
    "BRAVE_PATH": "/path/to/brave",
    "PROXY_URL": "http://proxy:8080"
  }
}'
```

#### Verification and Testing

After adding the server:

1. **Check MCP Server Status:**
   ```bash
   /mcp
   ```
   This command in Claude Code shows all active MCP servers.

2. **Test the Server:**
   In Claude Code, try:
   > "Initialize a browser and navigate to google.com, then get the page content"

   If working correctly, you should see:
   - Browser initialization
   - Navigation to Google
   - Page content extracted and displayed

#### Configuration Scopes Explained

| Scope | Description | Config Location | Use Case |
|-------|-------------|----------------|----------|
| **local** (default) | Available only to you in current project | `.mcp.json` in project | Testing, project-specific |
| **project** | Shared with entire team | `.mcp.json` committed to repo | Team collaboration |
| **user** | Available to you across all projects | User config directory | Personal productivity |

#### Benefits of Claude Code CLI

- **Automatic Updates**: Using `@latest` ensures you get bug fixes and improvements
- **No Installation**: npx handles downloading and running automatically  
- **Environment Variables**: Easy configuration of proxies, Brave paths, etc.
- **Scope Control**: Choose where the server is available (local/project/user)
- **Team Sharing**: Project scope allows sharing configurations with teammates
- **Status Monitoring**: Built-in `/mcp` command for server health checks

### With Cursor IDE

Cursor IDE uses the same npx approach - no installation needed! Here are the setup methods:

#### Method 1: One-Click Installation (Recommended)

1. **Open Cursor IDE**
2. **Open Command Palette** (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on Mac)
3. **Search for "Cursor Settings"** and select it
4. **Click on "MCP" in the sidebar**
5. **Browse curated MCP servers** and install browser automation tools with one-click
6. **OAuth authentication** will be handled automatically

#### Method 2: Manual Configuration

**Configuration File Location:**
- **Project-specific**: Create `.cursor/mcp.json` in your project directory
- **Global**: Create `~/.cursor/mcp.json` in your home directory

**Basic Configuration (No Installation Required):**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"]
    }
  }
}
```

> **Important:** Just like Claude Desktop, Cursor will use `npx` to automatically download and run the server. You don't need to install anything with npm!

**Windows-Specific Configuration (if experiencing Brave path issues):**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"
      }
    }
  }
}
```

> **Note**: Browser options like headless mode should be configured when initializing the browser through the `browser_init` tool, not via environment variables.

**Advanced Configuration with Custom Brave Path:**
```json
{
  "mcpServers": {
    "brave-real-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server@latest"],
      "env": {
        "BRAVE_PATH": "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"
      }
    }
  }
}
```

> **Note**: Proxy settings and browser options should be configured when asking Claude to initialize the browser using the `browser_init` tool.

#### Platform-Specific Brave Paths for Cursor IDE

If Brave auto-detection fails, you can specify the Brave path using the `BRAVE_PATH` environment variable:

**Windows:**
```json
"env": {
  "BRAVE_PATH": "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe"
}
```
Alternative Windows paths:
- `"C:/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe"`
- `"%LOCALAPPDATA%/BraveSoftware/Brave-Browser/Application/brave.exe"`

**macOS:**
```json
"env": {
  "BRAVE_PATH": "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
}
```

**Linux:**
```json
"env": {
  "BRAVE_PATH": "/usr/bin/brave-browser"
}
```
Alternative Linux paths: `/snap/bin/brave`, `/usr/bin/brave`, `/opt/brave.com/brave/brave-browser`


#### Testing Cursor IDE Setup

After configuration:
1. **Restart Cursor IDE completely**
2. **Open a new chat** 
3. **Test with**: "Initialize a browser and navigate to google.com, then get the page content"

If successful, you should see:
- Browser window opening
- Navigation to Google
- Page content extracted and displayed in the chat

#### Cursor IDE Troubleshooting

**Common Issues:**

1. **"MCP server not found"**
   - Verify config file location and JSON syntax
   - Use [jsonlint.com](https://jsonlint.com/) to validate JSON
   - Ensure Node.js 18+ is installed

2. **"Browser failed to launch" on Windows**
   - Add explicit Brave path in `BRAVE_PATH` environment variable
   - Try running Cursor IDE as Administrator
   - Check Windows Defender isn't blocking Brave Browser

3. **"Permission denied"**
   - Use `sudo npm install -g brave-real-browser-mcp-server` on Linux/Mac
   - Run Command Prompt as Administrator on Windows

4. **Configuration not loading**
   - Ensure file is named exactly `mcp.json` (not `mcp.json.txt`)
   - Check file is in correct directory
   - Restart Cursor IDE after changes

### With Other AI Assistants

Start the server:

```bash
brave-real-browser-mcp-server
```

Or if installed from source:

```bash
npm start
```

The server communicates via stdin/stdout using the MCP protocol.

### Example Interactions

#### Basic Web Browsing
```text
User: "Initialize a browser and navigate to example.com"
AI: I'll initialize a stealth browser and navigate to the website.
[Uses browser_init and navigate tools]

```

#### Form Automation
```text
User: "Fill in the search form with 'test query'"
AI: I'll type that into the search field.
[Uses type tool with selector and text]

User: "Click the search button"
AI: I'll click the search button.
[Uses click tool]
```

#### Data Extraction
```text
User: "Get all the product names from this e-commerce page"
AI: I'll extract the product information from the page.
[Uses get_content tool with appropriate selectors]

User: "Save the page content as text"
AI: I'll get the text content of the entire page.
[Uses get_content tool with type: 'text']

User: "Save this page content as a markdown file"
AI: I'll extract the page content and save it as a formatted markdown file.
[Uses save_content_as_markdown tool with specified file path]
```


#### Working with Proxies
```text
User: "Initialize a browser with a proxy server"
AI: I'll set up the browser with your proxy configuration.
[Uses browser_init with proxy: "https://proxy.example.com:8080"]
```

## Available Tools

### 🎯 **Complete Professional Toolset - 62 Tools**

This MCP server provides **62 professional-grade tools** organized into 11 major categories:

### 🔥 **Core Browser Management (11 Tools)**
1. `browser_init` - Initialize stealth browser with advanced options
2. `navigate` - Navigate to a URL
3. `get_content` - Get page content (HTML or text) 
4. `click` - Click on elements
5. `type` - Type text into input fields
6. `wait` - Wait for various conditions
7. `browser_close` - Close browser instance
8. `solve_captcha` - Solve captchas (reCAPTCHA, hCaptcha, Turnstile)
9. `random_scroll` - Natural scrolling behavior
10. `find_selector` - Find CSS selectors by text content
11. `save_content_as_markdown` - Save page content as markdown

### 📊 **Smart Data Extractors (5 Tools)**
12. `scrape_table` - Extract structured data from HTML tables
13. `extract_list` - Extract data from bullet and numbered lists
14. `extract_json` - Extract embedded JSON/API data
15. `scrape_meta_tags` - Extract SEO meta tags and Open Graph data
16. `extract_schema` - Extract Schema.org structured data

### 🔄 **Multi-Element Extractors (7 Tools)**
17. `batch_element_scraper` - Scrape multiple similar elements in batch
18. `nested_data_extraction` - Extract data maintaining parent-child relationships
19. `attribute_harvester` - Collect element attributes (href, src, data-*)
20. `image_scraper` - Extract image URLs, alt text, dimensions
21. `link_harvester` - Collect internal/external links with classification
22. `media_extractor` - Extract video, audio, iframe URLs and metadata
23. `pdf_link_finder` - Find downloadable files (PDF, DOC, etc.)

### 📄 **Pagination Tools (5 Tools)**
24. `auto_pagination` - Automatically detect and navigate through pages
25. `infinite_scroll` - Handle lazy-loading pages with auto-scroll
26. `multi_page_scraper` - Collect data from multiple pages
27. `sitemap_parser` - Extract URLs from sitemap.xml
28. `breadcrumb_navigator` - Navigate site structure using breadcrumbs

### 🧹 **Data Processing Tools (8 Tools)**
29. `smart_text_cleaner` - Clean and normalize text data
30. `html_to_text` - Convert HTML to clean text
31. `price_parser` - Extract numbers from currency strings
32. `date_normalizer` - Convert various date formats to standard format
33. `contact_extractor` - Detect phone numbers and email addresses
34. `schema_validator` - Validate data against JSON schema
35. `required_fields_checker` - Check for missing required fields
36. `duplicate_remover` - Remove duplicate items from arrays

### 🤖 **AI-Powered Features (5 Tools)**
37. `smart_selector_generator` - AI-based CSS selector generation
38. `content_classification` - Classify webpage content into categories
39. `sentiment_analysis` - Analyze sentiment of page content
40. `summary_generator` - Generate page content summaries using TF-IDF
41. `translation_support` - Detect language and provide translation info

### 🔍 **Search & Filter Tools (5 Tools)**
42. `keyword_search` - Advanced keyword search with context
43. `regex_pattern_matcher` - Search using regular expressions
44. `xpath_support` - Query elements using XPath expressions
45. `advanced_css_selectors` - Support for complex CSS selectors
46. `visual_element_finder` - Find elements by visual properties

### 🔧 **Data Quality & Validation (5 Tools)**
47. `data_deduplication` - Advanced duplicate removal with fuzzy matching
48. `missing_data_handler` - Detect and handle missing data
49. `data_type_validator` - Validate data types against JSON schema
50. `outlier_detection` - Detect outliers in numerical data
51. `consistency_checker` - Check data consistency across fields

### 🛡️ **Advanced Captcha Handling (3 Tools)**
52. `ocr_engine` - Extract text from images using OCR
53. `audio_captcha_solver` - Handle audio captchas
54. `puzzle_captcha_handler` - Handle slider and puzzle captchas

### 📸 **Screenshot & Visual Tools (5 Tools)**
55. `full_page_screenshot` - Capture complete page screenshots
56. `element_screenshot` - Capture screenshots of specific elements
57. `pdf_generation` - Convert pages to PDF
58. `video_recording` - Record browser sessions
59. `visual_comparison` - Compare two screenshots for differences

### 🌐 **Website API Integration (3 Tools)**
60. `rest_api_endpoint_finder` - Discover REST API endpoints
61. `webhook_support` - Set up and test webhooks
62. `all_website_api_finder` - Comprehensive API discovery

---

### 📝 **Usage Examples**

| Category | Example Usage |
|----------|---------------|
| **Basic Browsing** | `browser_init` → `navigate` → `get_content` |
| **Data Extraction** | `scrape_table` → `smart_text_cleaner` → `duplicate_remover` |
| **Form Automation** | `find_selector` → `type` → `click` → `wait` |
| **Content Analysis** | `get_content` → `sentiment_analysis` → `summary_generator` |
| **Visual Capture** | `full_page_screenshot` → `element_screenshot` |
| **Quality Control** | `data_type_validator` → `consistency_checker` |

## Advanced Features

### Dynamic Selector Discovery

The server includes intelligent element discovery capabilities through the `find_selector` tool:

- **Text-based element finding**: Automatically locates elements containing specific text
- **Smart CSS selector generation**: Creates unique, robust CSS selectors similar to Brave DevTools
- **Element type filtering**: Optionally restrict search to specific HTML elements (e.g., buttons, links)
- **Exact or partial text matching**: Choose between precise text matching or substring searches
- **Universal compatibility**: Works across any website without hardcoded selectors

**Example Usage:**
```text
User: "Find the submit button that says 'Sign Up'"
AI: I'll locate that button for you.
[Uses find_selector with text: "Sign Up", elementType: "button"]

AI: Found button at selector: "form > button.btn-primary:nth-of-type(2)"
```

This approach eliminates the need for manually crafted selectors and makes automation more reliable across different websites.

### Natural Interactions

The server includes tools designed for natural browsing behavior:

- **Random scrolling**: Performs scrolling with natural timing and variable distances

This feature helps avoid detection by sophisticated bot-detection systems
that analyze user behavior patterns.

### Captcha Handling

The server includes basic support for solving common captcha types:

- reCAPTCHA
- hCaptcha
- Cloudflare Turnstile

Note that captcha solving capabilities depend on the underlying
brave-real-browser implementation.

## Configuration

### Automatic Brave Path Detection (Enhanced in v2.9.5)

The server automatically detects Brave Browser installation paths across different operating systems with advanced multi-layer detection:

- **Windows (v2.9.5+)**: 
  - Registry-based detection for all installed Brave versions
  - Searches 15+ common installation directories including Program Files, user-specific locations, and portable installations
  - Support for all Brave variants (Stable, Beta, Dev, Nightly)
  - Environment variable detection (`BRAVE_PATH`, `CHROME_PATH` for fallback)
  - Detailed troubleshooting guidance when Brave is not found
  
- **macOS**: Detects Brave in all Application bundle locations for all variants

- **Linux**: Checks multiple locations including package manager installations and manual installs

**Advanced Brave Detection** (Enhanced in v2.9.5):
The server now uses sophisticated multi-layer detection combining Windows Registry queries, file system scanning, and environment variables for maximum compatibility.

If Brave is not found automatically, you can specify a custom path using:
1. Environment variable: `set BRAVE_PATH="C:\Your\Brave\Path\brave.exe"`
2. Browser init option: `customConfig.chromePath` when initializing the browser (legacy Chrome path support)

### Configuring Custom Options (like headless mode)
Custom options like headless mode are **not configured in the MCP config file**. Instead, they're passed when initializing the browser using the `browser_init` tool:

When you ask Claude to initialize a browser, you can specify options like:

```
Please initialize a browser with headless mode enabled and a 30-second timeout
```

Claude will then use the `browser_init` tool with appropriate parameters:

```json
{
  "headless": true,
  "connectOption": {
    "timeout": 30000
  }
}
```

### Available Browser Options
When initializing with `browser_init`, you can configure:

- `headless`: true/false (Set to true for headless operation)
- `disableXvfb`: true/false (Disable X Virtual Framebuffer)
- `ignoreAllFlags`: true/false (Ignore all Brave browser flags)
- `proxy`: "https://proxy:8080" (Proxy server URL)
- `plugins`: ["plugin1", "plugin2"] (Array of plugins to load)
- `connectOption`: Additional connection options like:
  - `slowMo`: 250 (Slow down operations by milliseconds)
  - `timeout`: 60,000 (Connection timeout)

The MCP config file only tells Claude where to find the server - all browser-specific options are configured through your conversations with Claude.

### Browser Options Example

When initializing the browser with `browser_init`, you can configure:

```json
{
  "headless": false,
  "disableXvfb": false,
  "ignoreAllFlags": false,
  "proxy": "https://proxy:8080",
  "plugins": ["plugin1", "plugin2"],
  "connectOption": {
    "slowMo": 250,
    "timeout": 60000
  }
}
```

### Advanced Configuration Examples

#### Specifying Custom Brave Path
```json
{
  "customConfig": {
    "chromePath": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}
```

#### Using a Proxy
```json
{
  "headless": true,
  "proxy": "https://username:password@proxy.example.com:8080"
}
```

#### Stealth Mode with Custom Options
```json
{
  "headless": false,
  "ignoreAllFlags": true,
  "disableXvfb": false,
  "connectOption": {
    "slowMo": 100,
    "devtools": false
  }
}
```


### Server Configuration

For advanced users, you can modify the server behavior by editing the source code:

- Change default viewport size in the `initializeBrowser` function
- Adjust timeout values for various operations
- Enable debug logging

## Troubleshooting

### Major Windows Connection Issues (Fixed in v1.3.0)

**🔧 ECONNREFUSED Error Solutions**

Version 1.3.0 includes comprehensive fixes for the `connect ECONNREFUSED 127.0.0.1:60725` error commonly experienced on Windows systems:

**Enhanced Brave Path Detection:**
- Added Windows Registry-based Brave detection for all variants
- Expanded search to 15+ Windows installation locations including portable installations
- Added support for all Brave versions (Stable, Beta, Dev, Nightly)
- Environment variable support (`BRAVE_PATH`, `CHROME_PATH` for legacy fallback)

**Windows-Specific Launch Optimizations:**
- 20+ Windows-specific Brave browser flags for better compatibility
- Multiple fallback strategies (5 different connection approaches)
- Progressive retry logic with exponential backoff
- Enhanced timeout handling (120s for Windows vs 90s for other platforms)

**Connection Resilience Features:**
- Localhost vs 127.0.0.1 fallback handling (fixes known Puppeteer issue)
- Port availability checking and automatic port assignment
- Network connectivity testing before browser launch
- Enhanced error categorization and automatic fallback strategies

**If you're still experiencing ECONNREFUSED errors:**

1. **Environment Variables (Recommended):**
   ```bash
   set BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
   ```

2. **Manual Brave Path Configuration:**
   ```text
   Ask Claude: "Initialize browser with custom Brave path at C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
   ```

3. **Network Troubleshooting:**
   ```bash
   # Test localhost resolution
   ping localhost
   # Should resolve to 127.0.0.1
   
   # Check Windows hosts file
   notepad C:\Windows\System32\drivers\etc\hosts
   # Ensure: 127.0.0.1 localhost
   ```

4. **Brave Process Management:**
   ```bash
   # Kill existing Brave processes
   taskkill /f /im brave.exe
   ```

### Common Issues

#### npx-Specific Issues

1. **"spawn npx ENOENT" or "command not found" errors**
   - **Cause:** npx is not in your system PATH or Node.js is not properly installed
   - **Solutions:**
     - Verify Node.js installation: `node --version` and `npm --version`
     - Reinstall Node.js from [nodejs.org](https://nodejs.org/)
     - For NVM users, see the NVM-specific section below

2. **"npx: command not found" in Claude Desktop/Cursor**
   - **Windows:** Make sure to restart your IDE after installing Node.js
   - **Mac/Linux:** Add npm to PATH: `export PATH="$PATH:$(npm bin -g)"`
   - **Alternative:** Use the full path to npx: `/usr/local/bin/npx`

3. **npx hangs or takes too long**
   - npx downloads the package on first run, which can take 30-60 seconds
   - Ensure you have a stable internet connection
   - Try clearing npm cache: `npm cache clean --force`

4. **Using NVM (Node Version Manager)?**
   - Standard npx commands may fail with NVM
   - **Solution 1:** Use absolute paths in your config:
     ```json
     {
       "mcpServers": {
         "brave-real-browser": {
           "command": "/Users/yourname/.nvm/versions/node/v20.0.0/bin/npx",
           "args": ["brave-real-browser-mcp-server@latest"]
         }
       }
     }
     ```
   - **Solution 2:** Set a default Node version: `nvm alias default 20.0.0`

5. **Permission denied errors with npx**
   - **Mac/Linux:** Try with sudo: `sudo npx brave-real-browser-mcp-server@latest`
   - **Better solution:** Fix npm permissions: `npm config set prefix ~/.npm`

#### Other Common Issues

1. **"Maximum call stack size exceeded" errors**
   - This was fixed in version 1.2.0 with comprehensive stack overflow protection
   - The server now includes circuit breaker patterns and recursion depth tracking
   - Timeout controls prevent hanging operations that could lead to stack overflow
   - If you encounter this error, ensure you're using the latest version: `npx brave-real-browser-mcp-server@latest`

2. **"command not found" or "syntax error" when using npx**
   - This was fixed in version 1.0.3 with the addition of a proper shebang line
   - Make sure you're using the latest version: `npx brave-real-browser-mcp-server@latest`
   - For global installation: `npm install -g brave-real-browser-mcp-server@latest`
   - If still having issues, install globally: `npm install -g brave-real-browser-mcp-server`
   - Check your PATH includes npm global binaries: `npm config get prefix`

3. **Browser won't start**
   - Check if Brave Browser is installed in standard locations
   - **Windows specific troubleshooting**:
     
     **Step 1: Verify Brave Installation Paths**
     Check these locations in order:
     - `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
     - `C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe`
     - `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe`
     - `%PROGRAMFILES%\BraveSoftware\Brave-Browser\Application\brave.exe`
     
     **Step 2: Manual Path Configuration**
     If Brave is in a different location, specify it manually:
     ```
     Ask Claude: "Initialize browser with custom Brave path at C:\Your\Brave\Path\brave.exe"
     ```
     
     **Step 3: Windows Launch Arguments**
     For Windows compatibility, use these launch arguments:
     ```
     Ask Claude: "Initialize browser with args --disable-gpu --disable-setuid-sandbox"
     ```
     
     **Step 4: Windows-Specific Solutions**
     - **Run as Administrator**: Try running your IDE/terminal as Administrator
     - **Windows Defender**: Add Brave Browser and Node.js to Windows Defender exclusions
     - **Antivirus Software**: Temporarily disable antivirus to test if it's blocking Brave
     - **User Account Control**: Lower UAC settings temporarily for testing
     - **Brave Processes**: Kill any existing Brave processes in Task Manager
     
     **Step 5: Alternative Brave Installation**
     If Brave detection still fails:
     - Download Brave directly from [brave.com/download](https://brave.com/download/)
     - Install to default location (`C:\Program Files\BraveSoftware\Brave-Browser\`)
     - Restart your IDE after installation
     
     **Step 6: PowerShell vs Command Prompt**
     Try switching between PowerShell and Command Prompt:
     - Test with `cmd.exe` instead of PowerShell
     - Test with PowerShell instead of Command Prompt
     
     **Step 7: Node.js and npm Configuration**
     - Ensure Node.js is added to PATH: `node --version`
     - Clear npm cache: `npm cache clean --force`
     - Reinstall global packages: `npm install -g brave-real-browser-mcp-server@latest`
     
   - **Linux**: Install Brave: `sudo apt install brave-browser` or from [brave.com](https://brave.com/)
   - **macOS**: Ensure Brave is in `/Applications/Brave Browser.app/`
   - Try with `headless: true` first
   - Check console output for Brave path detection messages

4. **Claude doesn't see the MCP server**
   - Verify `claude_desktop_config.json` is in the correct location
   - Check JSON syntax is valid (use [jsonlint.com](https://jsonlint.com/))
   - Restart Claude Desktop completely
   - Check for any error messages in Claude Desktop

**4a. Claude Code CLI doesn't see the MCP server**
   - **Installation Issues**:
     - Verify `claude mcp add` command was successful
     - Check command syntax: `claude mcp add brave-real-browser -- npx brave-real-browser-mcp-server@latest`
     - Ensure you have the latest Claude Code CLI version
   
   - **Scope and Configuration**:
     - Check which scope you used: local (default), project, or user
     - For local scope: ensure you're in the correct project directory
     - For project scope: verify `.mcp.json` exists in project root
     - For user scope: check user config directory
   
   - **MCP Server Status**:
     - Use `/mcp` command in Claude Code to check server status
     - Look for the "brave-real-browser" server in the list
     - Check if server status shows "connected" or error messages
   
   - **Environment Variables**:
     - If using custom environment variables (Brave path, proxy), verify they're correctly set
     - Test without environment variables first: `claude mcp add brave-real-browser -- npx brave-real-browser-mcp-server@latest`
   
   - **Node.js and npx Issues**:
     - Verify Node.js version 18+: `node --version`
     - Test npx directly: `npx brave-real-browser-mcp-server@latest`
     - Clear npm cache: `npm cache clean --force`
   
   - **Protocol Version Issues** (Known Issue):
     - Claude CLI may show protocolVersion validation errors despite correct configuration
     - This is a known issue with internal validation in Claude CLI
     - Server may still work despite validation warnings
   
   - **Re-adding Server**:
     ```bash
     # Remove and re-add if issues persist
     claude mcp remove brave-real-browser
     claude mcp add brave-real-browser -- npx brave-real-browser-mcp-server@latest
     ```

**4b. Cursor IDE doesn't see the MCP server**
   - **Config File Location Issues**:
     - Verify `mcp.json` is in the correct location:
       - Global: `~/.cursor/mcp.json` (`%USERPROFILE%\.cursor\mcp.json` on Windows)
       - Project: `.cursor/mcp.json` in your project root
     - Ensure filename is exactly `mcp.json` (not `mcp.json.txt`)
     - Check file permissions allow reading
   
   - **JSON Syntax Validation**:
     - Use [jsonlint.com](https://jsonlint.com/) to validate JSON syntax
     - Common issues: missing commas, incorrect quotes, trailing commas
     - Ensure proper escaping of Windows paths: `"C:/Program Files/Google/Chrome/Application/chrome.exe"`
   
   - **Cursor IDE Restart Process**:
     - Close Cursor IDE completely (check Task Manager on Windows)
     - Wait 5 seconds
     - Restart Cursor IDE
     - Open Command Palette and check MCP servers are listed
   
   - **Environment Variables**:
     - Verify Node.js is accessible: `node --version`
     - Check PATH includes npm: `npm --version`
     - Clear any conflicting environment variables
   
   - **Cursor IDE Version Compatibility**:
     - Ensure Cursor IDE version supports MCP (latest versions)
     - Update Cursor IDE if using an older version
     - Check Cursor IDE documentation for MCP requirements

5. **Permission denied errors**
   - On Linux/Mac: Try `sudo npm install -g brave-real-browser-mcp-server`
   - Or use nvm to manage Node.js without sudo
   - On Windows: Run command prompt as Administrator

6. **Detection issues**
   - Use appropriate delays between actions for better reliability
   - Add random delays with `random_scroll`
   - Use proxy if needed: `proxy: "http://proxy.example.com:8080"`

7. **Memory leaks**
   - Always close browser instances with `browser_close` when done
   - Don't initialize multiple browsers without closing previous ones
   - Check for uncaught exceptions that might prevent cleanup

8. **Timeout errors**
   - Increase timeout values: `{ "timeout": 60000 }`
   - Use `wait` tool before interacting with elements
   - Check network connectivity and website response times

### Frequently Asked Questions

**Q: When should I use npm install vs npx?**
A: 
- **Use npx (recommended for most users):** When using with Claude Desktop, Claude Code CLI, or Cursor IDE. The npx command in your config automatically downloads and runs the latest version without installation.
- **Use npm install -g:** Only if you want to run the server directly from command line frequently, or if you're developing/contributing to the project.
- **Never needed:** If you're just a Claude Desktop/Claude Code CLI user following the Quick Start guide - npx handles everything!

**Q: Should I use Claude Desktop or Claude Code CLI?**
A: Both are excellent choices, depending on your needs:

**Claude Desktop:**
- **Best for:** Simple web browsing automation, content extraction, basic form filling
- **Setup:** Manual JSON config file editing
- **Sharing:** Individual use only
- **Interface:** Desktop GUI application
- **Authentication:** None required

**Claude Code CLI:**
- **Best for:** Development workflows, team collaboration, project-specific automation
- **Setup:** Simple command-line setup (`claude mcp add`)
- **Sharing:** Supports team sharing via project scope
- **Interface:** Command-line integration with IDEs
- **Authentication:** OAuth support available
- **Advanced Features:** Environment variables, scope control, server monitoring

**Use Claude Code CLI if you:**
- Work in development teams
- Need project-specific browser automation
- Want environment variable configuration
- Prefer command-line workflows
- Need server health monitoring

**Use Claude Desktop if you:**
- Want a simple GUI experience
- Do individual browsing automation
- Don't need team collaboration features
- Prefer visual interfaces over command-line

**Q: Why do we use @latest in the npx command?**
A: The `@latest` tag ensures you always get the newest version with bug fixes and security updates. Without it, npx might cache an older version. It's especially important for actively maintained projects.

**Q: Does this work with headless browsers?**
A: Yes, set `headless: true` in browser_init options.

**Q: Can I use multiple browsers at once?**
A: Currently supports one browser instance. Close the current one before starting a new one.

**Q: What captchas can it solve?**
A: Supports reCAPTCHA, hCaptcha, and Cloudflare Turnstile through brave-real-browser.

**Q: Is this detectable by websites?**
A: brave-real-browser includes anti-detection features, but no solution is 100% undetectable.

**Q: Can I use custom Brave extensions?**
A: Yes, through the `plugins` option in browser_init. Brave extensions and Chrome extensions are compatible.

**Q: Does it work on all operating systems?**
A: Yes, tested on Windows, macOS, and Linux. The server automatically detects Brave Browser installations on all platforms with advanced multi-layer detection.

**Q: What's the difference between Claude Desktop, Claude Code CLI, and Cursor IDE configurations?**
A: Here's a comparison:

| Feature | Claude Desktop | Claude Code CLI | Cursor IDE |
|---------|---------------|-----------------|------------|
| **Setup Method** | Manual JSON editing | Command-line (`claude mcp add`) | One-click install OR manual JSON |
| **Config Location** | `claude_desktop_config.json` | `.mcp.json` (scoped) | `.cursor/mcp.json` |
| **Team Sharing** | No | Yes (project scope) | Yes |
| **Environment Variables** | Limited support | Full support | Full support |
| **Scope Control** | No | Yes (local/project/user) | Project/Global |
| **Server Monitoring** | No | Yes (`/mcp` command) | Limited |
| **Authentication** | None | OAuth available | OAuth available |
| **Best For** | Individual GUI use | Development teams | Code-focused workflows |

**Command Examples:**
- **Claude Desktop**: Edit config file with JSON
- **Claude Code CLI**: `claude mcp add brave-real-browser -- npx brave-real-browser-mcp-server@latest`
- **Cursor IDE**: One-click install or manual JSON config

**Q: What if Brave is installed in a non-standard location?**
A: Version 2.9.5 dramatically improves Brave detection with multi-layer scanning. The server now searches 15+ locations including portable installations and uses Windows Registry detection for all Brave variants. If Brave is still not found automatically, you can:
1. Set environment variable: `set BRAVE_PATH="C:\Your\Brave\Path\brave.exe"`
2. Use the `customConfig.chromePath` option: `{"customConfig": {"chromePath": "C:\\Custom\\Brave\\brave.exe"}}`

**Q: Why am I getting "Brave not found" or ECONNREFUSED errors on Windows?**
A: Version 2.9.5 includes comprehensive fixes for Windows Brave detection and connection issues. The server now automatically searches these locations and more:
- `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
- `C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe` 
- `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe`
- `%USERPROFILE%\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe`
- All Brave variants (Stable, Beta, Dev, Nightly) installations
- Portable Brave installations
- Registry-detected installations

The server also implements multiple connection strategies with automatic fallback between localhost and 127.0.0.1, plus enhanced Windows-specific Brave flags for better compatibility.

**Q: I'm still getting ECONNREFUSED errors after upgrading to v2.9.5. What should I do?**
A: Try these steps in order:
1. Set the `BRAVE_PATH` environment variable to your Brave location
2. Kill all existing Brave processes: `taskkill /f /im brave.exe`
3. Check your Windows hosts file contains: `127.0.0.1 localhost`
4. Try running your IDE as Administrator
5. Add Brave Browser to Windows Defender exclusions
6. If using a VPN/proxy, try disabling it temporarily

### Debug Mode

To enable debug logging:

```bash
DEBUG=true npm start
```

Or when running from source:
```bash
DEBUG=true npm run dev
```

### Getting Help

If you're still having issues:
1. Check the [GitHub Issues](https://github.com/your-organization/brave-real-browser-mcp-server/issues)
2. Create a new issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Full error message
   - Steps to reproduce the problem

## Development

### Project Structure

```text
brave-real-browser-mcp-server/
├── src/
│   ├── index.ts         # Main server implementation
│   └── stealth-actions.ts # Browser interaction functions
├── test/
│   └── test-server.ts   # Test script
├── package.json
└── tsconfig.json
```

### Building from Source

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Test the server
npm test
```

### Adding New Tools

To add a new tool:

1. Add the tool definition to the `TOOLS` array in `src/index.ts`
2. Implement the tool handler in the `CallToolRequestSchema` handler
3. Test the new tool functionality

## Testing

This project includes a comprehensive testing suite with multiple categories optimized for different purposes:

### Quick Tests (CI/CD) - ~30 seconds
```bash
npm run test:quick    # Fast Jest tests for protocol compliance
npm test              # Alias for test:quick
```

### Comprehensive Tests - ~5-10 minutes  
```bash
npm run test:full     # End-to-end MCP client testing
```

### Performance Testing - ~2-3 minutes
```bash
npm run test:performance  # Browser performance benchmarking
```

Performance tests measure:
- Browser initialization timing (5 trials)
- Navigation performance across different site types
- Concurrent operation handling
- Session longevity testing (30+ operations over 30 seconds)

### Debug Tools - ~10 seconds
```bash
npm run test:debug    # Environment diagnostics and troubleshooting
```

Debug tools provide:
- Environment validation (Node.js version, platform, memory)
- Brave Browser installation detection with specific paths
- Quick server health check with startup timing
- Network connectivity validation
- Build status verification

### All Tests - ~7-13 minutes
```bash
npm run test:all      # Runs quick + full + performance tests
npm run test:dashboard # Unified test runner with reporting
```

The test dashboard provides:
- Unified execution of multiple test categories
- Real-time progress reporting
- Performance metrics and timing
- Overall test status summary
- Recommendations for failed tests
- JSON results saved to `test-results/` directory

### Integration Testing
```bash
npm run test:integration  # Claude Code CLI integration testing
```

For detailed testing information, see [TESTING.md](TESTING.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

### 🦁 **Powered by brave-real-browser**

This MCP server is built upon the excellent **[brave-real-browser](https://github.com/ZFC-Digital/brave-real-browser)** library by **ZFC-Digital**, which provides the core automation capabilities.

**Why brave-real-browser is Amazing:**
- **🛡️ Advanced Anti-Detection**: Sophisticated techniques to bypass bot detection
- **🦁 Brave Browser Optimized**: Specifically designed for Brave Browser
- **🔒 Privacy-First**: Built with privacy and security in mind
- **🎨 Stealth Capabilities**: Natural human-like interactions
- **⚡ High Performance**: Optimized for speed and reliability
- **🔧 Professional Grade**: Enterprise-level automation features

**Thank you** to the brave-real-browser team for creating such a powerful and detection-resistant browser automation solution!

**Resources:**
- **GitHub**: [https://github.com/ZFC-Digital/brave-real-browser](https://github.com/ZFC-Digital/brave-real-browser)
- **npm Package**: [https://www.npmjs.com/package/brave-real-browser](https://www.npmjs.com/package/brave-real-browser)
- **Documentation**: Comprehensive guides and examples
- **Community**: Active development and support
