#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

console.log('🦁 Brave Browser Auto-Installer');
console.log('=================================');

const platform = os.platform();
const arch = os.arch();
const isCI = process.env.CI === 'true';

console.log(`Platform: ${platform} ${arch}`);
console.log(`CI Environment: ${isCI}`);

// Brave installation paths by platform
const BRAVE_PATHS = {
  win32: {
    x64: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(os.homedir(), 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
      path.join(os.homedir(), 'AppData\\Roaming\\BraveSoftware\\Brave-Browser\\Application\\brave.exe')
    ],
    arm64: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      path.join(os.homedir(), 'AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe')
    ]
  },
  darwin: {
    x64: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
    arm64: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser']
  },
  linux: {
    x64: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave-browser-stable',
      '/snap/bin/brave',
      '/var/lib/flatpak/exports/bin/com.brave.Browser',
      path.join(os.homedir(), '/.local/bin/brave-browser')
    ],
    arm64: [
      '/usr/bin/brave-browser',
      '/usr/bin/brave-browser-stable',
      '/snap/bin/brave',
      '/var/lib/flatpak/exports/bin/com.brave.Browser',
      path.join(os.homedir(), '/.local/bin/brave-browser')
    ]
  }
};

// Download URLs for Brave
const BRAVE_DOWNLOADS = {
  win32: {
    x64: 'https://laptop-updates.brave.com/latest/winx64',
    arm64: 'https://laptop-updates.brave.com/latest/winia32'
  },
  darwin: {
    x64: 'https://laptop-updates.brave.com/latest/osx',
    arm64: 'https://laptop-updates.brave.com/latest/osxarm64'
  },
  linux: {
    x64: 'https://brave-browser-apt-release.s3.brave.com/pool/main/b/brave-browser/',
    arm64: 'https://brave-browser-apt-release.s3.brave.com/pool/main/b/brave-browser/'
  }
};

function findExistingBrave() {
  console.log('🔍 Checking for existing Brave installation...');
  
  const paths = BRAVE_PATHS[platform]?.[arch] || [];
  
  for (const bravePath of paths) {
    try {
      if (fs.existsSync(bravePath)) {
        console.log(`✅ Found Brave at: ${bravePath}`);
        
        // Set environment variable
        process.env.BRAVE_PATH = bravePath;
        
        // Save to .env file
        const envContent = `BRAVE_PATH="${bravePath}"`;
        fs.writeFileSync('.env', envContent);
        
        console.log(`📝 Saved BRAVE_PATH to .env file`);
        return bravePath;
      }
    } catch (error) {
      // Continue searching
    }
  }
  
  console.log('❌ No existing Brave installation found');
  return null;
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      reject(err);
    });
  });
}

