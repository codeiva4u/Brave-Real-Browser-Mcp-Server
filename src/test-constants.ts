/**
 * Central Test Configuration
 * Use these constants across all test files for consistency
 */

export const TEST_URLS = {
  // CAPTCHA Testing URLs
  CAPTCHA: {
    CLOUDFLARE: 'https://nopecha.com/demo/cloudflare',
    ECOURTS_INDIA: 'https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&app_token=22e7493ca224682349cf0986dd144491a950819d30918b8e319ab0d39618f847',
    RECAPTCHA: 'https://nopecha.com/demo/recaptcha',
    HCAPTCHA: 'https://nopecha.com/demo/hcaptcha',
    TURNSTILE: 'https://nopecha.com/demo/turnstile',
  },

  // General Content Testing
  GENERAL: {
    WIKIPEDIA: 'https://en.wikipedia.org/wiki/Web_scraping',
    IMDB: 'https://www.imdb.com/',
    GITHUB: 'https://github.com/',
    EXAMPLE: 'https://example.com',
  },

  // API Discovery Testing
  API: {
    JSONPLACEHOLDER: 'https://jsonplaceholder.typicode.com',
    REQRES: 'https://reqres.in/',
  },

  // E-commerce Testing
  ECOMMERCE: {
    AMAZON: 'https://www.amazon.com',
  },

  // Local Testing
  LOCAL: {
    LOCALHOST: 'http://localhost:3000',
    FILE: 'file:///test.html',
  },
};

export const TEST_SELECTORS = {
  // Common selectors for testing
  WIKIPEDIA: {
    HEADING: '#firstHeading',
    CONTENT: '#mw-content-text',
    TOC: '#toc',
    LINKS: 'a[href]',
    IMAGES: 'img',
    TABLES: 'table.wikitable',
  },

  ECOURTS: {
    CAPTCHA_IMAGE: 'img[src*="captcha"]',
    CAPTCHA_INPUT: 'input[name*="captcha" i]',
    STATE_SELECT: 'select[name="state"]',
    SEARCH_BUTTON: 'button[type="submit"]',
  },

  CLOUDFLARE: {
    CHALLENGE: 'div[id^="cf-chl-widget"]',
    IFRAME: 'iframe[src*="challenges.cloudflare.com"]',
    VERIFY_TEXT: 'p:contains("Verifying")',
  },

  COMMON: {
    HEADING: 'h1',
    PARAGRAPH: 'p',
    LINK: 'a',
    IMAGE: 'img',
    BUTTON: 'button',
    INPUT: 'input',
  },
};

export const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  CAPTCHA: 60000,
};

export const TEST_EXPECTATIONS = {
  WIKIPEDIA: {
    MIN_IMAGES: 5,
    MIN_LINKS: 100,
    HAS_TOC: true,
  },

  ECOURTS: {
    HAS_CAPTCHA: true,
    HAS_STATE_SELECT: true,
  },

  CLOUDFLARE: {
    HAS_CHALLENGE: true,
    VERIFICATION_TEXT: 'Verifying you are human',
  },
};

export const TEST_DATA = {
  // Sample data for testing
  SENTIMENT: {
    POSITIVE: 'This is an amazing product! I absolutely love it. Highly recommended!',
    NEGATIVE: 'Terrible experience. Very disappointed. Would not recommend.',
    NEUTRAL: 'The product arrived on time. It works as described.',
  },

  TRANSLATION: {
    FRENCH: 'Bonjour, comment allez-vous? Je suis très heureux de vous rencontrer.',
    SPANISH: 'Hola, ¿cómo estás? Estoy muy feliz de conocerte.',
    GERMAN: 'Hallo, wie geht es dir? Ich bin sehr glücklich, dich kennenzulernen.',
  },

  SEARCH: {
    PARTY_NAME: 'Ramesh Kumar',
    CASE_NUMBER: '123/2024',
    YEAR: '2024',
  },
};

export default {
  TEST_URLS,
  TEST_SELECTORS,
  TEST_TIMEOUTS,
  TEST_EXPECTATIONS,
  TEST_DATA,
};
