/**
 * @license Copyright 2024 Brave Real Launcher Contributors.
 * Licensed under the Apache License, Version 2.0
 * 
 * Brave Browser Installer
 * Auto-installs Brave browser on Windows, Linux, and macOS
 */
'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { execSync, spawn } from 'child_process';
import { homedir } from 'os';
import log from './logger.js';
import { getPlatform } from './utils.js';

export interface InstallerOptions {
    silent?: boolean;
    downloadDir?: string;
    channel?: 'release' | 'beta' | 'nightly';
}

export interface InstallResult {
    success: boolean;
    bravePath?: string;
    error?: string;
}

const BRAVE_DOWNLOAD_URLS = {
    win32: {
        release: 'https://laptop-updates.brave.com/latest/winx64',
        beta: 'https://laptop-updates.brave.com/latest/winx64-beta',
        nightly: 'https://laptop-updates.brave.com/latest/winx64-nightly'
    },
    darwin: {
        release: 'https://laptop-updates.brave.com/latest/osx',
        beta: 'https://laptop-updates.brave.com/latest/osx-beta',
        nightly: 'https://laptop-updates.brave.com/latest/osx-nightly'
    }
};

export class BraveInstaller {
    private silent: boolean;
    private downloadDir: string;
    private channel: 'release' | 'beta' | 'nightly';

