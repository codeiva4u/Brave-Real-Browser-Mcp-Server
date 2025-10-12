# 🦁 Brave Browser Setup Guide

## Quick Start

This project is **optimized for Brave Browser** and automatically detects it during `npm install`.

### Status Check

Run this command to check if Brave is detected:
```bash
npm run install-brave
```

## Installation Methods

### Method 1: Manual Installation (Recommended) ✅

**Windows:**
1. Download: https://brave.com/download/
2. Install the `.exe` file
3. Run: `npm install`

**Package Managers (Windows):**
```powershell
# Winget
winget install BraveSoftware.BraveBrowser

# Chocolatey  
choco install brave

# Scoop
scoop install brave
```

**macOS:**
```bash
# Homebrew
brew install --cask brave-browser

# Or download from: https://brave.com/download/
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install brave-browser

# Fedora
sudo dnf install brave-browser

# Snap
sudo snap install brave
```

### Method 2: Environment Variable (Temporary)

If you want to use Chrome instead:

**Windows (PowerShell):**
```powershell
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm test
```

**Windows (CMD):**
```cmd
set CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm test
```

**macOS/Linux:**
```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm test
```

## Auto-Detection

The project automatically detects Brave in this priority order:

1. **`.brave-config.json`** - Auto-generated during `npm install`
2. **`BRAVE_PATH`** environment variable
3. **Windows Registry** detection
4. **File system** standard paths
5. **Ultimate fallback** to `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe` (Windows)
6. **Chrome fallback** if Brave not found

## Verification

After installation, verify detection:

```bash
npm run build
npm test
```

You should see:
```
✓ Found Brave via .brave-config.json (auto-detected)
```

## Troubleshooting

### Issue: "Brave not detected"

**Solution 1 - Set Environment Variable:**
```powershell
# Windows
$env:BRAVE_PATH="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

# macOS
export BRAVE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

# Linux
export BRAVE_PATH="/usr/bin/brave-browser"
```

**Solution 2 - Manual Config:**

Create `.brave-config.json` in project root:
```json
{
  "bravePath": "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "detectedAt": "2025-01-11T00:00:00.000Z",
  "platform": "win32",
  "autoDetected": false
}
```

**Solution 3 - Reinstall:**
```bash
npm run clean:all
npm install
```

### Issue: "Tests fail with browser errors"

1. **Close all Brave instances:**
   ```powershell
   # Windows
   taskkill /F /IM brave.exe
   ```

2. **Clear browser data:**
   - Delete: `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data\`

3. **Run as Administrator**

### Issue: "Browser opens and closes immediately"

This is **FIXED** in E2E tests - browser now stays open for all tests!

Check the test output:
```
📺 You should see ONE browser window that will be used for ALL tests
⚡ Browser will stay open between tests for better performance
```

## Project Features

✅ **Brave Priority** - Always uses Brave over Chrome  
✅ **Auto-Detection** - No manual configuration needed  
✅ **Multi-Platform** - Windows, macOS, Linux support  
✅ **Single Browser Session** - E2E tests reuse one browser  
✅ **Promise-based Locking** - Prevents multiple init calls  
✅ **Fallback to Chrome** - If Brave not available  

## FAQ

**Q: Will Brave auto-install during `npm install`?**  
A: No, for security reasons. But we provide clear installation instructions and detect common package managers.

**Q: Can I use Chrome instead?**  
A: Yes! Set `CHROME_PATH` environment variable or Chrome will be used automatically as fallback.

**Q: Why does the project prefer Brave?**  
A: Brave Browser provides better privacy, ad-blocking, and is Chromium-based making it compatible with all Chrome automation tools.

**Q: How do I check which browser is being used?**  
A: Run `npm test` and check the output for:
```
✓ Found Brave via .brave-config.json (auto-detected)
```

## Support

For issues, check:
- [GitHub Issues](https://github.com/withLinda/brave-real-browser-mcp-server/issues)
- Brave Download: https://brave.com/download/
- Chrome Fallback: https://www.google.com/chrome/

---

**Made with 🦁 for Brave Browser**
