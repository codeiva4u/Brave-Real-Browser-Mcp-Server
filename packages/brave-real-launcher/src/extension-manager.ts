/**
 * @license Copyright 2024 Brave Real Launcher Contributors.
 * Licensed under the Apache License, Version 2.0
 * 
 * Extension Manager for Brave Real Launcher
 * Handles downloading, caching, and loading browser extensions
 */
'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { execSync } from 'child_process';
import { homedir } from 'os';
import log from './logger.js';

export interface ExtensionInfo {
    name: string;
    version: string;
    path: string;
}

export interface ExtensionManagerOptions {
    cacheDir?: string;
    autoUpdate?: boolean;
    silent?: boolean;
}

const UBLOCK_GITHUB_API = 'https://api.github.com/repos/gorhill/uBlock/releases/latest';
const UBLOCK_DOWNLOAD_BASE = 'https://github.com/gorhill/uBlock/releases/download';

export class ExtensionManager {
    private cacheDir: string;
    private autoUpdate: boolean;
    private silent: boolean;

    constructor(options: ExtensionManagerOptions = {}) {
        this.cacheDir = options.cacheDir || this.getDefaultCacheDir();
        this.autoUpdate = options.autoUpdate !== false;
        this.silent = options.silent || false;

        // Ensure cache directory exists
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    private getDefaultCacheDir(): string {
        const homeDir = homedir();
        return path.join(homeDir, '.brave-real-launcher', 'extensions');
    }

    /**
     * Get uBlock Origin extension, downloading if necessary
     * Only checks for updates once per day to avoid slow startup
     */
    async getUBlockOrigin(): Promise<ExtensionInfo | null> {
        try {
            const extensionDir = path.join(this.cacheDir, 'ublock-origin');
            const versionFile = path.join(extensionDir, 'version.json');

            // Check if we need to update
            let needsUpdate = !fs.existsSync(extensionDir);
            let currentVersion = '0.0.0';
            let lastChecked = 0;

            if (fs.existsSync(versionFile)) {
                try {
                    const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
                    currentVersion = versionData.version;
                    lastChecked = versionData.lastChecked || 0;
                } catch (e) {
                    needsUpdate = true;
                }
            } else {
                needsUpdate = true;
            }

            // Only check for updates once per day (24 hours = 86400000 ms)
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            const shouldCheckForUpdate = this.autoUpdate && (Date.now() - lastChecked > ONE_DAY_MS);

            // Get latest version info only if needed (first install or daily check)
            if (needsUpdate || shouldCheckForUpdate) {
                const latestInfo = await this.getLatestUBlockVersion();

                if (latestInfo) {
                    if (needsUpdate || this.compareVersions(latestInfo.version, currentVersion) > 0) {
                        if (!this.silent && !needsUpdate) {
                            log.log('ExtensionManager', `uBlock Origin update available: ${currentVersion} → ${latestInfo.version}`);
                        }
                        await this.downloadAndExtractUBlock(latestInfo.downloadUrl, extensionDir, latestInfo.version);
                    } else {
                        // No update needed, just update lastChecked timestamp
                        this.updateLastCheckedTimestamp(versionFile, currentVersion);
                        if (!this.silent) {
                            log.verbose('ExtensionManager', `uBlock Origin v${currentVersion} is up to date`);
                        }
                    }
                }
            } else {
                // Using cached version, skip update check
                if (!this.silent) {
                    log.verbose('ExtensionManager', `Using cached uBlock Origin v${currentVersion} (next check in ${Math.round((ONE_DAY_MS - (Date.now() - lastChecked)) / 3600000)}h)`);
                }
            }

            // Find the extension manifest
            const manifestPath = this.findManifest(extensionDir);
            if (manifestPath) {
                const manifestDir = path.dirname(manifestPath);
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

                return {
                    name: 'uBlock Origin',
                    version: manifest.version || currentVersion,
                    path: manifestDir
                };
            }

            return null;
        } catch (error) {
            if (!this.silent) {
                log.error('ExtensionManager', `Failed to get uBlock Origin: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Update lastChecked timestamp without re-downloading
     */
    private updateLastCheckedTimestamp(versionFile: string, version: string): void {
        try {
            fs.writeFileSync(versionFile, JSON.stringify({
                version,
                downloadedAt: new Date().toISOString(),
                lastChecked: Date.now()
            }));
        } catch (e) {
            // Ignore write errors
        }
    }

    /**
     * Get latest uBlock Origin version from GitHub
     */
    private async getLatestUBlockVersion(): Promise<{ version: string, downloadUrl: string } | null> {
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.github.com',
                path: '/repos/gorhill/uBlock/releases/latest',
                method: 'GET',
                headers: {
                    'User-Agent': 'brave-real-launcher',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const release = JSON.parse(data);
                        const version = release.tag_name?.replace('v', '') || release.name;

                        // Find chromium zip asset
                        const chromiumAsset = release.assets?.find((asset: any) =>
                            asset.name.includes('chromium') && asset.name.endsWith('.zip')
                        );

                        if (chromiumAsset) {
                            resolve({
                                version,
                                downloadUrl: chromiumAsset.browser_download_url
                            });
                        } else {
                            // Fallback to constructed URL
                            resolve({
                                version,
                                downloadUrl: `${UBLOCK_DOWNLOAD_BASE}/${release.tag_name}/uBlock0_${version}.chromium.zip`
                            });
                        }
                    } catch (e) {
                        resolve(null);
                    }
                });
            });

            req.on('error', () => resolve(null));
            req.setTimeout(10000, () => {
                req.destroy();
                resolve(null);
            });
            req.end();
        });
    }

    /**
     * Download and extract uBlock Origin
     */
    private async downloadAndExtractUBlock(url: string, targetDir: string, version: string): Promise<void> {
        if (!this.silent) {
            log.log('ExtensionManager', `Downloading uBlock Origin v${version}...`);
        }

        const zipPath = path.join(this.cacheDir, 'ublock-temp.zip');

        // Download the file
        await this.downloadFile(url, zipPath);

        // Clean target directory
        if (fs.existsSync(targetDir)) {
            this.removeDir(targetDir);
        }
        fs.mkdirSync(targetDir, { recursive: true });

        // Extract the zip
        await this.extractZip(zipPath, targetDir);

        // Save version info with lastChecked timestamp
        const versionFile = path.join(targetDir, 'version.json');
        fs.writeFileSync(versionFile, JSON.stringify({
            version,
            downloadedAt: new Date().toISOString(),
            lastChecked: Date.now()
        }));

        // Cleanup zip
        try {
            fs.unlinkSync(zipPath);
        } catch (e) { }

        if (!this.silent) {
            log.log('ExtensionManager', `uBlock Origin v${version} installed successfully`);
        }
    }

    /**
     * Download a file from URL
     */
    private downloadFile(url: string, destPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const followRedirect = (url: string, redirectCount = 0) => {
                if (redirectCount > 5) {
                    reject(new Error('Too many redirects'));
                    return;
                }

                const protocol = url.startsWith('https') ? https : http;

                protocol.get(url, {
                    headers: { 'User-Agent': 'brave-real-launcher' }
                }, (response) => {
                    // Handle redirects
                    if (response.statusCode === 301 || response.statusCode === 302) {
                        const redirectUrl = response.headers.location;
                        if (redirectUrl) {
                            followRedirect(redirectUrl, redirectCount + 1);
                            return;
                        }
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`Download failed with status ${response.statusCode}`));
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
     * Extract zip file
     */
    private async extractZip(zipPath: string, targetDir: string): Promise<void> {
        const platform = process.platform;

        try {
            if (platform === 'win32') {
                // Use PowerShell on Windows
                execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`, {
                    stdio: 'ignore'
                });
            } else {
                // Use unzip on Linux/macOS
                execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, {
                    stdio: 'ignore'
                });
            }
        } catch (error) {
            throw new Error(`Failed to extract zip: ${error.message}`);
        }
    }

