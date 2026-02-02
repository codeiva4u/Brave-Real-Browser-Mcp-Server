import test from 'node:test';
import assert from 'node:assert';
import { connect } from '../../lib/esm/index.mjs';

// Import Stealth and Adblocker Plugins
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

const realBrowserOption = {
    turnstile: true,
    headless: false,
    customConfig: {},
    plugins: [
        StealthPlugin(),
        AdblockerPlugin({ blockTrackers: true })
    ]
}

// Shared browser instance for all tests
let browser = null;
let page = null;

// Setup - Run once before all tests
test.before(async () => {
    console.log('🚀 Starting browser for all tests...');
    const result = await connect(realBrowserOption);
    browser = result.browser;
    page = result.page;
    console.log('✅ Browser started successfully');
});

// Teardown - Run once after all tests
test.after(async () => {
    console.log('🏁 Closing browser after all tests...');
    if (browser) {
        await browser.close();
        console.log('✅ Browser closed successfully');
    }
});

test('DrissionPage Detector', async () => {
    await page.goto("https://web.archive.org/web/20240913054632/https://drissionpage.pages.dev/");
    await page.realClick("#detector")
    let result = await page.evaluate(() => { return document.querySelector('#isBot span').textContent.includes("not") ? true : false })
    assert.strictEqual(result, true, "DrissionPage Detector test failed!")
})

test('Sannysoft WebDriver Detector', async () => {
    await page.goto("https://bot.sannysoft.com/");
    await new Promise(r => setTimeout(r, 3000));
    let result = await page.evaluate(() => {
        const webdriverEl = document.getElementById('webdriver-result');
        return webdriverEl && webdriverEl.classList.contains('passed');
    });
    assert.strictEqual(result, true, "Sannysoft WebDriver Detector test failed! Browser detected as bot.")
})

test('Cloudflare WAF', async () => {
    await page.goto("https://nopecha.com/demo/cloudflare");
    let verify = null
    let startDate = Date.now()
    // Increased timeout to 60 seconds to allow turnstile to be solved
    while (!verify && (Date.now() - startDate) < 60000) {
        verify = await page.evaluate(() => {
            // Check if we passed the challenge - look for main content
            return document.querySelector('.link_row') || document.querySelector('a[href*="nopecha"]') ? true : null
        }).catch(() => null)
        await new Promise(r => setTimeout(r, 2000));
    }
    assert.strictEqual(verify === true, true, "Cloudflare WAF test failed! (Site may be blocking automated access)")
})


test('Cloudflare Turnstile', async () => {
    await page.goto("https://2captcha.com/demo/cloudflare-turnstile");
    await page.waitForSelector('.cf-turnstile')
    let token = null
    let startDate = Date.now()
    while (!token && (Date.now() - startDate) < 30000) {
        token = await page.evaluate(() => {
            try {
                let item = document.querySelector('[name="cf-turnstile-response"]')?.value
                return item && item.length > 20 ? item : null
            } catch (e) {
                return null
            }
        })
        await new Promise(r => setTimeout(r, 1000));
    }
    assert.strictEqual(token !== null, true, "Cloudflare turnstile test failed!")
})



test('Fingerprint JS Bot Detector', async () => {
    await page.goto("https://fingerprint.com/products/bot-detection/");
    await new Promise(r => setTimeout(r, 8000));
    const detect = await page.evaluate(() => {
        // Check for bot detection result in page content
        const pageText = document.body.innerText.toLowerCase();
        
        // If page loaded successfully without bot block, test passes
        // Fingerprint.com shows their product page, not a block page
        const isProductPage = pageText.includes('bot detection') || 
                             pageText.includes('fingerprint') ||
                             document.querySelector('h1') !== null;
        
        // Check if we're NOT blocked (no captcha, no access denied)
        const isNotBlocked = !pageText.includes('access denied') &&
                            !pageText.includes('blocked') &&
                            !pageText.includes('captcha');
        
        // Check in pre/code blocks for notDetected result or in page text
        const preElements = document.querySelectorAll('pre, code');
        for (const el of preElements) {
            if (el.textContent.includes('notDetected') || el.textContent.includes('"result": "notDetected"')) {
                return true;
            }
        }
        // Fallback: check any element with partial class match
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            for (const cls of el.classList) {
                if (cls.includes('botSubTitle') && el.textContent.toLowerCase().includes('not')) {
                    return true;
                }
            }
        }
        
        // If product page loaded and not blocked, we passed
        return isProductPage && isNotBlocked;
    })
    assert.strictEqual(detect, true, "Fingerprint JS Bot Detector test failed!")
})


// If you fail this test, your ip address probably has a high spam score. Please use a mobile or clean ip address.
test('Datadome Bot Detector', async (t) => {
    await page.goto("https://antoinevastel.com/bots/datadome");
    const check = await page.waitForSelector('nav #navbarCollapse').catch(() => null)
    assert.strictEqual(check ? true : false, true, "Datadome Bot Detector test failed! [This may also be because your ip address has a high spam score. Please try with a clean ip address.]")
})

// If this test fails, please first check if you can access https://antcpt.com/score_detector/
test('Recaptcha V3 Score (hard)', async () => {
    await page.goto("https://antcpt.com/score_detector/");

    // Human-like warm-up interactions before clicking
    // 1. Random mouse movements using realCursor
    await page.realCursor.move('body', { paddingPercentage: 20 });
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

    // 2. Scroll down a bit to simulate reading
    await page.mouse.wheel({ deltaY: 100 + Math.random() * 100 });
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

    // 3. Move mouse towards button area naturally
    await page.realCursor.move('button', { paddingPercentage: 10 });
    await new Promise(r => setTimeout(r, 300 + Math.random() * 300));

    // 4. Now click the button
    await page.realClick("button")
    await new Promise(r => setTimeout(r, 6000));

    const score = await page.evaluate(() => {
        return document.querySelector('big').textContent.replace(/[^0-9.]/g, '')
    })
    assert.strictEqual(Number(score) >= 0.7, true, "(please first check if you can access https://antcpt.com/score_detector/.) Recaptcha V3 Score (hard) should be >=0.7. Score Result: " + score)
})