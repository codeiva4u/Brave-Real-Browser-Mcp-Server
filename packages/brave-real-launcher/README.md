# brave-real-launcher

Launch Brave Browser with ease from Node.js. Based on [chrome-launcher](https://github.com/GoogleChrome/chrome-launcher) but specifically adapted for Brave Browser with additional features.

## ✨ Features

- 🦁 **Brave Browser Detection**: Automatically detects Brave Browser installations across all platforms
- 🖥️ **Multi-Platform Support**: Linux (x64/ARM64), macOS (Intel/Apple Silicon), Windows (x64/ARM64)
- 🐧 **Xvfb Support**: Built-in Xvfb support for headless operation on Linux
- 🎯 **Launch Modes**: Headless mode, GUI mode, or automatic detection
- 🔄 **Auto-Sync**: Automatically syncs with chrome-launcher updates while preserving Brave-specific features
- 📦 **uBlock Origin**: Automatic download and loading of uBlock Origin ad blocker
- 🛡️ **Stealth Mode**: Anti-bot-detection capabilities (enabled by default)
- ⬇️ **Auto-Install**: Automatically install Brave if not present (enabled by default)
- 🔇 **P3A Disabled**: Private analytics notifications disabled by default
- 🔍 **Chrome/Chromium Fallback**: Detect Chrome and Chromium as fallback browsers

## Installation

```bash
npm install brave-real-launcher
```

## Quick Start

```javascript
const { launch, killAll } = require('brave-real-launcher');

// Basic launch - auto-installs Brave if missing, stealth mode enabled
const brave = await launch({
  startingUrl: 'https://example.com',
  logLevel: 'info'
});

console.log(`Brave running on port ${brave.port}`);

// Clean up
brave.kill();
```

## API

### `launch(options)`

Launches Brave Browser with the specified options.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bravePath` | `string` | auto-detected | Path to Brave executable |
| `braveFlags` | `string[]` | `[]` | Array of Brave flags to pass |
| `startingUrl` | `string` | `about:blank` | URL to navigate to on start |
| `port` | `number` | random | Debug port |
| `userDataDir` | `string\|boolean` | temp dir | User data directory |
| `launchMode` | `'auto'\|'headless'\|'gui'` | `'auto'` | Launch mode |
| `enableXvfb` | `boolean` | `false` | Enable Xvfb on Linux |
| `autoLoadUBlock` | `boolean` | `false` | Auto-load uBlock Origin |
| `enableStealth` | `boolean` | **`true`** | Enable stealth mode |
| `autoInstall` | `boolean` | **`true`** | Auto-install Brave if not found |
| `userAgent` | `string` | dynamic | Custom user agent |
| `logLevel` | `'verbose'\|'info'\|'error'\|'silent'` | `'silent'` | Log level |

**Returns:** `LaunchedBrave` object with:
- `pid`: Process ID
- `port`: Debug port
- `process`: Child process
- `extensions`: Loaded extensions info
- `kill()`: Function to kill browser

### Other Exports

```javascript
const {
  // Core functions
  launch,
  killAll,
  getBravePath,
  getInstallations,
  findBrave,
  
  // Classes
  BraveLauncher,      // Launcher class
  BraveInstaller,     // Auto-install helper
  ExtensionManager,   // Extension loader
  XvfbManager,        // Xvfb for Linux
  
  // Flags
  DEFAULT_FLAGS,      // 32 default flags
  
  // Stealth utilities
  STEALTH_FLAGS,
  STEALTH_SCRIPTS,
  USER_AGENTS,
  getStealthFlags,
  getDynamicUserAgents,
  getLatestChromeVersion,
  
  // Browser detection
  braveFinder,        // findChrome, findChromium, findAnyChromiumBrowser
  
  // Utilities
  getRandomPort,
  getPlatform,
  detectDesktopEnvironment
} = require('brave-real-launcher');
```

## Chrome/Chromium Fallback

If Brave is not available, you can use Chrome or Chromium:

```javascript
const { braveFinder } = require('brave-real-launcher');

// Find any Chromium-based browser (Brave → Chrome → Chromium)
const browser = braveFinder.findAnyChromiumBrowser();
// Returns: { browser: 'brave'|'chrome'|'chromium', path: '...' }

// Or find specific browsers
const chromePaths = braveFinder.findChrome();
const chromiumPaths = braveFinder.findChromium();
```

## Platform Support

### Auto-Install Behavior

| Platform | Method | Skip if Installed |
|----------|--------|-------------------|
| **Windows** | Downloads installer, runs silently | ✅ Yes |
| **Linux** | apt/dnf/yum/pacman | ✅ Yes |
| **macOS** | Downloads DMG, mounts & copies | ✅ Yes |

### Path Detection

| Platform | Detection Paths |
|----------|-----------------||
| **Windows** | `%LOCALAPPDATA%\BraveSoftware\...`, `%PROGRAMFILES%\...` |
| **Linux** | `/usr/bin/brave-browser`, `/opt/brave.com/brave/...`, Flatpak, Snap |
| **macOS** | `/Applications/Brave Browser.app/...` |

## Testing

```bash
# Run comprehensive tests (10 tests)
node test.cjs

# Quick test commands
npm run test:detection    # Test Brave detection
npm run test:exports      # Test module exports
npm run test:ci           # Full CI test suite

# Test with uBlock Origin
node -e "const {launch} = require('./dist'); launch({autoLoadUBlock:true, startingUrl:'https://example.com', logLevel:'info'}).then(b => setTimeout(() => b.kill(), 5000))"
```

### Test Coverage

| Test | Description |
|------|-------------|
| Brave Installations Check | Detects all Brave installations |
| Basic Launch & Kill | Launch and terminate browser |
| Headless Mode | Headless browser operation |
| Custom Configuration | Custom flags and preferences |
| Port Management | Multiple instances on different ports |
| API Validation | All exports work correctly |
| Remote Debugging Pipes | Debugging pipes functionality |
| Multiple Instances | Run 3+ instances simultaneously |
| Kill All Functionality | Terminate all instances |
| Performance Test | < 1s launch time |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BRAVE_PATH` | Path to Brave executable |
| `HEADLESS` | Force headless mode when set |
| `DISPLAY` | X11 display (Linux) |
| `CI` | Skip postinstall in CI environments |
| `SKIP_BRAVE_INSTALL` | Skip auto-install on npm install |

## Auto-Sync with chrome-launcher

This project automatically syncs with chrome-launcher updates while preserving Brave-specific functionality:

- ✅ Checks for chrome-launcher updates **daily**
- ✅ Automatically integrates compatible changes
- ✅ Preserves Brave-specific browser detection
- ✅ Runs comprehensive tests
- ✅ Publishes to npm automatically

## License

Apache-2.0 - Based on chrome-launcher by The Chromium Authors

