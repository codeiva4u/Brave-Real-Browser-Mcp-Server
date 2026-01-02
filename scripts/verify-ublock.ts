
import { ExtensionManager } from '../src/extension-manager.js';
import { initializeBrowser, closeBrowser } from '../src/browser-manager.js';
import * as fs from 'fs';
import * as path from 'path';

async function verifyUBlock() {
    console.log('🚀 Starting uBlock Origin Verification...');

    // 1. Verify Download & Extraction
    console.log('\nSTEP 1: Checking ExtensionManager...');
    const extPath = await ExtensionManager.ensureUBlockOrigin();
    console.log(`📂 Extension Path: ${extPath}`);

    if (!extPath || !fs.existsSync(extPath)) {
        console.error('❌ Failed: Extension path does not exist!');
        process.exit(1);
    }

    const manifestPath = path.join(extPath, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        console.log('✅ Manifest.json found! Extension extracted correctly.');
    } else {
        console.error('❌ Failed: manifest.json missing in extension folder!');
        process.exit(1);
    }

    // 2. Verify Browser Launch with Extension
    console.log('\nSTEP 2: Launching Browser with uBlock...');
    try {
        const { browser } = await initializeBrowser({
            headless: false, // Must be false or 'new' for extensions usually, but let's test our default config
            autoInstall: true
        });

        // Check if arguments were passed
        const spawnArgs = browser.process()?.spawnargs || [];
        const loadArg = spawnArgs.find(arg => arg.includes('--load-extension'));

        if (loadArg && loadArg.includes(extPath)) {
            console.log('✅ Browser launched with --load-extension argument pointing to uBlock!');
        } else {
            console.error('❌ Failed: Browser launched but --load-extension arg missing or incorrect.');
            console.error('Spawn Args:', spawnArgs);
            await closeBrowser();
            process.exit(1);
        }

        await closeBrowser();
        console.log('\n✨ VERIFICATION SUCCESSFUL: uBlock Origin is integrated!');

    } catch (error) {
        console.error('❌ Browser Launch Failed:', error);
        process.exit(1);
    }
}

verifyUBlock();
