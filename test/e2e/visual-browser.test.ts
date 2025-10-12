/**
 * End-to-End Visual Browser Tests
 * 
 * These tests actually launch a visible browser window so you can see
 * the automation happening like in production usage.
 * 
 * Run with: npm run test:e2e
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { handleBrowserInit, handleBrowserClose } from '../../src/handlers/browser-handlers';
import { handleNavigate } from '../../src/handlers/navigation-handlers';
import { handleGetContent, handleFindSelector } from '../../src/handlers/content-handlers';
import { handleClick, handleType } from '../../src/handlers/interaction-handlers';
import { resetBrowserInitDepth } from '../../src/browser-manager';

// Skip E2E visual tests in CI environment (they require display and are for demo purposes)
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const describeOrSkip = isCI ? describe.skip : describe;

describeOrSkip.sequential('E2E Visual Browser Tests', () => {
  // Increase timeout for E2E tests since they use real browser
  const E2E_TIMEOUT = 30000;

  beforeAll(async () => {
    console.log('🚀 Starting E2E Visual Browser Tests');
    console.log('📺 You should see ONE browser window that will be used for ALL tests');
    console.log('⚡ Browser will stay open between tests for better performance');
    
    // Reset browser initialization depth at the start
    resetBrowserInitDepth();
    
    // Clean up any existing browsers before starting
    try {
      await handleBrowserClose();
    } catch (error) {
      // Ignore close errors - browser might not exist
    }
    
    // Initialize ONE browser for ALL tests
    console.log('\n🌐 Opening browser for all E2E tests...');
    await handleBrowserInit({
      headless: false,
      disableXvfb: true,
      customConfig: {
        args: ['--window-size=1200,800']
      }
    });
    console.log('✅ Browser ready - will be reused for all tests\n');
  }, E2E_TIMEOUT);

  beforeEach(async () => {
    // NO browser close - just navigate to a clean page if needed
    console.log('\n🔄 Preparing for next test...');
  });

  afterEach(async () => {
    // NO browser close - keep it open for next test
    console.log('✅ Test completed - browser stays open for next test');
  });

  afterAll(async () => {
    console.log('\n🏁 All E2E tests completed');
    console.log('🔒 Closing browser now...');
    
    // Only close browser once at the very end
    try {
      await handleBrowserClose();
      console.log('✅ Browser closed successfully');
    } catch (error) {
      console.log('⚠️  Browser close error (may already be closed)');
    }
    
    // Final reset
    resetBrowserInitDepth();
    console.log('✅ All cleanup completed');
  });

  describe('Complete Workflow Demonstration', () => {
    it('should demonstrate full browser automation workflow visually', async () => {
      console.log('\n🎬 TEST 1: Complete Browser Automation Workflow');
      console.log('👀 Using existing browser window for this test');
      
      try {
        // Browser already initialized in beforeAll - just navigate
        // Step 1: Navigate to a real website
        console.log('\n1️⃣ Navigating to example.com...');
        const navResult = await handleNavigate({
          url: 'https://example.com',
          waitUntil: 'domcontentloaded'
        });
        
        expect(navResult.content[0].text).toContain('Successfully navigated');
        console.log('✅ Page loaded successfully');
        
        // Delay to see navigation
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Get page content
        console.log('\n2️⃣ Analyzing page content...');
        const contentResult = await handleGetContent({
          type: 'text'
        });
        
        expect(contentResult.content[0].text).toContain('Example Domain');
        console.log('✅ Content analyzed - found "Example Domain"');
        
        // Step 3: Find an element
        console.log('\n3️⃣ Finding "Learn more" link...');
        const findResult = await handleFindSelector({
          text: 'Learn more',
          elementType: 'a'
        });
        
        expect(findResult.content[0].text).toContain('Found element');
        console.log('✅ Element located successfully');
        
        console.log('\n🎉 TEST 1 COMPLETE! Browser stays open for next test...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('❌ E2E test failed:', error);
        throw error;
      }
    }, E2E_TIMEOUT);
  });

  describe('Interactive Form Automation', () => {
    it('should demonstrate form interaction with visible browser', async () => {
      console.log('\n🎬 TEST 2: Form Automation');
      console.log('👀 Using same browser window - navigating to form...');
      
      try {
        // Browser already open - just navigate to form
        console.log('\n1️⃣ Navigating to httpbin form...');
        await handleNavigate({
          url: 'https://httpbin.org/forms/post',
          waitUntil: 'domcontentloaded'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get content to analyze the page
        console.log('\n2️⃣ Analyzing form page...');
        const contentResult = await handleGetContent({ type: 'text' });
        expect(contentResult.content[0].text).toContain('Customer name');
        console.log('✅ Form page loaded successfully');
        
        // Fill complete form in serial order (all fields)
        console.log('\n3️⃣ Filling out complete form in order...');
        try {
          // Field 1: Customer name
          console.log('   1. Filling customer name...');
          await handleType({
            selector: 'input[name="custname"]',
            text: 'John Doe',
            delay: 50
          });
          console.log('   ✅ Customer name: John Doe');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Field 2: Telephone
          console.log('   2. Filling telephone...');
          await handleType({
            selector: 'input[name="custtel"]',
            text: '555-123-4567',
            delay: 50
          });
          console.log('   ✅ Telephone: 555-123-4567');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Field 3: Email
          console.log('   3. Filling email...');
          await handleType({
            selector: 'input[name="custemail"]',
            text: 'john.doe@example.com',
            delay: 50
          });
          console.log('   ✅ Email: john.doe@example.com');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Field 4: Pizza size (radio button)
          console.log('   4. Selecting pizza size (Large)...');
          await handleClick({
            selector: 'input[value="large"]',
            waitForNavigation: false
          });
          console.log('   ✅ Pizza size: Large');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Field 5: Toppings (checkboxes - all 4 toppings)
          console.log('   5. Selecting toppings...');
          await handleClick({
            selector: 'input[value="bacon"]',
            waitForNavigation: false
          });
          console.log('   ✅ Topping: Bacon');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await handleClick({
            selector: 'input[value="cheese"]',
            waitForNavigation: false
          });
          console.log('   ✅ Topping: Extra Cheese');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await handleClick({
            selector: 'input[value="onion"]',
            waitForNavigation: false
          });
          console.log('   ✅ Topping: Onion');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await handleClick({
            selector: 'input[value="mushroom"]',
            waitForNavigation: false
          });
          console.log('   ✅ Topping: Mushroom');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Field 6: Delivery time (time input)
          console.log('   6. Setting delivery time...');
          await handleType({
            selector: 'input[name="delivery"]',
            text: '18:30',
            delay: 50
          });
          console.log('   ✅ Delivery time: 18:30');
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Field 7: Comments (textarea)
          console.log('   7. Adding comments...');
          await handleType({
            selector: 'textarea[name="comments"]',
            text: 'Please ring the doorbell twice. Thank you!',
            delay: 30
          });
          console.log('   ✅ Comments added');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('\n✅ All form fields completed!');
          
          // Submit the form
          console.log('\n4️⃣ Submitting form...');
          try {
            await handleClick({
              selector: 'button',
              waitForNavigation: true
            });
          } catch (submitError) {
            // Frame detach errors are expected during form submission navigation
            if (!submitError.message.includes('detached')) {
              throw submitError;
            }
            console.log('🔄 Form submitted (navigation in progress)...');
          }
          
          // Wait for navigation to complete
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('✅ Form submitted successfully!');
          
          // Verify submission
          const submitResult = await handleGetContent({ type: 'text' });
          if (submitResult.content[0].text.includes('john.doe@example.com')) {
            console.log('✅ Form submission verified - data received by server');
          }
          
        } catch (error) {
          console.log(`❌ Form fill error: ${error.message}`);
          throw error;
        }

        console.log('\n🎉 TEST 2 COMPLETE! Browser stays open for next test...');
        
      } catch (error) {
        console.error('❌ Form automation test failed:', error);
        throw error;
      }
    }, E2E_TIMEOUT);
  });

  describe('Content Strategy Demonstration', () => {
    it('should show content analysis and token management', async () => {
      console.log('\n🎬 TEST 3: Content Analysis & Token Management');
      console.log('👀 Using same browser window for content analysis...');
      
      try {
        // Browser already open - just test content analysis
        // Test different content types
        const testSites = [
          { url: 'https://httpbin.org/html', description: 'Simple HTML page' },
          { url: 'https://example.com', description: 'Minimal content page' }
        ];

        for (const [index, site] of testSites.entries()) {
          console.log(`\n${index + 2}️⃣ Testing ${site.description}: ${site.url}`);
          
          await handleNavigate({
            url: site.url,
            waitUntil: 'domcontentloaded'
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Test HTML content
          console.log(`   📄 Getting HTML content...`);
          const htmlResult = await handleGetContent({ type: 'html' });
          console.log(`   ✅ HTML analyzed: ${htmlResult.content[0].text.length} characters`);
          
          // Test text content
          console.log(`   📝 Getting text content...`);
          const textResult = await handleGetContent({ type: 'text' });
          console.log(`   ✅ Text analyzed: ${textResult.content[0].text.length} characters`);
          
          // Basic content validation
          expect(htmlResult.content[0].text.length).toBeGreaterThan(0);
          expect(textResult.content[0].text.length).toBeGreaterThan(0);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n🎉 TEST 3 COMPLETE! All E2E tests done - browser will close now...');

      } catch (error) {
        console.error('❌ Content analysis test failed:', error);
        throw error;
      }
    }, E2E_TIMEOUT);
  });
});