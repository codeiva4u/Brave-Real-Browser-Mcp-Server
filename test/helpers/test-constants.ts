/**
 * Centralized Test Constants
 * 
 * This file contains reusable constants for test files to maintain consistency
 * and make updates easier across all tests.
 */

/**
 * Test URLs used throughout the test suites
 * - Use these constants instead of hardcoding URLs in tests
 * - Makes it easy to update URLs across all tests from one place
 */
export const TEST_URLS = {
  /** Basic example website - simple HTML page for testing */
  BASIC: 'https://example.com',
  
  /** HttpBin HTML endpoint - for testing HTML content extraction */
  HTTPBIN_HTML: 'https://httpbin.org/html',
  
  /** HttpBin form endpoint - for testing form interactions */
  HTTPBIN_FORM: 'https://httpbin.org/forms/post',
  
  /** Cloudflare demo page - for testing CAPTCHA handling */
  CLOUDFLARE_DEMO: 'https://nopecha.com/demo/cloudflare',
  
  /** Another test URL option */
  TEST_PAGE: 'https://httpbin.org/html',
} as const;

/**
 * Test selectors used in multiple test files
 */
export const TEST_SELECTORS = {
  /** Common button selector */
  BUTTON: 'button',
  
  /** Input field selector */
  INPUT: 'input',
  
  /** Form selector */
  FORM: 'form',
} as const;

/**
 * Test timeouts in milliseconds
 */
export const TEST_TIMEOUTS = {
  /** Short timeout for quick operations */
  SHORT: 1000,
  
  /** Medium timeout for standard operations */
  MEDIUM: 5000,
  
  /** Long timeout for slow operations */
  LONG: 30000,
} as const;
