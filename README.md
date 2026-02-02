# Brave Real Browser MCP Server

[![CI](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/actions/workflows/ci.yml/badge.svg)](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/brave-real-browser-mcp-server.svg)](https://www.npmjs.com/package/brave-real-browser-mcp-server)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**MCP Server for Puppeteer + Brave Browser + Stealth + Ad Blocker + Turnstile Auto-Solver**

A production-ready MCP (Model Context Protocol) server that combines Puppeteer with Brave Browser for undetectable web automation. Passes all major bot detectors including Cloudflare, DataDome, and reCAPTCHA v3.

## Features

| Feature | Description |
|---------|-------------|
| MCP Server | Model Context Protocol compatible server |
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

## Ecosystem Chain

```
brave-real-browser-mcp-server (Top Level - MCP Server)
    └── brave-real-puppeteer-core (Stealth patches)
        └── brave-real-launcher (Browser launch)
            └── brave-real-blocker (Ad/Tracker blocking - Auto-enabled)
```

The blocker is automatically enabled on all pages via the ecosystem chain. No manual setup required.

## Installation

```bash
npm install brave-real-browser-mcp-server
```

For Linux (required for headless mode):
```bash
sudo apt-get install xvfb
```

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

## Environment Variables

Create a `.env` file in your project root:

```env
# Headless mode (true = headless, false = GUI)
HEADLESS=true
```

The library automatically reads `.env` files and respects the `HEADLESS` variable.

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm test` | Run all tests (CJS + ESM) |
| `npm run cjs_test` | Run CommonJS tests only |
| `npm run esm_test` | Run ESM tests only |
| `npm run lint` | Run linter |

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
| DrissionPage Detector | Chinese bot detector | Pass |
| Sannysoft WebDriver | WebDriver detection | Pass |
| Cloudflare WAF | Full page challenge | Pass |
| Cloudflare Turnstile | CAPTCHA widget | Pass |
| FingerprintJS | Browser fingerprinting | Pass |
| Datadome | Anti-bot detection | Pass |
| reCAPTCHA v3 | Google score test | Pass |

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

## Project Structure

```
brave-real-browser-mcp-server/
├── lib/
│   ├── cjs/           # CommonJS build
│   └── esm/           # ESM build
├── packages/
│   ├── brave-real-blocker/        # Ad/Tracker blocker
│   ├── brave-real-launcher/       # Browser launcher
│   └── brave-real-puppeteer-core/ # Puppeteer with patches
├── test/
│   ├── cjs/           # CJS tests
│   └── esm/           # ESM tests
├── .github/
│   └── workflows/     # CI/CD workflows
├── Dockerfile         # Docker configuration
├── typings.d.ts       # TypeScript definitions
└── package.json
```

## Requirements

- Node.js >= 18.0.0
- Brave Browser (auto-installed if missing)
- Linux: xvfb package for headless mode

## License

ISC - See [LICENSE](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/blob/main/LICENSE.md)

## Credits

- **rebrowser** - Runtime patches
- **ghost-cursor** - Human-like mouse movements
- **brave-real-launcher** - Brave Browser launcher
- **@aspect-dev/adblocker-puppeteer** - Ad blocking engine
- **uBlock Origin** - Filter lists

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- GitHub Issues: [Report bugs](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server/issues)
- Documentation: [README.md](https://github.com/codeiva4u/Brave-Real-Browser-Mcp-Server#readme)
