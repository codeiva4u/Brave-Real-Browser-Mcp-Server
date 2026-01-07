
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec, spawn } from 'child_process';
import axios from 'axios';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BraveInstaller {
    private static readonly WINDOWS_INSTALLER_URL = 'https://laptop-updates.brave.com/latest/winx64';
    private static readonly MAC_INSTALLER_URL = 'https://laptop-updates.brave.com/latest/osx';

    /**
     * Install Brave Browser based on the current platform with Silent/Auto options
     */
    public static async install(): Promise<boolean> {
        const platform = process.platform;
        console.error(`⬇️  Attempting to install Brave Browser for ${platform} (Silent Mode)...`);

        try {
            if (platform === 'win32') {
                return await this.installOnWindows();
            } else if (platform === 'darwin') {
                return await this.installOnMac();
            } else if (platform === 'linux') {
                return await this.installOnLinux();
            }
            return false;
        } catch (error: any) {
            console.error(`❌ Failed to install Brave: ${error.message}`);
            return false;
        }
    }

    /**
     * Install Brave on Windows (Silent Install)
     */
    private static async installOnWindows(): Promise<boolean> {
        const tempDir = os.tmpdir();
        const installerPath = path.join(tempDir, 'BraveBrowserSetup.exe');

        console.error('1️⃣  Downloading Brave Installer...');
        try {
            await this.downloadFile(this.WINDOWS_INSTALLER_URL, installerPath);
        } catch (e: any) {
            console.error(`   Download failed: ${e.message}`);
            return false;
        }

        console.error('2️⃣  Running Installer (Silent Mode)...');
        try {
            // /silent and /install are standard for Brave/Chrome
            // Triggers UAC prompt if not already elevated, but handles the UI silently
            const installCmd = `"${installerPath}" --silent --install`;
            await execAsync(installCmd);

            console.error('⏳ Waiting for installation to complete...');
            // Wait multiple intervals to ensure filesystem sync
            await new Promise(resolve => setTimeout(resolve, 30000));

            return true;
        } catch (error: any) {
            console.error('   Silent install failed, attempting interactive fallback...');
            try {
                // Fallback: Launch normally so user can interact
                const child = spawn(installerPath, { detached: true, stdio: 'ignore' });
                child.unref();
                return true;
            } catch (e) {
                console.error(`   Failed to launch installer: ${error.message}`);
                return false;
            }
        }
    }

    /**
     * Install Brave on Mac (Silent/Automated Install via DMG)
     */
    private static async installOnMac(): Promise<boolean> {
        const tempDir = os.tmpdir();
        const dmgPath = path.join(tempDir, 'Brave-Browser.dmg');

        console.error('1️⃣  Downloading Brave DMG...');
        try {
            await this.downloadFile(this.MAC_INSTALLER_URL, dmgPath);
        } catch (e: any) {
            console.error(`   Download failed: ${e.message}`);
            return false;
        }

        console.error('2️⃣  Mounting DMG...');
        try {
            // Attach huge image quietly
            await execAsync(`hdiutil attach "${dmgPath}" -nobrowse -quiet`);

            console.error('3️⃣  Copying to Applications...');
            // Copy the app bundle
            try {
                await execAsync(`cp -R "/Volumes/Brave Browser/Brave Browser.app" /Applications/`);

                // Cleanup: Detach
                try { await execAsync(`hdiutil detach "/Volumes/Brave Browser" -quiet`); } catch (e) { }

                // Force attribute update to remove quarantine (avoids 'downloaded from internet' popup)
                try { await execAsync(`xattr -r -d com.apple.quarantine "/Applications/Brave Browser.app"`); } catch (e) { }

                return true;
            } catch (e) {
                console.error('   Copy failed (Permission denied?). Opening DMG for user manually...');
                await execAsync(`open "${dmgPath}"`);
                return true;
            }
        } catch (error: any) {
            console.error(`   Install failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Install Brave on Linux (Debian/Ubuntu/Fedora support)
     */
    private static async installOnLinux(): Promise<boolean> {
        console.error('1️⃣  Detecting Linux distribution...');
        try {
            let dist = 'unknown';
            if (fs.existsSync('/etc/debian_version')) dist = 'debian';
            else if (fs.existsSync('/etc/fedora-release')) dist = 'fedora';
            // Can extend for Arch/openSUSE if needed

            console.error(`   Detected family: ${dist}`);

            if (dist === 'debian') {
                console.error('2️⃣  Installing for Debian/Ubuntu (Attempting sudo)...');
                // Basic check if we are root or can sudo
                const cmd = `
                sudo apt install -y curl &&
                sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg &&
                echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list &&
                sudo apt update &&
                sudo apt install -y brave-browser
               `;
                await execAsync(cmd);
                return true;
            } else if (dist === 'fedora') {
                console.error('2️⃣  Installing for Fedora/CentOS (Attempting sudo)...');
                const cmd = `
                sudo dnf install -y dnf-plugins-core &&
                sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo &&
                sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc &&
                sudo dnf install -y brave-browser
              `;
                await execAsync(cmd);
                return true;
            } else {
                console.error('   Unsupported Linux distribution for auto-install.');
                return false;
            }

        } catch (error: any) {
            console.error(`   Linux install failed: ${error.message}`);
            console.error('   Note: This requires sudo/root access without password or interactive terminal.');
            return false;
        }
    }

    /**
     * Download a file from URL to destination
     */
    private static async downloadFile(url: string, dest: string): Promise<void> {
        const writer = fs.createWriteStream(dest);

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }
}
