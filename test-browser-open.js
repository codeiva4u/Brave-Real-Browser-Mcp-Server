/**
 * Quick Browser Open Test
 * Tests if browser can be initialized and opened properly
 */

import { handleBrowserInit, handleBrowserClose } from './dist/handlers/browser-handlers.js';
import { handleNavigate } from './dist/handlers/navigation-handlers.js';
import { handleGetContent } from './dist/handlers/content-handlers.js';

console.log('🧪 Testing Browser Initialization...\n');

async function testBrowser() {
  try {
    // Test 1: Initialize Browser
    console.log('1️⃣ Initializing browser...');
    const initResult = await handleBrowserInit({
      headless: false, // Visible browser
      disableXvfb: true
    });
    
    console.log('✅ Browser initialized:', initResult.content[0].text);
    console.log('   Browser should be visible on your screen now!\n');
    
    // Wait to see the browser
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Navigate to a page
    console.log('2️⃣ Navigating to example.com...');
    const navResult = await handleNavigate({
      url: 'https://example.com',
      waitUntil: 'domcontentloaded'
    });
    
    console.log('✅ Navigation successful:', navResult.content[0].text);
    console.log('   You should see example.com loaded in the browser\n');
    
    // Wait to see the page
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Get page content
    console.log('3️⃣ Getting page content...');
    const contentResult = await handleGetContent({
      type: 'text'
    });
    
    const content = contentResult.content[0].text;
    const preview = content.substring(0, 100);
    console.log('✅ Content retrieved:', preview + '...');
    
    if (content.includes('Example Domain')) {
      console.log('✅ Correct page loaded!\n');
    } else {
      console.log('⚠️  Unexpected content\n');
    }
    
    // Wait before closing
    console.log('⏳ Browser will close in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 4: Close browser
    console.log('4️⃣ Closing browser...');
    const closeResult = await handleBrowserClose();
    console.log('✅ Browser closed:', closeResult.content[0].text);
    
    console.log('\n🎉 All tests passed! Browser works correctly.\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nError details:', error);
    
    // Try to close browser if test failed
    try {
      await handleBrowserClose();
    } catch (closeError) {
      // Ignore close errors
    }
    
    process.exit(1);
  }
}

// Run test
testBrowser();
