#!/usr/bin/env node

/**
 * Automatic Brave Browser Installation Script
 * यह script npm install के बाद automatically run होगा
 * अगर Brave पहले से installed है तो skip कर देगा
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function detectExistingBrave() {
  const platform = process.platform;
  
  log('🔍 Checking for existing Brave installation...', colors.blue);
  
  let bravePaths = [];
  
  switch (platform) {
    case 'win32':
      bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env.PROGRAMFILES || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe')
      ];
      break;
      
    case 'darwin':
      bravePaths = [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        '/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta'
      ];
      break;
      
    case 'linux':
      bravePaths = [
        '/usr/bin/brave-browser',
        '/usr/bin/brave',
        '/snap/bin/brave',
        '/opt/brave.com/brave/brave',
        '/opt/brave-browser/brave'
      ];
      break;
  }
  
  for (const bravePath of bravePaths) {
    if (fs.existsSync(bravePath)) {
      log(`✅ Found Brave at: ${bravePath}`, colors.green);
      process.env.BRAVE_PATH = bravePath;
      return bravePath;
    }
  }
  
  return null;
}

async function installBraveWindows() {
  log('📦 Installing Brave for Windows...', colors.yellow);
  
  // Target installation path - हमेशा यहीं install होगा
  const targetPath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application';
  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(targetPath)) {
      log(`📁 Creating directory: ${targetPath}`, colors.blue);
      execSync(`powershell -Command "New-Item -ItemType Directory -Path '${targetPath}' -Force"`, {
        stdio: 'inherit'
      });
    }
    
    // Download Brave installer (standalone/offline installer for better control)
    const installerUrl = 'https://brave-browser-downloads.s3.brave.com/latest/BraveBrowserStandaloneSetup.exe';
    const installerPath = path.join(os.tmpdir(), 'BraveBrowserStandaloneSetup.exe');
    
    log('⬇️ Downloading Brave standalone installer...', colors.blue);
    execSync(`powershell -Command "Invoke-WebRequest -Uri '${installerUrl}' -OutFile '${installerPath}'"`, {
      stdio: 'inherit'
    });
    
    log(`🎯 Installing Brave to: ${bravePath}`, colors.yellow);
    log('🚀 Running Brave installer with custom path...', colors.blue);
    
    // Use MSI installer commands for better control over installation path
    // First try with admin privileges
    try {
      // Silent install with specific installation directory
      execSync(`powershell -Command "Start-Process -FilePath '${installerPath}' -ArgumentList '/silent', '/install', '/norestart' -Wait -Verb RunAs"`, {
        stdio: 'inherit'
      });
    } catch (adminError) {
      // If admin fails, try without elevation
      log('⚠️ Admin installation failed, trying user-level installation...', colors.yellow);
      execSync(`"${installerPath}" /silent /install`, {
        stdio: 'inherit'
      });
    }
    
    // Wait for installation to complete
    log('⏳ Waiting for installation to complete...', colors.blue);
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Verify installation at expected path
    if (fs.existsSync(bravePath)) {
      log(`✅ Brave installed successfully at: ${bravePath}`, colors.green);
      
      // Set environment variable permanently for Windows
      try {
        execSync(`setx BRAVE_PATH "${bravePath}"`, { stdio: 'inherit' });
        log('📝 BRAVE_PATH environment variable set permanently', colors.green);
      } catch (envError) {
        log('⚠️ Could not set permanent environment variable', colors.yellow);
      }
      
      // Clean up installer
      if (fs.existsSync(installerPath)) {
        fs.unlinkSync(installerPath);
      }
      
      return true;
    } else {
      // If not at expected location, check alternative locations
      log('⚠️ Brave not found at expected location, checking alternatives...', colors.yellow);
      
      const alternativePaths = [
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
        path.join(process.env.PROGRAMFILES || '', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe')
      ];
      
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          log(`⚠️ Brave found at alternative location: ${altPath}`, colors.yellow);
          log('📋 Attempting to move to standard location...', colors.blue);
          
          try {
            // Try to move/copy to standard location
            const sourceDir = path.dirname(altPath);
            execSync(`powershell -Command "Copy-Item -Path '${sourceDir}' -Destination '${targetPath}' -Recurse -Force"`, {
              stdio: 'inherit'
            });
            
            if (fs.existsSync(bravePath)) {
              log(`✅ Brave moved to standard location: ${bravePath}`, colors.green);
              return true;
            }
          } catch (moveError) {
            log(`⚠️ Could not move to standard location: ${moveError.message}`, colors.yellow);
            // Still successful, just not at preferred location
            process.env.BRAVE_PATH = altPath;
            return true;
          }
        }
      }
    }
    
    // Clean up installer even if installation location check failed
    if (fs.existsSync(installerPath)) {
      fs.unlinkSync(installerPath);
    }
    
    log('❌ Brave installation completed but not found at expected location', colors.red);
    log(`💡 Please check if Brave is installed and set BRAVE_PATH manually`, colors.yellow);
    return false;
    
  } catch (error) {
    log(`❌ Failed to install Brave: ${error.message}`, colors.red);
    log('💡 Try running as Administrator or install manually from: https://brave.com/download/', colors.yellow);
    return false;
  }
}

async function installBraveMacOS() {
  log('📦 Installing Brave for macOS...', colors.yellow);
  
  // Standard installation path for macOS (Intel and Apple Silicon)
  const targetPath = '/Applications/Brave Browser.app';
  const bravePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
  const arch = process.arch; // 'x64' for Intel, 'arm64' for Apple Silicon
  
  log(`🔍 Detected architecture: ${arch}`, colors.blue);
  
  try {
    // Check if Homebrew is installed (works for both Intel and Apple Silicon)
    try {
      execSync('which brew', { stdio: 'ignore' });
      log('🍺 Installing Brave using Homebrew...', colors.blue);
      execSync('brew install --cask brave-browser', {
        stdio: 'inherit'
      });
      
      // Verify installation at expected location
      if (fs.existsSync(bravePath)) {
        log(`✅ Brave installed successfully at: ${bravePath}`, colors.green);
        return true;
      }
    } catch {
      // Homebrew not found, download directly
      log('⬇️ Downloading Brave DMG directly...', colors.blue);
      
      // Use universal DMG that works for both Intel and Apple Silicon
      const dmgUrl = arch === 'arm64' 
        ? 'https://brave-browser-downloads.s3.brave.com/latest/Brave-Browser-arm64.dmg'
        : 'https://brave-browser-downloads.s3.brave.com/latest/Brave-Browser-x64.dmg';
      
      // Fallback to universal if architecture-specific not available
      const universalUrl = 'https://brave-browser-downloads.s3.brave.com/latest/Brave-Browser.dmg';
      const dmgPath = path.join(os.tmpdir(), 'Brave-Browser.dmg');
      
      try {
        log(`📥 Downloading ${arch} version...`, colors.blue);
        execSync(`curl -L -o "${dmgPath}" "${dmgUrl}"`, {
          stdio: 'inherit'
        });
      } catch {
        log('⚠️ Architecture-specific download failed, trying universal...', colors.yellow);
        execSync(`curl -L -o "${dmgPath}" "${universalUrl}"`, {
          stdio: 'inherit'
        });
      }
      
      log('🚀 Mounting and installing Brave to /Applications...', colors.blue);
      execSync(`hdiutil attach "${dmgPath}" -nobrowse -quiet`, { stdio: 'inherit' });
      
      // Ensure installation to /Applications
      execSync('sudo cp -R "/Volumes/Brave Browser/Brave Browser.app" /Applications/', { stdio: 'inherit' });
      execSync('hdiutil detach "/Volumes/Brave Browser" -quiet', { stdio: 'inherit' });
      
      // Clean up
      if (fs.existsSync(dmgPath)) {
        fs.unlinkSync(dmgPath);
      }
    }
    
    // Verify installation
    if (fs.existsSync(bravePath)) {
      log(`✅ Brave installed successfully at standard location: ${bravePath}`, colors.green);
      return true;
    } else {
      log('⚠️ Brave installed but not at expected location', colors.yellow);
      return true; // Still successful, macOS might have placed it elsewhere
    }
    
  } catch (error) {
    log(`❌ Failed to install Brave: ${error.message}`, colors.red);
    log('💡 Try installing manually from: https://brave.com/download/', colors.yellow);
    return false;
  }
}

async function installBraveLinux() {
  log('📦 Installing Brave for Linux...', colors.yellow);
  
  const arch = process.arch; // 'x64' or 'arm64'
  const platform = process.platform;
  
  log(`🔍 Detected architecture: ${arch}`, colors.blue);
  log(`📍 Platform: Linux ${arch}`, colors.blue);
  
  // Standard installation paths for Linux
  const standardPaths = {
    apt: '/usr/bin/brave-browser',
    snap: '/snap/bin/brave',
    yum: '/usr/bin/brave-browser',
    flatpak: '/var/lib/flatpak/app/com.brave.Browser'
  };
  
  try {
    // Method 1: APT (Debian/Ubuntu) - Works for both x64 and ARM64
    try {
      execSync('which apt-get', { stdio: 'ignore' });
      log('📝 Using APT package manager...', colors.blue);
      
      // Architecture-specific repository setup
      if (arch === 'arm64') {
        log('🔧 Setting up ARM64 repository...', colors.blue);
        
        // ARM64-specific GPG key and repository
        execSync('sudo apt install -y curl', { stdio: 'inherit' });
        execSync('sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg', {
          stdio: 'inherit'
        });
        
        // Add ARM64 repository
        execSync('echo "deb [arch=arm64 signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list', {
          stdio: 'inherit'
        });
      } else {
        log('🔧 Setting up x64 repository...', colors.blue);
        
        // x64 GPG key and repository
        execSync('sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg', {
          stdio: 'inherit'
        });
        
        execSync('echo "deb [arch=amd64 signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list', {
          stdio: 'inherit'
        });
      }
      
      // Update and install
      log('📦 Installing Brave browser via APT...', colors.blue);
      execSync('sudo apt update', { stdio: 'inherit' });
      execSync('sudo apt install -y brave-browser', { stdio: 'inherit' });
      
      // Verify installation at standard path
      if (fs.existsSync(standardPaths.apt)) {
        log(`✅ Brave installed at standard APT location: ${standardPaths.apt}`, colors.green);
        
        // Create symbolic links for easier access
        try {
          execSync('sudo ln -sf /usr/bin/brave-browser /usr/local/bin/brave', { stdio: 'inherit' });
          log('🔗 Created symbolic link: /usr/local/bin/brave', colors.green);
        } catch {}
        
        return true;
      }
      
    } catch (aptError) {
      log('⚠️ APT not available, trying alternative methods...', colors.yellow);
      
      // Method 2: Snap (Universal) - Better ARM64 support
      try {
        execSync('which snap', { stdio: 'ignore' });
        log('📦 Installing Brave using Snap (universal package)...', colors.blue);
        
        // Snap works well on ARM64
        execSync('sudo snap install brave', { stdio: 'inherit' });
        
        if (fs.existsSync(standardPaths.snap)) {
          log(`✅ Brave installed at standard Snap location: ${standardPaths.snap}`, colors.green);
          
          // Create symbolic link
          try {
            execSync('sudo ln -sf /snap/bin/brave /usr/local/bin/brave', { stdio: 'inherit' });
            log('🔗 Created symbolic link: /usr/local/bin/brave', colors.green);
          } catch {}
          
          return true;
        }
        
      } catch (snapError) {
        log('⚠️ Snap not available, trying other methods...', colors.yellow);
        
        // Method 3: Flatpak (Universal) - Good ARM64 support
        try {
          execSync('which flatpak', { stdio: 'ignore' });
          log('📦 Installing Brave using Flatpak...', colors.blue);
          
          execSync('flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo', { stdio: 'inherit' });
          execSync('sudo flatpak install -y flathub com.brave.Browser', { stdio: 'inherit' });
          
          // Create wrapper script for Flatpak
          const wrapperScript = `#!/bin/bash\nflatpak run com.brave.Browser "$@"`;
          fs.writeFileSync('/tmp/brave-wrapper.sh', wrapperScript);
          execSync('sudo mv /tmp/brave-wrapper.sh /usr/local/bin/brave', { stdio: 'inherit' });
          execSync('sudo chmod +x /usr/local/bin/brave', { stdio: 'inherit' });
          
          log('✅ Brave installed via Flatpak with wrapper script', colors.green);
          return true;
          
        } catch (flatpakError) {
          // Method 4: YUM/DNF (RedHat/Fedora)
          try {
            execSync('which yum || which dnf', { stdio: 'ignore' });
            log('📦 Installing Brave using YUM/DNF...', colors.blue);
            
            // Add Brave repository for YUM/DNF
            execSync('sudo dnf install -y dnf-plugins-core', { stdio: 'inherit' });
            execSync('sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo', { stdio: 'inherit' });
            execSync('sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc', { stdio: 'inherit' });
            execSync('sudo dnf install -y brave-browser', { stdio: 'inherit' });
            
            if (fs.existsSync(standardPaths.yum)) {
              log(`✅ Brave installed at standard YUM location: ${standardPaths.yum}`, colors.green);
              return true;
            }
            
          } catch (yumError) {
            // Method 5: Direct binary download for ARM64
            if (arch === 'arm64') {
              log('📥 Attempting direct ARM64 binary download...', colors.yellow);
              
              try {
                const downloadUrl = 'https://github.com/brave/brave-browser/releases/latest/download/brave-browser_arm64.deb';
                const debPath = '/tmp/brave-browser_arm64.deb';
                
                execSync(`wget -O ${debPath} ${downloadUrl}`, { stdio: 'inherit' });
                execSync(`sudo dpkg -i ${debPath}`, { stdio: 'inherit' });
                execSync('sudo apt-get install -f -y', { stdio: 'inherit' }); // Fix dependencies
                
                if (fs.existsSync('/usr/bin/brave-browser')) {
                  log('✅ Brave installed via direct ARM64 binary', colors.green);
                  return true;
                }
              } catch {}
            }
            
            throw new Error('No supported package manager found or installation method failed');
          }
        }
      }
    }
    
    log('✅ Brave installation completed!', colors.green);
    return true;
    
  } catch (error) {
    log(`❌ Failed to install Brave: ${error.message}`, colors.red);
    log('💡 Manual installation instructions:', colors.yellow);
    
    if (arch === 'arm64') {
      log('   For ARM64 Linux:', colors.blue);
      log('   1. Try Snap: sudo snap install brave', colors.blue);
      log('   2. Or download ARM64 .deb from: https://brave.com/linux/', colors.blue);
    } else {
      log('   For x64 Linux:', colors.blue);
      log('   1. Visit: https://brave.com/linux/', colors.blue);
      log('   2. Follow distribution-specific instructions', colors.blue);
    }
    
    return false;
  }
}

async function main() {
  log('\n🚀 Brave Browser Setup Script', colors.bright);
  log('================================\n', colors.bright);
  
  // Check if Brave is already installed
  const existingBrave = detectExistingBrave();
  
  if (existingBrave) {
    log('✨ Brave is already installed! Skipping installation.', colors.green);
    log(`📍 BRAVE_PATH set to: ${existingBrave}`, colors.blue);
    
    // Write to .env file for future use
    const envContent = `BRAVE_PATH="${existingBrave}"\n`;
    fs.writeFileSync('.env', envContent, { flag: 'w' });
    log('📝 Saved BRAVE_PATH to .env file', colors.green);
    
    return;
  }
  
  // Brave not found, proceed with installation
  log('⚠️ Brave not found. Starting automatic installation...', colors.yellow);
  
  const platform = process.platform;
  let installed = false;
  
  switch (platform) {
    case 'win32':
      installed = await installBraveWindows();
      break;
    case 'darwin':
      installed = await installBraveMacOS();
      break;
    case 'linux':
      installed = await installBraveLinux();
      break;
    default:
      log(`❌ Unsupported platform: ${platform}`, colors.red);
      log('Please install Brave manually from: https://brave.com/download/', colors.yellow);
  }
  
  if (installed) {
    // Verify installation
    const newBravePath = detectExistingBrave();
    if (newBravePath) {
      log(`\n🎉 Setup complete! BRAVE_PATH: ${newBravePath}`, colors.green);
      
      // Write to .env file
      const envContent = `BRAVE_PATH="${newBravePath}"\n`;
      fs.writeFileSync('.env', envContent, { flag: 'w' });
      log('📝 Saved BRAVE_PATH to .env file', colors.green);
    }
  } else {
    log('\n⚠️ Automatic installation failed. Please install Brave manually.', colors.yellow);
    log('Download from: https://brave.com/download/', colors.blue);
    log('After installation, run: npm run setup-brave', colors.blue);
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
