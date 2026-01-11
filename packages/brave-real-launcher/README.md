# brave-real-launcher

Launch Brave Browser with ease from Node.js. Based on [chrome-launcher](https://github.com/GoogleChrome/chrome-launcher) but specifically adapted for Brave Browser with additional features.

## ✨ Features

- 🦁 **Brave Browser Detection**: Automatically detects Brave Browser installations across all platforms
- 🖥️ **Multi-Platform Support**: Linux (x64/ARM64), macOS (Intel/Apple Silicon), Windows (x64/ARM64)
- 🐧 **Xvfb Support**: Built-in Xvfb support for headless operation on Linux
- 🎯 **Launch Modes**: Headless mode, GUI mode, or automatic detection
- 🔄 **Auto-Sync**: Automatically syncs with chrome-launcher updates while preserving Brave-specific features
- 📦 **uBlock Origin**: Automatic download and loading of uBlock Origin ad blocker
- 🛡️ **Stealth Mode**: Anti-bot-detection capabilities for automation
- ⬇️ **Auto-Install**: Automatically install Brave if not present (Windows/Linux/macOS)
- 🔇 **P3A Disabled**: Private analytics notifications disabled by default

## Installation

```bash
npm install brave-real-launcher
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
| `enableStealth` | `boolean` | `false` | Enable stealth mode |
| `autoInstall` | `boolean` | `false` | Auto-install Brave if not found |
| `userAgent` | `string` | default | Custom user agent |
| `logLevel` | `'verbose'\|'info'\|'error'\|'silent'` | `'silent'` | Log level |

**Returns:** `LaunchedBrave` object with:
- `pid`: Process ID
- `port`: Debug port
- `process`: Child process
- `extensions`: Loaded extensions info
- `kill()`: Function to kill browser

### `getBravePath()`

Returns the path to the Brave Browser executable.

## Platform Support

### Auto-Install Behavior

| Platform | Method | Skip if Installed |
|----------|--------|-------------------|
| **Windows** | Downloads installer, runs silently | ✅ Yes |
| **Linux** | apt/dnf/yum/pacman | ✅ Yes |
| **macOS** | Downloads DMG, mounts & copies | ✅ Yes |

### Path Detection

| Platform | Detection Paths |
|----------|-----------------|
| **Windows** | `%LOCALAPPDATA%\BraveSoftware\...`, `%PROGRAMFILES%\...` |
| **Linux** | `/usr/bin/brave-browser`, `/opt/brave.com/brave/...`, Flatpak, Snap |
| **macOS** | `/Applications/Brave Browser.app/...` |

## Testing

```bash
# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Test Brave detection
npm run test:detection

# Test with uBlock Origin
node -e "const {launch} = require('./dist'); launch({autoLoadUBlock:true, startingUrl:'https://example.com', logLevel:'info'}).then(b => setTimeout(() => b.kill(), 5000))"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BRAVE_PATH` | Path to Brave executable |
| `HEADLESS` | Force headless mode when set |
| `DISPLAY` | X11 display (Linux) |

## Development

```bash
# Clone repository
git clone https://github.com/codeiva4u/Brave-Real-Launcher.git
cd brave-real-launcher

# Install dependencies
npm install

# Build
npm run build

# Run CI tests
npm run test:ci
```

## Auto-Sync with chrome-launcher

This project automatically syncs with chrome-launcher updates while preserving Brave-specific functionality:

- ✅ Checks for chrome-launcher updates **daily**
- ✅ Automatically integrates compatible changes
- ✅ Preserves Brave-specific browser detection
- ✅ Runs comprehensive tests
- ✅ Publishes to npm automatically

## License

Apache-2.0 - Based on chrome-launcher by The Chromium Authors
