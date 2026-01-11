#!/usr/bin/env node

/**
 * Playwright Bot Detector Test Script
 * Tests comprehensive stealth capabilities with Playwright using Brave-Real-Launcher
 */

import { chromium } from 'playwright-core';
import fs from 'fs';
import { launch as launchBrave } from '../../Brave-Real-Launcher/dist/index.mjs';
import { getPuppeteerOptimizedScript } from './stealth-injector.js';
import { getLatestChromeVersion, getMajorVersion, generateUserAgentMetadata, generateUserAgent } from './chrome-version.js';

// ENABLE STEALTH MODE
process.env.REBROWSER_STEALTH_MODE = 'comprehensive';
process.env.REBROWSER_STEALTH_USERAGENT_SPOOF = '1';
process.env.REBROWSER_STEALTH_NAVIGATOR_SPOOF = '1';
process.env.REBROWSER_STEALTH_WEBGL_SPOOF = '1';
process.env.REBROWSER_STEALTH_HUMAN_BEHAVIOR = '1';
process.env.REBROWSER_STEALTH_HEADLESS_BYPASS = '1';

async function runPlaywrightBotDetectorTest(options = {}) {
    const {
        headless = true,
        mobile = false,
        brave = true
    } = options;

    console.log('🛡️ Playwright Stealth Bot Detection Test (via Brave-Real-Launcher)...');
    console.log(`📱 Mobile: ${mobile ? 'YES' : 'NO'}`);
    console.log(`🎭 Headless: ${headless ? 'YES' : 'NO'}`);
    console.log(`🦁 Brave Browser: ${brave ? 'YES (preferred)' : 'NO (Chrome fallback)'}`);

    // Set mobile simulation environment variable if needed
    if (mobile) {
        process.env.REBROWSER_MOBILE_SIMULATION = '1';
    }

    // Define custom flags - Brave-Real-Launcher handles most, but we can add extras
    const extraFlags = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--metrics-recording-only',
        '--safebrowsing-disable-auto-update',
        '--enable-automation=false',
        '--password-store=basic',
        '--use-mock-keychain',
        // CRITICAL: Remove webdriver detection
        '--disable-features=AutomationControlled',
        '--disable-blink-features=AutomationControlled',
        '--exclude-switches=enable-automation',
        '--disable-extensions-except',
        '--disable-plugins-discovery',
        '--no-service-autorun',
        '--no-default-browser-check',
        '--disable-component-extensions-with-background-pages'
    ];

    let launchedBrave = null;
    let browser = null;

    try {
        console.log('🚀 Launching Brave via Brave-Real-Launcher...');

        // Launch Brave using the Launcher
        launchedBrave = await launchBrave({
            launchMode: headless ? 'headless' : 'gui',
            enableStealth: true,
            braveFlags: extraFlags
        });

        console.log(`✅ Brave launched on port ${launchedBrave.port} (PID: ${launchedBrave.pid})`);

        // Connect Playwright to the running instance via CDP
        // Playwright can connect to the HTTP endpoint and discover the WS endpoint
        browser = await chromium.connectOverCDP(`http://127.0.0.1:${launchedBrave.port}`);

        console.log('✅ Playwright connected over CDP');

        // Fetch latest Chrome version dynamically
        const chromeVersion = await getLatestChromeVersion();
        const majorVersion = getMajorVersion(chromeVersion);
        console.log(`🔄 Using Chrome version: ${chromeVersion}`);

        // Create context with userAgent metadata (using dynamic version)
        const userAgentMetadata = generateUserAgentMetadata(chromeVersion, mobile);
        const userAgent = generateUserAgent(chromeVersion, mobile);

        console.log('📱 Creating Browser Context...');
        const context = await browser.newContext({
            userAgent,
            viewport: mobile ? { width: 390, height: 844 } : { width: 1920, height: 1080 },
            deviceScaleFactor: mobile ? 3 : 1,
            isMobile: mobile,
            hasTouch: mobile,
            // Ensure we bypass some automation checks
            ignoreHTTPSErrors: true
        });

        const page = await context.newPage();

        // Use CDP to set userAgentMetadata override
        const cdpSession = await context.newCDPSession(page);
        await cdpSession.send('Emulation.setUserAgentOverride', {
            userAgent,
            userAgentMetadata: {
                brands: userAgentMetadata.brands,
                fullVersionList: userAgentMetadata.fullVersionList,
                platform: userAgentMetadata.platform,
                platformVersion: userAgentMetadata.platformVersion,
                architecture: userAgentMetadata.architecture,
                model: userAgentMetadata.model,
                mobile: userAgentMetadata.mobile,
                bitness: userAgentMetadata.bitness || '64',
                wow64: userAgentMetadata.wow64 || false
            }
        });

        console.log('💉 Injecting Stealth Scripts...');

        // Inject stealth script
        const stealthScript = getPuppeteerOptimizedScript();
        await context.addInitScript(stealthScript);

        // Inject dummyFn
        await context.addInitScript(() => {
            window.dummyFn = () => { };
        });

        console.log('🌐 Navigating to bot detector...');
        await page.goto('https://bot-detector.rebrowser.net/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Trigger dummyFn and sourceUrlLeak patterns
        console.log('⚡ Triggering detection vectors...');
        await page.evaluate(() => {
            // Trigger dummyFn
            if (window.dummyFn && typeof window.dummyFn === 'function') {
                window.dummyFn();
                window.dummyFn();
                window.dummyFn();
            }

            // Trigger sourceUrlLeak via Error stack
            try {
                const detectionElement = document.getElementById('detections-json');
                const error = new Error('sourceUrlLeak trigger');
                error.stack;
            } catch (e) { }

            // Trigger sourceUrlLeak via throw
            try {
                throw new Error('sourceUrlLeak throw trigger');
            } catch (e) {
                e.stack;
            }
        });

        console.log('[WAITING] Waiting for bot detector results...');
        // Wait for potential async checks
        await page.waitForTimeout(5000);

        // Get results
        const detectionsJson = await page.evaluate(() => {
            const el = document.getElementById('detections-json');
            return el ? el.value : null;
        });

        if (detectionsJson) {
            const detections = JSON.parse(detectionsJson);
            const results = {};
            let passed = 0, failed = 0, warnings = 0;

            for (const detection of detections) {
                let status = 'PASSED';
                let icon = '✅';

                if (detection.rating > 0) {
                    status = 'FAILED';
                    icon = '❌';
                    failed++;
                } else if (detection.rating === 0.5) {
                    status = 'WARNING';
                    icon = '⚠️';
                    warnings++;
                } else if (detection.rating === 0) {
                    status = 'UNKNOWN';
                    icon = '⚪️';
                } else {
                    passed++;
                }

                console.log(`${icon} ${detection.type} (${detection.msSinceLoad} ms): ${detection.note?.substring(0, 50)}...`);

                results[detection.type] = {
                    status,
                    timing: `${detection.msSinceLoad} ms`,
                    notes: detection.note
                };
            }

            const total = passed + failed + warnings;
            const successRate = Math.round((passed / total) * 100);

            console.log(`\n📊 SUMMARY: ${passed} PASSED, ${failed} FAILED, ${warnings} WARNING (Total: ${total})`);
            console.log(`📊 Success Rate: ${successRate}%`);

            if (failed === 0) {
                console.log('🎉 EXCELLENT! All critical tests passed! 🛡️');
            } else {
                console.log('⚠️ Some tests failed.');
            }

            // Save results
            fs.writeFileSync('playwright_bot_test_results.json', JSON.stringify(results, null, 2));
            console.log('📄 Results saved to playwright_bot_test_results.json');
        } else {
            console.log('❌ Could not retrieve detection results JSON.');
        }

        if (!headless) {
            console.log('\n🔍 Browser kept open for manual inspection...');
            console.log('Press Ctrl+C to close');
            // Keep alive forever if manual (or until user kills)
            await new Promise(() => { });
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error(error);
    } finally {
        // Cleanup
        if (browser && headless) {
            await browser.close().catch(() => { });
        }
        if (launchedBrave && headless) {
            launchedBrave.kill();
        }
    }
}

// Command line args
const args = process.argv.slice(2);
// CLI parsing similar to other script
const isTestScript = process.env.npm_lifecycle_event === 'test-playwright-bot-detector';

const options = {
    headless: isTestScript ? false : !args.includes('--no-headless'),
    mobile: args.includes('--mobile'),
    brave: !args.includes('--no-brave')
};

// Force headless if arg is present
if (args.includes('--headless')) options.headless = true;

runPlaywrightBotDetectorTest(options).catch(console.error);

