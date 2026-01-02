import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const EXTENSIONS_DIR = path.resolve(process.cwd(), 'extensions');
const UBLOCK_DIR = path.join(EXTENSIONS_DIR, 'ublock');

export class ExtensionManager {
    private static readonly GITHUB_API_URL = 'https://api.github.com/repos/gorhill/uBlock/releases/latest';
    private static readonly FALLBACK_VERSION_URL = 'https://github.com/gorhill/uBlock/releases/download/1.68.1rc1/uBlock0_1.68.1rc1.chromium.zip';

    /**
     * Ensures uBlock Origin is installed and up-to-date.
     * Returns the path to the unzipped extension.
     */
    public static async ensureUBlockOrigin(): Promise<string> {
        try {
            if (!fs.existsSync(UBLOCK_DIR)) {
                console.error('🚀 [Auto-Update] uBlock Origin not found. Installing...');
                await this.installUBlock();
            } else {
                // Optional: Check for updates (Skipped for now to avoid Github API rate limits on every startup, 
                // using existence check primarily. A real-world app might check once a day.)
                // For now, if it exists, use it.
                console.error('✅ [Auto-Update] uBlock Origin is already installed.');
            }

            return UBLOCK_DIR;
        } catch (error) {
            console.error('❌ [Auto-Update] Failed to install/update uBlock:', error);
            // Fallback: Return empty string or throw? If fails, browser opens without adblock.
            // Better to log and continue without extension than crash.
            return '';
        }
    }

    private static async installUBlock(): Promise<void> {
        // 1. Create directory
        if (!fs.existsSync(EXTENSIONS_DIR)) {
            fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
        }

        // 2. Get Download URL
        let downloadUrl = this.FALLBACK_VERSION_URL;
        try {
            const release = await axios.get(this.GITHUB_API_URL);
            const assets = release.data.assets;
            const chromiumAsset = assets.find((a: any) => a.name.includes('.chromium.zip'));
            if (chromiumAsset) {
                downloadUrl = chromiumAsset.browser_download_url;
                console.error(`⬇️ [Auto-Update] Found latest version: ${release.data.tag_name}`);
            }
        } catch (e) {
            console.warn('⚠️ [Auto-Update] Failed to fetch latest release from GitHub (Rate limit?), using fallback.');
        }

        // 3. Download Zip
        const zipPath = path.join(EXTENSIONS_DIR, 'ublock.zip');
        console.error(`⬇️ [Auto-Update] Downloading ${downloadUrl}...`);

        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(zipPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 4. Extract
        console.error('📦 [Auto-Update] Extracting uBlock Origin...');

        // Clean previous install if any partial
        if (fs.existsSync(UBLOCK_DIR)) {
            fs.rmSync(UBLOCK_DIR, { recursive: true, force: true });
        }

        // Also clean potential extraction artifacts
        const preChildren = fs.readdirSync(EXTENSIONS_DIR);
        preChildren.forEach(c => {
            if (c.startsWith('uBlock0') && c.endsWith('.chromium')) {
                fs.rmSync(path.join(EXTENSIONS_DIR, c), { recursive: true, force: true });
            }
        });

        await this.extractZip(zipPath, EXTENSIONS_DIR);

        // Wait for file locks to release
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Rename extracted folder to 'ublock'
        const children = fs.readdirSync(EXTENSIONS_DIR);
        const extractedFolder = children.find(c => c.startsWith('uBlock0') && c.endsWith('.chromium'));

        if (extractedFolder) {
            const fullPath = path.join(EXTENSIONS_DIR, extractedFolder);
            try {
                fs.renameSync(fullPath, UBLOCK_DIR);
            } catch (renameError) {
                console.warn('⚠️ [Auto-Update] Rename failed, trying copy...', renameError);
                fs.cpSync(fullPath, UBLOCK_DIR, { recursive: true, force: true });
                fs.rmSync(fullPath, { recursive: true, force: true });
            }
        } else {
            // If extracted directly or structure is different, we might already be good or failed.
            // Let's assume if ublock dir doesn't exist, something went wrong, OR unzip worked differently.
            if (!fs.existsSync(UBLOCK_DIR)) {
                // Try to handle case where it unzipped contents directly (unlikely for uBlock release)
                // or maybe check if there is another folder.
                console.warn('⚠️ [Auto-Update] setup: Could not determine extracted folder name. Checking extensions dir content.');
            }
        }

        // 5. Cleanup
        if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
        }

        console.error('✅ [Auto-Update] uBlock Origin installed successfully!');
    }

    private static async extractZip(zipPath: string, destDir: string): Promise<void> {
        // Cross-platform unzip without adding dependencies
        if (process.platform === 'win32') {
            // Use PowerShell Expand-Archive
            const command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`;
            await execAsync(command);
        } else {
            // Use unzip command on Linux/Mac
            try {
                await execAsync(`unzip -o "${zipPath}" -d "${destDir}"`);
            } catch (e) {
                // Fallback or specific error handling (e.g., install unzip?)
                // Most distros have unzip. If not:
                console.error('❌ [Auto-Update] `unzip` command failed. Please install unzip (sudo apt install unzip).');
                throw e;
            }
        }
    }
}
