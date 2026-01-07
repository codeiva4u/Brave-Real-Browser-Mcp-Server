
import { handleBrowserInit } from '../handlers/browser-handlers.js';
import { handleNavigate } from '../handlers/navigation-handlers.js';
import { handleAdProtectionDetector, handleAdvancedVideoExtraction, handleMultiLayerRedirectTrace } from '../handlers/advanced-extraction-handlers.js';
import { handleSmartSelectorGenerator } from '../handlers/ai-powered-handlers.js';
import { handleNetworkRecorder, handleApiFinder } from '../handlers/smart-data-extractors.js';
import { handleSearchContent, handleFindElementAdvanced } from '../handlers/unified-search-handler.js';
import { handleDeepAnalysis } from '../handlers/deep-analysis-handler.js';
import { handleMediaExtractor } from '../handlers/multi-element-handlers.js';
import { handleRandomScroll, handleClick } from '../handlers/interaction-handlers.js';

async function main() {
    const targetUrl = "https://multimovies.golf/movies/120-bahadur/";
    const report: any = {
        targets: [],
        infrastructure: {},
        network_protocols: {},
        timestamp: new Date().toISOString()
    };

    console.log("Starting Forensic Analysis...");

    try {
        // --- Phase 1: Setup & Fingerprinting ---
        console.log("[Phase 1] Initializing Environment...");
        await handleBrowserInit({ headless: false });
        await handleNavigate({ url: targetUrl, waitUntil: 'domcontentloaded' });

        // Ad/Protection Check
        try {
            const protection = await handleAdProtectionDetector({});
            report.infrastructure.protection_systems = protection;
        } catch (e) { console.log("Protection check skipped"); }

        await handleRandomScroll();
        await new Promise(r => setTimeout(r, 3000));

        // --- Phase 2: Deep DOM & Logic ---
        console.log("[Phase 2] Deep DOM Reconstruction...");

        // Find Player/Play Button
        try {
            const playButton = await handleSmartSelectorGenerator({ description: "play button, video player overlay, large start button" });
            report.infrastructure.dom_selectors = { play_button_candidate: playButton };
            if (playButton && playButton.content) {
                console.log(`Potential Play Button Result:`, playButton.content[0].text);
                // Optional: Click if confirmed safe, but for forensic we might just log it 
                // or click to trigger network traffic. Let's try a click to force loading.
                // await handleClick({ selector: playButton.selector }); // Logic disabled due to text return type
            }
        } catch (e) { console.log("Smart selector failed"); }

        // Logic Extraction (looking for player config)
        try {
            console.log("Deobfuscation is now handled by Advanced Video Extraction.");
        } catch (e) { console.log("Deobfuscation skipped"); }

        // --- Phase 3: Network & API ---
        console.log("[Phase 3] Network Forensics...");

        // Start Recorder (simulated/snapshot)
        const networkDump = await handleNetworkRecorder({ duration: 5000, filterTypes: ['xhr', 'fetch', 'media'] });
        report.network_protocols.captured_requests = networkDump;

        // API Mapping
        const apiMap = await handleApiFinder({ duration: 2000 }); // Scan current network logs
        report.infrastructure.api_endpoints = apiMap;

        // --- Phase 4: Pattern Mining ---
        console.log("[Phase 4] Pattern Mining...");

        // Regex Configs
        const regexChecks = [
            { pattern: "bearer\\s+[a-zA-Z0-9\\-_\\.]+", name: "Bearer Token" },
            { pattern: "aes-128", name: "Encryption Method" },
            { pattern: "https?:\\/\\/[^\\s\"']+\\.m3u8", name: "HLS Stream" }
        ];

        report.infrastructure.patterns = [];
        for (const check of regexChecks) {
            const match = await handleSearchContent({ query: check.pattern, type: 'regex' });
            if (match && match.content) {
                report.infrastructure.patterns.push({ type: check.name, result: match.content });
            }
        }

        // --- Phase 5: Asset Verification ---
        console.log("[Phase 5] Asset Extraction...");

        const videoAssets = await handleAdvancedVideoExtraction({ waitTime: 5000 });
        // Parse video assets to populate 'targets'
        // Assuming videoAssets structure, we'd loop and add to report.targets
        // For now, dump the raw result
        report.targets_raw = videoAssets;

        report.download_links = "Handled by Advanced Video Extraction";

        console.log("--- MASTER REPORT JSON ---");
        console.log(JSON.stringify(report, null, 2));
        console.log("--- END REPORT ---");

        process.exit(0);

    } catch (error) {
        console.error("Forensic Extraction Failed:", error);
        process.exit(1);
    }
}

main();
