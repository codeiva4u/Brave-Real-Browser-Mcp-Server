# Brave Real Browser MCP Server

[![npm version](https://img.shields.io/npm/v/brave-real-browser-mcp-server.svg)](https://www.npmjs.com/package/brave-real-browser-mcp-server)
[![Auto-Update](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/actions/workflows/auto-update-deps.yml/badge.svg)](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/actions/workflows/auto-update-deps.yml)
[![Monorepo Publish](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/actions/workflows/monorepo-publish.yml/badge.svg)](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/actions/workflows/monorepo-publish.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**MCP Server for Puppeteer + Brave Browser + Stealth + Ad Blocker + Turnstile Auto-Solver**

A production-ready MCP (Model Context Protocol) server that combines Puppeteer with Brave Browser for undetectable web automation. Passes all major bot detectors including Cloudflare, DataDome, and reCAPTCHA v3.

## Key Features

| Feature | Description |
|---------|-------------|
| **MCP Server** | Model Context Protocol compatible server with 28 tools |
| **LSP Server** | Language Server Protocol for IDE code intelligence |
| **AI Core** | Automatic AI enhancement for all tools (auto-healing, smart retry) |
| Brave Browser | Uses Brave instead of Chromium for better privacy |
| 50+ Stealth Features | Passes all major bot detectors |
| Built-in Ad Blocker | uBlock Origin filters with auto-update |
| Turnstile Auto-Solver | Cloudflare CAPTCHA bypass |
| Real Cursor | Ghost-cursor for human-like movements |
| Plugin Support | Puppeteer-extra plugins compatible |
| Proxy Support | Built-in proxy with authentication |
| Auto-Install | Brave auto-installs if missing |
| TypeScript Support | Full type definitions included |
| ESM + CJS | Dual module support |
| **Multi-language** | English & Hindi language support |
| **Auto-Update** | Daily automatic dependency updates |
| **Auto-Publish** | Automatic NPM publishing on updates |
| **Monorepo** | npm workspaces with linked packages |
| **Singleton Blocker** | Single shared blocker instance |

---

## MCP Server (Model Context Protocol)

This package is a fully-featured MCP Server with **28 browser automation tools** for AI assistants like Claude, Cursor, Copilot, and other MCP-compatible clients.

### Quick Start MCP Server

```bash
# Start the MCP server
npm run dev

# Or with verbose mode (shows all tool details)
npm run mcp:verbose
```

### MCP Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "brave-browser": {
      "command": "npx",
      "args": ["brave-real-browser-mcp-server"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "brave-browser": {
      "command": "brave-mcp"
    }
  }
}
```

### Available MCP Tools (28)

| # | Tool | Emoji | Description |
|---|------|-------|-------------|
| 1 | `browser_init` | :rocket: | Initialize Brave browser with stealth mode |
| 2 | `navigate` | :compass: | Navigate to a URL |
| 3 | `get_content` | :page_facing_up: | Get page content (HTML, text, markdown) |
| 4 | `wait` | :hourglass: | Wait for element, navigation, or timeout |
| 5 | `click` | :point_up: | Click with human-like behavior |
| 6 | `type` | :keyboard: | Type text into input fields |
| 7 | `browser_close` | :red_circle: | Close browser and cleanup |
| 8 | `solve_captcha` | :unlock: | Solve CAPTCHA (Turnstile, reCAPTCHA) |
| 9 | `random_scroll` | :scroll: | Human-like random scrolling |
| 10 | `find_element` | :mag: | Find elements by selector/xpath/text |
| 11 | `save_content_as_markdown` | :memo: | Save page as Markdown file |
| 12 | `redirect_tracer` | :twisted_rightwards_arrows: | Trace URL redirects |
| 13 | `search_regex` | :mag_right: | Search content with regex |
| 14 | `extract_json` | :bar_chart: | Extract JSON from page/scripts |
| 15 | `scrape_meta_tags` | :label: | Get meta tags, OG, Twitter cards |
| 16 | `press_key` | :musical_keyboard: | Press keyboard keys |
| 17 | `progress_tracker` | :chart_with_upwards_trend: | Track automation progress |
| 18 | `deep_analysis` | :brain: | SEO, performance, accessibility analysis |
| 19 | `network_recorder` | :satellite: | Record network requests |
| 20 | `link_harvester` | :link: | Extract all links from page |
| 21 | `cookie_manager` | :cookie: | Manage browser cookies |
| 22 | `file_downloader` | :arrow_down: | Download files from URLs |
| 23 | `iframe_handler` | :framed_picture: | Handle iframe content |
| 24 | `stream_extractor` | :clapper: | Extract video/audio streams |
| 25 | `js_scrape` | :zap: | Scrape JS-rendered content |
| 26 | `execute_js` | :computer: | Execute custom JavaScript |
| 27 | `player_api_hook` | :video_game: | Hook video player APIs |
| 28 | `form_automator` | :clipboard: | Auto-fill and submit forms |

### MCP Example Usage

```
User: Open a browser and go to example.com

AI: I'll use browser_init to start the browser, then navigate to the URL.

[Calls browser_init] -> Browser started
[Calls navigate with url="https://example.com"] -> Page loaded

User: Get all links on the page

AI: [Calls link_harvester] -> Found 15 links...

User: Download the main image

AI: [Calls file_downloader with url="..."] -> Downloaded to ./downloads/image.png
```

---

## LSP Server (Language Server Protocol)

This package also includes a full-featured **LSP Server** for IDE code intelligence when writing browser automation scripts.

### Quick Start LSP Server

```bash
# Start the LSP server
npm run lsp
```

### LSP Capabilities

| Feature | Description |
|---------|-------------|
| **Autocomplete** | Tool names, parameters, and enum values |
| **Hover** | Full documentation on hover |
| **Diagnostics** | Error & warning detection (missing browser_init, etc.) |
| **Snippets** | Code templates for common workflows |
| **Refactoring** | Quick fixes (add browser_init, try-catch, etc.) |
| **Simulation** | Workflow simulation in IDE |
| **Multi-language** | English & Hindi support |

## AI Core (Automatic Enhancement)

All 28 tools are automatically enhanced with AI capabilities. No configuration needed - AI features work transparently.

### How It Works

```
AI Agent calls any tool (e.g., click, type, find_element)
                │
                ▼
        ┌───────────────────┐
        │   AI Core Check   │
        │ (Lazy initialize) │
        └───────────────────┘
                │
                ▼
        Execute Original Tool
                │
        ┌───────┴───────┐
        │               │
     Success         Failed (selector not found)
        │               │
        ▼               ▼
   Return result    ┌─────────────────┐
   with _ai meta    │ AI Auto-Healing │
                    │ - Find alts     │
                    │ - Try healed    │
                    │ - Retry op      │
                    └─────────────────┘
                            │
                            ▼
                    Return healed result
```

### AI Features

| Feature | Description |
|---------|-------------|
| **Auto-Healing Selectors** | If a CSS selector fails, AI finds alternative selectors |
| **Smart Retry** | Failed operations are automatically retried with AI assistance |
| **Confidence Scoring** | AI provides confidence scores for healed selectors |
| **Caching** | Healed selectors are cached for performance |
| **Zero Configuration** | Works out of the box with all 28 tools |

### Example Response with AI Metadata

When AI heals a broken selector:

```json
{
  "success": true,
  "selector": "#new-login-btn",
  "clicked": true,
  "_ai": {
    "enabled": true,
    "healed": true,
    "originalSelector": "#old-login-button",
    "healedSelector": "#new-login-btn",
    "duration": 245
  }
}
```

### AI Modules

| Module | Description |
|--------|-------------|
| `AICore` | Central AI intelligence singleton |
| `ElementFinder` | Smart element finding with multiple strategies |
| `SelectorHealer` | Auto-fix broken CSS selectors |
| `PageAnalyzer` | Page structure analysis |
| `ActionParser` | Natural language command parsing |

### Programmatic Access

For advanced usage, you can access AI features directly:

```javascript
const { getAICore, aiEnhancedSelector } = require('./src/mcp/handlers');

// Get AI Core instance
const ai = getAICore();

// Use AI-enhanced selector finding
const { element, selector, healed } = await aiEnhancedSelector(page, '#old-selector', 'click');
```

---

## Unified Architecture

Both MCP and LSP servers share the same tool definitions:

```
src/
├── shared/
│   └── tools.js         # Single source of truth (28 tools)
├── ai/                  # AI Core Module (Auto-enhancement)
│   ├── index.js         # AI module exports
│   ├── core.js          # AI Core singleton
│   ├── element-finder.js# Smart element finding
│   ├── selector-healer.js# Auto-heal selectors
│   ├── page-analyzer.js # Page analysis
│   └── action-parser.js # NL command parsing
├── mcp/
│   ├── server.js        # MCP server for AI agents
│   └── handlers.js      # Tool implementations + AI integration
├── lsp/
│   ├── server.js        # LSP server for IDEs
│   └── capabilities/    # Autocomplete, hover, diagnostics, etc.
└── index.js             # Unified entry point
```

### Unified CLI

```bash
# List all tools
node src/index.js --list

# Start MCP server (default)
node src/index.js mcp

# Start LSP server
node src/index.js lsp

# Show help
node src/index.js --help
```

### Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| **Browser** | 3 | Browser lifecycle (init, close, cookies) |
| **Navigation** | 1 | Page navigation |
| **Interaction** | 8 | User actions (click, type, scroll, etc.) |
| **Extraction** | 10 | Content scraping (HTML, JSON, links, etc.) |
| **Network** | 3 | Network operations (recorder, download, trace) |
| **Analysis** | 1 | Page analysis (SEO, performance, etc.) |
| **Utility** | 2 | Helpers (wait, progress tracker) |

---

## Monorepo Ecosystem

```
brave-real-browser-mcp-server (Top Level - MCP Server)
    └── brave-real-puppeteer-core (Stealth patches)
        └── brave-real-launcher (Browser launch)
            └── brave-real-blocker (Ad/Tracker blocking - Singleton)
```

### Package Details

| Package | Description | npm |
|---------|-------------|-----|
| `brave-real-browser-mcp-server` | MCP Server + Puppeteer integration | [![npm](https://img.shields.io/npm/v/brave-real-browser-mcp-server.svg)](https://www.npmjs.com/package/brave-real-browser-mcp-server) |
| `brave-real-puppeteer-core` | 50+ stealth patches for Puppeteer/Playwright | [![npm](https://img.shields.io/npm/v/brave-real-puppeteer-core.svg)](https://www.npmjs.com/package/brave-real-puppeteer-core) |
| `brave-real-launcher` | Brave Browser launcher with auto-detection | [![npm](https://img.shields.io/npm/v/brave-real-launcher.svg)](https://www.npmjs.com/package/brave-real-launcher) |
| `brave-real-blocker` | uBlock Origin-based ad/tracker blocker | [![npm](https://img.shields.io/npm/v/brave-real-blocker.svg)](https://www.npmjs.com/package/brave-real-blocker) |

---

## Automation & CI/CD

### GitHub Actions Workflows

| Workflow | Schedule | Description |
|----------|----------|-------------|
| `auto-update-deps.yml` | Daily 6 AM UTC | Auto-updates all dependencies across all packages |
| `monorepo-publish.yml` | Daily 6 AM UTC + Push/PR | Version bump + NPM publish for all packages |

### Auto-Update Flow

```
Daily 6 AM UTC
      ↓
Check all packages for outdated dependencies
      ↓
┌─────────────────────────────────────────┐
│  brave-real-blocker                      │
│  brave-real-launcher                     │
│  brave-real-puppeteer-core               │
│  brave-real-browser-mcp-server           │
└─────────────────────────────────────────┘
      ↓
Update found? → Install → Build → Test → Commit → Push
      ↓
Trigger NPM Publish Workflow
      ↓
All packages published to NPM automatically
```

### Dependencies Auto-Updated

| Package | Auto-Updated Dependencies |
|---------|---------------------------|
| **blocker** | `@cliqz/adblocker-puppeteer`, `cross-fetch`, `fs-extra` |
| **launcher** | `which`, `escape-string-regexp`, `is-wsl` |
| **puppeteer-core** | `puppeteer-core`, `playwright-core`, `yargs` |
| **root** | `ghost-cursor`, `puppeteer-extra`, `puppeteer-extra-plugin-stealth` |

---

## Installation

```bash
npm install brave-real-browser-mcp-server
```

For Linux (required for headless mode):
```bash
sudo apt-get install xvfb
```

---

## Quick Start

### CommonJS

```javascript
const { connect } = require('brave-real-browser-mcp-server');

(async () => {
  const { browser, page, blocker } = await connect({
    headless: false,
    turnstile: true,  // Auto-solve Cloudflare
  });

  await page.goto('https://example.com');

  // Human-like click with ghost-cursor
  await page.realClick('#button');

  await browser.close();
})();
```

### ESM

```javascript
import { connect } from 'brave-real-browser-mcp-server';

const { browser, page, blocker } = await connect({
  headless: false,
  turnstile: true,
});

await page.goto('https://example.com');
await page.realClick('#button');
await browser.close();
```

---

## Connect Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headless` | `boolean \| 'new'` | `false` | Headless mode (also respects `.env` HEADLESS variable) |
| `args` | `string[]` | `[]` | Additional Chrome flags |
| `customConfig` | `object` | `{}` | Brave launcher options |
| `proxy` | `ProxyOptions` | `{}` | Proxy configuration |
| `turnstile` | `boolean` | `false` | Auto-solve Cloudflare Turnstile |
| `connectOption` | `object` | `{}` | Puppeteer connect options |
| `disableXvfb` | `boolean` | `false` | Disable virtual display (Linux) |
| `plugins` | `array` | `[]` | Puppeteer-extra plugins |
| `ignoreAllFlags` | `boolean` | `false` | Override all default flags |
| `enableBlocker` | `boolean` | `true` | Enable ad/tracker blocker |
| `blockerOptions` | `BlockerOptions` | `{}` | Blocker configuration |

### BlockerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableAdBlocking` | `boolean` | `true` | Network request blocking (Ads/Trackers) |
| `enableStealth` | `boolean` | `true` | Stealth evasions (Navigator, WebGL, etc.) |
| `enableCosmeticFiltering` | `boolean` | `true` | Element hiding (CSS-based) |
| `enableRedirectBlocking` | `boolean` | `true` | Popup and redirect blocking |
| `enableScriptlets` | `boolean` | `true` | Scriptlet injection for anti-adblock |
| `customFiltersPath` | `string` | `null` | Path to custom filter list file |
| `enableFilterAutoUpdate` | `boolean` | `true` | Auto-update uBlock Origin filters |

### ProxyOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `host` | `string` | Yes | Proxy host |
| `port` | `number` | Yes | Proxy port |
| `username` | `string` | No | Proxy username |
| `password` | `string` | No | Proxy password |

---

## Usage Examples

### Proxy Configuration

```javascript
const { browser, page } = await connect({
  proxy: {
    host: '127.0.0.1',
    port: 8080,
    username: 'user',     // Optional
    password: 'pass'      // Optional
  }
});
```

### Custom Brave Path

```javascript
const { browser, page } = await connect({
  customConfig: {
    bravePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    userDataDir: './my-profile'
  }
});
```

### Disable Blocker

```javascript
const { browser, page } = await connect({
  enableBlocker: false,  // Disable all blocking
});
```

### Custom Blocker Options

```javascript
const { browser, page, blocker } = await connect({
  blockerOptions: {
    enableAdBlocking: true,
    enableStealth: true,
    enableCosmeticFiltering: true,
    enableRedirectBlocking: true,
    enableScriptlets: true,
    customFiltersPath: './my-filters.txt',
    enableFilterAutoUpdate: true,
  }
});
```

### Real Cursor (Ghost-Cursor)

Built-in ghost-cursor for human-like mouse movements:

```javascript
const { browser, page } = await connect();

// Human-like click
await page.realClick('#submit-button');

// Full cursor control
await page.realCursor.move('#element');
await page.realCursor.click('#button');
```

### Turnstile Auto-Solver

Automatically solves Cloudflare Turnstile challenges:

```javascript
const { browser, page } = await connect({
  turnstile: true
});

await page.goto('https://site-with-turnstile.com');
// Turnstile is automatically solved!
```

### Puppeteer-Extra Plugins

```javascript
const clickAndWait = require('puppeteer-extra-plugin-click-and-wait')();

const { browser, page } = await connect({
  plugins: [clickAndWait]
});
```

### Singleton Blocker Usage

The blocker is a singleton - only one instance is created and shared:

```javascript
// From brave-real-blocker package
import { 
  getBraveBlockerSingleton, 
  initBraveBlockerSingleton,
  isBraveBlockerInitialized 
} from 'brave-real-blocker/singleton';

// Initialize once at startup
const blocker = await initBraveBlockerSingleton({
  enableAdBlocking: true,
  enableStealth: true,
});

// Get the same instance anywhere else
const sameBlocker = getBraveBlockerSingleton();
console.log(blocker === sameBlocker); // true
```

---

## Commands

### Root Level

| Command | Description |
|---------|-------------|
| `npm start` | Start unified server (MCP by default) |
| `npm run dev` | Start MCP server |
| `npm run mcp` | Start MCP server (alias) |
| `npm run mcp:verbose` | Start MCP server with tool details |
| `npm run lsp` | Start LSP server for IDE intelligence |
| `npm run list` | List all 28 tools with categories |
| `npm install` | Install all dependencies with workspace linking |
| `npm test` | Run all tests (CJS + ESM) |
| `npm run cjs_test` | Run CommonJS tests only |
| `npm run esm_test` | Run ESM tests only |
| `npm run build` | Build root package |
| `npm run build:all` | Build all workspace packages |
| `npm run lint` | Run linter |

### Workspace Scripts

| Command | Description |
|---------|-------------|
| `node scripts/prepare-publish.js` | Sync dependency versions before publish |
| `node scripts/restore-workspace.js` | Verify workspace linking |
| `node scripts/version-bump.js patch` | Increment all versions (patch/minor/major) |

### Package: brave-real-puppeteer-core

| Command | Description |
|---------|-------------|
| `npm run patch-puppeteer` | Apply stealth patches to puppeteer-core |
| `npm run patch-playwright` | Apply stealth patches to playwright-core |
| `npm run patch-both` | Apply patches to both engines |
| `npm run setup-puppeteer` | Full puppeteer setup with patches |
| `npm run test-bot-detector` | Run bot detection tests |
| `npm run ai-agent` | Run AI agent tests |

### Package: brave-real-launcher

| Command | Description |
|---------|-------------|
| `npm run build` | Build the launcher |
| `npm run test:detection` | Test Brave browser detection |

### Package: brave-real-blocker

| Command | Description |
|---------|-------------|
| `npm run build` | Build the blocker |
| `npm run visual-test` | Run visual blocking tests |

---

## Testing

```bash
# Run all 7 bot detector tests
npm test

# Run CJS tests only
npm run cjs_test

# Run ESM tests only
npm run esm_test
```

### Test Coverage

All 7 bot detection tests pass:

| Test | Description | Status |
|------|-------------|--------|
| DrissionPage Detector | Chinese bot detector | ✅ Pass |
| Sannysoft WebDriver | WebDriver detection | ✅ Pass |
| Cloudflare WAF | Full page challenge | ✅ Pass |
| Cloudflare Turnstile | CAPTCHA widget | ✅ Pass |
| FingerprintJS | Browser fingerprinting | ✅ Pass |
| Datadome | Anti-bot detection | ✅ Pass |
| reCAPTCHA v3 | Google score test (0.7+) | ✅ Pass |

---

## Docker

### Build and Run

```bash
# Build the image
docker build -t brave-real-browser-mcp-server .

# Run tests in container
docker run brave-real-browser-mcp-server

# Run with custom command
docker run brave-real-browser-mcp-server npm run esm_test
```

### Docker Features

- Multi-stage build for smaller image size
- Node.js 20 LTS (pinned version)
- Non-root user for security
- Health check included
- Headless mode enabled by default

---

## Project Structure

```
brave-real-browser-mcp-server/
├── src/
│   └── mcp/                      # MCP Server
│       ├── index.js              # Entry point with startup logs
│       ├── server.js             # MCP server with STDIO transport
│       ├── handlers.js           # 28 tool implementations
│       └── tools.js              # Tool definitions with schemas
├── lib/
│   ├── cjs/                      # CommonJS build
│   └── esm/                      # ESM build
├── packages/
│   ├── brave-real-blocker/       # Ad/Tracker blocker (singleton)
│   │   ├── src/
│   │   │   ├── brave-blocker.ts
│   │   │   ├── singleton.ts      # Singleton pattern
│   │   │   ├── stealth.ts
│   │   │   ├── cosmetic.ts
│   │   │   └── scriptlets.ts
│   │   └── package.json
│   ├── brave-real-launcher/      # Browser launcher
│   │   └── package.json
│   └── brave-real-puppeteer-core/  # Stealth patches
│       └── package.json
├── scripts/
│   ├── prepare-publish.js        # Sync versions before publish
│   ├── restore-workspace.js      # Verify workspace
│   └── version-bump.js           # Version management
├── .github/
│   └── workflows/
│       ├── auto-update-deps.yml      # Daily dependency updates
│       └── monorepo-publish.yml      # Auto-publish to NPM
├── test/
│   ├── cjs/                      # CJS tests
│   └── esm/                      # ESM tests
├── Dockerfile
├── typings.d.ts
└── package.json                  # Root with workspaces
```

---

## Environment Variables

Create a `.env` file in your project root:

```env
# Headless mode (true = headless, false = GUI)
HEADLESS=true
```

The library automatically reads `.env` files and respects the `HEADLESS` variable.

---

## Re-exports

Access brave-real-launcher features directly:

```javascript
const { 
  connect,
  launcher,      // brave-real-launcher module
  launch,        // Direct browser launch
  killAll,       // Kill all browsers
  getBravePath,  // Get Brave path
  DEFAULT_FLAGS  // Default browser flags
} = require('brave-real-browser-mcp-server');
```

---

## TypeScript

Full TypeScript support with type definitions:

```typescript
import { connect, Options, ConnectResult } from 'brave-real-browser-mcp-server';

const options: Options = {
  headless: false,
  turnstile: true,
  enableBlocker: true,
  blockerOptions: {
    enableAdBlocking: true,
    enableStealth: true,
  }
};

const { browser, page, blocker }: ConnectResult = await connect(options);
```

---

## FAQ

### Why can't I pass reCAPTCHA v3?

When there's no Google session, reCAPTCHA identifies you as a bot. This is a known limitation - log into a Google account first.

### page.setViewport not working?

Set `defaultViewport` in connectOption:

```javascript
const { browser, page } = await connect({
  connectOption: { defaultViewport: null }
});
```

### Mouse positions don't match?

This is automatically patched. Use `page.realClick()` for best results.

### How to disable ad blocker?

```javascript
const { browser, page } = await connect({
  enableBlocker: false
});
```

### How to use custom filter lists?

```javascript
const { browser, page } = await connect({
  blockerOptions: {
    customFiltersPath: './my-custom-filters.txt'
  }
});
```

### How does the singleton blocker work?

The blocker uses a global Symbol-based singleton pattern. No matter how many times you import it, the same instance is shared across the entire Node.js process, preventing duplicate filter loading and saving memory.

### How does npm workspaces linking work?

When packages are listed in the root `package.json` `workspaces` array, npm automatically creates symlinks to local packages instead of downloading from npm registry. This enables seamless local development.

---

## Requirements

- Node.js >= 18.0.0
- Brave Browser (auto-installed if missing)
- Linux: xvfb package for headless mode

---

## License

ISC - See [LICENSE](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/blob/main/LICENSE.md)

---

## Credits

- **rebrowser** - Runtime patches
- **ghost-cursor** - Human-like mouse movements
- **brave-real-launcher** - Brave Browser launcher
- **@cliqz/adblocker-puppeteer** - Ad blocking engine
- **uBlock Origin** - Filter lists

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Support

- GitHub Issues: [Report bugs](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)
- Documentation: [README.md](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server#readme)

---

## Changelog

See [Releases](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/releases) for version history and changes.
