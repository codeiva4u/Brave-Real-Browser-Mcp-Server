
import { handleBrowserInit } from '../handlers/browser-handlers.js';
import { handleNavigate } from '../handlers/navigation-handlers.js';
import { handleRandomScroll } from '../handlers/interaction-handlers.js';
import { handleElementScreenshot } from '../handlers/visual-tools-handlers.js';
import { handleNetworkRecorder } from '../handlers/smart-data-extractors.js';
import {
    handleAdvancedVideoExtraction,
    handleMultiLayerRedirectTrace,
    handleAdProtectionDetector
} from '../handlers/advanced-extraction-handlers.js';

async function main() {
    const targetUrl = process.argv[2];
    if (!targetUrl) {
        console.error("Please provide a target URL as the first argument.");
        process.exit(1);
    }

    console.log(`Starting Media Extraction Workflow for: ${targetUrl}`);

    // Phase 1: Setup & Protection Bypass
    console.log("\n--- Phase 1: Setup & Protection Bypass ---");
    await handleBrowserInit({
        headless: false, // User requested visuals/interaction might be needed
        connectOption: { defaultViewport: null }
    });

    await handleNavigate({ url: targetUrl, waitUntil: 'domcontentloaded' });

    // Environment Check
    try {
        const protection = await handleAdProtectionDetector({});
        console.log("Protection Check:", protection);
    } catch (e) {
        console.log("Protection check skipped:", e);
    }

    // Stabilize
    await handleRandomScroll();
    await new Promise(r => setTimeout(r, 2000));

    // Phase 2: Primary Extraction
    console.log("\n--- Phase 2: Primary Extraction ---");

    // 5. Deep Scan
    console.log("Running Advanced Video Extraction...");
    let results: any = await handleAdvancedVideoExtraction({ waitTime: 10000 });

    let foundMedia = false;
    if (results && results.content && results.content[0].text) {
        const text = results.content[0].text;
        if (!text.includes('"videos":[]') && !text.includes('No video sources found')) {
            console.log("Found items via Deep Scan:", text);
            foundMedia = true;
        }
    }

    // 6. Obfuscation Bypass
    if (!foundMedia) {
        console.log("Deep Scan empty. Deobfuscation is now handled by Advanced Video Extraction.");
    }

    // 7. Network Traffic
    if (!foundMedia) {
        console.log("Scanning Network Traffic...");
        const network = await handleNetworkRecorder({ duration: 5000, filterTypes: ['video', 'media', 'xhr'] });
        console.log("Network Scan Results:", network);
    }

    // Phase 3: Redirect & Link Validation
    console.log("\n--- Phase 3: Redirect & Link Validation ---");
    console.log("Direct download link finding is now integrated into Advanced Video Extraction.");

    // Phase 4: Fallback
    console.log("\n--- Phase 4: Fallback / Manual Aid ---");
    if (!foundMedia) {
        console.log("Taking debug screenshot...");
        await handleElementScreenshot({ selector: 'body', outputPath: 'debug_screenshot.png' });
    }

    console.log("\nWorkflow Complete.");
    // process.exit(0);
}

main().catch(console.error);
