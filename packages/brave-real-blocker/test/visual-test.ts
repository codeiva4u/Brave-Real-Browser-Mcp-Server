
import { connect } from 'brave-real-browser';
import { log } from '../src/logger.js';
import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const LOG_FILE = path.join(process.cwd(), 'execution-log.txt');
function logToFile(msg: string) {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
    console.log(msg); // Keep console log too
}

async function runVisualTest() {
    // Clear old log
    if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

    logToFile('Starting Visual Test for Brave Real Blocker...');

    try {
        const { browser, page } = await connect({
            headless: false,
            args: [],
            plugins: [StealthPlugin()]  // Enable stealth plugin!
        });

        logToFile('Browser launched with Blocker enabled');

        // 1. Test Bot Detection
        logToFile('Testing Bot Detection (SannySoft)...');
        await page.goto('https://bot.sannysoft.com/');
        await new Promise(r => setTimeout(r, 5000));

        const failedTests = await page.evaluate(() => {
            const failed = document.querySelectorAll('.failed');
            return Array.from(failed).map(el => el.textContent);
        });

        if (failedTests.length === 0) {
            logToFile('✅ Passed SannySoft Bot Detection');
        } else {
            logToFile(`⚠️ Failed some detection tests: ${failedTests.join(', ')}`);
            await page.screenshot({ path: 'sannysoft-failure.png', fullPage: true });
            const html = await page.content();
            fs.writeFileSync('sannysoft-debug.html', html);
        }

        // 2. Test Ad Blocking (e.g., d3ward adblock test)
        // 2. Test Ad Blocking
        log.info('Test', 'Testing Ad Blocking efficiency...');

        // 2. Test Ad Blocking & Privacy
        logToFile('Testing Ad Blocking & Privacy...');

        // Verify AdBlock Tester Score
        try {
            const site = 'https://adblock-tester.com/';
            logToFile(`Visiting ${site} and extracting score...`);
            await page.goto(site, { waitUntil: 'domcontentloaded' });

            // Wait for the score to appear (it takes time as tests run)
            // Wait for the score to appear
            try {
                // Wait for text "points out of 100"
                await page.waitForFunction(() => {
                    return document.body.innerText.includes('points out of 100');
                }, { timeout: 35000 });
            } catch (e) {
                logToFile('Wait for score text failed, continuing check...');
            }

            // Capture screenshot for debugging
            await page.screenshot({ path: 'adblock-tester.png', fullPage: true });
            logToFile('Captured adblock-tester.png');

            // Dump HTML for debugging
            const html = await page.content();
            fs.writeFileSync('adblock-debug.html', html);
            logToFile('Dumped adblock-debug.html');

            const pageData = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                const match = bodyText.match(/(\d+)\s+points out of 100/);
                const scoreText = match ? match[0] : null;

                // Generic Fallback
                const matchGeneric = bodyText.match(/(\d+)\/100/);
                const genericScore = matchGeneric ? matchGeneric[0] : null;

                return { scoreText, genericScore, title: document.title };
            });

            const finalScore = pageData.scoreText || pageData.regexScore || 'Unknown';
            logToFile(`AdBlock Tester Score: ${finalScore} (Title: ${pageData.title})`);

            // Analyze specific failures if score is not 100/100 (Optional enhancement)
        } catch (e) {
            log.error('Test', `Failed to verify adblock-tester.com: ${e}`);
        }

        // Verify CanYouBlockIt
        try {
            const site = 'https://canyoublockit.com/extreme-test/';
            logToFile(`Visiting ${site}...`);
            await page.goto(site, { waitUntil: 'domcontentloaded' });
            // In a real visual test, we might check if specific ad banners are effectively hidden
            // For now, we mainly load it to visually confirm during the "visual" run
            // checking for a known ad element that SHOULD be hidden
            const adVisible = await page.evaluate(() => {
                const ad = document.querySelector('#banner-advertisement'); // Example selector
                return ad && (ad as HTMLElement).offsetParent !== null;
            });
            if (adVisible) {
                logToFile('⚠️ Ad banner detected on CanYouBlockIt');
            } else {
                logToFile('✅ CanYouBlockIt seems clean (basic check)');
            }
        } catch (e) {
            logToFile(`Failed to verify canyoublockit.com: ${e}`);
        }

        // 3. Test Fingerprinting
        logToFile('Testing Fingerprinting protection...');
        logToFile('Visiting Canvas Fingerprinting (https://browserleaks.com/canvas)...');
        await page.goto('https://browserleaks.com/canvas', { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 3000));

        try {
            const canvasResult = await page.evaluate(() => {
                const signature = document.querySelector('#crc')?.textContent || 'Unknown';
                const unique = document.querySelector('#uniqueness')?.textContent || 'Unknown';
                return { signature, unique };
            });
            logToFile(`   Canvas Signature: ${canvasResult.signature}`);
            logToFile(`   Uniqueness: ${canvasResult.unique}`);
        } catch (e) {
            logToFile('   ⚠️ Could not extract Canvas details');
        }

        logToFile('Visiting AmIUnique (https://amiunique.org/fingerprint)...');
        await page.goto('https://amiunique.org/fingerprint', { waitUntil: 'domcontentloaded' });

        // Click the button to start fingerprinting if needed, or wait for auto-scann
        try {
            const btn = await page.$('#start_fingerprint'); // Selector might vary
            if (btn) await btn.click();
        } catch (e) { }

        await new Promise(r => setTimeout(r, 10000)); // Wait for analysis

        try {
            // Updated selectors for AmIUnique new UI
            const amiResult = await page.evaluate(() => {
                const uniqueText = document.body.innerText.includes('You are unique') ? 'Yes' : 'No';
                return uniqueText;
            });
            logToFile(`   AmIUnique Status: ${amiResult === 'Yes' ? '⚠️ Unique (Trackable)' : '✅ Not Unique (Blends in)'}`);
        } catch (e) {
            logToFile('   ⚠️ Could not extract AmIUnique details');
        }

        // Fix Permissions: Override permissions to ensure prompts don't fail tests
        // This is crucial for "Permission prompt" tests which expect auto-block/deny
        const context = browser.defaultBrowserContext();
        await context.overridePermissions('https://rowserleaks.com', []); // Deny all
        await context.overridePermissions('https://adblock-tester.com', []);

        // 4. Verify Scriptlet Injection
        logToFile('Verifying Scriptlet Injection...');
        const isWindowOpenWrapped = await page.evaluate(() => {
            return window.open.toString().includes('Intercepted') || window.open.toString().includes('native code') === false;
        });

        if (isWindowOpenWrapped) {
            logToFile('✅ Window.open is wrapped/intercepted');
        } else {
            logToFile('⚠️ Window.open is NOT wrapped');
        }

        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
        logToFile('Visual Test Completed Successfully');
        process.exit(0);

    } catch (error) {
        logToFile(`Test Failed: ${error}`);
        process.exit(1);
    }
}

runVisualTest();
