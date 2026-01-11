
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';
import { moveMouseNaturally } from './human_mouse.js';
import { getPuppeteerOptimizedScript } from './stealth-injector.js';

// Reusing the safe flags from test-bot-detector.js
const SAFE_FLAGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-zygote',
    // '--disable-gpu', // Kept enabled
    // '--disable-web-security', // REMOVED for Cloudflare
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--enable-automation=false'
];

async function testCloudflare() {
    console.log('🛡️ Starting Cloudflare Verification Test...');

    // Find Brave or Chrome
    let executablePath = null;
    const bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    ];
    for (const p of bravePaths) {
        if (existsSync(p)) {
            executablePath = p;
            console.log('🦁 Using Brave Browser:', p);
            break;
        }
    }

    const browser = await puppeteer.launch({
        headless: false, // Cloudflare often needs headful for first pass or debug
        executablePath: executablePath || undefined,
        args: SAFE_FLAGS,
        defaultViewport: { width: 1366, height: 768 }
    });

    const page = await browser.newPage();

    // APPLY STEALTH
    const stealthScript = getPuppeteerOptimizedScript();
    await page.evaluateOnNewDocument(stealthScript);

    // Cloudflare turnstile demo
    console.log('🌐 Navigating to Cloudflare/Turnstile Demo...');
    await page.goto('https://turnstile.zeroclover.io/', { waitUntil: 'networkidle2' });

    // Move mouse naturally
    await moveMouseNaturally(page, 100, 100);
    await moveMouseNaturally(page, 500, 300);

    // Wait for success
    try {
        // Wait for connection/success message or check iframe status
        // This specific demo usually shows a success message
        await page.waitForSelector('body', { timeout: 10000 });
        console.log('✅ Page loaded. Checking for Turnstile success...');

        // This is a manual verification script mostly, but we can check for success indicators if known.
        // For zeroclover, it shows a table of results.

        await new Promise(r => setTimeout(r, 5000)); // Wait for turnstile to solve

        console.log('📸 Taking screenshot...');
        await page.screenshot({ path: 'cloudflare_result.png' });

    } catch (e) {
        console.error('❌ Error during Cloudflare test:', e);
    }

    await browser.close();
}

testCloudflare();