async function installBraveWindows() {
  console.log('🪟 Installing Brave on Windows...');
  
  const downloadUrl = BRAVE_DOWNLOADS[platform][arch];
  const installerPath = path.join(os.tmpdir(), 'BraveSetup.exe');
  
  try {
    console.log('📥 Downloading Brave installer...');
    await downloadFile(downloadUrl, installerPath);
    
    console.log('🚀 Running Brave installer...');
    execSync(`"${installerPath}" /silent /install`, { stdio: 'inherit' });
    
    // Wait for installation to complete
    console.log('⏳ Waiting for installation to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Clean up installer
    fs.unlinkSync(installerPath);
    
    // Find the new installation
    const bravePath = findExistingBrave();
    if (bravePath) {
      console.log('✅ Brave installed successfully');
      return bravePath;
    } else {
      throw new Error('Installation completed but Brave not found');
    }
  } catch (error) {
    console.error('❌ Failed to install Brave on Windows:', error.message);
    throw error;
  }
}

async function installBraveMacOS() {
  console.log('🍎 Installing Brave on macOS...');
  
  try {
    // Check if Homebrew is available
    try {
      execSync('which brew', { stdio: 'ignore' });
      console.log('🍺 Using Homebrew to install Brave...');
      execSync('brew install --cask brave-browser', { stdio: 'inherit' });
    } catch (homebrewError) {
      console.log('📥 Downloading Brave DMG...');
      const downloadUrl = BRAVE_DOWNLOADS[platform][arch];
      const dmgPath = path.join(os.tmpdir(), 'Brave-Browser.dmg');
      
      await downloadFile(downloadUrl, dmgPath);
      
      console.log('📦 Mounting DMG...');
      execSync(`hdiutil attach "${dmgPath}"`, { stdio: 'inherit' });
      
      console.log('📱 Installing Brave...');
      execSync('cp -R "/Volumes/Brave Browser/Brave Browser.app" /Applications/', { stdio: 'inherit' });
      
      console.log('📤 Unmounting DMG...');
      execSync('hdiutil detach "/Volumes/Brave Browser"', { stdio: 'inherit' });
      
      // Clean up
      fs.unlinkSync(dmgPath);
    }
    
    const bravePath = findExistingBrave();
    if (bravePath) {
      console.log('✅ Brave installed successfully');
      return bravePath;
    } else {
      throw new Error('Installation completed but Brave not found');
    }
  } catch (error) {
    console.error('❌ Failed to install Brave on macOS:', error.message);
    throw error;
  }
}

async function installBraveLinux() {
  console.log('🐧 Installing Brave on Linux...');
  
  try {
    // Detect package manager
    let packageManager = null;
    
    try {
      execSync('which apt-get', { stdio: 'ignore' });
      packageManager = 'apt';
    } catch {}
    
    try {
      execSync('which yum', { stdio: 'ignore' });
      packageManager = 'yum';
    } catch {}
    
    try {
      execSync('which dnf', { stdio: 'ignore' });
      packageManager = 'dnf';
    } catch {}
    
    if (packageManager === 'apt') {
      console.log('📦 Using APT to install Brave...');
      execSync('sudo apt-get update', { stdio: 'inherit' });
      execSync('sudo apt-get install -y curl', { stdio: 'inherit' });
      execSync('sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg', { stdio: 'inherit' });
      execSync('echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg arch=amd64] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list', { stdio: 'inherit' });
      execSync('sudo apt-get update', { stdio: 'inherit' });
      execSync('sudo apt-get install -y brave-browser', { stdio: 'inherit' });
    } else if (packageManager === 'dnf') {
      console.log('📦 Using DNF to install Brave...');
      execSync('sudo dnf install -y dnf-plugins-core', { stdio: 'inherit' });
      execSync('sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/x86_64/', { stdio: 'inherit' });
      execSync('sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc', { stdio: 'inherit' });
      execSync('sudo dnf install -y brave-browser', { stdio: 'inherit' });
    } else if (packageManager === 'yum') {
      console.log('📦 Using YUM to install Brave...');
      execSync('sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc', { stdio: 'inherit' });
      execSync('echo -e "[brave-browser-rpm-release.s3.brave.com_x86_64_]\\nname=created by dnf config-manager from https://brave-browser-rpm-release.s3.brave.com/x86_64/\\nbaseurl=https://brave-browser-rpm-release.s3.brave.com/x86_64/\\nenabled=1\\ngpgcheck=1\\ngpgkey=https://brave-browser-rpm-release.s3.brave.com/brave-core.asc" | sudo tee /etc/yum.repos.d/brave-browser-rpm-release.s3.brave.com_x86_64_.repo', { stdio: 'inherit' });
      execSync('sudo yum install -y brave-browser', { stdio: 'inherit' });
    } else {
      // Try Snap as fallback
      try {
        execSync('which snap', { stdio: 'ignore' });
        console.log('📦 Using Snap to install Brave...');
        execSync('sudo snap install brave', { stdio: 'inherit' });
      } catch {
        throw new Error('No supported package manager found (apt, dnf, yum, snap)');
      }
    }
    
    const bravePath = findExistingBrave();
    if (bravePath) {
      console.log('✅ Brave installed successfully');
      return bravePath;
    } else {
      throw new Error('Installation completed but Brave not found');
    }
  } catch (error) {
    console.error('❌ Failed to install Brave on Linux:', error.message);
    throw error;
  }
}

async function installBrave() {
  try {
    switch (platform) {
      case 'win32':
        return await installBraveWindows();
      case 'darwin':
        return await installBraveMacOS();
      case 'linux':
        return await installBraveLinux();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    console.error('❌ Brave installation failed:', error.message);
    console.log('💡 Please install Brave manually from: https://brave.com/download/');
    return null;
  }
}

async function main() {
  try {
    // First check if Brave is already installed
    const existingBrave = findExistingBrave();
    if (existingBrave) {
      console.log('✅ Brave is already installed, skipping installation');
      return existingBrave;
    }
    
    // Install Brave
    console.log('📦 Brave not found, starting installation...');
    const bravePath = await installBrave();
    
    if (bravePath) {
      console.log('🎉 Brave installation completed successfully!');
      console.log(`📍 Brave path: ${bravePath}`);
    } else {
      console.log('⚠️  Brave installation failed. Please install manually.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Installation process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  findExistingBrave,
  installBrave,
  BRAVE_PATHS
};
