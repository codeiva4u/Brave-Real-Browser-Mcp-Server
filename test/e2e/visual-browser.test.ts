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
    console.log('📺 You should see browser windows opening during these tests');
    
    // Reset browser initialization depth at the start
    resetBrowserInitDepth();
    
    // Clean up any existing browsers
    try {
      await handleBrowserClose();
    } catch (error) {
      // Ignore close errors - browser might not exist
    }
  }, E2E_TIMEOUT);

  beforeEach(async () => {
    // Reset depth counter before each test to prevent accumulation
    resetBrowserInitDepth();
    
    // Ensure clean state before each test
    try {
      await handleBrowserClose();
    } catch (error) {
      // Ignore close errors - browser might not be open
    }
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await handleBrowserClose();
    } catch (error) {
      // Ignore close errors - browser might already be closed
    }
    
    // Reset depth counter after each test
    resetBrowserInitDepth();
  });

  afterAll(async () => {
    console.log('🏁 Completed E2E Visual Browser Tests');
    
    // Final cleanup
    try {
      await handleBrowserClose();
    } catch (error) {
      // Ignore close errors
    }
    
    // Final reset
    resetBrowserInitDepth();
  });

  describe('Complete Workflow Demonstration', () => {
    it('should demonstrate full browser automation workflow visually', async () => {
      console.log('\n🎬 DEMO: Complete Browser Automation Workflow');
      console.log('👀 Watch your screen - browser window will open and perform automation');
      
      try {
        // Step 1: Initialize browser (visible)
        console.log('\n1️⃣ Initializing visible browser...');
        const initResult = await handleBrowserInit({
          headless: false, // VISIBLE browser
          disableXvfb: true, // Ensure no virtual display
          customConfig: {
            args: [
              '--disable-setuid-sandbox',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--window-size=1200,800'
            ]
          }
        });
        
        expect(initResult.content[0].text).toContain('Browser initialized successfully');
        console.log('✅ Browser window opened successfully');
        
        // Small delay to see browser window
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Navigate to a real website
        console.log('\n2️⃣ Navigating to example.com...');
        const navResult = await handleNavigate({
          url: 'https://example.com',
          waitUntil: 'domcontentloaded'
        });
        
        expect(navResult.content[0].text).toContain('Successfully navigated');
        console.log('✅ Page loaded successfully');
        
        // Delay to see navigation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 3: Get page content
        console.log('\n3️⃣ Analyzing page content...');
        const contentResult = await handleGetContent({
          type: 'text'
        });
        
        expect(contentResult.content[0].text).toContain('Example Domain');
        console.log('✅ Content analyzed - found "Example Domain"');
        
        // Step 4: Find an element
        console.log('\n4️⃣ Finding "More information..." link...');
        const findResult = await handleFindSelector({
          text: 'More information',
          elementType: 'a'
        });
        
        expect(findResult.content[0].text).toContain('Found element');
        console.log('✅ Element located successfully');
        
        console.log('\n🎉 WORKFLOW COMPLETE! Browser will close...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error('❌ E2E test failed:', error);
        throw error;
      }
    }, E2E_TIMEOUT);
  });

  describe('Interactive Form Automation', () => {
    it('should demonstrate form interaction with visible browser', async () => {
      console.log('\n🎬 DEMO: Form Automation');
      console.log('👀 Watch browser interact with a search form');
      
      try {
        // Initialize browser
        console.log('\n1️⃣ Opening browser for form demo...');
        await handleBrowserInit({
          headless: false,
          disableXvfb: true,
          customConfig: {
            args: ['--window-size=1200,800']
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to a simple test site
        console.log('\n2️⃣ Navigating to httpbin form...');
        await handleNavigate({
          url: 'https://httpbin.org/forms/post',
          waitUntil: 'domcontentloaded'
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get content to analyze the page
        console.log('\n3️⃣ Analyzing form page...');
        const contentResult = await handleGetContent({ type: 'text' });
        
        // Check if httpbin service is available (handle 502 Bad Gateway gracefully)
        if (contentResult.content[0].text.includes('502 Bad Gateway') || 
            contentResult.content[0].text.includes('503 Service Unavailable')) {
          console.log('⚠️  httpbin.org service is currently unavailable (502/503 error)');
          console.log('⚠️  Skipping form interaction test - this is expected when external service is down');
          return; // Skip test gracefully
        }
        
        expect(contentResult.content[0].text).toContain('Customer name');
        console.log('✅ Form page loaded successfully');
        
        // Fill complete form in serial order (all fields)
        console.log('\n4️⃣ Filling out complete form in order...');
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
          console.log('\n5️⃣ Submitting form...');
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

        console.log('\n🎉 FORM AUTOMATION COMPLETE!');
        
      } catch (error) {
        console.error('❌ Form automation test failed:', error);
        throw error;
      }
    }, E2E_TIMEOUT);
  });

  describe('Content Strategy Demonstration', () => {
    it('should show content analysis and token management', async () => {
      console.log('\n🎬 DEMO: Content Analysis & Token Management');
      console.log('👀 Watch browser analyze content from different websites');
      
      try {
        // Initialize browser
        console.log('\n1️⃣ Opening browser for content analysis...');
        await handleBrowserInit({
          headless: false,
          disableXvfb: true,
          contentPriority: {
            prioritizeContent: true,
            autoSuggestGetContent: true
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));

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
          
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        console.log('\n🎉 CONTENT ANALYSIS COMPLETE!');

      } catch (error) {
        console.error('❌ Content analysis test failed:', error);
        throw error;
      }
    }, E2E_TIMEOUT);
  });
});