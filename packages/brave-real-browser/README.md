# 🦁 Brave Real Browser

**Puppeteer with Brave Browser | Stealth Mode | Turnstile Auto-Solver**

A production-ready library that combines Puppeteer with Brave Browser for undetectable web automation.

## ✨ Features

- 🦁 **Brave Browser** - Uses Brave instead of Chromium
- 🛡️ **50+ Stealth Features** - Passes all major bot detectors
- ☁️ **Turnstile Auto-Solver** - Cloudflare CAPTCHA bypass
- 🖱️ **Real Cursor** - Ghost-cursor for human-like movements
- 🔌 **Plugin Support** - Puppeteer-extra plugins compatible
- 🌐 **Proxy Support** - Built-in proxy configuration
- ⬇️ **Auto-Install** - Brave auto-installs if missing

## 🚀 Installation

```bash
npm install brave-real-browser
```

For Linux:
```bash
sudo apt-get install xvfb
```

## 💡 Quick Start

```javascript
const { connect } = require('brave-real-browser');

const { browser, page } = await connect({
  headless: false,
  turnstile: true,  // Auto-solve Cloudflare
});

await page.goto('https://example.com');

// Use real cursor for human-like clicking
await page.realClick('#button');

await browser.close();
```

## 📋 Connect Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headless` | `boolean\|'new'` | `false` | Headless mode |
| `args` | `string[]` | `[]` | Additional Chrome flags |
| `customConfig` | `object` | `{}` | Brave launcher options |
| `proxy` | `object` | `{}` | Proxy configuration |
| `turnstile` | `boolean` | `false` | Auto-solve Cloudflare Turnstile |
| `connectOption` | `object` | `{}` | Puppeteer connect options |
| `disableXvfb` | `boolean` | `false` | Disable virtual display (Linux) |
| `plugins` | `array` | `[]` | Puppeteer-extra plugins |
| `ignoreAllFlags` | `boolean` | `false` | Override all default flags |

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

## 🖱️ Real Cursor (Ghost-Cursor)

Built-in ghost-cursor for human-like mouse movements:

```javascript
const { browser, page } = await connect();

// Human-like click
await page.realClick('#submit-button');

// Full cursor control
await page.realCursor.move('#element');
await page.realCursor.click('#button');
```

## ☁️ Turnstile Auto-Solver

Automatically solves Cloudflare Turnstile challenges:

```javascript
const { browser, page } = await connect({
  turnstile: true
});

await page.goto('https://site-with-turnstile.com');
// Turnstile is automatically solved!
```

## 🔌 Puppeteer-Extra Plugins

```javascript
const clickAndWait = require('puppeteer-extra-plugin-click-and-wait')();

const { browser, page } = await connect({
  plugins: [clickAndWait]
});
```

## 🧪 Testing

```bash
# Run all 7 bot detector tests
npm run cjs_test
# or
node test/cjs/test.js

# ESM test
npm run esm_test
# or
node test/esm/test.js
```

### Test Coverage

| Test | Description | Status |
|------|-------------|--------|
| DrissionPage Detector | Chinese bot detector | ✅ Pass |
| Sannysoft WebDriver | WebDriver detection | ✅ Pass |
| Cloudflare WAF | Full page challenge | ✅ Pass |
| Cloudflare Turnstile | CAPTCHA widget | ✅ Pass |
| FingerprintJS | Browser fingerprinting | ✅ Pass |
| Datadome | Anti-bot detection | ✅ Pass |
| reCAPTCHA v3 | Google score test | ✅ Pass |

## 🐳 Docker

```bash
docker build -t brave-real-browser .
docker run brave-real-browser
```

## 🆚 Re-exports

Access brave-real-launcher features directly:

```javascript
const { 
  connect,
  launcher,      // brave-real-launcher module
  launch,        // Direct browser launch
  killAll,       // Kill all browsers
  getBravePath,  // Get Brave path
  DEFAULT_FLAGS  // Default browser flags
} = require('brave-real-browser');
```

## ❓ FAQ

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

## 📄 License

MIT - See [LICENSE](https://github.com/codeiva4u/Brave-Real-Browser/blob/main/LICENSE.md)

## 🙏 Credits

- **rebrowser** - Runtime patches
- **ghost-cursor** - Human-like mouse movements
- **brave-real-launcher** - Brave Browser launcher
