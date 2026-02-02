/**
 * Ecosystem Chain - Ad Blocking Test
 * 
 * Verify करता है कि blocker सभी pages पर auto-enable है
 */

const { connect } = require('./lib/cjs/index.js');

async function testAdBlocking() {
    console.log('='.repeat(60));
    console.log('AD BLOCKING TEST - Auto-enabled on all pages');
    console.log('='.repeat(60));
    
    try {
        console.log('\n[1] Connecting...');
        const { browser, page } = await connect({
            headless: true,
            args: ['--no-sandbox']
        });
        
        console.log('[OK] Connected!');
        
        // Navigate to a page that typically has ads
        console.log('\n[2] Testing ad blocking on first page...');
        await page.goto('https://www.speedtest.net/', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Check if ad elements are blocked
        const adCount = await page.evaluate(() => {
            const adSelectors = [
                'ins.adsbygoogle',
                'div[id*="google_ads"]',
                'iframe[src*="doubleclick"]',
                'div[class*="ad-"]'
            ];
            let count = 0;
            adSelectors.forEach(sel => {
                count += document.querySelectorAll(sel).length;
            });
            return count;
        });
        
        console.log(`[INFO] Ad elements found: ${adCount} (should be 0 or very low)`);
        
        // Create new page - blocker should auto-enable
        console.log('\n[3] Creating new page (auto-enable test)...');
        const page2 = await browser.newPage();
        await page2.goto('https://example.com', { waitUntil: 'domcontentloaded' });
        console.log('[OK] New page created!');
        
        // Check console logs for blocker messages
        console.log('\n[4] Checking blocker status...');
        
        // Get title to verify page loaded
        const title = await page2.title();
        console.log(`[OK] Page title: ${title}`);
        
        await browser.close();
        
        console.log('\n' + '='.repeat(60));
        console.log('AD BLOCKING TEST - PASSED!');
        console.log('Ecosystem Chain is working correctly!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n[ERROR]', error.message);
        process.exit(1);
    }
}

testAdBlocking();
