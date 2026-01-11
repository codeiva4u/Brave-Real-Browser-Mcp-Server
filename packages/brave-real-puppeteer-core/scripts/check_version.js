
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

async function checkVersion() {
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
        headless: "new",
        executablePath,
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const ua = await page.evaluate(() => navigator.userAgent);
    const version = await browser.version();

    console.log('🦁 Real User Agent:', ua);
    console.log('🦁 Browser Version API:', version);

    await browser.close();
}

checkVersion();
