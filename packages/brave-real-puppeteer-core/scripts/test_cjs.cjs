
const puppeteer = require('puppeteer-core');
const fs = require('fs');

// Safe flags
const SAFE_FLAGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--disable-blink-features=AutomationControlled',
    '--exclude-switches=enable-automation',
    '--enable-automation=false'
];

async function runTest() {
    console.log('🛡️ Starting CJS Compatibility Test...');

    // Find Brave
    let executablePath = null;
    const bravePaths = [
        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
    ];
    for (const p of bravePaths) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath,
        args: SAFE_FLAGS
    });

    const page = await browser.newPage();

    // We expect the text "stealth" or similar to be present if patched, 
    // or just verify we can visit the bot detector.
    // Since we patched the library, we assume internal stealth is active if configured.
    // However, our patcher usually adds a file `stealth-injection.js` to the package 
    // that needs to be evaluated.
    // But `enhanced-patcher.js` logic showed it writes `stealth-injection.js`.
    // Does it auto-inject? check enhanced-patcher.
    // It says "Apply comprehensive stealth enhancements...".

    // For this test, we just ensure it runs in CJS without error.
    await page.goto('https://example.com');
    console.log('✅ CJS Test Passed: Browser launched and navigated.');

    await browser.close();
}

runTest().catch(console.error);
