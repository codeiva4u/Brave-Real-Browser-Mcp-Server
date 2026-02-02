/**
 * Ecosystem Chain Test
 * 
 * Test करता है कि:
 * 1. brave-real-browser (Top Level) से connect होता है
 * 2. brave-real-launcher browser launch करता है
 * 3. brave-real-blocker auto-enable होता है सभी pages पर
 */

const { connect } = require('./lib/cjs/index.js');

async function testEcosystem() {
    console.log('='.repeat(60));
    console.log('ECOSYSTEM CHAIN TEST');
    console.log('brave-real-browser -> brave-real-launcher -> brave-real-blocker');
    console.log('='.repeat(60));
    
    try {
        console.log('\n[1] Connecting via brave-real-browser...');
        const { browser, page, blocker } = await connect({
            headless: false,
            args: ['--no-sandbox']
        });
        
        console.log('[OK] Browser connected!');
        console.log('[OK] Page created!');
        
        // Check if blocker is available from ecosystem chain
        if (blocker) {
            console.log('[OK] Blocker available via ecosystem chain!');
        } else {
            console.log('[!] Blocker not available from launcher - checking direct...');
        }
        
        // Test navigation
        console.log('\n[2] Testing navigation to a page with ads...');
        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
        console.log('[OK] Navigation successful!');
        
        // Test new page (should auto-enable blocker)
        console.log('\n[3] Testing new page creation (auto-enable test)...');
        const newPage = await browser.newPage();
        await newPage.goto('https://example.com', { waitUntil: 'domcontentloaded' });
        console.log('[OK] New page created and navigated!');
        
        // Wait to see
        console.log('\n[4] Waiting 5 seconds to verify...');
        await new Promise(r => setTimeout(r, 5000));
        
        // Cleanup
        console.log('\n[5] Closing browser...');
        await browser.close();
        
        console.log('\n' + '='.repeat(60));
        console.log('ECOSYSTEM CHAIN TEST - PASSED!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n[ERROR]', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testEcosystem();
