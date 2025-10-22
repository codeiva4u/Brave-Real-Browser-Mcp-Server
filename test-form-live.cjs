// Live Form Fill Test - आप यह test खुद देख सकते हैं!
const { connect } = require('brave-real-browser');
const { setTimeout: sleep } = require('node:timers/promises');

async function testFormFill() {
  console.log('\n🎬 Live Form Fill Demo');
  console.log('👀 Watch browser fill a form automatically!\n');
  
  let browser, page;
  
  try {
    // Step 1: Launch browser
    console.log('1️⃣ Launching browser...');
    const result = await connect({
      args: ["--start-maximized"],
      headless: false,
      ignoreAllFlags: false,
      customConfig: {},
      connectOption: {
        defaultViewport: null
      }
    });
    
    browser = result.browser;
    page = result.page;
    console.log('✅ Browser launched\n');
    
    await sleep(1000);
    
    // Step 2: Navigate to test form
    console.log('2️⃣ Navigating to test form...');
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    console.log('✅ Page loaded\n');
    
    await sleep(2000);
    
    // Step 3: Find search box and type
    console.log('3️⃣ Finding search box...');
    const searchSelector = 'textarea[name="q"]'; // Google search box
    await page.waitForSelector(searchSelector, { timeout: 5000 });
    console.log('✅ Search box found\n');
    
    await sleep(1000);
    
    // Step 4: Type text
    console.log('4️⃣ Typing text...');
    await page.click(searchSelector);
    await page.type(searchSelector, 'Brave Real Browser MCP Server', { delay: 100 });
    console.log('✅ Text typed successfully\n');
    
    await sleep(2000);
    
    // Step 5: Submit (press Enter)
    console.log('5️⃣ Submitting...');
    await page.keyboard.press('Enter');
    console.log('✅ Form submitted\n');
    
    await sleep(3000);
    
    console.log('🎉 FORM FILL TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📝 Summary:');
    console.log('   ✅ Browser launched');
    console.log('   ✅ Page loaded');
    console.log('   ✅ Input field found');
    console.log('   ✅ Text typed');
    console.log('   ✅ Form submitted');
    console.log('\n👀 Browser will close in 3 seconds...\n');
    
    await sleep(3000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('✅ Browser closed');
    }
  }
}

// Run test
testFormFill().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