    constructor(options: InstallerOptions = {}) {
        this.silent = options.silent || false;
        this.downloadDir = options.downloadDir || path.join(homedir(), '.brave-real-launcher', 'downloads');
        this.channel = options.channel || 'release';

        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }
    }

    /**
     * Install Brave browser on the current platform
     */
    async install(): Promise<InstallResult> {
        const platform = getPlatform();

        if (!this.silent) {
            log.log('BraveInstaller', `Installing Brave Browser on ${platform}...`);
        }

        try {
            switch (platform) {
                case 'win32':
                    return await this.installWindows();
                case 'linux':
                    return await this.installLinux();
                case 'darwin':
                    return await this.installMacOS();
                default:
                    return { success: false, error: `Unsupported platform: ${platform}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Install Brave on Windows
     */
    private async installWindows(): Promise<InstallResult> {
        const installerPath = path.join(this.downloadDir, 'BraveBrowserSetup.exe');
        const downloadUrl = BRAVE_DOWNLOAD_URLS.win32[this.channel];

        if (!this.silent) {
            log.log('BraveInstaller', 'Downloading Brave installer for Windows...');
        }

        // Download installer
        await this.downloadFile(downloadUrl, installerPath);

        if (!this.silent) {
            log.log('BraveInstaller', 'Running Brave installer (silent mode)...');
        }

        // Run installer silently
        try {
            execSync(`"${installerPath}" /silent /install`, {
                stdio: 'ignore',
                timeout: 300000 // 5 minutes timeout
            });
        } catch (error) {
            // Try alternative silent flags
            try {
                execSync(`"${installerPath}" --system-level --do-not-launch-chrome`, {
                    stdio: 'ignore',
                    timeout: 300000
                });
            } catch (e) {
                // Installation might still succeed, continue checking
            }
        }

        // Wait for installation to complete
        await this.delay(5000);

        // Find Brave installation
        const bravePath = this.findBraveWindows();

        if (bravePath) {
            if (!this.silent) {
                log.log('BraveInstaller', `Brave installed successfully at: ${bravePath}`);
            }

            // Cleanup installer
            try { fs.unlinkSync(installerPath); } catch (e) { }

            return { success: true, bravePath };
        }

        return { success: false, error: 'Installation completed but Brave not found' };
    }

    /**
     * Install Brave on Linux
     */
    private async installLinux(): Promise<InstallResult> {
        if (!this.silent) {
            log.log('BraveInstaller', 'Installing Brave on Linux...');
        }

        // Detect package manager
        const packageManager = this.detectLinuxPackageManager();

        try {
            if (packageManager === 'apt') {
                // Debian/Ubuntu based
                execSync('sudo apt install -y curl', { stdio: 'ignore' });
                execSync('sudo curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg', { stdio: 'ignore' });
                execSync('echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main" | sudo tee /etc/apt/sources.list.d/brave-browser-release.list', { stdio: 'ignore' });
                execSync('sudo apt update', { stdio: 'ignore' });
                execSync('sudo apt install -y brave-browser', { stdio: 'ignore' });
            } else if (packageManager === 'dnf' || packageManager === 'yum') {
                // Fedora/RHEL based
                execSync('sudo dnf install -y dnf-plugins-core', { stdio: 'ignore' });
                execSync('sudo dnf config-manager --add-repo https://brave-browser-rpm-release.s3.brave.com/brave-browser.repo', { stdio: 'ignore' });
                execSync('sudo rpm --import https://brave-browser-rpm-release.s3.brave.com/brave-core.asc', { stdio: 'ignore' });
                execSync('sudo dnf install -y brave-browser', { stdio: 'ignore' });
            } else if (packageManager === 'pacman') {
                // Arch based
                execSync('yay -S --noconfirm brave-bin', { stdio: 'ignore' });
            } else {
                return { success: false, error: `Unsupported package manager. Please install Brave manually.` };
            }

            // Find Brave installation
            const bravePath = this.findBraveLinux();
            if (bravePath) {
                if (!this.silent) {
                    log.log('BraveInstaller', `Brave installed successfully at: ${bravePath}`);
                }
                return { success: true, bravePath };
            }

            return { success: false, error: 'Installation completed but Brave not found' };
        } catch (error) {
            return { success: false, error: `Linux installation failed: ${error.message}` };
        }
    }

    /**
     * Install Brave on macOS
     */
    private async installMacOS(): Promise<InstallResult> {
        const dmgPath = path.join(this.downloadDir, 'Brave-Browser.dmg');
        const downloadUrl = BRAVE_DOWNLOAD_URLS.darwin[this.channel];

        if (!this.silent) {
            log.log('BraveInstaller', 'Downloading Brave for macOS...');
        }

        // Download DMG
        await this.downloadFile(downloadUrl, dmgPath);

        if (!this.silent) {
            log.log('BraveInstaller', 'Installing Brave...');
        }

        try {
            // Mount DMG
            const mountOutput = execSync(`hdiutil attach "${dmgPath}" -nobrowse`, { encoding: 'utf-8' });
            const mountPoint = mountOutput.split('\t').pop()?.trim() || '/Volumes/Brave Browser';

            // Copy to Applications
            execSync(`cp -R "${mountPoint}/Brave Browser.app" /Applications/`, { stdio: 'ignore' });

            // Unmount DMG
            execSync(`hdiutil detach "${mountPoint}"`, { stdio: 'ignore' });

            // Cleanup
            try { fs.unlinkSync(dmgPath); } catch (e) { }

            const bravePath = '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';
            if (fs.existsSync(bravePath)) {
                if (!this.silent) {
                    log.log('BraveInstaller', `Brave installed successfully at: ${bravePath}`);
                }
                return { success: true, bravePath };
            }

            return { success: false, error: 'Installation completed but Brave not found' };
        } catch (error) {
            return { success: false, error: `macOS installation failed: ${error.message}` };
        }
    }

    /**
     * Download file from URL
     */
    private downloadFile(url: string, destPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const followRedirect = (currentUrl: string, redirectCount = 0) => {
                if (redirectCount > 10) {
                    reject(new Error('Too many redirects'));
                    return;
                }

                const protocol = currentUrl.startsWith('https') ? https : http;

                protocol.get(currentUrl, {
                    headers: { 'User-Agent': 'brave-real-launcher' }
                }, (response) => {
                    if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                        let redirectUrl = response.headers.location;
                        if (redirectUrl) {
                            // Handle relative redirect URLs
                            if (!redirectUrl.startsWith('http')) {
                                try {
                                    const baseUrl = new URL(currentUrl);
                                    redirectUrl = new URL(redirectUrl, baseUrl.origin).href;
                                } catch (e) {
                                    reject(new Error(`Invalid redirect URL: ${redirectUrl}`));
                                    return;
                                }
                            }
                            followRedirect(redirectUrl, redirectCount + 1);
                            return;
                        }
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`Download failed: ${response.statusCode}`));
                        return;
                    }

                    const file = fs.createWriteStream(destPath);
                    response.pipe(file);

                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });

                    file.on('error', (err) => {
                        fs.unlinkSync(destPath);
                        reject(err);
                    });
                }).on('error', reject);
            };

            followRedirect(url);
        });
    }

    /**
     * Detect Linux package manager
     */
    private detectLinuxPackageManager(): string {
        try {
            execSync('which apt', { stdio: 'ignore' });
            return 'apt';
        } catch (e) { }

        try {
            execSync('which dnf', { stdio: 'ignore' });
            return 'dnf';
        } catch (e) { }

        try {
            execSync('which yum', { stdio: 'ignore' });
            return 'yum';
        } catch (e) { }

        try {
            execSync('which pacman', { stdio: 'ignore' });
            return 'pacman';
        } catch (e) { }

        return 'unknown';
    }

    /**
     * Find Brave on Windows
     */
    private findBraveWindows(): string | null {
        const paths = [
            `${process.env.LOCALAPPDATA}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
            `${process.env.PROGRAMFILES}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
            `${process.env['PROGRAMFILES(X86)']}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
        ];

        for (const p of paths) {
            if (p && fs.existsSync(p)) {
                return p;
            }
        }
        return null;
    }

    /**
     * Find Brave on Linux
     */
    private findBraveLinux(): string | null {
        const paths = [
            '/usr/bin/brave-browser',
            '/usr/bin/brave-browser-stable',
            '/opt/brave.com/brave/brave',
            '/snap/bin/brave'
        ];

        for (const p of paths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return null;
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if Brave is installed
     */
    static isInstalled(): boolean {
        const platform = getPlatform();
        const installer = new BraveInstaller({ silent: true });

        switch (platform) {
            case 'win32':
                return installer.findBraveWindows() !== null;
            case 'linux':
                return installer.findBraveLinux() !== null;
            case 'darwin':
                return fs.existsSync('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser');
            default:
                return false;
        }
    }
}

export default BraveInstaller;
