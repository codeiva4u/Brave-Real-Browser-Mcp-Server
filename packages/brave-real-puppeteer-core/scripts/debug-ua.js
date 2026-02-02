
import { launch as launchBrave } from '../../Brave-Real-Launcher/dist/index.mjs';
import { getPuppeteerOptimizedScript } from './stealth-injector.js';
import puppeteer from 'puppeteer-core';

async function verifyUserAgent() {
    console.log('🚀 Launching Brave for UA Check (GUI MODE)...');
    const launchedBrave = await launchBrave({
        launchMode: 'gui',  // GUI mode to test Client Hints support
        enableStealth: true
    });

    const browser = await puppeteer.connect({
        browserURL: `http://127.0.0.1:${launchedBrave.port}`
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    // 🔥 SET CDP User Agent with Client Hints metadata FIRST (before any JS)
    const { getLatestChromeVersion, generateUserAgent, generateUserAgentMetadata } = await import('./chrome-version.js');
    const chromeVersion = await getLatestChromeVersion();
    const userAgent = generateUserAgent(chromeVersion, false);
    const uaMetadata = generateUserAgentMetadata(chromeVersion, false);

    console.log(`🎭 Setting CDP User-Agent FIRST: Chrome/${chromeVersion}`);
    const client = await page.target().createCDPSession();
    await client.send('Emulation.setUserAgentOverride', {
        userAgent: userAgent,
        userAgentMetadata: {
            brands: uaMetadata.brands,
            fullVersionList: uaMetadata.fullVersionList,
            platform: uaMetadata.platform,
            platformVersion: uaMetadata.platformVersion,
            architecture: uaMetadata.architecture,
            model: uaMetadata.model,
            mobile: uaMetadata.mobile,
            bitness: uaMetadata.bitness,
            wow64: uaMetadata.wow64
        }
    });
    console.log('✅ CDP Emulation metadata set FIRST');

    // Inject stealth
    console.log('💉 Injecting stealth...');
    await page.evaluateOnNewDocument(getPuppeteerOptimizedScript());

    // 🔥 CRITICAL: userAgentData ONLY works in HTTPS secure context!
    console.log('🌐 Navigating to HTTPS page for Client Hints testing...');
    await page.goto('https://bot-detector.rebrowser.net/', { waitUntil: 'networkidle2' });

    const uaInfo = await page.evaluate(async () => {
        let uaData = null;
        if (navigator.userAgentData) {
            uaData = {
                brands: navigator.userAgentData.brands,
                mobile: navigator.userAgentData.mobile,
                platform: navigator.userAgentData.platform,
            };
            try {
                const highEntropy = await navigator.userAgentData.getHighEntropyValues(['fullVersionList', 'uaFullVersion']);
                uaData.fullVersionList = highEntropy.fullVersionList;
                uaData.uaFullVersion = highEntropy.uaFullVersion;
            } catch (e) {
                uaData.error = e.message;
            }
        }
        return {
            userAgent: navigator.userAgent,
            appVersion: navigator.appVersion,
            platform: navigator.platform,
            userAgentData: uaData,
            vendor: navigator.vendor
        };
    });

    console.log('📊 REPORTED NAVIGATOR INFO:');
    console.log(JSON.stringify(uaInfo, null, 2));

    await browser.close();
    launchedBrave.kill();
}

verifyUserAgent().catch(console.error);
