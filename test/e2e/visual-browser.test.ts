/**
 * End-to-End Visual Browser Tests - Human-Like Behavior
 * 
 * Tests all URLs with human-like interaction:
 * - nopecha.com (Cloudflare protected)
 * - httpbin.org/forms/post (Form filling)
 * - httpbin.org/html (HTML content)
 * - example.com (Simple page)
 * - httpbin.org/headers (Headers info)
 * 
 * Run with: npm run test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { handleBrowserInit, handleBrowserClose } from '../../src/handlers/browser-handlers';
import { handleNavigate } from '../../src/handlers/navigation-handlers';
import { handleGetContent } from '../../src/handlers/content-handlers';
import { handleClick, handleType } from '../../src/handlers/interaction-handlers';
import { resetBrowserInitDepth } from '../../src/browser-manager';

// ============== Human-Like Helper Functions ==============

const humanDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

const quickPause = () => humanDelay(200, 500);
const thinkPause = () => humanDelay(500, 1000);
const readPause = () => humanDelay(1000, 2000);
const humanTypingDelay = (): number => Math.floor(Math.random() * 80) + 40;

describe.sequential('E2E Visual Browser Tests', () => {
  const E2E_TIMEOUT = 180000;

  // ============== Browser Setup ==============
  beforeAll(async () => {
    console.log('🚀 Starting Human-Like E2E Tests');

    resetBrowserInitDepth();
    try { await handleBrowserClose(); } catch (e) { }

    const initResult = await handleBrowserInit({ headless: false });
    expect(initResult.content[0].text).toContain('Browser initialized');

    await readPause();
    console.log('✅ Browser ready\n');
  }, E2E_TIMEOUT);

  afterAll(async () => {
    console.log('\n🏁 Closing browser...');
    try { await handleBrowserClose(); } catch (e) { }
    resetBrowserInitDepth();
  });

  // ============== TEST 1: NoPecha (Cloudflare Protected) ==============
  describe('NoPecha Site Test', () => {
    it('should navigate to nopecha.com', async () => {
      console.log('📍 TEST 1: NoPecha.com');

      const nav = await handleNavigate({
        url: 'https://nopecha.com',
        waitUntil: 'networkidle2' // Wait for network to be idle
      });
      expect(nav.content[0].text).toContain('Successfully navigated');

      // Wait for captcha to solve (Cloudflare challenge needs time)
      console.log('   ⏳ Waiting for page and captcha...');
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Get content after captcha solved
      const content = await handleGetContent({ type: 'text' });
      expect(content.content[0].text.length).toBeGreaterThan(0);

      await readPause();
      console.log('   ✅ NoPecha.com loaded');
    }, E2E_TIMEOUT);
  });

  // ============== TEST 2: Form Filling (httpbin.org/forms/post) ==============
  describe('Form Automation', () => {
    it('should fill form on httpbin.org/forms/post', async () => {
      console.log('\n📍 TEST 2: Form Filling');

      // Navigate
      const nav = await handleNavigate({
        url: 'https://httpbin.org/forms/post',
        waitUntil: 'domcontentloaded'
      });
      expect(nav.content[0].text).toContain('Successfully navigated');
      await readPause();

      // Verify form
      const page = await handleGetContent({ type: 'text' });
      expect(page.content[0].text).toContain('Customer name');
      console.log('   Form loaded');

      // Fill Name
      await thinkPause();
      await handleType({
        selector: 'input[name="custname"]',
        text: 'John Smith',
        delay: humanTypingDelay()
      });
      console.log('   ✓ Name filled');

      // Fill Phone
      await quickPause();
      await handleType({
        selector: 'input[name="custtel"]',
        text: '9876543210',
        delay: humanTypingDelay()
      });
      console.log('   ✓ Phone filled');

      // Fill Email
      await quickPause();
      await handleType({
        selector: 'input[name="custemail"]',
        text: 'john@example.com',
        delay: humanTypingDelay()
      });
      console.log('   ✓ Email filled');

      // Select Size
      await thinkPause();
      await handleClick({ selector: 'input[name="size"][value="large"]' });
      console.log('   ✓ Size selected');

      // Select Toppings
      await quickPause();
      await handleClick({ selector: 'input[name="topping"][value="bacon"]' });
      await quickPause();
      await handleClick({ selector: 'input[name="topping"][value="cheese"]' });
      await quickPause();
      await handleClick({ selector: 'input[name="topping"][value="mushroom"]' });
      console.log('   ✓ Toppings selected');

      // Fill Time
      await thinkPause();
      await handleType({
        selector: 'input[name="delivery"]',
        text: '20:00',
        delay: humanTypingDelay()
      });
      console.log('   ✓ Time set');

      // Fill Comments
      await thinkPause();
      await handleType({
        selector: 'textarea[name="comments"]',
        text: 'Please call before delivery. Gate code: 1234',
        delay: humanTypingDelay()
      });
      console.log('   ✓ Comments added');

      await readPause();
      console.log('   ✅ Form completed');
    }, E2E_TIMEOUT);
  });

  // ============== TEST 3: HTML Content (httpbin.org/html) ==============
  describe('HTML Content Test', () => {
    it('should analyze httpbin.org/html', async () => {
      console.log('\n📍 TEST 3: HTML Content');

      const nav = await handleNavigate({
        url: 'https://httpbin.org/html',
        waitUntil: 'domcontentloaded'
      });
      expect(nav.content[0].text).toContain('Successfully navigated');

      await readPause();

      const content = await handleGetContent({ type: 'text' });
      expect(content.content[0].text).toContain('Herman Melville');

      const html = await handleGetContent({ type: 'html' });
      expect(html.content[0].text).toContain('<h1>');

      console.log('   ✅ HTML content analyzed');
    }, E2E_TIMEOUT);
  });

  // ============== TEST 4: Example.com ==============
  describe('Example Domain Test', () => {
    it('should analyze example.com', async () => {
      console.log('\n📍 TEST 4: Example.com');

      const nav = await handleNavigate({
        url: 'https://example.com',
        waitUntil: 'domcontentloaded'
      });
      expect(nav.content[0].text).toContain('Successfully navigated');

      await readPause();

      const content = await handleGetContent({ type: 'text' });
      expect(content.content[0].text).toContain('Example Domain');

      const html = await handleGetContent({ type: 'html' });
      expect(html.content[0].text).toContain('</a>');

      console.log('   ✅ Example.com analyzed');
    }, E2E_TIMEOUT);
  });

  // ============== TEST 5: Headers (httpbin.org/headers) ==============
  describe('Headers Test', () => {
    it('should analyze httpbin.org/headers', async () => {
      console.log('\n📍 TEST 5: Headers Page');

      const nav = await handleNavigate({
        url: 'https://httpbin.org/headers',
        waitUntil: 'domcontentloaded'
      });
      expect(nav.content[0].text).toContain('Successfully navigated');

      await readPause();

      const content = await handleGetContent({ type: 'text' });
      expect(content.content[0].text).toContain('Host');

      console.log('   ✅ Headers page analyzed');
    }, E2E_TIMEOUT);
  });
});