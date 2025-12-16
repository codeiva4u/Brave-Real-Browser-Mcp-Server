const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, exec } = require('child_process');
const https = require('https');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    cyan: "\x1b[36m"
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    let color = colors.reset;
    if (type === 'success') color = colors.green;
    if (type === 'warn') color = colors.yellow;
    if (type === 'error') color = colors.red;
    if (type === 'info') color = colors.cyan;
    console.log(`${color}[${type.toUpperCase()}] ${message}${colors.reset}`);
}

const platform = os.platform();

// Define standard paths including the user's specific request
const bravePaths = {
    win32: [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', // User's requested primary path
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        path.join(os.homedir(), 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
    ],
    darwin: [
        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    ],
    linux: [
        '/usr/bin/brave-browser',
        '/usr/bin/brave',
        '/snap/bin/brave'
    ]
};

async function checkBraveInstallation() {
    log("Checking for Brave Browser installation...", 'info');
    
    let foundPath = null;
    const pathsToCheck = bravePaths[platform] || [];

    for (const p of pathsToCheck) {
        if (fs.existsSync(p)) {
            foundPath = p;
            break;
        }
    }

    if (foundPath) {
        log(`Brave Browser found at: ${foundPath}`, 'success');
        updateEnvFile(foundPath);
        return true;
    } else {
        log("Brave Browser not found in standard locations.", 'warn');
        return false;
    }
}

function updateEnvFile(bravePath) {
    const envPath = path.join(__dirname, '..', '.env');
    try {
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        } else {
             // Create from example if possible, or just start empty
             const examplePath = path.join(__dirname, '..', '.env.example');
             if(fs.existsSync(examplePath)) {
                envContent = fs.readFileSync(examplePath, 'utf8');
             }
        }

        // Check if BRAVE_PATH is already set
        if (envContent.includes('BRAVE_PATH=')) {
             // Replace existing
             const newContent = envContent.replace(/^BRAVE_PATH=.*$/m, `BRAVE_PATH=${bravePath}`);
             if (newContent !== envContent) {
                 fs.writeFileSync(envPath, newContent);
                 log("Updated .env with detected Brave path.", 'success');
             } else {
                 log(".env already has a BRAVE_PATH set (or format differs).", 'info');
             }
        } else {
            // Append
            fs.appendFileSync(envPath, `\nBRAVE_PATH=${bravePath}\n`);
            log("Appended BRAVE_PATH to .env.", 'success');
        }
    } catch (err) {
        log(`Failed to update .env: ${err.message}`, 'error');
    }
}

async function installBrave() {
    log("Attempting to install Brave Browser...", 'info');
    
    if (platform === 'win32') {
        const installerUrl = 'https://laptop-updates.brave.com/latest/winx64'; // Standard stub installer
        const installerPath = path.join(os.tmpdir(), 'BraveBrowserSetup.exe');
        
        try {
            await downloadFile(installerUrl, installerPath);
            log(`Installer downloaded to ${installerPath}`, 'success');
            log("Running installer... Please follow the prompts if any appear.", 'info');
            
            // Run installer
            // /silent /install are common flags for Chromium based browsers.
            // But we use start to let it run interactively if needed, or silent if possible.
            // The standard stub installer usually just runs.
            exec(`"${installerPath}"`, (error, stdout, stderr) => {
                if (error) {
                    log(`Installer execution failed: ${error.message}`, 'error');
                } else {
                    log("Installer started. Please complete the installation.", 'success');
                }
            });

        } catch (err) {
            log(`Failed to download/run installer: ${err.message}`, 'error');
            log("Please install Brave manually from https://brave.com/download/", 'warn');
        }
    } else if (platform === 'darwin') {
        log("Automatic installation on macOS is complex. Opening download page...", 'info');
        exec('open https://brave.com/download/');
    } else if (platform === 'linux') {
        log("Please install Brave using your package manager (apt, dnf, snap, etc.).", 'info');
        console.log("Visit: https://brave.com/linux/");
    } else {
        log(`Unsupported platform for auto-install: ${platform}`, 'error');
    }
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                 reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
                 return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {}); // Delete the file async. (But we don't check result)
            reject(err);
        });
    });
}

async function main() {
    const isInstalled = await checkBraveInstallation();
    if (!isInstalled) {
        await installBrave();
    }
}

main().catch(err => {
    console.error("Setup script failed:", err);
    process.exit(0); 
});
