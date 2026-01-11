
import puppeteer from 'puppeteer-core';
import { existsSync, writeFileSync } from 'fs';
import { moveMouseNaturally, performHumanClick } from './human_mouse.js';
import { getPuppeteerOptimizedScript } from './stealth-injector.js';
import { getLatestChromeVersion, generateUserAgent, generateUserAgentMetadata } from './chrome-version.js';

const SAFE_FLAGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-zygote',
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--enable-automation=false'
];

// ENABLE STEALTH MODE (Default)
process.env.REBROWSER_STEALTH_MODE = 'comprehensive';
process.env.REBROWSER_STEALTH_USERAGENT_SPOOF = '1';
process.env.REBROWSER_STEALTH_NAVIGATOR_SPOOF = '1';
process.env.REBROWSER_STEALTH_WEBGL_SPOOF = '1';
process.env.REBROWSER_STEALTH_HUMAN_BEHAVIOR = '1';
process.env.REBROWSER_STEALTH_HEADLESS_BYPASS = '1';

async function testUrl(page, url, name) {
    console.log(`\n🌐 Testing ${name} (${url})...`);
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 1. Warm-up interactions
        await moveMouseNaturally(page, 100, 100);
        await moveMouseNaturally(page, 300, 400);
        await new Promise(r => setTimeout(r, 1000));
        await page.mouse.wheel({ deltaY: 200 }); // scroll
        await new Promise(r => setTimeout(r, 1000));

        // 2. Specific extraction logic
        if (name === 'Google Demo') {
            // Click the "Request Score" button if needed (it usually loads on click of a button)
            // The URL provided typically just loads. 
            // Let's try finding a button 'recaptcha-demo-submit' or similar if it exists.
            // Actually the direct link often has a 'run' link.
            const btn = await page.$('.recaptcha-submit');
            if (btn) {
                console.log('👆 Clicking submit...');
                await performHumanClick(page, '.recaptcha-submit');
                await new Promise(r => setTimeout(r, 2000));
            }

            // Extract score from PRE or specific div
            const content = await page.content();
            const scoreMatch = content.match(/"score":\s*([\d.]+)/);
            if (scoreMatch) return parseFloat(scoreMatch[1]);

        } else if (name === '2Captcha Demo') {
            // Usually has a button "Check" or verifies automatically
            // Look for result block
            const resultSelector = '.captcha-solver-info'; // Hypothetical
            // 2captcha demo usually shows a token. V3 score is often hidden or returned in API response console.
            // Let's look for "Human" or "Bot" text.
            const content = await page.content();
            if (content.includes('score')) {
                const scoreMatch = content.match(/score["']?:?\s*([\d.]+)/i);
                if (scoreMatch) return parseFloat(scoreMatch[1]);
            }
        } else if (name === 'AntCpt') {
            await page.waitForFunction(() => {
                return document.body.innerText.toLowerCase().includes('score');
            }, { timeout: 10000 });

            const score = await page.evaluate(() => {
                const bodyText = document.body.innerText;
                const match = bodyText.match(/(?:score|result)[\s:is]+([\d.]+)/i);
                return match ? match[1] : null;
            });
            if (score) return parseFloat(score);
        }

    } catch (e) {
        console.log(`❌ Error testing ${name}:`, e.message);
    }
    return null;
}

async function runTest() {
    let executablePath = null;
    const bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    ];
    for (const p of bravePaths) {
        if (existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    const browser = await puppeteer.launch({
        headless: false,
        executablePath,
        args: SAFE_FLAGS,
        defaultViewport: { width: 1366, height: 768 }
    });

    const page = await browser.newPage();

    // Fetch latest Chrome version dynamically
    const chromeVersion = await getLatestChromeVersion();
    console.log(`🔄 Using Chrome version: ${chromeVersion}`);

    // Set Correct UA with dynamic version
    await page.setUserAgent(
        generateUserAgent(chromeVersion, false),
        generateUserAgentMetadata(chromeVersion, false)
    );

    // Apply Stealth
    const stealthScript = getPuppeteerOptimizedScript();
    await page.evaluateOnNewDocument(stealthScript);

    // Test 1: AntCpt (Strict)
    const score1 = await testUrl(page, 'https://antcpt.com/score_detector/', 'AntCpt');
    console.log(`📊 AntCpt Score: ${score1 !== null ? score1 : 'FAILED'}`);

    // Test 2: Google Demo
    // https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php
    const score2 = await testUrl(page, 'https://recaptcha-demo.appspot.com/recaptcha-v3-request-scores.php', 'Google Demo');
    console.log(`📊 Google Demo Score: ${score2 !== null ? score2 : 'FAILED'}`);

    await browser.close();
}

runTest();
