/**
 * Brave Real Browser MCP Server - Tool Handlers
 * 
 * Implementation of all 23 browser automation tools (optimized from 28)
 * 
 * Environment Variables:
 *   HEADLESS=true   - Run browser in headless mode
 *   HEADLESS=false  - Run browser in GUI mode (visible)
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Browser state management
let browserInstance = null;
let pageInstance = null;
let blockerInstance = null;
let networkRecords = [];
let isRecordingNetwork = false;
let progressTasks = {};

// Progress notification callback (set by server)
let progressCallback = null;

/**
 * Set progress callback for real-time notifications
 */
function setProgressCallback(callback) {
  progressCallback = callback;
}

/**
 * Send real-time progress notification
 */
function notifyProgress(toolName, status, message, data = {}) {
  const notification = {
    tool: toolName,
    status, // 'started' | 'progress' | 'completed' | 'error'
    message,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Log to stderr for visibility
  const emoji = {
    started: '🚀',
    progress: '⏳',
    completed: '✅',
    error: '❌'
  }[status] || '📌';
  
  console.error(`${emoji} [${toolName}] ${message}`);
  
  // Call progress callback if set
  if (progressCallback) {
    progressCallback(notification);
  }
  
  return notification;
}

/**
 * Get headless setting from environment
 */
function getHeadlessFromEnv() {
  const envHeadless = process.env.HEADLESS;
  
  if (envHeadless === undefined || envHeadless === null || envHeadless === '') {
    return false; // Default: GUI mode
  }
  
  // Parse string to boolean
  const value = envHeadless.toLowerCase().trim();
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get browser and page instances
 */
function getState() {
  return { browser: browserInstance, page: pageInstance, blocker: blockerInstance };
}

/**
 * Check if browser is initialized
 */
function requireBrowser() {
  if (!browserInstance || !pageInstance) {
    throw new Error('Browser not initialized. Call browser_init first.');
  }
  return { browser: browserInstance, page: pageInstance };
}

/**
 * DECODER UTILITIES - URL, Base64, AES Decryption
 */
const decoders = {
  // URL Decoder
  urlDecode: (encodedUrl) => {
    try {
      // Handle multiple encoding layers
      let decoded = encodedUrl;
      let iterations = 0;
      const maxIterations = 5;
      
      while (iterations < maxIterations) {
        const newDecoded = decodeURIComponent(decoded);
        if (newDecoded === decoded) break;
        decoded = newDecoded;
        iterations++;
      }
      
      return { success: true, decoded, iterations, original: encodedUrl };
    } catch (error) {
      return { success: false, error: error.message, original: encodedUrl };
    }
  },
  
  // Base64 Decoder
  base64Decode: (encodedData) => {
    try {
      // Try multiple approaches
      const approaches = [];
      
      // Standard Base64
      try {
        const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
        if (decoded && decoded !== encodedData) {
          approaches.push({ method: 'standard', decoded });
        }
      } catch (e) {}
      
      // URL-safe Base64 (replace - with +, _ with /)
      try {
        const normalized = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(normalized, 'base64').toString('utf-8');
        if (decoded && decoded !== encodedData) {
          approaches.push({ method: 'url-safe', decoded });
        }
      } catch (e) {}
      
      // With padding
      try {
        const padding = 4 - (encodedData.length % 4);
        if (padding !== 4) {
          const padded = encodedData + '='.repeat(padding);
          const decoded = Buffer.from(padded, 'base64').toString('utf-8');
          if (decoded && decoded !== encodedData) {
            approaches.push({ method: 'padded', decoded });
          }
        }
      } catch (e) {}
      
      if (approaches.length === 0) {
        return { success: false, error: 'Could not decode base64', original: encodedData };
      }
      
      return { success: true, decoded: approaches[0].decoded, approaches, original: encodedData };
    } catch (error) {
      return { success: false, error: error.message, original: encodedData };
    }
  },
  
  // AES Decryptor
  decryptAES: (encryptedData, key, iv = null, algorithm = 'aes-256-cbc') => {
    try {
      // Convert inputs to buffers if needed
      const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'utf-8');
      
      // Handle different input formats
      let encryptedBuffer;
      if (Buffer.isBuffer(encryptedData)) {
        encryptedBuffer = encryptedData;
      } else if (encryptedData.includes('%')) {
        // URL encoded
        encryptedBuffer = Buffer.from(decodeURIComponent(encryptedData), 'base64');
      } else {
        encryptedBuffer = Buffer.from(encryptedData, 'base64');
      }
      
      let decipher;
      if (iv) {
        const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, 'utf-8');
        decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);
      } else {
        // Try without IV (ECB mode - less secure but sometimes used)
        decipher = crypto.createDecipheriv(algorithm.replace('-cbc', '-ecb'), keyBuffer, Buffer.alloc(0));
      }
      
      let decrypted = decipher.update(encryptedBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      const result = decrypted.toString('utf-8');
      return { success: true, decrypted: result, algorithm };
    } catch (error) {
      return { success: false, error: error.message, algorithm };
    }
  },
  
  // Try all decoders
  tryAll: (data, options = {}) => {
    const results = {
      original: data,
      attempts: []
    };
    
    // Try URL decode
    const urlResult = decoders.urlDecode(data);
    if (urlResult.success && urlResult.iterations > 0) {
      results.attempts.push({ type: 'url', result: urlResult.decoded });
    }
    
    // Try Base64
    const base64Result = decoders.base64Decode(data);
    if (base64Result.success) {
      results.attempts.push({ type: 'base64', result: base64Result.decoded });
      
      // Try nested decoding
      const nestedUrl = decoders.urlDecode(base64Result.decoded);
      if (nestedUrl.success && nestedUrl.iterations > 0) {
        results.attempts.push({ type: 'base64+url', result: nestedUrl.decoded });
      }
    }
    
    // Try AES if key provided
    if (options.key) {
      const aesResult = decoders.decryptAES(data, options.key, options.iv, options.algorithm);
      if (aesResult.success) {
        results.attempts.push({ type: 'aes', result: aesResult.decrypted });
      }
    }
    
    return results;
  }
};

/**
 * Tool Handlers Object
 */
