import test from 'node:test';
import assert from 'node:assert';
import { connect } from 'brave-real-browser';

const realBrowserOption = {
    args: ["--start-maximized"],
    turnstile: true,
    headless: false,
    customConfig: {},
    connectOption: {
        defaultViewport: null
    },
    plugins: []
}

// Quick test to verify brave-real-browser is working
test('Simple Google Navigation Test', async () => {
    console.log('\n🧪 Testing brave-real-browser package (ESM)...\n');
    const { page, browser } = await connect(realBrowserOption);
    
    console.log('✓ Browser connected successfully');
    await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });
    console.log('✓ Navigated to Google');
    
    const title = await page.title();
    console.log(`✓ Page title: ${title}`);
    
    await browser.close();
    console.log('✓ Browser closed\n');
    
    assert.strictEqual(title.includes('Google'), true, "Google navigation test failed!");
    console.log('✅ Test passed - brave-real-browser is working!\n');
})

test('DrissionPage Detector', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://web.archive.org/web/20240913054632/https://drissionpage.pages.dev/");
    await page.realClick("#detector")
    let result = await page.evaluate(() => { return document.querySelector('#isBot span').textContent.includes("not") ? true : false })
    await browser.close()
    assert.strictEqual(result, true, "DrissionPage Detector test failed!")
})

test('Brotector, a webdriver detector', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://kaliiiiiiiiii.github.io/brotector/");
    await new Promise(r => setTimeout(r, 3000));
    let result = await page.evaluate(() => { return document.querySelector('#table-keys').getAttribute('bgcolor') })
    await browser.close()
    assert.strictEqual(result === "darkgreen", true, "Brotector, a webdriver detector test failed!")
})

test('Cloudflare WAF', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://nopecha.com/demo/cloudflare");
    let verify = null
    let startDate = Date.now()
    while (!verify && (Date.now() - startDate) < 30000) {
        verify = await page.evaluate(() => { return document.querySelector('.link_row') ? true : null }).catch(() => null)
        await new Promise(r => setTimeout(r, 1000));
    }
    await browser.close()
    assert.strictEqual(verify === true, true, "Cloudflare WAF test failed!")
})

test('Cloudflare Turnstile', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://turnstile.zeroclover.io/");
    await page.waitForSelector('[type="submit"]')
    let token = null
    let startDate = Date.now()
    while (!token && (Date.now() - startDate) < 30000) {
        token = await page.evaluate(() => {
            try {
                let item = document.querySelector('[name="cf-turnstile-response"]').value
                return item && item.length > 20 ? item : null
            } catch (e) {
                return null
            }
        })
        await new Promise(r => setTimeout(r, 1000));
    }
    await browser.close()
    assert.strictEqual(token !== null, true, "Cloudflare turnstile test failed!")
})

test('Fingerprint JS Bot Detector', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://fingerprint.com/products/bot-detection/");
    
    // Wait for the bot detection section to load
    await page.waitForSelector('.HeroSection-module--botSubTitle--2711e', { timeout: 15000 });
    
    // Give extra time for bot detection to complete
    await new Promise(r => setTimeout(r, 7000));
    
    const detect = await page.evaluate(() => {
        const element = document.querySelector('.HeroSection-module--botSubTitle--2711e');
        if (!element) {
            console.log('Bot detection element not found');
            return false;
        }
        const textContent = element.textContent.toLowerCase();
        console.log('Bot detection text:', textContent);
        return textContent.includes("not") ? true : false;
    })
    await browser.close()
    assert.strictEqual(detect, true, "Fingerprint JS Bot Detector test failed!")
})

test('Datadome Bot Detector', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://antoinevastel.com/bots/datadome");
    const check = await page.waitForSelector('nav #navbarCollapse').catch(() => null)
    await browser.close()
    assert.strictEqual(check ? true : false, true, "Datadome Bot Detector test failed! [This may also be because your ip address has a high spam score.]")
})

test('Recaptcha V3 Score (hard)', async () => {
    const { page, browser } = await connect(realBrowserOption)
    await page.goto("https://antcpt.com/score_detector/");
    await page.realClick("button")
    await new Promise(r => setTimeout(r, 5000));
    const score = await page.evaluate(() => {
        return document.querySelector('big').textContent.replace(/[^0-9.]/g, '')
    })
    await browser.close()
    assert.strictEqual(Number(score) >= 0.7, true, "Recaptcha V3 Score should be >=0.7. Score: " + score)
})
