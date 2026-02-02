# Brave Real Blocker

A powerful ad-blocking and stealth library for Brave Real Browser, based on uBlock Origin filtering logic.
This package replaces the traditional uBlock Origin extension with a native Node.js implementation using `@cliqz/adblocker` and custom scriptlet injections.

## Features

- **Core Filtering**: Uses uBlock Origin compatible filter lists (EasyList, EasyPrivacy, uBlock filters).
- **Stealth Mode**: Advanced fingerprinting protection (Canvas, WebGL, AudioContext noise).
- **Scriptlet Injection**:
  - Blocks forced button clicks.
  - Prevents auto-tab opening loops.
  - Intercepts forced redirects.
- **Visual Blocker**: Removes "Sponsored" and ad placeholders cosmetically.
- **URL Cleaner**: Removes tracking parameters (`utm_`, `fbclid`) from URLs.

## Installation

```bash
npm install brave-real-blocker
```

## Usage

This library is automatically integrated into `brave-real-browser`.
To use it manually with Puppeteer:

```typescript
import { BraveBlocker } from 'brave-real-blocker';
import puppeteer from 'puppeteer-core';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const blocker = new BraveBlocker({
        enableStealth: true,
        enableScriptlets: true
    });
    
    await blocker.init(); // Downloads latest lists
    await blocker.enable(page);

    await page.goto('https://example.com');
})();
```


## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableAdBlocking` | boolean | `true` | Enables standard network request blocking (Ads/Trackers). |
| `enableStealth` | boolean | `true` | Enables anti-fingerprinting and bot evasion techniques. |
| `enableScriptlets` | boolean | `true` | Enables injection of scriptlets to block forced clicks and popups. |
| `enableCosmeticFiltering` | boolean | `true` | Hides cosmetic elements like "Sponsored" labels or empty ad slots. |
| `enableRedirectBlocking` | boolean | `true` | Prevents forced tab openings and cleans tracking parameters from URLs. |


## Testing

Run unit tests:
```bash
npm run test
```

Run visual verification on real sites:
```bash
npm run visual-test
```

## Architecture

This package is part of the Brave Real Browser ecosystem. It runs as a library hooking into Puppeteer's request interception and page evaluation APIs, providing a faster and more undetectable experience than loading the full chrome extension.