const handlers = {
  // 1. Browser Init
  async browser_init(params = {}) {
    notifyProgress('browser_init', 'started', 'Initializing browser...');
    
    const { connect } = require('../../lib/cjs/index.js');
    
    // Get headless from params OR environment variable
    const envHeadless = getHeadlessFromEnv();
    const headless = params.headless !== undefined ? params.headless : envHeadless;
    
    const { proxy = {}, turnstile = false, enableBlocker = true } = params;
    
    notifyProgress('browser_init', 'progress', `Mode: ${headless ? 'Headless' : 'GUI (Visible)'}`, { headless });
    
    const result = await connect({
      headless,
      proxy,
      turnstile,
      enableBlocker,
    });
    
    browserInstance = result.browser;
    pageInstance = result.page;
    blockerInstance = result.blocker;
    
    const pid = browserInstance.process()?.pid;
    
    notifyProgress('browser_init', 'completed', `Browser started (PID: ${pid})`, { 
      headless, 
      pid,
      blockerEnabled: enableBlocker 
    });
    
    return {
      success: true,
      message: `Browser initialized in ${headless ? 'headless' : 'GUI'} mode`,
      pid,
      headless,
      blockerEnabled: enableBlocker
    };
  },

  // 2. Navigate (ENHANCED - handles context destroyed errors, retries)
  async navigate(params) {
    const { page } = requireBrowser();
    const { url, waitUntil = 'networkidle2', timeout = 30000, retries = 2 } = params;
    
    notifyProgress('navigate', 'started', `Navigating to: ${url}`);
    
    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Wait a bit if this is a retry
        if (attempt > 0) {
          notifyProgress('navigate', 'progress', `Retry attempt ${attempt}...`);
          await new Promise(r => setTimeout(r, 1000));
        }
        
        await page.goto(url, { waitUntil, timeout });
        
        // Wait for page to stabilize after navigation
        await new Promise(r => setTimeout(r, 500));
        
        // Try to get title with error handling
        let title = '';
        try {
          title = await page.title();
        } catch (e) {
          // Title might fail if page is still loading
          title = 'Loading...';
        }
        
        notifyProgress('navigate', 'completed', `Loaded: ${title}`, { url: page.url(), title });
        
        return {
          success: true,
          url: page.url(),
          title
        };
      } catch (error) {
        lastError = error;
        
        // Handle specific errors that might be recoverable
        if (error.message?.includes('Execution context was destroyed') ||
            error.message?.includes('context') ||
            error.message?.includes('Target closed')) {
          
          notifyProgress('navigate', 'progress', `Navigation interrupted (${error.message.substring(0, 50)}...), waiting for page...`);
          
          // Wait for any ongoing navigation to complete
          try {
            await page.waitForNavigation({ timeout: 5000, waitUntil: 'domcontentloaded' }).catch(() => {});
          } catch (e) {
            // Ignore timeout
          }
          
          // Check if we actually landed on the page
          try {
            const currentUrl = page.url();
            if (currentUrl && currentUrl !== 'about:blank') {
              const title = await page.title().catch(() => 'Unknown');
              notifyProgress('navigate', 'completed', `Loaded after recovery: ${title}`, { url: currentUrl, title });
              return {
                success: true,
                url: currentUrl,
                title,
                recovered: true
              };
            }
          } catch (e) {
            // Continue to retry
          }
        } else {
          // Non-recoverable error, throw immediately
          throw error;
        }
      }
    }
    
    // All retries failed
    notifyProgress('navigate', 'error', `Navigation failed after ${retries + 1} attempts: ${lastError?.message}`);
    throw lastError || new Error('Navigation failed');
  },

  // 3. Get Content
  async get_content(params = {}) {
    const { page } = requireBrowser();
    const { format = 'text', selector } = params;
    
    notifyProgress('get_content', 'started', `Extracting ${format} content${selector ? ` from ${selector}` : ''}`);
    
    let content;
    
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        notifyProgress('get_content', 'error', `Element not found: ${selector}`);
        return { success: false, error: `Element not found: ${selector}` };
      }
      
      if (format === 'html') {
        content = await element.evaluate(el => el.outerHTML);
      } else {
        content = await element.evaluate(el => el.textContent);
      }
    } else {
      if (format === 'html') {
        content = await page.content();
      } else if (format === 'markdown') {
        content = await page.evaluate(() => {
          const body = document.body.innerText;
          return body;
        });
      } else {
        content = await page.evaluate(() => document.body.innerText);
      }
    }
    
    notifyProgress('get_content', 'completed', `Extracted ${content.length} characters`, { format, length: content.length });
    
    return {
      success: true,
      content,
      url: page.url(),
      format
    };
  },

  // 4. Wait
  async wait(params) {
    const { page } = requireBrowser();
    const { type = 'timeout', value, timeout = 30000 } = params;
    
    notifyProgress('wait', 'started', `Waiting for ${type}: ${value}`);
    
    switch (type) {
      case 'selector':
        await page.waitForSelector(value, { timeout });
        break;
      case 'navigation':
        await page.waitForNavigation({ timeout });
        break;
      case 'networkidle':
        await page.waitForNetworkIdle({ timeout });
        break;
      case 'timeout':
      default:
        await new Promise(r => setTimeout(r, parseInt(value) || 1000));
    }
    
    notifyProgress('wait', 'completed', `Wait completed: ${type}`, { type, value });
    
    return { success: true, type, value };
  },

  // 5. Click
  async click(params) {
    const { page } = requireBrowser();
    const { selector, humanLike = true, clickCount = 1, delay = 0 } = params;
    
    notifyProgress('click', 'started', `Clicking: ${selector}`);
    
    if (humanLike) {
      try {
        const { createCursor } = require('ghost-cursor');
        const cursor = createCursor(page);
        await cursor.click(selector);
        notifyProgress('click', 'progress', 'Used human-like cursor movement');
      } catch (e) {
        await page.click(selector, { clickCount, delay });
      }
    } else {
      await page.click(selector, { clickCount, delay });
    }
    
    notifyProgress('click', 'completed', `Clicked: ${selector}`, { selector, humanLike });
    
    return { success: true, selector, clicked: true };
  },

  // 6. Type
  async type(params) {
    const { page } = requireBrowser();
    const { selector, text, delay = 50, clear = false } = params;
    
    notifyProgress('type', 'started', `Typing ${text.length} characters into ${selector}`);
    
    if (clear) {
      await page.click(selector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      notifyProgress('type', 'progress', 'Cleared existing text');
    }
    
    await page.type(selector, text, { delay });
    
    notifyProgress('type', 'completed', `Typed ${text.length} characters`, { selector, textLength: text.length });
    
    return { success: true, selector, textLength: text.length };
  },

  // 7. Browser Close
  async browser_close(params = {}) {
    const { force = false } = params;
    
    notifyProgress('browser_close', 'started', 'Closing browser...');
    
    if (browserInstance) {
      try {
        await browserInstance.close();
        notifyProgress('browser_close', 'progress', 'Browser closed gracefully');
      } catch (e) {
        if (force) {
          browserInstance.process()?.kill('SIGKILL');
          notifyProgress('browser_close', 'progress', 'Browser force killed');
        }
      }
      browserInstance = null;
      pageInstance = null;
      blockerInstance = null;
    }
    
    notifyProgress('browser_close', 'completed', 'Browser closed');
    
    return { success: true, message: 'Browser closed' };
  },

  // 8. Solve Captcha
  async solve_captcha(params = {}) {
    const { page } = requireBrowser();
    const { type = 'auto', timeout = 30000 } = params;
    
    notifyProgress('solve_captcha', 'started', `Solving ${type} captcha...`);
    
    const start = Date.now();
    let attempts = 0;
    
    while (Date.now() - start < timeout) {
      attempts++;
      
      const turnstileToken = await page.evaluate(() => {
        const input = document.querySelector('input[name="cf-turnstile-response"]');
        return input ? input.value : null;
      });
      
      if (turnstileToken) {
        notifyProgress('solve_captcha', 'completed', `Captcha solved after ${attempts} checks`, { type: 'turnstile', attempts });
        return { success: true, type: 'turnstile', solved: true };
      }
      
      if (attempts % 10 === 0) {
        notifyProgress('solve_captcha', 'progress', `Still solving... (${attempts} checks)`, { attempts });
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
    
    notifyProgress('solve_captcha', 'error', 'Captcha solving timeout');
    return { success: false, error: 'Captcha solving timeout' };
  },

  // 9. Random Scroll
  async random_scroll(params = {}) {
    const { page } = requireBrowser();
    const { direction = 'down', amount = 0, smooth = true } = params;
    
    const scrollAmount = amount || Math.floor(Math.random() * 500) + 200;
    const scrollDirection = direction === 'random' 
      ? (Math.random() > 0.5 ? 'down' : 'up') 
      : direction;
    
    notifyProgress('random_scroll', 'started', `Scrolling ${scrollDirection} ${scrollAmount}px`);
    
    await page.evaluate(({ scrollAmount, scrollDirection, smooth }) => {
      const y = scrollDirection === 'down' ? scrollAmount : -scrollAmount;
      window.scrollBy({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    }, { scrollAmount, scrollDirection, smooth });
    
    notifyProgress('random_scroll', 'completed', `Scrolled ${scrollDirection} ${scrollAmount}px`, { direction: scrollDirection, amount: scrollAmount });
    
    return { success: true, direction: scrollDirection, amount: scrollAmount };
  },

  // 10. Find Element
  async find_element(params = {}) {
    const { page } = requireBrowser();
    const { selector, xpath, text, multiple = false } = params;
    
    notifyProgress('find_element', 'started', `Finding element: ${selector || xpath || text}`);
    
    let elements = [];
    
    if (selector) {
      if (multiple) {
        elements = await page.$$eval(selector, els => els.map(el => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 100),
          classes: el.className,
          id: el.id
        })));
      } else {
        const el = await page.$(selector);
        if (el) {
          elements = [await el.evaluate(el => ({
            tag: el.tagName,
            text: el.textContent?.substring(0, 100),
            classes: el.className,
            id: el.id
          }))];
        }
      }
    } else if (xpath) {
      const handles = await page.$x(xpath);
      elements = await Promise.all(handles.map(h => h.evaluate(el => ({
        tag: el.tagName,
        text: el.textContent?.substring(0, 100)
      }))));
    } else if (text) {
      elements = await page.$$eval('*', (els, text) => 
        els.filter(el => el.textContent?.includes(text))
          .slice(0, 10)
          .map(el => ({ tag: el.tagName, text: el.textContent?.substring(0, 100) })),
        text
      );
    }
    
    notifyProgress('find_element', 'completed', `Found ${elements.length} element(s)`, { found: elements.length });
    
    return { success: true, found: elements.length, elements };
  },

  // 11. Save Content as Markdown
  async save_content_as_markdown(params) {
    const { page } = requireBrowser();
    const { filename, selector, includeImages = true, includeMeta = true } = params;
    
    notifyProgress('save_content_as_markdown', 'started', `Saving to: ${filename}`);
    
    let markdown = '';
    
    if (includeMeta) {
      const title = await page.title();
      const url = page.url();
      markdown += `# ${title}\n\n`;
      markdown += `> Source: ${url}\n\n`;
    }
    
    const content = selector 
      ? await page.$eval(selector, el => el.innerText)
      : await page.evaluate(() => document.body.innerText);
    
    markdown += content;
    
    const outputPath = path.resolve(filename);
    fs.writeFileSync(outputPath, markdown);
    
    notifyProgress('save_content_as_markdown', 'completed', `Saved ${markdown.length} bytes to ${filename}`, { filename: outputPath, size: markdown.length });
    
    return { success: true, filename: outputPath, size: markdown.length };
  },

  // 12. Redirect Tracer (ENHANCED - tracks HTTP + JS + Meta redirects)
  async redirect_tracer(params) {
    const { page } = requireBrowser();
    const { url, maxRedirects = 20, includeHeaders = false, followJS = true, timeout = 30000 } = params;
    
    notifyProgress('redirect_tracer', 'started', `Tracing redirects for: ${url}`);
    
    const redirects = [];
    const jsNavigations = [];
    let currentUrl = url;
    
    // HTTP redirect handler
    const responseHandler = response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirects.push({
          url: response.url(),
          status: response.status(),
          type: 'http',
          headers: includeHeaders ? response.headers() : undefined
        });
        notifyProgress('redirect_tracer', 'progress', `HTTP Redirect ${redirects.length}: ${response.status()}`, { status: response.status() });
      }
    };
    
    // JS/Navigation handler for tracking window.location changes
    const frameNavigatedHandler = frame => {
      if (frame === page.mainFrame()) {
        const newUrl = frame.url();
        if (newUrl !== currentUrl && newUrl !== 'about:blank') {
          jsNavigations.push({
            url: newUrl,
            type: 'js_navigation',
            fromUrl: currentUrl,
            timestamp: Date.now()
          });
          notifyProgress('redirect_tracer', 'progress', `JS Navigation: ${newUrl}`, { type: 'js' });
          currentUrl = newUrl;
        }
      }
    };
    
    page.on('response', responseHandler);
    page.on('framenavigated', frameNavigatedHandler);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout });
      
      // If followJS is enabled, wait a bit and check for meta refreshes and JS redirects
      if (followJS) {
        // Check for meta refresh tags
        const metaRefresh = await page.evaluate(() => {
          const meta = document.querySelector('meta[http-equiv="refresh"]');
          if (meta) {
            const content = meta.getAttribute('content');
            const match = content?.match(/url=(.+)/i);
            return match ? match[1].trim().replace(/['"]/g, '') : null;
          }
          return null;
        }).catch(() => null);
        
        if (metaRefresh) {
          jsNavigations.push({
            url: metaRefresh,
            type: 'meta_refresh',
            fromUrl: page.url()
          });
        }
        
        // Extract any onclick/href javascript: URLs
        const jsLinks = await page.evaluate(() => {
          const links = [];
          document.querySelectorAll('a[href^="javascript:"], [onclick]').forEach(el => {
            const onclick = el.getAttribute('onclick');
            const href = el.getAttribute('href');
            if (onclick) {
              const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
              if (match) links.push({ url: match[1], type: 'onclick' });
            }
            if (href && href.includes('location')) {
              links.push({ url: href, type: 'javascript_href' });
            }
          });
          return links;
        }).catch(() => []);
        
        jsNavigations.push(...jsLinks);
      }
    } catch (e) {
      notifyProgress('redirect_tracer', 'progress', `Navigation error: ${e.message}`);
    }
    
    page.off('response', responseHandler);
    page.off('framenavigated', frameNavigatedHandler);
    
    const allRedirects = [
      ...redirects,
      ...jsNavigations.filter(nav => nav.url && nav.url.startsWith('http'))
    ];
    
    notifyProgress('redirect_tracer', 'completed', 
      `Found ${redirects.length} HTTP + ${jsNavigations.length} JS redirects`, 
      { httpRedirects: redirects.length, jsNavigations: jsNavigations.length, finalUrl: page.url() });
    
    return {
      success: true,
      originalUrl: url,
      finalUrl: page.url(),
      redirectCount: allRedirects.length,
      httpRedirects: redirects,
      jsNavigations: jsNavigations,
      allRedirects: allRedirects
    };
  },

  // 13. Search Regex
  async search_regex(params) {
    const { page } = requireBrowser();
    const { pattern, flags = 'gi', source = 'html' } = params;
    
    notifyProgress('search_regex', 'started', `Searching pattern: ${pattern}`);
    
    let content;
    if (source === 'html') {
      content = await page.content();
    } else if (source === 'scripts') {
      content = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
    } else {
      content = await page.evaluate(() => document.body.innerText);
    }
    
    const regex = new RegExp(pattern, flags);
    const matches = content.match(regex) || [];
    
    notifyProgress('search_regex', 'completed', `Found ${matches.length} matches`, { matchCount: matches.length });
    
    return { success: true, pattern, matchCount: matches.length, matches: matches.slice(0, 100) };
  },

  // 14. Extract JSON
  async extract_json(params = {}) {
    const { page } = requireBrowser();
    const { source = 'page', selector, jsonPath } = params;
    
    notifyProgress('extract_json', 'started', `Extracting JSON from: ${source}`);
    
    let jsonData = [];
    
    if (source === 'ld+json') {
      jsonData = await page.$$eval('script[type="application/ld+json"]', scripts => 
        scripts.map(s => {
          try { return JSON.parse(s.textContent); } catch { return null; }
        }).filter(Boolean)
      );
    } else if (source === 'scripts') {
      const content = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
      const jsonRegex = /\{[^{}]*\}|\[[^\[\]]*\]/g;
      const matches = content.match(jsonRegex) || [];
      jsonData = matches.slice(0, 20).map(m => {
        try { return JSON.parse(m); } catch { return null; }
      }).filter(Boolean);
    } else if (selector) {
      const text = await page.$eval(selector, el => el.textContent);
      try { jsonData = [JSON.parse(text)]; } catch {}
    }
    
    notifyProgress('extract_json', 'completed', `Extracted ${jsonData.length} JSON objects`, { count: jsonData.length });
    
    return { success: true, source, count: jsonData.length, data: jsonData };
  },

  // 15. Scrape Meta Tags
  async scrape_meta_tags(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'] } = params;
    
    notifyProgress('scrape_meta_tags', 'started', 'Extracting meta tags...');
    
    const meta = await page.evaluate(() => {
      const result = { meta: {}, og: {}, twitter: {} };
      
      document.querySelectorAll('meta').forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (name && content) {
          if (name.startsWith('og:')) {
            result.og[name.replace('og:', '')] = content;
          } else if (name.startsWith('twitter:')) {
            result.twitter[name.replace('twitter:', '')] = content;
          } else {
            result.meta[name] = content;
          }
        }
      });
      
      result.title = document.title;
      result.canonical = document.querySelector('link[rel="canonical"]')?.href;
      
      return result;
    });
    
    const tagCount = Object.keys(meta.meta).length + Object.keys(meta.og).length + Object.keys(meta.twitter).length;
    notifyProgress('scrape_meta_tags', 'completed', `Extracted ${tagCount} meta tags`, { tagCount });
    
    return { success: true, ...meta };
  },

  // 16. Press Key
  async press_key(params) {
    const { page } = requireBrowser();
    const { key, modifiers = [], count = 1 } = params;
    
    notifyProgress('press_key', 'started', `Pressing: ${modifiers.length ? modifiers.join('+') + '+' : ''}${key} x${count}`);
    
    for (let i = 0; i < count; i++) {
      if (modifiers.length > 0) {
        const keyCombo = [...modifiers, key].join('+');
        await page.keyboard.press(keyCombo);
      } else {
        await page.keyboard.press(key);
      }
    }
    
    notifyProgress('press_key', 'completed', `Pressed ${key} ${count} time(s)`, { key, modifiers, count });
    
    return { success: true, key, modifiers, count };
  },

  // 17. Progress Tracker
  async progress_tracker(params = {}) {
    const { action = 'get', taskName, progress } = params;
    
    switch (action) {
      case 'start':
        progressTasks[taskName] = { progress: 0, startTime: Date.now() };
        notifyProgress('progress_tracker', 'started', `Task started: ${taskName}`);
        break;
      case 'update':
        if (progressTasks[taskName]) {
          progressTasks[taskName].progress = progress;
          notifyProgress('progress_tracker', 'progress', `${taskName}: ${progress}%`, { taskName, progress });
        }
        break;
      case 'complete':
        if (progressTasks[taskName]) {
          progressTasks[taskName].progress = 100;
          progressTasks[taskName].endTime = Date.now();
          const duration = progressTasks[taskName].endTime - progressTasks[taskName].startTime;
          notifyProgress('progress_tracker', 'completed', `${taskName} completed in ${duration}ms`, { taskName, duration });
        }
        break;
    }
    
    return { success: true, tasks: progressTasks };
  },

  // 18. Deep Analysis
  async deep_analysis(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], detailed = true } = params;
    
    notifyProgress('deep_analysis', 'started', 'Analyzing page...');
    
    const analysis = await page.evaluate(() => {
      const result = {
        seo: {
          title: document.title,
          titleLength: document.title.length,
          h1Count: document.querySelectorAll('h1').length,
          metaDescription: document.querySelector('meta[name="description"]')?.content,
          canonicalUrl: document.querySelector('link[rel="canonical"]')?.href,
          hasViewport: !!document.querySelector('meta[name="viewport"]')
        },
        performance: {
          domElements: document.querySelectorAll('*').length,
          scripts: document.querySelectorAll('script').length,
          stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
          images: document.querySelectorAll('img').length
        },
        accessibility: {
          imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
          linksCount: document.querySelectorAll('a').length,
          formsCount: document.querySelectorAll('form').length,
          inputsWithoutLabel: document.querySelectorAll('input:not([aria-label]):not([id])').length
        },
        security: {
          isHttps: location.protocol === 'https:',
          hasCSP: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
          externalScripts: [...document.querySelectorAll('script[src]')].filter(s => !s.src.includes(location.hostname)).length
        }
      };
      return result;
    });
    
    notifyProgress('deep_analysis', 'completed', `Analysis complete: ${analysis.performance.domElements} DOM elements`, { domElements: analysis.performance.domElements });
    
    return { success: true, url: page.url(), analysis };
  },

  // 19. Network Recorder (ENHANCED - captures responses, headers, and video streams)
  async network_recorder(params = {}) {
    const { page } = requireBrowser();
    const { action = 'get', filter = {}, captureResponses = false } = params;
    
    switch (action) {
      case 'start':
        networkRecords = [];
        isRecordingNetwork = true;
        
        // Request handler
        page.on('request', req => {
          if (isRecordingNetwork) {
            networkRecords.push({
              type: 'request',
              url: req.url(),
              method: req.method(),
              resourceType: req.resourceType(),
              headers: req.headers(),
              timestamp: Date.now()
            });
          }
        });
        
        // Response handler for capturing video/media URLs
        page.on('response', async res => {
          if (isRecordingNetwork) {
            const url = res.url();
            const contentType = res.headers()['content-type'] || '';
            const isMedia = contentType.includes('video') || 
                           contentType.includes('audio') || 
                           contentType.includes('mpegurl') ||
                           url.includes('.m3u8') || 
                           url.includes('.mpd') ||
                           url.includes('.mp4') ||
                           url.includes('.ts');
            
            const record = {
              type: 'response',
              url: url,
              status: res.status(),
              contentType: contentType,
              isMedia: isMedia,
              timestamp: Date.now()
            };
            
            // For media URLs, try to get more details
            if (isMedia) {
              record.mediaType = url.includes('.m3u8') ? 'hls' : 
                                url.includes('.mpd') ? 'dash' : 
                                url.includes('.mp4') ? 'mp4' : 'other';
            }
            
            networkRecords.push(record);
          }
        });
        
        // Frame navigation handler for JS redirects
        page.on('framenavigated', frame => {
          if (isRecordingNetwork && frame === page.mainFrame()) {
            networkRecords.push({
              type: 'navigation',
              url: frame.url(),
              timestamp: Date.now()
            });
          }
        });
        
        notifyProgress('network_recorder', 'started', 'Enhanced network recording started (requests + responses + navigations)');
        break;
        
      case 'stop':
        isRecordingNetwork = false;
        notifyProgress('network_recorder', 'completed', `Recording stopped: ${networkRecords.length} events captured`);
        break;
        
      case 'clear':
        networkRecords = [];
        notifyProgress('network_recorder', 'completed', 'Network records cleared');
        break;
        
      case 'get_media':
        // Special action to get only media URLs
        const mediaRecords = networkRecords.filter(r => r.isMedia);
        return { 
          success: true, 
          count: mediaRecords.length, 
          mediaUrls: mediaRecords.map(r => ({ url: r.url, type: r.mediaType }))
        };
        
      case 'get_navigations':
        // Get only navigation events (for tracking JS redirects)
        const navRecords = networkRecords.filter(r => r.type === 'navigation');
        return { 
          success: true, 
          count: navRecords.length, 
          navigations: navRecords 
        };
    }
    
    let records = networkRecords;
    if (filter.resourceType) {
      records = records.filter(r => r.resourceType === filter.resourceType);
    }
    if (filter.urlPattern) {
      const regex = new RegExp(filter.urlPattern);
      records = records.filter(r => regex.test(r.url));
    }
    if (filter.type) {
      records = records.filter(r => r.type === filter.type);
    }
    if (filter.mediaOnly) {
      records = records.filter(r => r.isMedia);
    }
    
    return { success: true, recording: isRecordingNetwork, count: records.length, records: records.slice(-200) };
  },

  // 20. Link Harvester (ENHANCED - finds hidden links, data attributes, onclick handlers)
  async link_harvester(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], selector, includeText = true, includeHidden = true, searchIframes = false } = params;
    
    notifyProgress('link_harvester', 'started', 'Harvesting links (enhanced mode)...');
    
    const currentHost = new URL(page.url()).hostname;
    
    // Enhanced link extraction
    const extractLinks = async (context) => {
      return await context.evaluate(({ includeText, includeHidden }) => {
        const allLinks = [];
        const seenUrls = new Set();
        
        const addLink = (href, text, source, element) => {
          if (!href || seenUrls.has(href)) return;
          if (!href.startsWith('http') && !href.startsWith('//')) return;
          
          // Handle protocol-relative URLs
          if (href.startsWith('//')) {
            href = window.location.protocol + href;
          }
          
          seenUrls.add(href);
          allLinks.push({
            href,
            text: includeText ? (text || '').trim().substring(0, 100) : undefined,
            source,
            hidden: element ? (
              element.offsetParent === null || 
              getComputedStyle(element).display === 'none' ||
              getComputedStyle(element).visibility === 'hidden'
            ) : false
          });
        };
        
        // 1. Standard anchor tags
        document.querySelectorAll('a[href]').forEach(a => {
          addLink(a.href, a.textContent, 'anchor', a);
        });
        
        // 2. Data attributes containing URLs
        const dataAttrs = ['data-href', 'data-url', 'data-link', 'data-src', 'data-file', 'data-download'];
        dataAttrs.forEach(attr => {
          document.querySelectorAll(`[${attr}]`).forEach(el => {
            const url = el.getAttribute(attr);
            addLink(url, el.textContent, `${attr}`, el);
          });
        });
        
        // 3. OnClick handlers with URLs
        if (includeHidden) {
          document.querySelectorAll('[onclick]').forEach(el => {
            const onclick = el.getAttribute('onclick');
            // Look for URL patterns in onclick
            const urlMatches = onclick.match(/https?:\/\/[^\s"'<>]+/gi) || [];
            urlMatches.forEach(url => {
              addLink(url, el.textContent, 'onclick', el);
            });
            
            // Look for location.href assignments
            const hrefMatch = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
            if (hrefMatch) {
              addLink(hrefMatch[1], el.textContent, 'onclick-location', el);
            }
            
            // Look for window.open calls
            const openMatch = onclick.match(/window\.open\s*\(\s*['"]([^'"]+)['"]/);
            if (openMatch) {
              addLink(openMatch[1], el.textContent, 'onclick-window-open', el);
            }
          });
        }
        
        // 4. JavaScript href links
        document.querySelectorAll('a[href^="javascript:"]').forEach(a => {
          const href = a.getAttribute('href');
          const urlMatch = href.match(/https?:\/\/[^\s"'<>]+/gi);
          if (urlMatch) {
            urlMatch.forEach(url => addLink(url, a.textContent, 'javascript-href', a));
          }
        });
        
        // 5. Hidden inputs with URLs
        document.querySelectorAll('input[type="hidden"]').forEach(input => {
          const value = input.value;
          if (value && (value.startsWith('http') || value.startsWith('//'))) {
            addLink(value, input.name || input.id, 'hidden-input', input);
          }
        });
        
        // 6. Script content analysis for URLs (limited for performance)
        if (includeHidden) {
          const scripts = [...document.querySelectorAll('script')].slice(0, 20);
          scripts.forEach(script => {
            const content = script.textContent || '';
            // Look for download/stream URLs
            const patterns = [
              /["']?(https?:\/\/[^"'\s<>]+\.(mp4|mkv|avi|m3u8|mpd|zip|rar|pdf))[^"'\s<>]*["']?/gi,
              /download[_-]?url\s*[:=]\s*["']([^"']+)["']/gi,
              /file\s*[:=]\s*["']([^"']+)["']/gi
            ];
            
            patterns.forEach(pattern => {
              let match;
              while ((match = pattern.exec(content)) !== null) {
                addLink(match[1], 'script-extracted', 'script', null);
              }
            });
          });
        }
        
        // 7. Meta refresh URLs
        const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
        if (metaRefresh) {
          const content = metaRefresh.getAttribute('content');
          const urlMatch = content?.match(/url=(.+)/i);
          if (urlMatch) {
            addLink(urlMatch[1].trim().replace(/['"]/g, ''), 'meta-refresh', 'meta', null);
          }
        }
        
        // 8. Iframe sources
        document.querySelectorAll('iframe[src]').forEach(iframe => {
          addLink(iframe.src, 'iframe', 'iframe', iframe);
        });
        
        return allLinks;
      }, { includeText, includeHidden }).catch(() => []);
    };
    
    let links = await extractLinks(page);
    
    // Search iframes if enabled
    if (searchIframes) {
      const frames = page.frames();
      for (let i = 1; i < frames.length && i < 5; i++) {
        try {
          const frame = frames[i];
          if (frame.url() && frame.url() !== 'about:blank') {
            const frameLinks = await extractLinks(frame);
            frameLinks.forEach(link => link.source = `iframe:${link.source}`);
            links = [...links, ...frameLinks];
          }
        } catch (e) {}
      }
    }
    
    // Filter by type
    if (!types.includes('all')) {
      links = links.filter(link => {
        const isInternal = link.href.includes(currentHost);
        const isMedia = /\.(jpg|jpeg|png|gif|mp4|mp3|mkv|avi|pdf|zip|rar|m3u8|mpd)/i.test(link.href);
        const isDownload = /download|file|drive/i.test(link.href);
        
        if (types.includes('internal') && isInternal) return true;
        if (types.includes('external') && !isInternal) return true;
        if (types.includes('media') && isMedia) return true;
        if (types.includes('download') && isDownload) return true;
        if (types.includes('hidden') && link.hidden) return true;
        return false;
      });
    }
    
    // Remove hidden links if not requested
    if (!includeHidden) {
      links = links.filter(link => !link.hidden);
    }
    
    // Deduplicate
    const seen = new Set();
    links = links.filter(link => {
      if (seen.has(link.href)) return false;
      seen.add(link.href);
      return true;
    });
    
    notifyProgress('link_harvester', 'completed', `Found ${links.length} links (including hidden)`, { count: links.length });
    
    return { success: true, count: links.length, links };
  },

  // 21. Cookie Manager
  async cookie_manager(params = {}) {
    const { page } = requireBrowser();
    const { action = 'get', name, value, domain, expires } = params;
    
    notifyProgress('cookie_manager', 'started', `Cookie action: ${action}`);
    
    switch (action) {
      case 'get':
        const cookies = await page.cookies();
        notifyProgress('cookie_manager', 'completed', `Retrieved ${cookies.length} cookies`);
        return { success: true, cookies: name ? cookies.filter(c => c.name === name) : cookies };
      
      case 'set':
        await page.setCookie({ name, value, domain: domain || new URL(page.url()).hostname, expires });
        notifyProgress('cookie_manager', 'completed', `Cookie set: ${name}`);
        return { success: true, message: `Cookie ${name} set` };
      
      case 'delete':
        const toDelete = await page.cookies();
        const filtered = name ? toDelete.filter(c => c.name === name) : toDelete;
        await page.deleteCookie(...filtered);
        notifyProgress('cookie_manager', 'completed', `Deleted ${filtered.length} cookie(s)`);
        return { success: true, message: `Deleted ${filtered.length} cookie(s)` };
      
      case 'clear':
        const allCookies = await page.cookies();
        await page.deleteCookie(...allCookies);
        notifyProgress('cookie_manager', 'completed', `Cleared ${allCookies.length} cookies`);
        return { success: true, message: `Cleared ${allCookies.length} cookies` };
    }
    
    return { success: false, error: 'Invalid action' };
  },

  // 22. File Downloader
  async file_downloader(params) {
    const { page } = requireBrowser();
    const { url, filename, directory = './downloads' } = params;
    
    notifyProgress('file_downloader', 'started', `Downloading: ${url}`);
    
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    const response = await page.goto(url, { waitUntil: 'networkidle2' });
    const buffer = await response.buffer();
    
    const outputFilename = filename || path.basename(new URL(url).pathname) || 'download';
    const outputPath = path.join(directory, outputFilename);
    
    fs.writeFileSync(outputPath, buffer);
    
    notifyProgress('file_downloader', 'completed', `Downloaded: ${outputFilename} (${buffer.length} bytes)`, { filename: outputPath, size: buffer.length });
    
    return { success: true, filename: outputPath, size: buffer.length };
  },

  // 23. iFrame Handler
  async iframe_handler(params = {}) {
    const { page } = requireBrowser();
    const { action = 'list', selector, index } = params;
    
    notifyProgress('iframe_handler', 'started', `iFrame action: ${action}`);
    
    const frames = page.frames();
    
    switch (action) {
      case 'list':
        notifyProgress('iframe_handler', 'completed', `Found ${frames.length} frames`);
        return {
          success: true,
          count: frames.length,
          frames: frames.map((f, i) => ({ index: i, name: f.name(), url: f.url() }))
        };
      
      case 'switch':
        const targetFrame = selector 
          ? await page.$(selector).then(el => el?.contentFrame())
          : frames[index];
        
        if (targetFrame) {
          notifyProgress('iframe_handler', 'completed', `Switched to frame: ${targetFrame.url()}`);
          return { success: true, switched: true, url: targetFrame.url() };
        }
        notifyProgress('iframe_handler', 'error', 'Frame not found');
        return { success: false, error: 'Frame not found' };
      
      case 'content':
        const frame = selector 
          ? await page.$(selector).then(el => el?.contentFrame())
          : frames[index || 0];
        
        if (frame) {
          const content = await frame.content();
          notifyProgress('iframe_handler', 'completed', `Got frame content: ${content.length} chars`);
          return { success: true, content };
        }
        return { success: false, error: 'Frame not found' };
      
      case 'exit':
        notifyProgress('iframe_handler', 'completed', 'Returned to main frame');
        return { success: true, message: 'Returned to main frame' };
    }
    
    return { success: false, error: 'Invalid action' };
  },

  // 24. Stream Extractor (ENHANCED - searches iframes, detects obfuscated sources)
  async stream_extractor(params = {}) {
    const { page } = requireBrowser();
    const { types = ['all'], quality = 'best', searchIframes = true, deep = true } = params;
    
    notifyProgress('stream_extractor', 'started', 'Extracting streams (enhanced mode)...');
    
    // Helper function to extract streams from a frame/page context
    const extractFromContext = async (context, contextName = 'main') => {
      return await context.evaluate(() => {
        const result = { video: [], audio: [], hls: [], dash: [], download: [], embedded: [] };
        
        // 1. Direct video/audio elements
        document.querySelectorAll('video source, video').forEach(el => {
          const src = el.src || el.getAttribute('src') || el.currentSrc;
          if (src && src.startsWith('http')) result.video.push({ src, type: el.type || 'video' });
        });
        
        document.querySelectorAll('audio source, audio').forEach(el => {
          const src = el.src || el.getAttribute('src');
          if (src && src.startsWith('http')) result.audio.push({ src, type: el.type || 'audio' });
        });
        
        // 2. Script content analysis for HLS/DASH/MP4
        const scripts = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
        const html = document.documentElement.innerHTML;
        const combined = scripts + html;
        
        // HLS streams
        const hlsMatches = combined.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];
        result.hls = [...new Set(hlsMatches)].map(src => ({ src: src.replace(/\\"/g, ''), type: 'hls' }));
        
        // DASH streams
        const dashMatches = combined.match(/https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/gi) || [];
        result.dash = [...new Set(dashMatches)].map(src => ({ src: src.replace(/\\"/g, ''), type: 'dash' }));
        
        // Direct MP4/video links
        const mp4Matches = combined.match(/https?:\/\/[^\s"'<>]+\.(mp4|mkv|avi|webm)[^\s"'<>]*/gi) || [];
        result.download = [...new Set(mp4Matches)].map(src => ({ src: src.replace(/\\"/g, ''), type: 'direct' }));
        
        // 3. Data attributes and hidden sources
        document.querySelectorAll('[data-src], [data-video], [data-url], [data-file]').forEach(el => {
          const dataSrc = el.dataset.src || el.dataset.video || el.dataset.url || el.dataset.file;
          if (dataSrc && dataSrc.startsWith('http')) {
            result.video.push({ src: dataSrc, type: 'data-attribute' });
          }
        });
        
        // 4. Embedded player iframes (just URLs, not content)
        document.querySelectorAll('iframe[src]').forEach(el => {
          const src = el.src;
          if (src && src.startsWith('http')) {
            result.embedded.push({ src, type: 'iframe' });
          }
        });
        
        // 5. JWPlayer / VideoJS / Plyr sources
        if (window.jwplayer) {
          try {
            const jw = window.jwplayer();
            const playlist = jw.getPlaylist?.() || [];
            playlist.forEach(item => {
              if (item.file) result.video.push({ src: item.file, type: 'jwplayer' });
              (item.sources || []).forEach(s => {
                if (s.file) result.video.push({ src: s.file, type: 'jwplayer-source' });
              });
            });
          } catch (e) {}
        }
        
        if (window.player && window.player.src) {
          try {
            const src = typeof window.player.src === 'function' ? window.player.src() : window.player.src;
            if (src) result.video.push({ src, type: 'player-api' });
          } catch (e) {}
        }
        
        // 6. Look for common piracy site patterns
        const patterns = [
          /file\s*:\s*["']([^"']+)["']/gi,
          /source\s*:\s*["']([^"']+)["']/gi,
          /src\s*:\s*["']([^"']+\.(?:m3u8|mp4|mkv))["']/gi,
          /url\s*:\s*["']([^"']+\.(?:m3u8|mp4))["']/gi,
          /video_url\s*=\s*["']([^"']+)["']/gi,
          /sources\s*:\s*\[([^\]]+)\]/gi
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(combined)) !== null) {
            const url = match[1];
            if (url && url.startsWith('http') && (url.includes('.mp4') || url.includes('.m3u8'))) {
              result.download.push({ src: url, type: 'pattern-match' });
            }
          }
        });
        
        return result;
      }).catch(() => ({ video: [], audio: [], hls: [], dash: [], download: [], embedded: [] }));
    };
    
    // Extract from main page
    const mainStreams = await extractFromContext(page, 'main');
    let allStreams = { ...mainStreams };
    
    // Search in iframes if enabled
    if (searchIframes) {
      const frames = page.frames();
      notifyProgress('stream_extractor', 'progress', `Searching ${frames.length} frames...`);
      
      for (let i = 1; i < frames.length && i < 10; i++) { // Limit to 10 frames
        try {
          const frame = frames[i];
          const frameUrl = frame.url();
          if (frameUrl && frameUrl !== 'about:blank') {
            const frameStreams = await extractFromContext(frame, `frame-${i}`);
            
            // Merge frame streams
            Object.keys(frameStreams).forEach(key => {
              if (Array.isArray(frameStreams[key])) {
                frameStreams[key].forEach(stream => {
                  stream.source = `iframe: ${frameUrl}`;
                });
                allStreams[key] = [...(allStreams[key] || []), ...frameStreams[key]];
              }
            });
          }
        } catch (e) {
          // Frame access error, skip
        }
      }
    }
    
    // Deduplicate by URL
    Object.keys(allStreams).forEach(key => {
      if (Array.isArray(allStreams[key])) {
        const seen = new Set();
        allStreams[key] = allStreams[key].filter(item => {
          if (seen.has(item.src)) return false;
          seen.add(item.src);
          return true;
        });
      }
    });
    
    const totalStreams = Object.values(allStreams).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    notifyProgress('stream_extractor', 'completed', `Found ${totalStreams} streams (including iframes)`, { totalStreams });
    
    return { success: true, streams: allStreams, totalCount: totalStreams };
  },

  // 25. JS Scrape
  async js_scrape(params) {
    const { page } = requireBrowser();
    const { selector, waitForJS = true, timeout = 10000 } = params;
    
    notifyProgress('js_scrape', 'started', `Scraping: ${selector}`);
    
    if (waitForJS) {
      await page.waitForSelector(selector, { timeout });
      notifyProgress('js_scrape', 'progress', 'Element found, extracting content...');
    }
    
    const content = await page.$eval(selector, el => ({
      html: el.outerHTML,
      text: el.innerText,
      attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
    }));
    
    notifyProgress('js_scrape', 'completed', `Scraped ${content.text.length} characters`, { selector });
    
    return { success: true, selector, content };
  },

  // 26. Execute JS
  async execute_js(params) {
    const { page } = requireBrowser();
    const { code, returnValue = true } = params;
    
    notifyProgress('execute_js', 'started', 'Executing JavaScript...');
    
    const result = await page.evaluate(code);
    
    notifyProgress('execute_js', 'completed', 'JavaScript executed', { hasResult: result !== undefined });
    
    return { success: true, result: returnValue ? result : undefined };
  },

  // 27. Player API Hook (ENHANCED - searches iframes, detects more player types)
  async player_api_hook(params = {}) {
    const { page } = requireBrowser();
    const { playerType = 'auto', action = 'info', searchIframes = true } = params;
    
    notifyProgress('player_api_hook', 'started', `Player ${action}: ${playerType}`);
    
    // Enhanced player detection function
    const detectPlayer = async (context, contextName = 'main') => {
      return await context.evaluate(({ playerType, action }) => {
        const result = {
          detected: false,
          type: null,
          sources: [],
          info: {}
        };
        
        // 1. JWPlayer detection
        if (window.jwplayer) {
          try {
            const jw = window.jwplayer();
            if (jw) {
              result.detected = true;
              result.type = 'jwplayer';
              result.info = {
                duration: jw.getDuration?.(),
                currentTime: jw.getPosition?.(),
                volume: jw.getVolume?.(),
                state: jw.getState?.()
              };
              
              if (action === 'sources') {
                const playlist = jw.getPlaylist?.() || [];
                playlist.forEach(item => {
                  if (item.file) result.sources.push({ src: item.file, type: 'jwplayer' });
                  (item.sources || []).forEach(s => {
                    if (s.file) result.sources.push({ src: s.file, type: 'jwplayer-source', label: s.label });
                  });
                });
              }
              
              if (action === 'play') jw.play?.();
              if (action === 'pause') jw.pause?.();
            }
          } catch (e) {}
        }
        
        // 2. Video.js detection
        if (window.videojs && !result.detected) {
          try {
            const players = document.querySelectorAll('.video-js');
            if (players.length > 0) {
              const player = window.videojs(players[0].id || players[0]);
              result.detected = true;
              result.type = 'videojs';
              result.info = {
                duration: player.duration?.(),
                currentTime: player.currentTime?.(),
                volume: player.volume?.()
              };
              
              if (action === 'sources') {
                const src = player.currentSrc?.();
                if (src) result.sources.push({ src, type: 'videojs' });
              }
              
              if (action === 'play') player.play?.();
              if (action === 'pause') player.pause?.();
            }
          } catch (e) {}
        }
        
        // 3. Plyr detection
        if (window.Plyr && !result.detected) {
          try {
            const plyrElements = document.querySelectorAll('.plyr');
            if (plyrElements.length > 0 && plyrElements[0].plyr) {
              const player = plyrElements[0].plyr;
              result.detected = true;
              result.type = 'plyr';
              result.info = {
                duration: player.duration,
                currentTime: player.currentTime,
                volume: player.volume
              };
              
              if (action === 'sources') {
                const src = player.source;
                if (src) result.sources.push({ src, type: 'plyr' });
              }
            }
          } catch (e) {}
        }
        
        // 4. Generic window.player
        if ((window.player || window.videoPlayer) && !result.detected) {
          try {
            const player = window.player || window.videoPlayer;
            result.detected = true;
            result.type = 'generic';
            result.info = {
              duration: player.getDuration?.() || player.duration,
              currentTime: player.getCurrentTime?.() || player.currentTime,
              volume: player.getVolume?.() || player.volume
            };
            
            if (action === 'sources') {
              const sources = player.getSources?.() || player.getPlaylist?.() || [];
              sources.forEach(s => {
                if (s.file || s.src) result.sources.push({ src: s.file || s.src, type: 'generic' });
              });
            }
          } catch (e) {}
        }
        
        // 5. HTML5 Video fallback
        if (!result.detected) {
          const video = document.querySelector('video');
          if (video) {
            result.detected = true;
            result.type = 'html5';
            result.info = {
              duration: video.duration,
              currentTime: video.currentTime,
              volume: video.volume,
              paused: video.paused,
              src: video.src || video.currentSrc
            };
            
            if (action === 'sources') {
              if (video.src) result.sources.push({ src: video.src, type: 'html5' });
              if (video.currentSrc && video.currentSrc !== video.src) {
                result.sources.push({ src: video.currentSrc, type: 'html5-current' });
              }
              video.querySelectorAll('source').forEach(s => {
                if (s.src) result.sources.push({ src: s.src, type: 'html5-source' });
              });
            }
            
            if (action === 'play') video.play();
            if (action === 'pause') video.pause();
          }
        }
        
        // 6. Look for common obfuscated player variables
        const commonPlayerVars = ['player', 'videoPlayer', 'mediaPlayer', 'vPlayer', 'hls', 'flv'];
        for (const varName of commonPlayerVars) {
          if (window[varName] && !result.detected) {
            try {
              const p = window[varName];
              if (typeof p === 'object' && (p.play || p.getDuration || p.src)) {
                result.detected = true;
                result.type = `${varName}-object`;
                result.info = { raw: true };
              }
            } catch (e) {}
          }
        }
        
        return result;
      }, { playerType, action }).catch(() => ({ detected: false }));
    };
    
    // Try main page first
    let playerInfo = await detectPlayer(page, 'main');
    
    // Search iframes if no player found and searchIframes is enabled
    if (!playerInfo.detected && searchIframes) {
      const frames = page.frames();
      notifyProgress('player_api_hook', 'progress', `Searching ${frames.length} frames for player...`);
      
      for (let i = 1; i < frames.length && i < 10; i++) {
        try {
          const frame = frames[i];
          const frameUrl = frame.url();
          if (frameUrl && frameUrl !== 'about:blank') {
            const framePlayer = await detectPlayer(frame, `frame-${i}`);
            if (framePlayer.detected) {
              playerInfo = { ...framePlayer, frameSource: frameUrl };
              notifyProgress('player_api_hook', 'progress', `Found player in iframe: ${frameUrl}`);
              break;
            }
          }
        } catch (e) {
          // Frame access error, skip
        }
      }
    }
    
    notifyProgress('player_api_hook', 'completed', 
      playerInfo.detected ? `Player detected: ${playerInfo.type}${playerInfo.frameSource ? ' (in iframe)' : ''}` : 'No player found', 
      { detected: playerInfo.detected, type: playerInfo.type });
    
    return { success: true, ...playerInfo };
  },

  // 28. Form Automator
  async form_automator(params) {
    const { page } = requireBrowser();
    const { selector, data, submit = false, humanLike = true } = params;
    
    const formSelector = selector || 'form';
    const fields = Object.keys(data || {});
    
    notifyProgress('form_automator', 'started', `Filling form with ${fields.length} fields`);
    
    let filledCount = 0;
    
    for (const [field, value] of Object.entries(data || {})) {
      const inputSelector = `${formSelector} [name="${field}"], ${formSelector} #${field}, ${formSelector} [placeholder*="${field}" i]`;
      
      try {
        const input = await page.$(inputSelector);
        if (input) {
          const tagName = await input.evaluate(el => el.tagName.toLowerCase());
          const inputType = await input.evaluate(el => el.type);
          
          if (tagName === 'select') {
            await page.select(inputSelector, value);
          } else if (inputType === 'checkbox' || inputType === 'radio') {
            if (value) await input.click();
          } else {
            await input.click({ clickCount: 3 });
            if (humanLike) {
              await page.type(inputSelector, String(value), { delay: 50 + Math.random() * 50 });
            } else {
              await page.type(inputSelector, String(value));
            }
          }
          filledCount++;
          notifyProgress('form_automator', 'progress', `Filled: ${field}`, { field, filledCount });
        }
      } catch (e) {
        // Field not found, continue
      }
    }
    
    if (submit) {
      await page.click(`${formSelector} [type="submit"], ${formSelector} button`);
      notifyProgress('form_automator', 'progress', 'Form submitted');
    }
    
    notifyProgress('form_automator', 'completed', `Filled ${filledCount}/${fields.length} fields`, { filledCount, submitted: submit });
    
    return { success: true, formSelector, fieldsProcessed: filledCount, submitted: submit };
  },

  // 21. Media Extractor (MERGED: iframe_handler + stream_extractor + player_api_hook + decoders)
  async media_extractor(params = {}) {
    const { page } = requireBrowser();
    const { 
      action = 'extract', 
      types = ['all'], 
      quality = 'best', 
      searchIframes = true, 
      deep = true,
      selector, 
      index,
      playerAction = 'info',
      encodedData,
      decoderType = 'auto',
      aesKey,
      aesIV,
      urls,
      aiOptimize = true 
    } = params;
    
    notifyProgress('media_extractor', 'started', `Media extraction action: ${action}`);
    
    // Helper: Extract streams from a context
    const extractStreamsFromContext = async (context, contextName = 'main') => {
      return await context.evaluate(() => {
        const result = { video: [], audio: [], hls: [], dash: [], download: [], embedded: [] };
        
        // 1. Direct video/audio elements
        document.querySelectorAll('video source, video').forEach(el => {
          const src = el.src || el.getAttribute('src') || el.currentSrc;
          if (src && src.startsWith('http')) result.video.push({ src, type: el.type || 'video' });
        });
        
        document.querySelectorAll('audio source, audio').forEach(el => {
          const src = el.src || el.getAttribute('src');
          if (src && src.startsWith('http')) result.audio.push({ src, type: el.type || 'audio' });
        });
        
        // 2. Script content analysis for HLS/DASH/MP4
        const scripts = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
        const html = document.documentElement.innerHTML;
        const combined = scripts + html;
        
        // HLS streams
        const hlsMatches = combined.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi) || [];
        result.hls = [...new Set(hlsMatches)].map(src => ({ src: src.replace(/\\"/g, ''), type: 'hls' }));
        
        // DASH streams
        const dashMatches = combined.match(/https?:\/\/[^\s"'<>]+\.mpd[^\s"'<>]*/gi) || [];
        result.dash = [...new Set(dashMatches)].map(src => ({ src: src.replace(/\\"/g, ''), type: 'dash' }));
        
        // Direct MP4/video links
        const mp4Matches = combined.match(/https?:\/\/[^\s"'<>]+\.(mp4|mkv|avi|webm)[^\s"'<>]*/gi) || [];
        result.download = [...new Set(mp4Matches)].map(src => ({ src: src.replace(/\\"/g, ''), type: 'direct' }));
        
        // 3. Data attributes and hidden sources
        document.querySelectorAll('[data-src], [data-video], [data-url], [data-file]').forEach(el => {
          const dataSrc = el.dataset.src || el.dataset.video || el.dataset.url || el.dataset.file;
          if (dataSrc && dataSrc.startsWith('http')) {
            result.video.push({ src: dataSrc, type: 'data-attribute' });
          }
        });
        
        // 4. Embedded player iframes
        document.querySelectorAll('iframe[src]').forEach(el => {
          const src = el.src;
          if (src && src.startsWith('http')) {
            result.embedded.push({ src, type: 'iframe' });
          }
        });
        
        // 5. JWPlayer / VideoJS / Plyr sources
        if (window.jwplayer) {
          try {
            const jw = window.jwplayer();
            const playlist = jw.getPlaylist?.() || [];
            playlist.forEach(item => {
              if (item.file) result.video.push({ src: item.file, type: 'jwplayer' });
              (item.sources || []).forEach(s => {
                if (s.file) result.video.push({ src: s.file, type: 'jwplayer-source' });
              });
            });
          } catch (e) {}
        }
        
        if (window.player && window.player.src) {
          try {
            const src = typeof window.player.src === 'function' ? window.player.src() : window.player.src;
            if (src) result.video.push({ src, type: 'player-api' });
          } catch (e) {}
        }
        
        // 6. Look for common patterns
        const patterns = [
          /file\s*:\s*["']([^"']+)["']/gi,
          /source\s*:\s*["']([^"']+)["']/gi,
          /src\s*:\s*["']([^"']+\.(?:m3u8|mp4|mkv))["']/gi,
          /url\s*:\s*["']([^"']+\.(?:m3u8|mp4))["']/gi,
          /video_url\s*=\s*["']([^"']+)["']/gi,
          /sources\s*:\s*\[([^\]]+)\]/gi
        ];
        
        patterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(combined)) !== null) {
            const url = match[1];
            if (url && url.startsWith('http') && (url.includes('.mp4') || url.includes('.m3u8'))) {
              result.download.push({ src: url, type: 'pattern-match' });
            }
          }
        });
        
        return result;
      }).catch(() => ({ video: [], audio: [], hls: [], dash: [], download: [], embedded: [] }));
    };
    
    // Helper: Detect player in context
    const detectPlayer = async (context, contextName = 'main') => {
      return await context.evaluate((playerAction) => {
        const result = { detected: false, type: null, sources: [], info: {} };
        
        // 1. JWPlayer detection
        if (window.jwplayer) {
          try {
            const jw = window.jwplayer();
            if (jw) {
              result.detected = true;
              result.type = 'jwplayer';
              result.info = {
                duration: jw.getDuration?.(),
                currentTime: jw.getPosition?.(),
                volume: jw.getVolume?.(),
                state: jw.getState?.()
              };
              
              if (playerAction === 'sources') {
                const playlist = jw.getPlaylist?.() || [];
                playlist.forEach(item => {
                  if (item.file) result.sources.push({ src: item.file, type: 'jwplayer' });
                  (item.sources || []).forEach(s => {
                    if (s.file) result.sources.push({ src: s.file, type: 'jwplayer-source', label: s.label });
                  });
                });
              }
              
              if (playerAction === 'play') jw.play?.();
              if (playerAction === 'pause') jw.pause?.();
              if (playerAction === 'seek' && params.seekTime) jw.seek?.(params.seekTime);
            }
          } catch (e) {}
        }
        
        // 2. Video.js detection
        if (window.videojs && !result.detected) {
          try {
            const players = document.querySelectorAll('.video-js');
            if (players.length > 0) {
              const player = window.videojs(players[0].id || players[0]);
              result.detected = true;
              result.type = 'videojs';
              result.info = { duration: player.duration?.(), currentTime: player.currentTime?.(), volume: player.volume?.() };
              
              if (playerAction === 'sources') {
                const src = player.currentSrc?.();
                if (src) result.sources.push({ src, type: 'videojs' });
              }
              
              if (playerAction === 'play') player.play?.();
              if (playerAction === 'pause') player.pause?.();
              if (playerAction === 'seek' && params.seekTime) player.currentTime?.(params.seekTime);
            }
          } catch (e) {}
        }
        
        // 3. Plyr detection
        if (window.Plyr && !result.detected) {
          try {
            const plyrElements = document.querySelectorAll('.plyr');
            if (plyrElements.length > 0 && plyrElements[0].plyr) {
              const player = plyrElements[0].plyr;
              result.detected = true;
              result.type = 'plyr';
              result.info = { duration: player.duration, currentTime: player.currentTime, volume: player.volume };
              
              if (playerAction === 'sources') {
                const src = player.source;
                if (src) result.sources.push({ src, type: 'plyr' });
              }
              
              if (playerAction === 'play') player.play?.();
              if (playerAction === 'pause') player.pause?.();
            }
          } catch (e) {}
        }
        
        // 4. Generic window.player
        if ((window.player || window.videoPlayer) && !result.detected) {
          try {
            const player = window.player || window.videoPlayer;
            result.detected = true;
            result.type = 'generic';
            result.info = {
              duration: player.getDuration?.() || player.duration,
              currentTime: player.getCurrentTime?.() || player.currentTime,
              volume: player.getVolume?.() || player.volume
            };
            
            if (playerAction === 'sources') {
              const sources = player.getSources?.() || player.getPlaylist?.() || [];
              sources.forEach(s => {
                if (s.file || s.src) result.sources.push({ src: s.file || s.src, type: 'generic' });
              });
            }
          } catch (e) {}
        }
        
        // 5. HTML5 Video fallback
        if (!result.detected) {
          const video = document.querySelector('video');
          if (video) {
            result.detected = true;
            result.type = 'html5';
            result.info = { duration: video.duration, currentTime: video.currentTime, volume: video.volume, paused: video.paused, src: video.src || video.currentSrc };
            
            if (playerAction === 'sources') {
              if (video.src) result.sources.push({ src: video.src, type: 'html5' });
              video.querySelectorAll('source').forEach(s => { if (s.src) result.sources.push({ src: s.src, type: 'html5-source' }); });
            }
            
            if (playerAction === 'play') video.play();
            if (playerAction === 'pause') video.pause();
            if (playerAction === 'seek' && params.seekTime) video.currentTime = params.seekTime;
          }
        }
        
        return result;
      }, playerAction).catch(() => ({ detected: false }));
    };
    
    // Helper: Deduplicate streams
    const deduplicateStreams = (streams) => {
      Object.keys(streams).forEach(key => {
        if (Array.isArray(streams[key])) {
          const seen = new Set();
          streams[key] = streams[key].filter(item => {
            if (seen.has(item.src)) return false;
            seen.add(item.src);
            return true;
          });
        }
      });
      return streams;
    };
    
    // Helper: Auto-detect decoder type
    const autoDetectDecoder = (data) => {
      if (data.includes('%')) return 'url';
      if (/^[A-Za-z0-9+/=]+$/.test(data) && data.length % 4 === 0) return 'base64';
      return 'url';
    };
    
    switch (action) {
      case 'extract': {
        // Comprehensive extraction - streams, iframes, and players
        notifyProgress('media_extractor', 'progress', 'Extracting all media...');
        
        // Get iframes
        const frames = page.frames();
        const iframes = frames.map((f, i) => ({ index: i, name: f.name(), url: f.url() }));
        
        // Extract streams from main page
        let allStreams = await extractStreamsFromContext(page, 'main');
        
        // Search in iframes
        if (searchIframes) {
          for (let i = 1; i < frames.length && i < 10; i++) {
            try {
              const frame = frames[i];
              const frameUrl = frame.url();
              if (frameUrl && frameUrl !== 'about:blank') {
                const frameStreams = await extractStreamsFromContext(frame, `frame-${i}`);
                Object.keys(frameStreams).forEach(key => {
                  if (Array.isArray(frameStreams[key])) {
                    frameStreams[key].forEach(stream => { stream.source = `iframe: ${frameUrl}`; });
                    allStreams[key] = [...(allStreams[key] || []), ...frameStreams[key]];
                  }
                });
              }
            } catch (e) {}
          }
        }
        
        // Deduplicate
        allStreams = deduplicateStreams(allStreams);
        
        // Detect players
        let playerInfo = await detectPlayer(page, 'main');
        if (!playerInfo.detected && searchIframes) {
          for (let i = 1; i < frames.length && i < 10; i++) {
            try {
              const frame = frames[i];
              const frameUrl = frame.url();
              if (frameUrl && frameUrl !== 'about:blank') {
                const framePlayer = await detectPlayer(frame, `frame-${i}`);
                if (framePlayer.detected) {
                  playerInfo = { ...framePlayer, frameSource: frameUrl };
                  break;
                }
              }
            } catch (e) {}
          }
        }
        
        const totalStreams = Object.values(allStreams).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        notifyProgress('media_extractor', 'completed', `Extracted ${totalStreams} streams, ${iframes.length} iframes, player: ${playerInfo.detected ? playerInfo.type : 'none'}`);
        
        return { 
          success: true, 
          action: 'extract',
          streams: allStreams, 
          iframes,
          player: playerInfo,
          totalStreams,
          iframeCount: iframes.length
        };
      }
      
      case 'list_iframes': {
        const frames = page.frames();
        const iframes = frames.map((f, i) => ({ index: i, name: f.name(), url: f.url() }));
        notifyProgress('media_extractor', 'completed', `Found ${iframes.length} iframes`);
        return { success: true, action: 'list_iframes', count: iframes.length, iframes };
      }
      
      case 'switch_iframe': {
        const frames = page.frames();
        const targetFrame = selector 
          ? await page.$(selector).then(el => el?.contentFrame())
          : frames[index];
        
        if (targetFrame) {
          notifyProgress('media_extractor', 'completed', `Switched to iframe: ${targetFrame.url()}`);
          return { success: true, action: 'switch_iframe', switched: true, url: targetFrame.url(), frameIndex: index };
        }
        notifyProgress('media_extractor', 'error', 'Iframe not found');
        return { success: false, error: 'Iframe not found' };
      }
      
      case 'player_control': {
        const { playerType, seekTime, volume } = params;
        notifyProgress('media_extractor', 'progress', `Player control: ${playerAction}`);
        
        // Try main page first
        let result = await detectPlayer(page, 'main');
        
        // Search iframes if no player found
        if (!result.detected && searchIframes) {
          const frames = page.frames();
          for (let i = 1; i < frames.length && i < 10; i++) {
            try {
              const frame = frames[i];
              const frameUrl = frame.url();
              if (frameUrl && frameUrl !== 'about:blank') {
                const frameResult = await detectPlayer(frame, `frame-${i}`);
                if (frameResult.detected) {
                  result = { ...frameResult, frameSource: frameUrl };
                  break;
                }
              }
            } catch (e) {}
          }
        }
        
        notifyProgress('media_extractor', 'completed', result.detected ? `Player ${playerAction} executed: ${result.type}` : 'No player found');
        return { success: true, action: 'player_control', playerAction, ...result };
      }
      
      case 'decode_url': {
        if (!encodedData) {
          return { success: false, error: 'encodedData is required for decode_url action' };
        }
        
        const type = decoderType === 'auto' ? autoDetectDecoder(encodedData) : decoderType;
        let decoded;
        
        notifyProgress('media_extractor', 'progress', `Decoding with ${type}...`);
        
        switch (type) {
          case 'url':
            decoded = decoders.urlDecode(encodedData);
            break;
          case 'base64':
            decoded = decoders.base64Decode(encodedData);
            break;
          case 'aes':
            if (!aesKey) {
              return { success: false, error: 'aesKey is required for AES decryption' };
            }
            decoded = decoders.decryptAES(encodedData, aesKey, aesIV);
            break;
          default:
            decoded = { success: false, error: 'Unknown decoder type' };
        }
        
        notifyProgress('media_extractor', 'completed', decoded.success ? 'Decoding successful' : 'Decoding failed');
        return { success: decoded.success, action: 'decode_url', decoderType: type, ...decoded };
      }
      
      case 'batch_extract': {
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return { success: false, error: 'urls array is required for batch_extract action' };
        }
        
        notifyProgress('media_extractor', 'progress', `Batch extracting from ${urls.length} URLs...`);
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          try {
            notifyProgress('media_extractor', 'progress', `Processing ${i + 1}/${urls.length}: ${url}`);
            
            // Navigate to URL
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForTimeout(2000); // Wait for media to load
            
            // Extract streams
            const streams = await extractStreamsFromContext(page, 'main');
            const dedupedStreams = deduplicateStreams(streams);
            const totalCount = Object.values(dedupedStreams).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
            
            // Get page metadata
            const meta = await page.evaluate(() => ({
              title: document.title,
              url: window.location.href
            }));
            
            results.push({ 
              url, 
              success: true, 
              streams: dedupedStreams, 
              totalCount,
              title: meta.title,
              finalUrl: meta.url
            });
          } catch (error) {
            errors.push({ url, error: error.message });
            results.push({ url, success: false, error: error.message });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        notifyProgress('media_extractor', 'completed', `Batch extraction complete: ${successCount}/${urls.length} successful`);
        
        return { 
          success: true, 
          action: 'batch_extract',
          totalUrls: urls.length,
          successful: successCount,
          failed: urls.length - successCount,
          results,
          errors
        };
      }
      
      default:
        return { success: false, error: `Unknown action: ${action}. Supported: extract, list_iframes, switch_iframe, player_control, decode_url, batch_extract` };
    }
  },

  // 22. Extract Data (MERGED: search_regex + extract_json + scrape_meta_tags)
  async extract_data(params = {}) {
    const { page } = requireBrowser();
    const { 
      type = 'auto',
      pattern,
      selector,
      jsonPath,
      source = 'all',
      autoDecode = true,
      flags = 'gi',
      types = ['all'],
      includeTitle = true,
      includeCanonical = true,
      maxMatches = 100,
      maxJsonObjects = 50,
      waitForSelector = false,
      selectorTimeout = 10000
    } = params;
    
    notifyProgress('extract_data', 'started', `Extracting data (type: ${type})...`);
    
    const results = {
      success: true,
      type,
      url: page.url(),
      extracted: {}
    };
    
    // Helper: Extract regex matches
    const extractRegex = async (regexPattern, regexFlags, contentSource) => {
      let content;
      if (contentSource === 'html') {
        content = await page.content();
      } else if (contentSource === 'scripts') {
        content = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
      } else if (contentSource === 'text') {
        content = await page.evaluate(() => document.body.innerText);
      } else {
        // 'all' - search in both HTML and scripts
        const html = await page.content();
        const scripts = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
        content = html + '\n' + scripts;
      }
      
      const regex = new RegExp(regexPattern, regexFlags);
      const matches = content.match(regex) || [];
      
      return {
        pattern: regexPattern,
        flags: regexFlags,
        matchCount: matches.length,
        matches: matches.slice(0, maxMatches)
      };
    };
    
    // Helper: Extract JSON data
    const extractJson = async (jsonSource, sel, path) => {
      const jsonData = [];
      
      if (jsonSource === 'ld+json') {
        const ldJson = await page.$$eval('script[type="application/ld+json"]', scripts => 
          scripts.map(s => {
            try { return JSON.parse(s.textContent); } catch { return null; }
          }).filter(Boolean)
        );
        jsonData.push(...ldJson);
      } else if (jsonSource === 'scripts') {
        const content = await page.$$eval('script', scripts => scripts.map(s => s.textContent).join('\n'));
        // Look for JSON objects in scripts
        const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g;
        const matches = content.match(jsonRegex) || [];
        for (const match of matches.slice(0, maxJsonObjects)) {
          try {
            const parsed = JSON.parse(match);
            jsonData.push(parsed);
          } catch {}
        }
      } else if (jsonSource === 'api') {
        // Try to find API responses in page data
        const apiData = await page.evaluate(() => {
          const data = [];
          // Look for common API data storage patterns
          if (window.__DATA__) data.push(window.__DATA__);
          if (window.__INITIAL_STATE__) data.push(window.__INITIAL_STATE__);
          if (window.__APP_DATA__) data.push(window.__APP_DATA__);
          if (window.data) data.push(window.data);
          if (window.config) data.push(window.config);
          return data;
        });
        jsonData.push(...apiData);
      } else if (sel) {
        try {
          const text = await page.$eval(sel, el => el.textContent);
          const parsed = JSON.parse(text);
          jsonData.push(parsed);
        } catch {}
      } else {
        // 'page' - try all sources
        const ldJson = await page.$$eval('script[type="application/ld+json"]', scripts => 
          scripts.map(s => {
            try { return JSON.parse(s.textContent); } catch { return null; }
          }).filter(Boolean)
        );
        jsonData.push(...ldJson);
      }
      
      // Apply JSONPath if specified
      if (path && jsonData.length > 0) {
        // Simple JSONPath implementation
        const getPath = (obj, pathStr) => {
          const parts = pathStr.replace(/^\$\./, '').split('.');
          let current = obj;
          for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            if (part.includes('[') && part.includes(']')) {
              const arrName = part.substring(0, part.indexOf('['));
              const idx = parseInt(part.match(/\[(\d+)\]/)?.[1] || '0');
              current = current[arrName]?.[idx];
            } else {
              current = current[part];
            }
          }
          return current;
        };
        
        return jsonData.map(obj => ({
          original: obj,
          extracted: getPath(obj, path)
        }));
      }
      
      return jsonData;
    };
    
    // Helper: Extract meta tags
    const extractMeta = async (metaTypes) => {
      const meta = await page.evaluate((includeTitle, includeCanonical) => {
        const result = { meta: {}, og: {}, twitter: {} };
        
        document.querySelectorAll('meta').forEach(tag => {
          const name = tag.getAttribute('name') || tag.getAttribute('property');
          const content = tag.getAttribute('content');
          if (name && content) {
            if (name.startsWith('og:')) {
              result.og[name.replace('og:', '')] = content;
            } else if (name.startsWith('twitter:')) {
              result.twitter[name.replace('twitter:', '')] = content;
            } else {
              result.meta[name] = content;
            }
          }
        });
        
        if (includeTitle) {
          result.title = document.title;
        }
        if (includeCanonical) {
          result.canonical = document.querySelector('link[rel="canonical"]')?.href;
        }
        
        return result;
      }, includeTitle, includeCanonical);
      
      // Filter by requested types
      const filtered = {};
      if (metaTypes.includes('all')) {
        return meta;
      }
      if (metaTypes.includes('meta')) filtered.meta = meta.meta;
      if (metaTypes.includes('og')) filtered.og = meta.og;
      if (metaTypes.includes('twitter')) filtered.twitter = meta.twitter;
      if (includeTitle) filtered.title = meta.title;
      if (includeCanonical) filtered.canonical = meta.canonical;
      
      return filtered;
    };
    
    // Helper: Extract structured data from selector
    const extractStructured = async (sel, wait = false, timeout = 10000) => {
      if (wait) {
        await page.waitForSelector(sel, { timeout });
      }
      
      const element = await page.$(sel);
      if (!element) {
        return { error: `Element not found: ${sel}` };
      }
      
      const data = await element.evaluate(el => ({
        tagName: el.tagName,
        text: el.innerText,
        html: el.innerHTML,
        attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value])),
        childCount: el.children.length,
        boundingBox: el.getBoundingClientRect ? {
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height
        } : null
      }));
      
      return data;
    };
    
    // Helper: Auto-detect and extract all
    const extractAuto = async () => {
      const autoResults = {
        meta: null,
        json: null,
        structured: null,
        patterns: []
      };
      
      // Extract meta tags
      try {
        autoResults.meta = await extractMeta(['all']);
      } catch (e) {}
      
      // Extract JSON-LD
      try {
        autoResults.json = await extractJson('ld+json');
      } catch (e) {}
      
      // Look for common data patterns
      const commonPatterns = [
        { name: 'emails', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' },
        { name: 'phones', pattern: '(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}' },
        { name: 'urls', pattern: 'https?://[^\s<>"{}|\\^`\[\]]+' },
        { name: 'ipv4', pattern: '\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b' }
      ];
      
      const pageText = await page.evaluate(() => document.body.innerText);
      for (const { name, pattern } of commonPatterns) {
        const regex = new RegExp(pattern, 'gi');
        const matches = [...new Set(pageText.match(regex) || [])];
        if (matches.length > 0) {
          autoResults.patterns.push({ type: name, count: matches.length, samples: matches.slice(0, 10) });
        }
      }
      
      return autoResults;
    };
    
    // Main switch based on type
    switch(type) {
      case 'regex': {
        if (!pattern) {
          return { success: false, error: 'Pattern is required for regex extraction' };
        }
        results.extracted = await extractRegex(pattern, flags, source);
        notifyProgress('extract_data', 'completed', `Regex: ${results.extracted.matchCount} matches`);
        break;
      }
      
      case 'json': {
        results.extracted = await extractJson(source, selector, jsonPath);
        results.count = Array.isArray(results.extracted) ? results.extracted.length : 0;
        notifyProgress('extract_data', 'completed', `JSON: ${results.count} objects`);
        break;
      }
      
      case 'meta': {
        results.extracted = await extractMeta(types);
        const tagCount = Object.values(results.extracted).reduce((sum, val) => {
          if (typeof val === 'object' && val !== null) {
            return sum + Object.keys(val).length;
          }
          return sum + (val ? 1 : 0);
        }, 0);
        notifyProgress('extract_data', 'completed', `Meta: ${tagCount} tags`);
        break;
      }
      
      case 'structured': {
        if (!selector) {
          return { success: false, error: 'Selector is required for structured extraction' };
        }
        results.extracted = await extractStructured(selector, waitForSelector, selectorTimeout);
        if (results.extracted.error) {
          results.success = false;
          results.error = results.extracted.error;
          delete results.extracted;
        }
        notifyProgress('extract_data', 'completed', results.success ? 'Structured data extracted' : 'Extraction failed');
        break;
      }
      
      case 'auto': {
        results.extracted = await extractAuto();
        const summary = [];
        if (results.extracted.meta) summary.push('meta');
        if (results.extracted.json?.length) summary.push('json');
        if (results.extracted.patterns?.length) summary.push('patterns');
        notifyProgress('extract_data', 'completed', `Auto: ${summary.join(', ')}`);
        break;
      }
      
      default:
        return { success: false, error: `Unknown type: ${type}. Supported: regex, json, meta, structured, auto` };
    }
    
    return results;
  }
};

// ═══════════════════════════════════════════════════════════════
// 🤖 AI-POWERED CORE INTEGRATION
// All tools automatically get AI features (auto-healing, smart find)
// ═══════════════════════════════════════════════════════════════

let aiCore = null;

/**
 * Get or initialize AI Core (lazy loading)
 */
function getAICore() {
  if (!aiCore) {
    try {
      const ai = require('../ai');
      aiCore = ai.aiCore;
      aiCore.configure({ logLevel: 'info', enableAutoHeal: true });
      console.error('🤖 [AI] AI Core initialized - all tools now AI-enhanced');
    } catch (e) {
      console.error('⚠️ [AI] AI Core not available:', e.message);
      return null;
    }
  }
  return aiCore;
}

/**
 * AI-Enhanced selector operation
 * Automatically heals broken selectors
 */
async function aiEnhancedSelector(page, selector, operation, options = {}) {
  const ai = getAICore();
  
  // Try original selector first
  try {
    const element = await page.$(selector);
    if (element) {
      return { element, selector, healed: false };
    }
  } catch (e) {
    // Selector failed
  }
  
  // If AI available, try to heal
  if (ai && ai.config.enableAutoHeal) {
    console.error(`🩹 [AI] Selector "${selector}" not found, attempting heal...`);
    
    try {
      const alternatives = await ai.selectorHealer.heal(page, selector, {
        maxAlternatives: 3
      });
      
      for (const alt of alternatives) {
        try {
          const element = await page.$(alt.selector);
          if (element) {
            console.error(`✅ [AI] Healed: "${selector}" → "${alt.selector}" (${Math.round(alt.confidence * 100)}% confidence)`);
            return { element, selector: alt.selector, healed: true, originalSelector: selector };
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.error(`⚠️ [AI] Heal failed:`, e.message);
    }
  }
  
  return { element: null, selector, healed: false };
}

/**
 * Execute a tool by name - NOW WITH AI INTEGRATION
 * 
 * AI Features automatically applied:
 * - Auto-healing: If selector fails, AI tries to find alternatives
 * - Smart retry: Failed operations are retried with AI assistance
 * - All 28 tools benefit from AI without any changes
 */
async function executeTool(name, params = {}) {
  const handler = handlers[name];
  
  if (!handler) {
    notifyProgress(name, 'error', `Unknown tool: ${name}`);
    return { success: false, error: `Unknown tool: ${name}` };
  }
  
  // Initialize AI Core (lazy)
  getAICore();
  
  const startTime = Date.now();
  
  try {
    // Execute the handler
    const result = await handler(params);
    
    // If successful, return with AI metadata
    if (result.success) {
      return {
        ...result,
        _ai: { 
          enabled: !!aiCore, 
          healed: false,
          duration: Date.now() - startTime 
        }
      };
    }
    
    // If failed with "not found" error and has selector, try AI healing
    if (result.error?.includes('not found') && params.selector && aiCore) {
      notifyProgress(name, 'progress', '🤖 AI attempting recovery...');
      
      const { page } = getState();
      if (page) {
        const healed = await aiEnhancedSelector(page, params.selector, name);
        
        if (healed.element) {
          // Retry with healed selector
          const retryParams = { ...params, selector: healed.selector };
          const retryResult = await handler(retryParams);
          
          return {
            ...retryResult,
            _ai: {
              enabled: true,
              healed: true,
              originalSelector: params.selector,
              healedSelector: healed.selector,
              duration: Date.now() - startTime
            }
          };
        }
      }
    }
    
    return {
      ...result,
      _ai: { enabled: !!aiCore, healed: false, duration: Date.now() - startTime }
    };
    
  } catch (error) {
    notifyProgress(name, 'error', error.message);
    
    // Try AI recovery for selector-based errors
    if (error.message?.includes('selector') && params.selector && aiCore) {
      notifyProgress(name, 'progress', '🤖 AI attempting error recovery...');
      
      try {
        const { page } = getState();
        if (page) {
          const healed = await aiEnhancedSelector(page, params.selector, name);
          
          if (healed.element) {
            const retryParams = { ...params, selector: healed.selector };
            const retryResult = await handler(retryParams);
            
            return {
              ...retryResult,
              _ai: {
                enabled: true,
                healed: true,
                recoveredFromError: true,
                originalSelector: params.selector,
                healedSelector: healed.selector,
                duration: Date.now() - startTime
              }
            };
          }
        }
      } catch (retryError) {
        // Recovery failed
      }
    }
    
    return { 
      success: false, 
      error: error.message,
      _ai: { enabled: !!aiCore, healed: false, duration: Date.now() - startTime }
    };
  }
}

/**
 * Cleanup - close browser if open
 */
async function cleanup() {
  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (e) {
      browserInstance.process()?.kill('SIGKILL');
    }
    browserInstance = null;
    pageInstance = null;
    blockerInstance = null;
  }
}

module.exports = {
  handlers,
  executeTool,
  cleanup,
  getState,
  requireBrowser,
  setProgressCallback,
  notifyProgress,
  getHeadlessFromEnv,
  // AI Core exports
  getAICore,
  aiEnhancedSelector
};
