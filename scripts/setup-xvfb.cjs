#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');

console.log('🖥️ Xvfb Setup for Headless Environments');
console.log('======================================');

const platform = os.platform();
console.log(`Platform: ${platform}`);

// Check if running in a headless environment
function isHeadless() {
  const display = process.env.DISPLAY;
  const ci = process.env.CI;
  const headless = process.env.HEADLESS;
  
  // Check for SSH without X11 forwarding
  const sshClient = process.env.SSH_CLIENT;
  const xAuthority = process.env.XAUTHORITY;
  
  // Check for common headless indicators
  if (ci === 'true' || headless === 'true') {
    return true;
  }
  
  // Check if DISPLAY is not set or invalid
  if (!display || display === '' || display === ':0' && !xAuthority) {
    return true;
  }
  
  // Check if SSH without X11
  if (sshClient && !display) {
    return true;
  }
  
  // Try to detect GUI availability on Linux
  if (platform === 'linux') {
    try {
      execSync('pidof X Xorg > /dev/null 2>&1', { stdio: 'ignore' });
      return false; // GUI detected
    } catch {
      return true; // No GUI detected
    }
  }
  
  return false;
}

function hasGui() {
  if (platform === 'win32' || platform === 'darwin') {
    return true; // Windows and macOS always have GUI
  }
  
  if (platform === 'linux') {
    try {
      // Check for running display server
      execSync('pidof X Xorg Xwayland > /dev/null 2>&1', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

async function setupXvfbLinux() {
  console.log('🐧 Setting up Xvfb for Linux...');
  
  try {
    // Check if Xvfb is already installed
    try {
      execSync('which Xvfb', { stdio: 'ignore' });
      console.log('✅ Xvfb already installed');
    } catch {
      console.log('📦 Installing Xvfb...');
      
      // Detect package manager and install
      try {
        execSync('which apt-get', { stdio: 'ignore' });
        execSync('sudo apt-get update && sudo apt-get install -y xvfb', { stdio: 'inherit' });
      } catch {
        try {
          execSync('which yum', { stdio: 'ignore' });
          execSync('sudo yum install -y xorg-x11-server-Xvfb', { stdio: 'inherit' });
        } catch {
          try {
            execSync('which dnf', { stdio: 'ignore' });
            execSync('sudo dnf install -y xorg-x11-server-Xvfb', { stdio: 'inherit' });
          } catch {
            throw new Error('No supported package manager found for Xvfb installation');
          }
        }
      }
    }
    
    // Create Xvfb startup script
    const xvfbScript = `#!/bin/bash
# Xvfb startup script for Brave browser
export DISPLAY=:99
Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
echo "Xvfb started with PID: $XVFB_PID"
echo $XVFB_PID > /tmp/xvfb.pid
`;
    
    fs.writeFileSync('/tmp/start-xvfb.sh', xvfbScript);
    execSync('chmod +x /tmp/start-xvfb.sh');
    
    console.log('📝 Created Xvfb startup script');
    
    // Set environment variable
    process.env.XVFB_AVAILABLE = 'true';
    
    // Save to .env file
    let envContent = '';
    if (fs.existsSync('.env')) {
      envContent = fs.readFileSync('.env', 'utf8');
    }
    
    if (!envContent.includes('XVFB_AVAILABLE')) {
      envContent += '\nXVFB_AVAILABLE=true\n';
      envContent += 'DISPLAY=:99\n';
      fs.writeFileSync('.env', envContent);
    }
    
    console.log('✅ Xvfb setup completed');
    return true;
  } catch (error) {
    console.error('❌ Failed to setup Xvfb:', error.message);
    return false;
  }
}

function detectEnvironment() {
  const headless = isHeadless();
  const gui = hasGui();
  
  console.log(`🔍 Environment Detection:`);
  console.log(`  - Headless: ${headless}`);
  console.log(`  - GUI Available: ${gui}`);
  console.log(`  - Platform: ${platform}`);
  console.log(`  - DISPLAY: ${process.env.DISPLAY || 'not set'}`);
  console.log(`  - CI: ${process.env.CI || 'false'}`);
  console.log(`  - SSH_CLIENT: ${process.env.SSH_CLIENT || 'not set'}`);
  
  return { headless, gui };
}

async function main() {
  try {
    const { headless, gui } = detectEnvironment();
    
    if (platform === 'linux') {
      if (headless || !gui) {
        console.log('🖥️ Headless environment detected, setting up Xvfb...');
        const success = await setupXvfbLinux();
        if (success) {
          console.log('🎉 Xvfb setup completed successfully!');
          console.log('💡 Use DISPLAY=:99 for headless browser operations');
        } else {
          console.log('⚠️ Xvfb setup failed. Browser may need --no-sandbox flag.');
        }
      } else {
        console.log('🖼️ GUI environment detected, Xvfb not needed');
        
        // Save to .env file
        let envContent = '';
        if (fs.existsSync('.env')) {
          envContent = fs.readFileSync('.env', 'utf8');
        }
        
        if (!envContent.includes('GUI_AVAILABLE')) {
          envContent += '\nGUI_AVAILABLE=true\n';
          fs.writeFileSync('.env', envContent);
        }
      }
    } else {
      console.log(`🖼️ Platform ${platform} has native GUI support, Xvfb not needed`);
      
      // Save to .env file
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
      }
      
      if (!envContent.includes('GUI_AVAILABLE')) {
        envContent += '\nGUI_AVAILABLE=true\n';
        fs.writeFileSync('.env', envContent);
      }
    }
    
  } catch (error) {
    console.error('❌ Environment setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  isHeadless,
  hasGui,
  detectEnvironment,
  setupXvfbLinux
};