    /**
     * Find manifest.json in extension directory
     */
    private findManifest(dir: string): string | null {
        if (!fs.existsSync(dir)) return null;

        // Check current directory
        const directManifest = path.join(dir, 'manifest.json');
        if (fs.existsSync(directManifest)) {
            return directManifest;
        }

        // Check subdirectories (zip might have a nested folder)
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const nestedManifest = path.join(dir, entry.name, 'manifest.json');
                if (fs.existsSync(nestedManifest)) {
                    return nestedManifest;
                }
            }
        }

        return null;
    }

    /**
     * Compare semantic versions
     */
    private compareVersions(a: string, b: string): number {
        const partsA = a.replace(/[^\d.]/g, '').split('.').map(Number);
        const partsB = b.replace(/[^\d.]/g, '').split('.').map(Number);

        for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
            const numA = partsA[i] || 0;
            const numB = partsB[i] || 0;
            if (numA > numB) return 1;
            if (numA < numB) return -1;
        }
        return 0;
    }

    /**
     * Remove directory recursively
     */
    private removeDir(dir: string): void {
        const rmSync = (fs as any).rmSync || (fs as any).rmdirSync;
        try {
            rmSync(dir, { recursive: true, force: true });
        } catch (e) { }
    }

    /**
     * Get extension load flags for browser
     */
    getExtensionFlags(extensionPaths: string[]): string[] {
        if (extensionPaths.length === 0) return [];

        return [
            `--load-extension=${extensionPaths.join(',')}`,
            '--enable-extensions'
        ];
    }

    /**
     * Clean extension cache
     */
    cleanCache(): void {
        if (fs.existsSync(this.cacheDir)) {
            this.removeDir(this.cacheDir);
            if (!this.silent) {
                log.log('ExtensionManager', 'Extension cache cleaned');
            }
        }
    }
}

export default ExtensionManager;
